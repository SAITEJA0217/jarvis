import os
import json
import logging
from functools import lru_cache

log = logging.getLogger("knowledge_loader")

KNOWLEDGE_DIR = os.path.dirname(__file__)

@lru_cache(maxsize=1)
def list_knowledge_files() -> list:
    """Return a list of markdown filenames present in the knowledge directory."""
    try:
        return [f for f in os.listdir(KNOWLEDGE_DIR) if f.lower().endswith('.md')]
    except Exception as e:
        log.error(f"Error listing knowledge files: {e}")
        return []

def get_recent_memories(limit: int = 20) -> list:
    """Retrieves up to *limit* recent user memories from the SQLite DB as a list of (key, value) tuples."""
    try:
        import sqlite3
        db_path = os.path.join(os.path.dirname(__file__), "..", "memory", "memory_store.db")
        if not os.path.exists(db_path):
            log.info("[MEMORY_LOADED] No memory DB found")
            return []
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Verify the schema / columns of the memories table
        cursor.execute("PRAGMA table_info(memories)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if "created_at" in columns:
            cursor.execute("SELECT key, value FROM memories ORDER BY created_at DESC LIMIT ?", (limit,))
        else:
            cursor.execute("SELECT key, value FROM memories LIMIT ?", (limit,))
            
        rows = cursor.fetchall()
        conn.close()
        log.info(f"[MEMORY_LOADED] Loaded {len(rows)} recent memories")
        return rows
    except Exception as e:
        log.error(f"[MEMORY_ERROR] Error loading recent memories: {e}")
        return []


@lru_cache(maxsize=1)
def load_user_profile() -> str:
    """Loads and formats the user_profile.json, including optional fields if present."""
    log.info("[PROFILE_LOADED] Loading user_profile.json")
    profile_path = os.path.join(os.path.dirname(__file__), "..", "memory", "user_profile.json")
    if not os.path.exists(profile_path):
        return ""
    try:
        with open(profile_path, "r", encoding="utf-8") as f:
            profile = json.load(f)
        # Build a multiline string with all known fields
        lines = []
        if profile.get('full_name'):
            lines.append(f"Name: {profile.get('full_name')}")
        if profile.get('university'):
            lines.append(f"University: {profile.get('university')}")
        if profile.get('degree'):
            lines.append(f"Degree: {profile.get('degree')}")
        if profile.get('graduation_year'):
            lines.append(f"Graduation Year: {profile.get('graduation_year')}")
        if profile.get('github'):
            lines.append(f"GitHub: {profile.get('github')}")
        if profile.get('linkedin'):
            lines.append(f"LinkedIn: {profile.get('linkedin')}")
        if profile.get('internlink'):
            lines.append(f"InternLink: {profile.get('internlink')}")
        if profile.get('skills'):
            lines.append(f"Skills: {', '.join(profile.get('skills'))}")
        if profile.get('projects'):
            lines.append(f"Projects: {', '.join(profile.get('projects'))}")
        return "\n".join(lines)
    except Exception as e:
        log.error(f"Error loading user profile: {e}")
        return ""

@lru_cache(maxsize=1)
def load_knowledge() -> str:
    """
    Loads all markdown knowledge files from the knowledge directory and returns their combined content as a string.
    """
    try:
        files = list_knowledge_files()
        if not files:
            log.info("[KNOWLEDGE_LOADED] No knowledge markdown files found")
            return ""
        contents = []
        for fname in files:
            fpath = os.path.join(KNOWLEDGE_DIR, fname)
            with open(fpath, "r", encoding="utf-8") as f:
                contents.append(f"--- {fname} ---\n" + f.read())
        combined = "\n\n".join(contents)
        log.info(f"[KNOWLEDGE_LOADED] Loaded {len(files)} knowledge files")
        return combined
    except Exception as e:
        log.error(f"Error loading knowledge files: {e}")
        return ""

def build_context() -> str:
    """Combines knowledge files, user profile, and recent memories."""
    kb = load_knowledge()
    prof = load_user_profile()
    mems = get_recent_memories()
    # Convert memory tuples to readable text
    if isinstance(mems, str):
        mem_text = mems
    else:
        mem_text = ""
        for key, val in mems:
            mem_text += f"{key}: {val}\n"
    return f"""User Profile:\n{prof}\n\nProjects & Knowledge:\n{kb}\n\nMemory:\n{mem_text}"""

def inject_context(base_prompt: str, transcript: str = "") -> str:
    """Injects the built context into the system prompt matching the desired format."""
    context = build_context()
    injected_prompt = f"""SYSTEM:\n{base_prompt}\n\n{context}"""
    if transcript:
        injected_prompt += f"\nUSER:\n{transcript}"
    log.info(f"[OLLAMA_CONTEXT_READY] Context built. Length: {len(injected_prompt)} chars")
    return injected_prompt
