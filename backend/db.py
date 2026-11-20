import os
import sqlite3
import hashlib
import secrets
import uuid
from datetime import datetime
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError

# Feature 5 - Stage 3: Data Quality & Normalization Safeguards
try:
    from mandi_quality import (
        normalize_state_display,
        get_state_query_variants,
        evaluate_price_quality,
        are_commodities_comparable,
        COMMODITY_PRICE_BOUNDS
    )
except ImportError:
    from backend.mandi_quality import (
        normalize_state_display,
        get_state_query_variants,
        evaluate_price_quality,
        are_commodities_comparable,
        COMMODITY_PRICE_BOUNDS
    )

# Argon2id password hasher (RFC 9106 recommended defaults)
ph = PasswordHasher()

# Path to local SQLite database
DB_DIR = os.path.join(os.path.dirname(__file__), "data")
DB_PATH = os.path.join(DB_DIR, "agriai.db")

def get_db_connection():
    """Connect to local SQLite database with Row factory."""
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def _execute_query(cursor, query, params=None):
    """Executes a SQLite query with optional parameters."""
    if params is not None:
        cursor.execute(query, params)
    else:
        cursor.execute(query)

def init_db():
    """Initialize local SQLite tables if they do not exist."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        language TEXT DEFAULT 'en',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS auth_tokens (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        language TEXT DEFAULT 'en',
        created_at TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # Mandi Prices Schema (Live Market Intelligence)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS mandi_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        state TEXT NOT NULL,
        district TEXT NOT NULL,
        market TEXT NOT NULL,
        commodity TEXT NOT NULL,
        variety TEXT DEFAULT 'Common',
        arrival_date TEXT NOT NULL,
        min_price REAL NOT NULL,
        max_price REAL NOT NULL,
        modal_price REAL NOT NULL,
        unit TEXT DEFAULT 'Rs/Quintal',
        source_type TEXT NOT NULL,
        source_label TEXT NOT NULL,
        last_updated TEXT NOT NULL
    );
    """)

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_mandi_commodity ON mandi_prices(commodity);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_mandi_state ON mandi_prices(state);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_mandi_district ON mandi_prices(district);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_mandi_market ON mandi_prices(market);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_mandi_arrival_date ON mandi_prices(arrival_date);")

    # Normalize any legacy NULL or whitespace varieties to 'Common'
    cursor.execute("UPDATE mandi_prices SET variety = 'Common' WHERE variety IS NULL OR TRIM(variety) = '';")

    # Safe deduplication unique index on (commodity, market, variety, arrival_date)
    cursor.execute("""
    CREATE UNIQUE INDEX IF NOT EXISTS idx_mandi_unique_record
    ON mandi_prices(commodity COLLATE NOCASE, market COLLATE NOCASE, variety COLLATE NOCASE, arrival_date);
    """)

    # Mandi Sync Log Table (Feature 5 Stage 4 Enhanced Audit Schema)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS mandi_sync_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sync_time TEXT NOT NULL,
        records_count INTEGER NOT NULL,
        status TEXT NOT NULL,
        source TEXT NOT NULL,
        details TEXT,
        start_time TEXT,
        end_time TEXT,
        fetched_count INTEGER DEFAULT 0,
        valid_count INTEGER DEFAULT 0,
        inserted_count INTEGER DEFAULT 0,
        updated_count INTEGER DEFAULT 0,
        duplicate_count INTEGER DEFAULT 0,
        rejected_count INTEGER DEFAULT 0,
        failed_requests INTEGER DEFAULT 0,
        commodities_collected TEXT,
        arrival_dates TEXT
    );
    """)

    # Safe migration for existing mandi_sync_log table
    cursor.execute("PRAGMA table_info(mandi_sync_log);")
    existing_cols = {row["name"] for row in cursor.fetchall()}
    new_cols = [
        ("start_time", "TEXT"),
        ("end_time", "TEXT"),
        ("fetched_count", "INTEGER DEFAULT 0"),
        ("valid_count", "INTEGER DEFAULT 0"),
        ("inserted_count", "INTEGER DEFAULT 0"),
        ("updated_count", "INTEGER DEFAULT 0"),
        ("duplicate_count", "INTEGER DEFAULT 0"),
        ("rejected_count", "INTEGER DEFAULT 0"),
        ("failed_requests", "INTEGER DEFAULT 0"),
        ("commodities_collected", "TEXT"),
        ("arrival_dates", "TEXT")
    ]
    for col_name, col_type in new_cols:
        if col_name not in existing_cols:
            cursor.execute(f"ALTER TABLE mandi_sync_log ADD COLUMN {col_name} {col_type};")

    conn.commit()
    conn.close()
    print(f"AgriAI local SQLite database initialized at {DB_PATH}")

def hash_password(password: str):
    """Generates an industry-standard Argon2id hash for the given password."""
    return ph.hash(password), "argon2id"

def verify_and_check_upgrade(password: str, salt: str, stored_hash: str):
    """
    Verifies a password against the stored hash.
    Supports both modern Argon2id hashes and legacy salted SHA-256 hashes.
    
    Returns:
        (is_valid: bool, new_argon2_hash: Optional[str])
        If valid and the stored hash is legacy SHA-256 (or needs rehash), returns the new Argon2id hash.
    """
    # 1. Check if stored hash is Argon2id
    if stored_hash.startswith("$argon2"):
        try:
            ph.verify(stored_hash, password)
            if ph.check_needs_rehash(stored_hash):
                return True, ph.hash(password)
            return True, None
        except (VerifyMismatchError, VerificationError, InvalidHashError):
            return False, None

    # 2. Legacy fallback: salted SHA-256
    legacy_hash = hashlib.sha256((password + (salt or "")).encode('utf-8')).hexdigest()
    if secrets.compare_digest(legacy_hash, stored_hash):
        # Valid password with legacy hash -> upgrade to Argon2id!
        return True, ph.hash(password)

    return False, None

def verify_password(password: str, salt: str, stored_hash: str) -> bool:
    """Helper verifying password validity."""
    is_valid, _ = verify_and_check_upgrade(password, salt, stored_hash)
    return is_valid

def register_user(name: str, password: str, language: str = "en"):
    name = name.strip()
    if not name or not password:
        raise ValueError("Name and password cannot be empty")

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        _execute_query(cursor, "SELECT id FROM users WHERE LOWER(name) = LOWER(?)", (name,))
        if cursor.fetchone():
            raise ValueError("An account with this name already exists.")

        pwd_hash, salt = hash_password(password)
        now = datetime.utcnow().isoformat()

        _execute_query(
            cursor,
            "INSERT INTO users (name, password_hash, salt, created_at) VALUES (?, ?, ?, ?)",
            (name, pwd_hash, salt, now)
        )
        user_id = cursor.lastrowid

        _execute_query(
            cursor,
            "INSERT INTO user_preferences (user_id, language, created_at, updated_at) VALUES (?, ?, ?, ?)",
            (user_id, language or "en", now, now)
        )

        token = secrets.token_hex(32)
        _execute_query(
            cursor,
            "INSERT INTO auth_tokens (token, user_id, created_at) VALUES (?, ?, ?)",
            (token, user_id, now)
        )

        conn.commit()
        return {
            "id": user_id,
            "name": name,
            "language": language or "en",
            "created_at": now
        }, token
    finally:
        conn.close()

def login_user(name: str, password: str):
    name = name.strip()
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        _execute_query(cursor, "SELECT id, name, password_hash, salt, created_at FROM users WHERE LOWER(name) = LOWER(?)", (name,))
        user_row = cursor.fetchone()
        if not user_row:
            raise ValueError("Name or password is incorrect.")

        is_valid, upgraded_hash = verify_and_check_upgrade(password, user_row["salt"], user_row["password_hash"])
        if not is_valid:
            raise ValueError("Name or password is incorrect.")

        user_id = user_row["id"]

        # Automatic seamless migration: upgrade legacy hash to Argon2id in DB
        if upgraded_hash:
            _execute_query(cursor, "UPDATE users SET password_hash = ?, salt = ? WHERE id = ?", (upgraded_hash, "argon2id", user_id))

        _execute_query(cursor, "SELECT language FROM user_preferences WHERE user_id = ?", (user_id,))
        pref = cursor.fetchone()
        language = pref["language"] if pref else "en"

        token = secrets.token_hex(32)
        now = datetime.utcnow().isoformat()
        _execute_query(
            cursor,
            "INSERT INTO auth_tokens (token, user_id, created_at) VALUES (?, ?, ?)",
            (token, user_id, now)
        )

        conn.commit()
        return {
            "id": user_id,
            "name": user_row["name"],
            "language": language,
            "created_at": user_row["created_at"]
        }, token
    finally:
        conn.close()

def get_user_by_token(token: str):
    if not token:
        return None
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        _execute_query(cursor, """
            SELECT u.id, u.name, u.created_at, p.language 
            FROM auth_tokens t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN user_preferences p ON u.id = p.user_id
            WHERE t.token = ?
        """, (token,))
        row = cursor.fetchone()
        if not row:
            return None
        return {
            "id": row["id"],
            "name": row["name"],
            "language": row["language"] or "en",
            "created_at": row["created_at"]
        }
    finally:
        conn.close()

def update_user_profile(user_id: int, name: str = None, language: str = None, new_password: str = None, current_password: str = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()

    try:
        if name:
            name = name.strip()
            _execute_query(cursor, "SELECT id FROM users WHERE LOWER(name) = LOWER(?) AND id != ?", (name, user_id))
            if cursor.fetchone():
                raise ValueError("An account with this name already exists.")
            _execute_query(cursor, "UPDATE users SET name = ? WHERE id = ?", (name, user_id))

        if new_password:
            if not current_password:
                raise ValueError("Current password is required to change password.")
            _execute_query(cursor, "SELECT password_hash, salt FROM users WHERE id = ?", (user_id,))
            user_row = cursor.fetchone()
            if not user_row or not verify_password(current_password, user_row["salt"], user_row["password_hash"]):
                raise ValueError("Current password is incorrect.")
            new_hash, new_salt = hash_password(new_password)
            _execute_query(cursor, "UPDATE users SET password_hash = ?, salt = ? WHERE id = ?", (new_hash, new_salt, user_id))

        if language:
            _execute_query(cursor, """
                INSERT INTO user_preferences (user_id, language, created_at, updated_at) 
                VALUES (?, ?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET language = excluded.language, updated_at = excluded.updated_at
            """, (user_id, language, now, now))

        conn.commit()

        _execute_query(cursor, """
            SELECT u.id, u.name, u.created_at, p.language
            FROM users u
            LEFT JOIN user_preferences p ON u.id = p.user_id
            WHERE u.id = ?
        """, (user_id,))
        row = cursor.fetchone()
        return {
            "id": row["id"],
            "name": row["name"],
            "language": row["language"] or "en",
            "created_at": row["created_at"]
        }
    finally:
        conn.close()

def logout_token(token: str):
    if not token:
        return
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        _execute_query(cursor, "DELETE FROM auth_tokens WHERE token = ?", (token,))
        conn.commit()
    finally:
        conn.close()

def get_user_chat_sessions(user_id: int, search_query: str = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if search_query and search_query.strip():
            query = f"%{search_query.strip().lower()}%"
            _execute_query(cursor, """
                SELECT DISTINCT s.id, s.title, s.created_at, s.updated_at 
                FROM chat_sessions s
                LEFT JOIN chat_history h ON s.id = h.session_id
                WHERE s.user_id = ? AND (LOWER(s.title) LIKE ? OR LOWER(h.question) LIKE ? OR LOWER(h.answer) LIKE ?)
                ORDER BY s.updated_at DESC
            """, (user_id, query, query, query))
        else:
            _execute_query(cursor, """
                SELECT id, title, created_at, updated_at 
                FROM chat_sessions 
                WHERE user_id = ? 
                ORDER BY updated_at DESC
            """, (user_id,))
        rows = cursor.fetchall()
        return [{"id": r["id"], "title": r["title"], "created_at": r["created_at"], "updated_at": r["updated_at"]} for r in rows]
    finally:
        conn.close()

def get_session_messages(session_id: str, user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        _execute_query(cursor, "SELECT id, title FROM chat_sessions WHERE id = ? AND user_id = ?", (session_id, user_id))
        session_row = cursor.fetchone()
        if not session_row:
            return None

        _execute_query(cursor, """
            SELECT id, question, answer, language, created_at 
            FROM chat_history 
            WHERE session_id = ? AND user_id = ? 
            ORDER BY created_at ASC, id ASC
        """, (session_id, user_id))
        rows = cursor.fetchall()
        messages = []
        for r in rows:
            messages.append({
                "id": r["id"],
                "question": r["question"],
                "answer": r["answer"],
                "language": r["language"],
                "created_at": r["created_at"]
            })
        return {
            "session_id": session_id,
            "title": session_row["title"],
            "messages": messages
        }
    finally:
        conn.close()

def create_chat_session(user_id: int, title: str = "New Farming Chat"):
    session_id = "session_" + uuid.uuid4().hex[:12]
    now = datetime.utcnow().isoformat()
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        _execute_query(
            cursor,
            "INSERT INTO chat_sessions (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            (session_id, user_id, title, now, now)
        )
        conn.commit()
        return session_id
    finally:
        conn.close()

def save_chat_message(user_id: int, session_id: str, question: str, answer: str, language: str = "en"):
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()

    try:
        _execute_query(cursor, "SELECT id, title FROM chat_sessions WHERE id = ? AND user_id = ?", (session_id, user_id))
        session_row = cursor.fetchone()
        if not session_row:
            session_id = create_chat_session(user_id, title=question[:40] + ("..." if len(question) > 40 else ""))
        elif session_row["title"] == "New Farming Chat":
            new_title = question[:40] + ("..." if len(question) > 40 else "")
            _execute_query(cursor, "UPDATE chat_sessions SET title = ?, updated_at = ? WHERE id = ?", (new_title, now, session_id))
        else:
            _execute_query(cursor, "UPDATE chat_sessions SET updated_at = ? WHERE id = ?", (now, session_id))

        _execute_query(cursor, """
            INSERT INTO chat_history (session_id, user_id, question, answer, language, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (session_id, user_id, question, answer, language or "en", now))
        msg_id = cursor.lastrowid

        conn.commit()
        return {
            "id": msg_id,
            "session_id": session_id,
            "question": question,
            "answer": answer,
            "language": language or "en",
            "created_at": now
        }
    finally:
        conn.close()

def delete_chat_session(session_id: str, user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        _execute_query(cursor, "DELETE FROM chat_sessions WHERE id = ? AND user_id = ?", (session_id, user_id))
        _execute_query(cursor, "DELETE FROM chat_history WHERE session_id = ? AND user_id = ?", (session_id, user_id))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()

def clear_all_chat_history(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        _execute_query(cursor, "DELETE FROM chat_sessions WHERE user_id = ?", (user_id,))
        _execute_query(cursor, "DELETE FROM chat_history WHERE user_id = ?", (user_id,))
        conn.commit()
        return True
    finally:
        conn.close()


# ============================================================
# MANDI MARKET PRICE INTELLIGENCE DATABASE OPERATIONS
# ============================================================

def save_mandi_prices(records, source_type="official_agmarknet_baseline", source_label="Agmarknet DMI Govt of India", return_stats=False):
    if not records:
        empty_stats = {
            "processed_count": 0,
            "inserted_count": 0,
            "updated_count": 0,
            "duplicate_count": 0,
            "rejected_count": 0
        }
        return empty_stats if return_stats else 0

    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    processed_count = 0
    rejected_count = 0
    duplicates_encountered = 0

    try:
        cursor.execute("SELECT count(*) FROM mandi_prices;")
        count_before = cursor.fetchone()[0]

        with conn:
            for r in records:
                if not isinstance(r, dict):
                    rejected_count += 1
                    continue

                commodity = str(r.get("commodity") or "").strip()
                market = str(r.get("market") or "").strip()
                state = str(r.get("state") or "").strip()
                district = str(r.get("district") or "").strip() or state
                variety = str(r.get("variety") or "").strip() or "Common"
                arrival_date = str(r.get("arrival_date") or "").strip()
                unit = str(r.get("unit") or "Rs/Quintal").strip() or "Rs/Quintal"

                try:
                    min_price = float(r.get("min_price", 0.0))
                except (ValueError, TypeError):
                    min_price = 0.0

                try:
                    max_price = float(r.get("max_price", 0.0))
                except (ValueError, TypeError):
                    max_price = 0.0

                try:
                    modal_price = float(r.get("modal_price", 0.0))
                except (ValueError, TypeError):
                    modal_price = 0.0

                # Validate required fields
                if not commodity or not market or not arrival_date or modal_price <= 0:
                    rejected_count += 1
                    continue

                # Harmonize min/max prices
                if min_price > max_price and max_price > 0:
                    min_price, max_price = max_price, min_price
                if min_price <= 0:
                    min_price = modal_price
                if max_price <= 0:
                    max_price = modal_price

                # Check if identical record already exists
                cursor.execute("""
                    SELECT modal_price, min_price, max_price FROM mandi_prices
                    WHERE LOWER(commodity) = LOWER(?) AND LOWER(market) = LOWER(?) AND LOWER(variety) = LOWER(?) AND arrival_date = ?
                """, (commodity, market, variety, arrival_date))
                existing_match = cursor.fetchone()
                if existing_match:
                    if (existing_match["modal_price"] == modal_price and 
                        existing_match["min_price"] == min_price and 
                        existing_match["max_price"] == max_price):
                        duplicates_encountered += 1

                cursor.execute("""
                    INSERT INTO mandi_prices 
                    (state, district, market, commodity, variety, arrival_date, min_price, max_price, modal_price, unit, source_type, source_label, last_updated)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(commodity COLLATE NOCASE, market COLLATE NOCASE, variety COLLATE NOCASE, arrival_date)
                    DO UPDATE SET
                        state = excluded.state,
                        district = excluded.district,
                        min_price = CASE WHEN excluded.min_price > 0 THEN excluded.min_price ELSE mandi_prices.min_price END,
                        max_price = CASE WHEN excluded.max_price > 0 THEN excluded.max_price ELSE mandi_prices.max_price END,
                        modal_price = CASE WHEN excluded.modal_price > 0 THEN excluded.modal_price ELSE mandi_prices.modal_price END,
                        unit = excluded.unit,
                        source_type = CASE WHEN excluded.modal_price > 0 THEN excluded.source_type ELSE mandi_prices.source_type END,
                        source_label = CASE WHEN excluded.modal_price > 0 THEN excluded.source_label ELSE mandi_prices.source_label END,
                        last_updated = excluded.last_updated;
                """, (
                    state,
                    district,
                    market,
                    commodity,
                    variety,
                    arrival_date,
                    min_price,
                    max_price,
                    modal_price,
                    unit,
                    source_type,
                    source_label,
                    now
                ))
                processed_count += 1

        cursor.execute("SELECT count(*) FROM mandi_prices;")
        count_after = cursor.fetchone()[0]

        inserted_count = max(0, count_after - count_before)
        updated_count = max(0, processed_count - inserted_count)

        if return_stats:
            return {
                "processed_count": processed_count,
                "inserted_count": inserted_count,
                "updated_count": updated_count,
                "duplicate_count": duplicates_encountered,
                "rejected_count": rejected_count
            }
        return processed_count
    except Exception as e:
        print(f"Error saving mandi prices: {e}")
        conn.rollback()
        raise e
    finally:
        conn.close()

def get_mandi_prices(search=None, state=None, district=None, market=None, commodity=None, sort="date_desc", page=1, limit=20):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        where_clauses = []
        params = []

        if search and isinstance(search, str) and search.strip():
            term = f"%{search.strip().lower()}%"
            where_clauses.append("(LOWER(commodity) LIKE ? OR LOWER(market) LIKE ? OR LOWER(district) LIKE ? OR LOWER(state) LIKE ? OR LOWER(variety) LIKE ?)")
            params.extend([term, term, term, term, term])

        # Stage 3: State name normalization query expansion
        if state and isinstance(state, str) and state.strip() and state.lower() != "all":
            variants = get_state_query_variants(state.strip())
            if len(variants) == 1:
                where_clauses.append("LOWER(state) = LOWER(?)")
                params.append(variants[0])
            else:
                placeholders = ", ".join(["LOWER(?)"] * len(variants))
                where_clauses.append(f"LOWER(state) IN ({placeholders})")
                params.extend(variants)

        if district and isinstance(district, str) and district.strip() and district.lower() != "all":
            where_clauses.append("LOWER(district) = LOWER(?)")
            params.append(district.strip())

        if market and isinstance(market, str) and market.strip() and market.lower() != "all":
            where_clauses.append("LOWER(market) = LOWER(?)")
            params.append(market.strip())

        # Stage 3: Strict exact commodity matching (prevents conflating Onion vs Onion Green, etc.)
        if commodity and isinstance(commodity, str) and commodity.strip() and commodity.lower() != "all":
            where_clauses.append("LOWER(TRIM(commodity)) = LOWER(TRIM(?))")
            params.append(commodity.strip())

        where_sql = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

        # Total count query
        count_sql = f"SELECT count(*) FROM mandi_prices {where_sql}"
        _execute_query(cursor, count_sql, tuple(params))
        total = cursor.fetchone()[0]

        # Sorting
        sort_clause = "arrival_date DESC, modal_price DESC"
        if sort == "price_desc":
            sort_clause = "modal_price DESC, arrival_date DESC"
        elif sort == "price_asc":
            sort_clause = "modal_price ASC, arrival_date DESC"
        elif sort == "commodity_asc":
            sort_clause = "commodity ASC, modal_price DESC"

        # Pagination
        try:
            page_num = int(page) if isinstance(page, (int, float, str)) and str(page).isdigit() else 1
        except (ValueError, TypeError):
            page_num = 1
        try:
            limit_num = int(limit) if isinstance(limit, (int, float, str)) and str(limit).isdigit() else 20
        except (ValueError, TypeError):
            limit_num = 20

        page_num = max(1, page_num)
        limit_num = max(1, min(100, limit_num))
        offset = max(0, (page_num - 1) * limit_num)

        data_sql = f"""
            SELECT id, state, district, market, commodity, variety, arrival_date,
                   min_price, max_price, modal_price, unit, source_type, source_label, last_updated
            FROM mandi_prices
            {where_sql}
            ORDER BY {sort_clause}
            LIMIT ? OFFSET ?
        """
        data_params = list(params) + [limit_num, offset]
        _execute_query(cursor, data_sql, tuple(data_params))
        rows = cursor.fetchall()
        
        # Stage 3: Enrich records with normalized display_state and suspicious price flags
        records = []
        for r in rows:
            rec = dict(r)
            quality = evaluate_price_quality(
                rec.get("commodity"),
                rec.get("modal_price", 0.0),
                rec.get("min_price"),
                rec.get("max_price"),
                rec.get("unit", "Rs/Quintal")
            )
            rec["display_state"] = normalize_state_display(rec.get("state"))
            rec["is_suspicious"] = quality["is_suspicious"]
            rec["suspicious_reason"] = quality["suspicious_reason"]
            records.append(rec)

        pages = (total + limit_num - 1) // limit_num if total > 0 else 1

        return {
            "records": records,
            "total": total,
            "page": page_num,
            "limit": limit_num,
            "pages": pages
        }
    finally:
        conn.close()

def get_mandi_filter_options(state=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Stage 3: States - retrieve distinct raw states, normalize display, and deduplicate
        _execute_query(cursor, "SELECT DISTINCT state FROM mandi_prices WHERE state IS NOT NULL AND state != ''")
        raw_states = [r[0] for r in cursor.fetchall()]
        states = sorted(list(set(normalize_state_display(s) for s in raw_states if s and s.strip())))

        # Stage 3: Districts & Markets (filtered by state variants if provided)
        if state and isinstance(state, str) and state.strip() and state.lower() != "all":
            variants = get_state_query_variants(state.strip())
            if len(variants) == 1:
                _execute_query(cursor, "SELECT DISTINCT district FROM mandi_prices WHERE LOWER(state) = LOWER(?) AND district IS NOT NULL AND district != '' ORDER BY district ASC", (variants[0],))
                districts = [r[0] for r in cursor.fetchall()]
                _execute_query(cursor, "SELECT DISTINCT market FROM mandi_prices WHERE LOWER(state) = LOWER(?) AND market IS NOT NULL AND market != '' ORDER BY market ASC", (variants[0],))
                markets = [r[0] for r in cursor.fetchall()]
            else:
                placeholders = ", ".join(["LOWER(?)"] * len(variants))
                _execute_query(cursor, f"SELECT DISTINCT district FROM mandi_prices WHERE LOWER(state) IN ({placeholders}) AND district IS NOT NULL AND district != '' ORDER BY district ASC", tuple(variants))
                districts = [r[0] for r in cursor.fetchall()]
                _execute_query(cursor, f"SELECT DISTINCT market FROM mandi_prices WHERE LOWER(state) IN ({placeholders}) AND market IS NOT NULL AND market != '' ORDER BY market ASC", tuple(variants))
                markets = [r[0] for r in cursor.fetchall()]
        else:
            _execute_query(cursor, "SELECT DISTINCT district FROM mandi_prices WHERE district IS NOT NULL AND district != '' ORDER BY district ASC")
            districts = [r[0] for r in cursor.fetchall()]

            _execute_query(cursor, "SELECT DISTINCT market FROM mandi_prices WHERE market IS NOT NULL AND market != '' ORDER BY market ASC")
            markets = [r[0] for r in cursor.fetchall()]

        # Stage 3: Distinct commodities - preserved individually to maintain commodity separation
        _execute_query(cursor, "SELECT DISTINCT commodity FROM mandi_prices WHERE commodity IS NOT NULL AND commodity != '' ORDER BY commodity ASC")
        commodities = [r[0] for r in cursor.fetchall()]

        return {
            "states": states,
            "districts": districts,
            "markets": markets,
            "commodities": commodities
        }
    finally:
        conn.close()

def get_mandi_market_summary():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        _execute_query(cursor, "SELECT count(*) FROM mandi_prices")
        total_records = cursor.fetchone()[0]

        _execute_query(cursor, "SELECT count(DISTINCT commodity) FROM mandi_prices")
        total_commodities = cursor.fetchone()[0]

        _execute_query(cursor, "SELECT count(DISTINCT market) FROM mandi_prices")
        total_markets = cursor.fetchone()[0]

        # Stage 3: Count distinct normalized states for accurate display
        _execute_query(cursor, "SELECT DISTINCT state FROM mandi_prices WHERE state IS NOT NULL AND state != ''")
        raw_states = [r[0] for r in cursor.fetchall()]
        total_states = len(set(normalize_state_display(s) for s in raw_states if s and s.strip()))

        # Stage 3: Exclude clerical outliers (< ₹20/Qtl) from overall average modal calculation
        _execute_query(cursor, "SELECT AVG(modal_price) FROM mandi_prices WHERE modal_price >= 20.0")
        avg_modal = cursor.fetchone()[0] or 0.0

        # Stage 3: Top benchmark commodities across mandis (excluding clerical price anomalies)
        _execute_query(cursor, """
            SELECT commodity, 
                   ROUND(AVG(CASE WHEN modal_price >= 20.0 THEN modal_price ELSE NULL END), 2) as avg_price,
                   ROUND(MIN(CASE WHEN modal_price >= 20.0 THEN min_price ELSE NULL END), 2) as min_price,
                   ROUND(MAX(max_price), 2) as max_price,
                   count(*) as market_count
            FROM mandi_prices
            GROUP BY commodity
            ORDER BY market_count DESC, avg_price DESC
            LIMIT 6
        """)
        top_commodities = [dict(r) for r in cursor.fetchall()]

        # Last sync information
        last_sync = get_last_mandi_sync()

        return {
            "total_records": total_records,
            "total_commodities": total_commodities,
            "total_markets": total_markets,
            "total_states": total_states,
            "overall_avg_price": round(avg_modal, 2),
            "top_commodities": top_commodities,
            "last_sync": last_sync
        }
    finally:
        conn.close()

def log_mandi_sync(
    records_count,
    status,
    source,
    details="",
    start_time=None,
    end_time=None,
    fetched_count=0,
    valid_count=0,
    inserted_count=0,
    updated_count=0,
    duplicate_count=0,
    rejected_count=0,
    failed_requests=0,
    commodities_collected=None,
    arrival_dates=None
):
    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    try:
        commodities_str = ",".join(commodities_collected) if isinstance(commodities_collected, list) else str(commodities_collected or "")
        dates_str = ",".join(arrival_dates) if isinstance(arrival_dates, list) else str(arrival_dates or "")

        _execute_query(cursor, """
            INSERT INTO mandi_sync_log 
            (sync_time, records_count, status, source, details,
             start_time, end_time, fetched_count, valid_count, inserted_count,
             updated_count, duplicate_count, rejected_count, failed_requests,
             commodities_collected, arrival_dates)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            now, records_count, status, source, details,
            start_time or now, end_time or now, fetched_count, valid_count, inserted_count,
            updated_count, duplicate_count, rejected_count, failed_requests,
            commodities_str, dates_str
        ))
        conn.commit()
    finally:
        conn.close()

def get_mandi_freshness_status():
    """
    Feature 5 - Stage 4: Data Freshness Status.
    Provides detailed freshness audit:
    - Last successful collection and last attempted collection
    - Latest arrival date available overall
    - Latest arrival date per supported commodity
    - Days lag vs India Standard Time (Asia/Kolkata)
    - Stale feed evaluation (never reports fresh merely on HTTP 200)
    - Checks for missing commodity feeds
    """
    import pytz
    from datetime import date, datetime as dt_cls
    ist_tz = pytz.timezone("Asia/Kolkata")
    now_ist = dt_cls.now(ist_tz)
    today_ist = now_ist.date()

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Total counts
        cursor.execute("SELECT count(*) FROM mandi_prices;")
        total_records = cursor.fetchone()[0]

        # Overall latest arrival date
        cursor.execute("""
            SELECT arrival_date,
                   SUBSTR(arrival_date, 7, 4) || '-' || SUBSTR(arrival_date, 4, 2) || '-' || SUBSTR(arrival_date, 1, 2) as iso_date
            FROM mandi_prices
            ORDER BY iso_date DESC
            LIMIT 1
        """)
        latest_row = cursor.fetchone()
        latest_arrival_date = latest_row["arrival_date"] if latest_row else None
        latest_iso = latest_row["iso_date"] if latest_row else None

        days_lag = None
        if latest_iso:
            try:
                latest_d = dt_cls.strptime(latest_iso, "%Y-%m-%d").date()
                days_lag = (today_ist - latest_d).days
            except ValueError:
                pass

        # Target commodities to check
        target_crops = ["Tomato", "Onion", "Paddy(Common)", "Wheat", "Cotton", "Rice"]
        commodity_freshness = {}
        missing_commodities = []

        for crop in target_crops:
            cursor.execute("""
                SELECT count(*) as cnt,
                       MAX(SUBSTR(arrival_date, 7, 4) || '-' || SUBSTR(arrival_date, 4, 2) || '-' || SUBSTR(arrival_date, 1, 2)) as latest_iso
                FROM mandi_prices
                WHERE LOWER(TRIM(commodity)) = LOWER(TRIM(?))
            """, (crop,))
            crow = cursor.fetchone()
            cnt = crow["cnt"] if crow else 0
            crop_iso = crow["latest_iso"] if crow else None

            if cnt == 0 or not crop_iso:
                missing_commodities.append(crop)
                commodity_freshness[crop] = {
                    "records_count": 0,
                    "latest_arrival_date": None,
                    "days_lag": None,
                    "status": "missing",
                    "is_stale": True
                }
            else:
                crop_d = dt_cls.strptime(crop_iso, "%Y-%m-%d").date()
                c_lag = (today_ist - crop_d).days
                c_formatted = crop_d.strftime("%d/%m/%Y")
                c_stale = c_lag > 2  # >2 days indicates stale feed
                commodity_freshness[crop] = {
                    "records_count": cnt,
                    "latest_arrival_date": c_formatted,
                    "days_lag": c_lag,
                    "status": "fresh" if c_lag <= 1 else ("acceptable" if c_lag == 2 else "stale"),
                    "is_stale": c_stale
                }

        # Stale evaluation:
        # If overall days_lag is > 2, or any target crop has days_lag > 3, consider stale
        is_overall_stale = (days_lag is not None and days_lag > 2) or len(missing_commodities) > 0
        freshness_tier = "fresh" if (days_lag is not None and days_lag <= 1 and not missing_commodities) else (
            "acceptable" if (days_lag is not None and days_lag == 2 and not missing_commodities) else "stale"
        )

        # Last attempted and successful sync logs
        cursor.execute("SELECT * FROM mandi_sync_log ORDER BY id DESC LIMIT 1;")
        last_attempted_row = cursor.fetchone()
        last_attempted = dict(last_attempted_row) if last_attempted_row else None

        cursor.execute("SELECT * FROM mandi_sync_log WHERE status = 'SUCCESS' ORDER BY id DESC LIMIT 1;")
        last_successful_row = cursor.fetchone()
        last_successful = dict(last_successful_row) if last_successful_row else None

        new_records_in_last_sync = 0
        if last_successful:
            new_records_in_last_sync = last_successful.get("inserted_count") or 0

        # Build human-readable health summary
        if is_overall_stale:
            health_summary = (
                f"Mandi data feed is {days_lag} days old (latest arrivals from {latest_arrival_date}). "
                f"Daily synchronization is recommended."
            )
        else:
            health_summary = (
                f"Mandi data feed is current (latest arrivals from {latest_arrival_date}, lag: {days_lag} day(s)). "
                f"All {len(target_crops)} monitored agricultural commodities have active wholesale price data."
            )

        return {
            "current_time_ist": now_ist.strftime("%d/%m/%Y %H:%M:%S IST"),
            "current_date_ist": today_ist.strftime("%d/%m/%Y"),
            "total_records": total_records,
            "latest_arrival_date": latest_arrival_date,
            "days_lag": days_lag,
            "is_stale": is_overall_stale,
            "freshness_status": freshness_tier,
            "feed_health_summary": health_summary,
            "new_records_collected_in_last_sync": new_records_in_last_sync,
            "last_successful_collection": last_successful,
            "last_attempted_collection": last_attempted,
            "commodity_freshness": commodity_freshness,
            "missing_commodities": missing_commodities,
            "has_missing_commodities": len(missing_commodities) > 0
        }
    finally:
        conn.close()

def get_last_mandi_sync():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        _execute_query(cursor, """
            SELECT id, sync_time, records_count, status, source, details 
            FROM mandi_sync_log 
            ORDER BY id DESC LIMIT 1
        """)
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()

def get_historical_collection_status():
    """
    Feature 5 - Stage 2: Historical Mandi Price Data Status.
    Provides comprehensive metrics on collected mandi price time-series records:
    - Total records and historical-specific records
    - Number of unique arrival dates
    - Number of crops and markets covered
    - Granular breakdown of records per crop
    - Breakdown of records per market
    - Earliest and latest arrival dates (chronological)
    - Provenance breakdown by source_type and source_label
    - Recent sync/collection logs
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Total counts
        cursor.execute("SELECT count(*) FROM mandi_prices")
        total_records = cursor.fetchone()[0]

        cursor.execute("SELECT count(*) FROM mandi_prices WHERE source_type = 'official_historical'")
        historical_records = cursor.fetchone()[0]

        cursor.execute("SELECT count(DISTINCT arrival_date) FROM mandi_prices")
        unique_dates_count = cursor.fetchone()[0]

        cursor.execute("SELECT count(DISTINCT commodity) FROM mandi_prices")
        unique_crops_count = cursor.fetchone()[0]

        cursor.execute("SELECT count(DISTINCT market) FROM mandi_prices")
        unique_markets_count = cursor.fetchone()[0]

        # Chronological Date Range
        cursor.execute("""
            SELECT arrival_date,
                   SUBSTR(arrival_date, 7, 4) || '-' || SUBSTR(arrival_date, 4, 2) || '-' || SUBSTR(arrival_date, 1, 2) as iso_date
            FROM mandi_prices
            ORDER BY iso_date ASC
            LIMIT 1
        """)
        earliest_row = cursor.fetchone()
        earliest_date = earliest_row["arrival_date"] if earliest_row else None

        cursor.execute("""
            SELECT arrival_date,
                   SUBSTR(arrival_date, 7, 4) || '-' || SUBSTR(arrival_date, 4, 2) || '-' || SUBSTR(arrival_date, 1, 2) as iso_date
            FROM mandi_prices
            ORDER BY iso_date DESC
            LIMIT 1
        """)
        latest_row = cursor.fetchone()
        latest_date = latest_row["arrival_date"] if latest_row else None

        # Records per crop
        cursor.execute("""
            SELECT commodity, 
                   count(*) as records_count, 
                   count(DISTINCT arrival_date) as dates_count,
                   MIN(modal_price) as min_modal, 
                   MAX(modal_price) as max_modal, 
                   ROUND(AVG(modal_price), 2) as avg_modal
            FROM mandi_prices
            GROUP BY commodity
            ORDER BY records_count DESC, commodity ASC
        """)
        crops_breakdown = [dict(r) for r in cursor.fetchall()]

        # Records per market (top 25)
        cursor.execute("""
            SELECT market, state, district, 
                   count(*) as records_count, 
                   count(DISTINCT commodity) as crops_count,
                   count(DISTINCT arrival_date) as dates_count
            FROM mandi_prices
            GROUP BY market, state, district
            ORDER BY records_count DESC, market ASC
            LIMIT 25
        """)
        markets_breakdown = [dict(r) for r in cursor.fetchall()]

        # Breakdown by source provenance
        cursor.execute("""
            SELECT source_type, source_label, count(*) as count
            FROM mandi_prices
            GROUP BY source_type, source_label
            ORDER BY count DESC
        """)
        sources_breakdown = [dict(r) for r in cursor.fetchall()]

        # Recent collection & sync logs (last 10)
        cursor.execute("""
            SELECT id, sync_time, records_count, status, source, details
            FROM mandi_sync_log
            ORDER BY id DESC
            LIMIT 10
        """)
        recent_logs = [dict(r) for r in cursor.fetchall()]

        return {
            "total_records": total_records,
            "historical_records": historical_records,
            "unique_dates_count": unique_dates_count,
            "crops_collected_count": unique_crops_count,
            "markets_covered_count": unique_markets_count,
            "earliest_arrival_date": earliest_date,
            "latest_arrival_date": latest_date,
            "crops_breakdown": crops_breakdown,
            "markets_breakdown": markets_breakdown,
            "sources_breakdown": sources_breakdown,
            "recent_logs": recent_logs
        }
    finally:
        conn.close()

def get_mandi_price_comparison(commodity, state=None, unit=None, variety=None):
    """
    Retrieves and compares agricultural market prices for a selected commodity across APMC mandis.
    Supports optional state and variety filters. Computes highest modal rate market, lowest modal rate market,
    price difference (spread), and average modal rate for compatible units.
    
    Stage 3 Safeguards:
    - Strict commodity isolation (prevents merging variants).
    - State name normalization query expansion.
    - Outlier/suspicious price exclusion from benchmark highest/lowest/average metrics.
    - Preserves all raw database records and flags suspicious rows with clear rationale.
    """
    if not commodity or not isinstance(commodity, str) or not commodity.strip():
        return {
            "commodity": "",
            "state": state or "All",
            "unit": unit or "Rs/Quintal",
            "variety": variety or "All",
            "records": [],
            "highest": None,
            "lowest": None,
            "price_difference": 0,
            "average_modal_price": 0,
            "markets_count": 0,
            "total_markets_count": 0,
            "suspicious_count": 0,
            "suspicious_records": [],
            "quality_note": None,
            "varieties": []
        }

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Strict exact commodity match
        var_clauses = ["LOWER(TRIM(commodity)) = LOWER(TRIM(?))"]
        var_params = [commodity.strip()]
        
        # State normalization query expansion
        if state and isinstance(state, str) and state.strip() and state.lower() != "all":
            st_vars = get_state_query_variants(state.strip())
            if len(st_vars) == 1:
                var_clauses.append("LOWER(state) = LOWER(?)")
                var_params.append(st_vars[0])
            else:
                pl = ", ".join(["LOWER(?)"] * len(st_vars))
                var_clauses.append(f"LOWER(state) IN ({pl})")
                var_params.extend(st_vars)

        var_sql = f"SELECT DISTINCT variety FROM mandi_prices WHERE {' AND '.join(var_clauses)}"
        _execute_query(cursor, var_sql, tuple(var_params))
        all_available_varieties = sorted([r[0] for r in cursor.fetchall() if r[0]])

        where_clauses = ["LOWER(TRIM(commodity)) = LOWER(TRIM(?))"]
        params = [commodity.strip()]

        if state and isinstance(state, str) and state.strip() and state.lower() != "all":
            st_vars = get_state_query_variants(state.strip())
            if len(st_vars) == 1:
                where_clauses.append("LOWER(state) = LOWER(?)")
                params.append(st_vars[0])
            else:
                pl = ", ".join(["LOWER(?)"] * len(st_vars))
                where_clauses.append(f"LOWER(state) IN ({pl})")
                params.extend(st_vars)

        if unit and isinstance(unit, str) and unit.strip() and unit.lower() != "all":
            where_clauses.append("LOWER(unit) = LOWER(?)")
            params.append(unit.strip())

        if variety and isinstance(variety, str) and variety.strip() and variety.lower() != "all":
            where_clauses.append("LOWER(variety) = LOWER(?)")
            params.append(variety.strip())

        where_sql = "WHERE " + " AND ".join(where_clauses)

        sql = f"""
            SELECT id, state, district, market, commodity, variety, arrival_date,
                   min_price, max_price, modal_price, unit, source_type, source_label, last_updated
            FROM mandi_prices
            {where_sql}
            ORDER BY modal_price DESC, arrival_date DESC
        """
        _execute_query(cursor, sql, tuple(params))
        rows = cursor.fetchall()
        
        # Enrich each record with display_state and suspicious price flags
        records = []
        for r in rows:
            rec = dict(r)
            quality = evaluate_price_quality(
                rec.get("commodity"),
                rec.get("modal_price", 0.0),
                rec.get("min_price"),
                rec.get("max_price"),
                rec.get("unit", "Rs/Quintal")
            )
            rec["display_state"] = normalize_state_display(rec.get("state"))
            rec["is_suspicious"] = quality["is_suspicious"]
            rec["suspicious_reason"] = quality["suspicious_reason"]
            records.append(rec)

        if not records:
            return {
                "commodity": commodity.strip(),
                "state": state or "All",
                "unit": unit or "Rs/Quintal",
                "variety": variety or "All",
                "records": [],
                "highest": None,
                "lowest": None,
                "price_difference": 0,
                "average_modal_price": 0,
                "markets_count": 0,
                "total_markets_count": 0,
                "suspicious_count": 0,
                "suspicious_records": [],
                "quality_note": None,
                "varieties": all_available_varieties
            }

        # Compatible units grouping (only compare matching units)
        target_unit = records[0]["unit"]
        compatible_records = [r for r in records if r["unit"].lower() == target_unit.lower()]

        # Stage 3 Safeguard: Isolate valid benchmark records from suspicious/clerical outliers
        valid_records = [r for r in compatible_records if not r.get("is_suspicious")]
        suspicious_records = [r for r in compatible_records if r.get("is_suspicious")]

        if valid_records:
            highest = max(valid_records, key=lambda x: x["modal_price"])
            lowest = min(valid_records, key=lambda x: x["modal_price"])
            price_difference = round(highest["modal_price"] - lowest["modal_price"], 2)
            avg_modal = round(sum(r["modal_price"] for r in valid_records) / len(valid_records), 2)
            quality_note = (
                f"{len(suspicious_records)} anomalous price record(s) excluded from highest/lowest benchmarks to ensure accurate spread."
                if suspicious_records else None
            )
        else:
            # Fallback if every available record was flagged as anomalous
            highest = max(compatible_records, key=lambda x: x["modal_price"])
            lowest = min(compatible_records, key=lambda x: x["modal_price"])
            price_difference = round(highest["modal_price"] - lowest["modal_price"], 2)
            avg_modal = round(sum(r["modal_price"] for r in compatible_records) / len(compatible_records), 2)
            quality_note = "All available records have been flagged as anomalous; benchmarks should be verified directly with APMC."

        return {
            "commodity": commodity.strip(),
            "state": state or "All",
            "unit": target_unit,
            "variety": variety or "All",
            "records": compatible_records,
            "highest": highest,
            "lowest": lowest,
            "price_difference": price_difference,
            "average_modal_price": avg_modal,
            "markets_count": len(valid_records) if valid_records else len(compatible_records),
            "total_markets_count": len(compatible_records),
            "suspicious_count": len(suspicious_records),
            "suspicious_records": suspicious_records,
            "quality_note": quality_note,
            "varieties": all_available_varieties
        }
    finally:
        conn.close()


def get_best_market_suggestion(commodity, state=None, unit=None, variety=None):
    """
    Feature 3: Best Market Suggestion MVP.
    Identifies the single highest paying APMC market for a crop,
    computes advantage metrics vs competitors/lowest, explains the recommendation rationale,
    and returns alternative markets.
    
    Stage 3 Safeguard: Guarantees that highest, lowest, and price spreads are derived
    exclusively from validated, non-suspicious market transactions.
    """
    comp = get_mandi_price_comparison(commodity=commodity, state=state, unit=unit, variety=variety)
    records = comp.get("records", [])

    if not records or not comp.get("highest"):
        return {
            "status": "no_data",
            "commodity": comp.get("commodity", commodity),
            "state": comp.get("state", state or "All"),
            "variety": comp.get("variety", variety or "All"),
            "recommended_market": None,
            "alternatives": [],
            "explanation": f"No active APMC mandi records found for {commodity} in the selected area.",
            "metrics": {
                "advantage_amount": 0,
                "advantage_percentage": 0,
                "average_modal_price": 0,
                "markets_analyzed": 0
            },
            "suspicious_count": 0,
            "quality_note": None,
            "varieties": comp.get("varieties", [])
        }

    highest = comp["highest"]
    lowest = comp["lowest"]
    price_diff = comp["price_difference"]
    avg_price = comp["average_modal_price"]
    markets_count = comp["markets_count"]
    suspicious_count = comp.get("suspicious_count", 0)

    # Alternatives are all records except the top recommended one
    alternatives = [r for r in records if r["id"] != highest["id"]]

    unit_label = highest["unit"].replace("Rs/", "").replace("Rs.", "").strip() or "Quintal"

    # Build human-readable rationale explanation
    if markets_count == 1:
        explanation = (
            f"{highest['market']} ({highest['district']}, {highest['state']}) is the sole verified APMC market "
            f"for {commodity} with a modal rate of ₹{highest['modal_price']:,.0f}/{unit_label}. "
            f"Broaden to 'All States' to discover inter-state market options."
        )
    elif price_diff > 0:
        pct_gain = round((price_diff / lowest["modal_price"]) * 100, 1) if lowest["modal_price"] else 0
        explanation = (
            f"{highest['market']} ({highest['district']}, {highest['state']}) offers the highest wholesale modal rate "
            f"at ₹{highest['modal_price']:,.0f}/{unit_label}, giving farmers +₹{price_diff:,.0f}/{unit_label} "
            f"(+{pct_gain}%) more revenue compared to {lowest['market']}."
        )
    else:
        explanation = (
            f"{highest['market']} offers the benchmark modal rate of ₹{highest['modal_price']:,.0f}/{unit_label}. "
            f"Prices are currently uniform across the {markets_count} analyzed APMC mandis."
        )

    if suspicious_count > 0:
        explanation += f" (Note: {suspicious_count} anomalous price report was excluded from benchmark analysis)."

    # Calculate difference for each alternative market vs the recommended one
    for alt in alternatives:
        alt["price_gap_vs_recommended"] = round(highest["modal_price"] - alt["modal_price"], 2)

    return {
        "status": "recommended" if markets_count > 1 else "single_market",
        "commodity": comp["commodity"],
        "state": comp["state"],
        "variety": comp["variety"],
        "recommended_market": {
            "id": highest["id"],
            "market": highest["market"],
            "district": highest["district"],
            "state": highest["state"],
            "display_state": highest.get("display_state", highest["state"]),
            "commodity": highest["commodity"],
            "variety": highest["variety"],
            "modal_price": highest["modal_price"],
            "min_price": highest["min_price"],
            "max_price": highest["max_price"],
            "unit": highest["unit"],
            "arrival_date": highest["arrival_date"],
            "source_type": highest["source_type"],
            "source_label": highest["source_label"],
            "is_suspicious": highest.get("is_suspicious", False),
            "last_updated": highest["last_updated"]
        },
        "alternatives": alternatives,
        "explanation": explanation,
        "metrics": {
            "advantage_amount": price_diff,
            "advantage_percentage": round((price_diff / lowest["modal_price"]) * 100, 1) if lowest and lowest["modal_price"] else 0,
            "average_modal_price": avg_price,
            "markets_analyzed": markets_count
        },
        "suspicious_count": suspicious_count,
        "quality_note": comp.get("quality_note"),
        "varieties": comp.get("varieties", [])
    }


def get_basic_selling_advice(commodity, state=None, unit=None, variety=None, selected_market=None):
    """
    Feature 4: Basic Selling Advice MVP.
    Provides rule-based selling advice based on actual mandi modal prices:
    - Case 1: Current market has a competitive price.
    - Case 2: Another mandi offers a higher price (+price gap).
    - Case 3: Limited market data (single mandi).
    - Case 4: No market data.
    - Case 5: Selected market has an anomalous / suspicious price.
    Includes general practical selling tips and verified data provenance.
    """
    selling_tips = [
        "Check today's mandi price before selling.",
        "Compare prices across available markets.",
        "Consider transportation expenses.",
        "Check loading, unloading and commission charges.",
        "Check crop quality and market demand.",
        "Confirm the latest price with the mandi before transporting produce."
    ]

    comp = get_mandi_price_comparison(commodity=commodity, state=state, unit=unit, variety=variety)
    records = comp.get("records", [])
    markets_count = comp.get("markets_count", 0)
    suspicious_count = comp.get("suspicious_count", 0)

    # Case 4 – No market data
    if not records or markets_count == 0 or not comp.get("highest"):
        return {
            "status": "success",
            "commodity": comp.get("commodity", commodity or ""),
            "state": comp.get("state", state or "All"),
            "variety": comp.get("variety", variety or "All"),
            "unit": comp.get("unit", unit or "Rs/Quintal"),
            "selected_market": None,
            "best_available_market": None,
            "price_difference": 0,
            "advice_category": "no_data",
            "advice_message": "No mandi price data is available for this crop and location. Try changing your filters.",
            "selling_tips": selling_tips,
            "arrival_date": None,
            "data_source": "Agmarknet DMI Govt of India",
            "data_status": "baseline",
            "available_markets": [],
            "suspicious_count": 0,
            "quality_note": None,
            "varieties": comp.get("varieties", [])
        }

    # Case 3 – Limited market data (Only 1 suitable mandi available)
    if markets_count == 1:
        single = records[0]
        data_status = "live" if single.get("source_type") == "official_live" else "baseline"
        return {
            "status": "success",
            "commodity": comp["commodity"],
            "state": comp["state"],
            "variety": comp["variety"],
            "unit": comp["unit"],
            "selected_market": single,
            "best_available_market": single,
            "price_difference": 0,
            "advice_category": "limited_data",
            "advice_message": "Only limited market price information is available. Compare with nearby markets before making your selling decision.",
            "selling_tips": selling_tips,
            "arrival_date": single.get("arrival_date"),
            "data_source": single.get("source_label", "Agmarknet DMI Govt of India"),
            "data_status": data_status,
            "available_markets": records,
            "suspicious_count": suspicious_count,
            "quality_note": comp.get("quality_note"),
            "varieties": comp.get("varieties", [])
        }

    # Multiple markets available
    best = comp["highest"]
    lowest = comp["lowest"]

    # Match selected mandi if provided by user; otherwise default to lowest/runner-up for comparison
    current = None
    if selected_market and isinstance(selected_market, str) and selected_market.strip():
        for r in records:
            if r["market"].strip().lower() == selected_market.strip().lower():
                current = r
                break

    if not current:
        # Default to lowest paying market (to show arbitrage) or runner-up if best == lowest
        current = lowest if lowest["id"] != best["id"] else records[-1]

    diff = round(best["modal_price"] - current["modal_price"], 2)
    data_status = "live" if best.get("source_type") == "official_live" else "baseline"

    # Stage 3 Safeguard: Check if the user's selected market has suspicious data
    if current.get("is_suspicious"):
        advice_category = "suspicious_market_data"
        advice_message = (
            f"Warning: {current['market']} has reported an anomalous price "
            f"(₹{current['modal_price']:,.2f}/{current.get('unit', 'Qtl')}). "
            f"Reason: {current.get('suspicious_reason') or 'Unusual price variance'}. "
            f"Please verify rates directly with mandi officials before making selling decisions."
        )
        price_diff_val = 0
    # Case 1 – Selected market has a competitive price
    elif current["id"] == best["id"] or diff <= 0:
        advice_category = "competitive_price"
        advice_message = "Your selected market has a competitive price. You can consider selling after checking transportation and other selling expenses."
        price_diff_val = 0
    # Case 2 – Another mandi offers a higher price
    else:
        advice_category = "better_mandi_available"
        advice_message = "Another mandi currently offers a higher modal price. Compare transportation, commission and other expenses before choosing where to sell."
        price_diff_val = diff

    return {
        "status": "success",
        "commodity": comp["commodity"],
        "state": comp["state"],
        "variety": comp["variety"],
        "unit": comp["unit"],
        "selected_market": current,
        "best_available_market": best,
        "price_difference": price_diff_val,
        "advice_category": advice_category,
        "advice_message": advice_message,
        "selling_tips": selling_tips,
        "arrival_date": best.get("arrival_date"),
        "data_source": best.get("source_label", "Agmarknet DMI Govt of India"),
        "data_status": data_status,
        "available_markets": records,
        "suspicious_count": suspicious_count,
        "quality_note": comp.get("quality_note"),
        "varieties": comp.get("varieties", [])
    }


