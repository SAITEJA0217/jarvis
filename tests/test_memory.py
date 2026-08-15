import pytest
from backend.memory.memory_manager import store_memory, retrieve_memory, delete_memory

def test_memory_lifecycle():
    # Store
    assert store_memory("favorite editor", "Antigravity") == True
    
    # Retrieve exact
    assert retrieve_memory("favorite editor") == "Antigravity"
    
    # Retrieve case-insensitive
    assert retrieve_memory("Favorite Editor") == "Antigravity"
    
    # Update
    assert store_memory("favorite editor", "Cursor") == True
    assert retrieve_memory("favorite editor") == "Cursor"
    
    # Delete
    assert delete_memory("favorite editor") == True
    assert retrieve_memory("favorite editor") == None
    
    # Delete missing
    assert delete_memory("nonexistent") == False
