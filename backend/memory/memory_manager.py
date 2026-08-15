import sqlite3
import os
import logging

log = logging.getLogger("memory_manager")

DB_PATH = os.path.join(os.path.dirname(__file__), "memory_store.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS memories (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS internships (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            company TEXT,
            location TEXT,
            source TEXT,
            url TEXT,
            date_found TEXT
        )
    ''')
    cursor.execute("DROP TABLE IF EXISTS resumes")
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS resumes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            role TEXT,
            markdown_path TEXT,
            pdf_path TEXT,
            created_at TEXT
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS llm_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            query TEXT UNIQUE,
            response TEXT,
            created_at TEXT
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company TEXT,
            role TEXT,
            source TEXT,
            resume_id INTEGER,
            status TEXT,
            applied_at TEXT,
            notes TEXT
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS voice_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transcript TEXT,
            intent TEXT,
            router TEXT,
            created_at TEXT
        )
    ''')
    conn.commit()
    conn.close()

def store_memory(key: str, value: str) -> bool:
    key_lower = key.lower().strip()
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("REPLACE INTO memories (key, value) VALUES (?, ?)", (key_lower, value.strip()))
        conn.commit()
        conn.close()
        log.info(f"Memory Saved: {key_lower} -> {value}")
        return True
    except Exception as e:
        log.error(f"Error saving memory: {e}")
        return False

def retrieve_memory(key: str) -> str:
    key_lower = key.lower().strip()
    
    # Check SQLite first
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM memories WHERE key = ?", (key_lower,))
        row = cursor.fetchone()
        conn.close()
        if row:
            log.info(f"Memory Retrieved: {key_lower} -> {row[0]}")
            return row[0]
    except Exception as e:
        log.error(f"Error retrieving memory from db: {e}")
        
    # Check user_profile.json fallback
    try:
        import json
        profile_path = os.path.join(os.path.dirname(__file__), "user_profile.json")
        if os.path.exists(profile_path):
            with open(profile_path, "r", encoding="utf-8") as f:
                profile = json.load(f)
                
            # Direct mapping from english words to JSON keys
            key_no_my = key_lower
            if key_no_my.startswith("my "):
                key_no_my = key_no_my[3:]
                
            mapping = {
                "github username": "github_username",
                "linkedin profile": "linkedin_profile",
                "graduation year": "graduation_year",
                "phone number": "phone",
                "full name": "full_name",
                "first name": "first_name",
                "last name": "last_name"
            }
            mapped_key = mapping.get(key_no_my, key_no_my.replace(" ", "_"))
            
            if mapped_key in profile:
                val = profile[mapped_key]
                if isinstance(val, list):
                    val = ", ".join(val)
                log.info(f"Memory Retrieved (Profile): {key_lower} -> {val}")
                return str(val)
    except Exception as e:
        log.error(f"Error retrieving memory from profile: {e}")
        
    log.info(f"Memory Retrieved: {key_lower} -> None")
    return None

def delete_memory(key: str) -> bool:
    key_lower = key.lower().strip()
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM memories WHERE key = ?", (key_lower,))
        deleted = cursor.rowcount > 0
        conn.commit()
        conn.close()
        if deleted:
            log.info(f"Memory Deleted: {key_lower}")
        return deleted
    except Exception as e:
        log.error(f"Error deleting memory: {e}")
        return False

def get_all_memories():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT key, value FROM memories ORDER BY key ASC")
        rows = cursor.fetchall()
        conn.close()
        
        result = []
        for row in rows:
            result.append({
                "key": row[0],
                "value": row[1]
            })
        return result
    except Exception as e:
        log.error(f"Error retrieving memories: {e}")
        return []

