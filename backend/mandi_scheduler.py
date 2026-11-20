"""
AgriAI — Automatic Daily Mandi Price Collection Scheduler (Feature 5 - Stage 4)
Handles reliable, non-overlapping background scheduling for daily Agmarknet mandi collections:
- Configurable daily execution time (Default: 18:30 IST).
- India Standard Time (Asia/Kolkata).
- Re-entrant concurrency lock preventing overlapping scheduled or manual collections.
- Singleton scheduler pattern preventing duplicate background worker instances.
- Graceful startup and shutdown handling.
- Safe application restarts without duplicate executions.
- Environment toggle (MANDI_SCHEDULER_ENABLED=true/false) to enable or disable scheduling.
"""

import os
import threading
import time
from datetime import datetime, timedelta, time as d_time
from typing import Optional, Dict, Any
from pathlib import Path
from dotenv import load_dotenv
import pytz

# Load environment configuration
ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

# =====================================================================
# 1. CONCURRENCY CONTROL (Global Mutex Lock)
# =====================================================================

_COLLECTION_LOCK = threading.Lock()
_COLLECTION_ACTIVE = False
_COLLECTION_ACTIVE_LOCK = threading.Lock()


def is_collection_active() -> bool:
    """Returns True if a mandi collection job (scheduled or manual) is currently running."""
    with _COLLECTION_ACTIVE_LOCK:
        return _COLLECTION_ACTIVE


def acquire_collection_lock() -> bool:
    """
    Non-blocking acquire of the collection mutex.
    Returns True if lock acquired, False if a collection is already active.
    """
    global _COLLECTION_ACTIVE
    acquired = _COLLECTION_LOCK.acquire(blocking=False)
    if acquired:
        with _COLLECTION_ACTIVE_LOCK:
            _COLLECTION_ACTIVE = True
    return acquired


def release_collection_lock():
    """Releases the collection mutex safely."""
    global _COLLECTION_ACTIVE
    with _COLLECTION_ACTIVE_LOCK:
        _COLLECTION_ACTIVE = False
    try:
        _COLLECTION_LOCK.release()
    except RuntimeError:
        pass


# =====================================================================
# 2. MANDI DAILY SCHEDULER SINGLETON
# =====================================================================

