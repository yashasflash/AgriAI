import os
import sqlite3
import hashlib
import secrets
import uuid
from datetime import datetime
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError

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