def log_voice_command(transcript: str, intent: str, router: str):
    from datetime import datetime
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO voice_logs (transcript, intent, router, created_at)
            VALUES (?, ?, ?, ?)
        ''', (transcript, intent, router, datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
        conn.commit()
        conn.close()
    except Exception as e:
        log.error(f"Error logging voice command: {e}")

def get_voice_logs():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT id, transcript, intent, router, created_at FROM voice_logs ORDER BY id DESC LIMIT 100")
        rows = cursor.fetchall()
        conn.close()
        
        result = []
        for row in rows:
            result.append({
                "id": row[0],
                "transcript": row[1],
                "intent": row[2],
                "router": row[3],
                "created_at": row[4]
            })
        return result
    except Exception as e:
        log.error(f"Error retrieving voice logs: {e}")
        return []

def store_internship(title: str, company: str, location: str, source: str, url: str, date_found: str):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO internships (title, company, location, source, url, date_found)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (title, company, location, source, url, date_found))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        log.error(f"Error saving internship: {e}")
        return False

def get_all_internships():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT id, title, company, location, source, url, date_found FROM internships ORDER BY id DESC")
        rows = cursor.fetchall()
        conn.close()
        
        result = []
        for row in rows:
            result.append({
                "id": row[0],
                "title": row[1],
                "company": row[2],
                "location": row[3],
                "source": row[4],
                "url": row[5],
                "date_found": row[6]
            })
        return result
    except Exception as e:
        log.error(f"Error retrieving internships: {e}")
        return []

def store_resume(role: str, markdown_path: str, pdf_path: str, created_at: str):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO resumes (role, markdown_path, pdf_path, created_at)
            VALUES (?, ?, ?, ?)
        ''', (role, markdown_path, pdf_path, created_at))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        log.error(f"Error saving resume record: {e}")
        return False

def get_all_resumes():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT id, role, markdown_path, pdf_path, created_at FROM resumes ORDER BY id DESC")
        rows = cursor.fetchall()
        conn.close()
        
        result = []
        for row in rows:
            result.append({
                "id": row[0],
                "role": row[1],
                "markdown_path": row[2],
                "pdf_path": row[3],
                "created_at": row[4]
            })
        return result
    except Exception as e:
        log.error(f"Error retrieving resumes: {e}")
        return []

def store_application(company: str, role: str, source: str, resume_id: int, status: str, applied_at: str, notes: str):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO applications (company, role, source, resume_id, status, applied_at, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (company, role, source, resume_id, status, applied_at, notes))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        log.error(f"Error saving application: {e}")
        return False

def get_all_applications():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT id, company, role, source, resume_id, status, applied_at, notes FROM applications ORDER BY id DESC")
        rows = cursor.fetchall()
        conn.close()
        
        result = []
        for row in rows:
            result.append({
                "id": row[0],
                "company": row[1],
                "role": row[2],
                "source": row[3],
                "resume_id": row[4],
                "status": row[5],
                "applied_at": row[6],
                "notes": row[7]
            })
        return result
    except Exception as e:
        log.error(f"Error retrieving applications: {e}")
        return []

def update_application_status(company: str, role: str, new_status: str):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE applications 
            SET status = ? 
            WHERE company LIKE ? AND role LIKE ?
        ''', (new_status, f"%{company}%", f"%{role}%"))
        changes = conn.total_changes
        conn.commit()
        conn.close()
        return changes > 0
    except Exception as e:
        log.error(f"Error updating application status: {e}")
        return False

def update_application_status_by_id(app_id: int, new_status: str):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE applications 
            SET status = ? 
            WHERE id = ?
        ''', (new_status, app_id))
        changes = conn.total_changes
        conn.commit()
        conn.close()
        return changes > 0
    except Exception as e:
        log.error(f"Error updating application status by id: {e}")
        return False

# Initialize the db on module load
init_db()

def check_llm_cache(query: str):
    query_lower = query.lower().strip()
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT response FROM llm_cache WHERE query = ?", (query_lower,))
        row = cursor.fetchone()
        conn.close()
        if row:
            import json
            return json.loads(row[0])
    except Exception as e:
        log.error(f"Error checking cache: {e}")
    return None

def store_llm_cache(query: str, response: dict):
    from datetime import datetime
    query_lower = query.lower().strip()
    try:
        import json
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO llm_cache (query, response, created_at)
            VALUES (?, ?, ?)
        ''', (query_lower, json.dumps(response), datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
        conn.commit()
        conn.close()
    except Exception as e:
        log.error(f"Error storing in cache: {e}")
