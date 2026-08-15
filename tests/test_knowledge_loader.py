import pytest
import os
from unittest.mock import patch, MagicMock
from backend.knowledge.loader import load_knowledge, load_user_profile, build_context, inject_context, get_recent_memories

def test_load_knowledge():
    # clear cache just in case
    load_knowledge.cache_clear()
    kb = load_knowledge()
    
    assert "Karka Saiteja Reddy" in kb
    assert "React.js" in kb
    assert "https://internlink.in" in kb

def test_load_user_profile():
    load_user_profile.cache_clear()
    prof = load_user_profile()
    
    assert "Name: Karka Saiteja Reddy" in prof
    assert "Malla Reddy University" in prof

@patch("backend.knowledge.loader.get_recent_memories")
def test_build_context(mock_get_memories):
    mock_get_memories.return_value = "favorite color: blue\n"
    
    load_knowledge.cache_clear()
    load_user_profile.cache_clear()
    
    context = build_context()
    
    assert "Karka Saiteja Reddy" in context
    assert "favorite color: blue" in context
    assert "https://internlink.in" in context
    
@patch("backend.knowledge.loader.build_context")
def test_inject_context(mock_build):
    mock_build.return_value = "Mocked Unified Context"
    
    result = inject_context("Test Prompt", "Hello")
    
    assert "Test Prompt" in result
    assert "SYSTEM:" in result
    assert "USER:\nHello" in result
    assert "Mocked Unified Context" in result