class MandiDailyScheduler:
    """
    Background worker that runs a daily mandi collection at a designated time in IST.
    """
    _instance = None
    _singleton_lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        with cls._singleton_lock:
            if cls._instance is None:
                cls._instance = super(MandiDailyScheduler, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self._thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
        self._is_running = False
        self._last_run_time: Optional[str] = None
        self._last_run_status: Optional[str] = None
        self._next_run_ist: Optional[datetime] = None

    @property
    def is_enabled(self) -> bool:
        """Checks whether automatic scheduling is enabled in backend/.env or environment."""
        val = os.getenv("MANDI_SCHEDULER_ENABLED", "true").strip().lower()
        return val not in ("false", "0", "no", "off", "disabled")

    @property
    def schedule_time_str(self) -> str:
        """Returns configured execution time in HH:MM format (default: '18:30')."""
        return os.getenv("MANDI_SYNC_SCHEDULE_TIME", "18:30").strip()

    @property
    def timezone_name(self) -> str:
        """Returns configured timezone (default: 'Asia/Kolkata')."""
        return os.getenv("MANDI_SYNC_TIMEZONE", "Asia/Kolkata").strip()

    def get_timezone(self) -> pytz.BaseTzInfo:
        try:
            return pytz.timezone(self.timezone_name)
        except Exception:
            return pytz.timezone("Asia/Kolkata")

    def parse_schedule_time(self) -> d_time:
        """Parses the configured schedule time string into hour and minute."""
        try:
            parts = self.schedule_time_str.split(":")
            h = int(parts[0])
            m = int(parts[1]) if len(parts) > 1 else 0
            return d_time(hour=max(0, min(23, h)), minute=max(0, min(59, m)))
        except Exception:
            return d_time(hour=18, minute=30)

    def calculate_next_run(self) -> datetime:
        """
        Calculates the next execution timestamp in India Standard Time.
        If today's scheduled time has not yet arrived, returns today at schedule time.
        Otherwise, returns tomorrow at schedule time.
        """
        tz = self.get_timezone()
        now_ist = datetime.now(tz)
        target_time = self.parse_schedule_time()

        today_scheduled = now_ist.replace(
            hour=target_time.hour,
            minute=target_time.minute,
            second=0,
            microsecond=0
        )

        if now_ist < today_scheduled:
            return today_scheduled
        else:
            return today_scheduled + timedelta(days=1)

    def start(self):
        """Starts the background scheduler thread if enabled and not already running."""
        if not self.is_enabled:
            print("Mandi Daily Scheduler is DISABLED by configuration (MANDI_SCHEDULER_ENABLED=false).")
            return

        if self._thread and self._thread.is_alive():
            print("Mandi Daily Scheduler thread is already running.")
            return

        self._stop_event.clear()
        self._next_run_ist = self.calculate_next_run()
        self._thread = threading.Thread(
            target=self._scheduler_loop,
            name="MandiDailySchedulerThread",
            daemon=True
        )
        self._is_running = True
        self._thread.start()
        print(f"✓ Mandi Daily Scheduler started. Next scheduled collection: {self._next_run_ist.strftime('%d/%m/%Y %H:%M:%S')} IST.")

    def stop(self):
        """Signals the background scheduler thread to terminate cleanly."""
        if not self._is_running:
            return
        print("Stopping Mandi Daily Scheduler...")
        self._stop_event.set()
        self._is_running = False
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=3.0)
        print("✓ Mandi Daily Scheduler stopped.")

    def get_status(self) -> Dict[str, Any]:
        """Returns comprehensive status of the scheduler and lock state."""
        return {
            "scheduler_enabled": self.is_enabled,
            "is_running": self._is_running,
            "is_collection_active": is_collection_active(),
            "schedule_time_ist": self.schedule_time_str,
            "timezone": self.timezone_name,
            "next_run_ist": self._next_run_ist.strftime("%d/%m/%Y %H:%M:%S IST") if self._next_run_ist else None,
            "last_run_time": self._last_run_time,
            "last_run_status": self._last_run_status
        }

    def _scheduler_loop(self):
        """Internal background loop that wakes up periodically and executes the daily job."""
        tz = self.get_timezone()

        while not self._stop_event.is_set():
            now_ist = datetime.now(tz)
            self._next_run_ist = self.calculate_next_run()

            seconds_to_wait = (self._next_run_ist - now_ist).total_seconds()

            # Wait in small increments so stop_event can awaken the thread immediately
            wait_slice = min(max(1.0, seconds_to_wait), 15.0)
            if self._stop_event.wait(timeout=wait_slice):
                break

            # Re-check time
            now_ist = datetime.now(tz)
            if now_ist >= self._next_run_ist:
                self._execute_scheduled_job()
                # Advance next run by at least 1 day
                self._next_run_ist = self.calculate_next_run()

    def _execute_scheduled_job(self):
        """Executes the daily collection job under the global concurrency lock."""
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Mandi Daily Scheduler: Triggering automated daily collection...")
        
        if not acquire_collection_lock():
            msg = "Mandi Daily Scheduler: Skipped scheduled collection — another collection job is already running."
            print(msg)
            self._last_run_time = datetime.now().isoformat()
            self._last_run_status = "SKIPPED_OVERLAP"
            return

        try:
            import mandi_service
            self._last_run_time = datetime.now().isoformat()
            res = mandi_service.run_daily_mandi_collection()
            self._last_run_status = res.get("status", "unknown").upper()
            print(f"Mandi Daily Scheduler finished with status: {self._last_run_status}. Details: {res.get('message')}")
        except Exception as e:
            self._last_run_status = "ERROR"
            print(f"Mandi Daily Scheduler encounter unexpected error: {e}")
        finally:
            release_collection_lock()


# Module-level accessor for the singleton scheduler
def get_mandi_scheduler() -> MandiDailyScheduler:
    return MandiDailyScheduler()
