import logging

log = logging.getLogger("memory_db")

def init_db():
    """Stub to initialize SQLite and ChromaDB."""
    log.info("Initializing Memory Databases (SQLite + ChromaDB)...")
    pass

def get_user_profile():
    """Stub to fetch user profile from SQLite."""
    return {"name": "User", "preferences": {}}

def add_to_long_term_memory(text: str):
    """Stub to embed and save to Vector DB."""
    log.info(f"Saving to long-term memory: {text}")
    pass
