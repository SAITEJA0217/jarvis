import pytest
import os
import json
from unittest.mock import patch, MagicMock
from backend.core.local_llm import route_intent_local, health_check
from backend.core.router import route_intent
from backend.memory.memory_manager import check_llm_cache, store_llm_cache

def test_ollama_startup():
    # If Ollama is running this will be True, else False.
    # We just want to make sure it doesn't crash
    status = health_check()
    assert isinstance(status, bool)

@patch('backend.core.local_llm.generate_json_response')
def test_json_parsing(mock_generate):
    mock_generate.return_value = {
        "intent": "resume_generation",
        "role": "AI internships",
        "format": "pdf",
        "confidence": 0.95
    }
    result = route_intent_local("generate a pdf resume for ai internships")
    assert result["intent"] == "resume_generation"
    assert result["role"] == "AI internships"
    assert result["format"] == "pdf"

def test_cache_functionality():
    test_query = "this is a test query for cache"
    test_response = {"intent": "unknown", "confidence": 0.9}
    
    # Store
    store_llm_cache(test_query, test_response)
    
    # Retrieve
    cached = check_llm_cache(test_query)
    assert cached is not None
    assert cached["intent"] == "unknown"

@patch('backend.core.router.execute_intent')
@patch('backend.core.router.route_intent_gemini')
@patch('backend.core.router.route_intent_local')
@patch('backend.core.router.check_llm_cache')
def test_routing_waterfall(mock_cache, mock_local, mock_gemini, mock_execute):
    # Test 1: Rule router handles "open linkedin" natively
    route_intent("open linkedin")
    mock_execute.assert_called_once()
    assert mock_execute.call_args[0][0]["intent"] == "desktop_control"
    assert mock_execute.call_args[0][0]["action"] == "open_linkedin"
    
    # Reset
    mock_execute.reset_mock()
    
    # Test 2: Cache hit prevents LLM calls
    mock_cache.return_value = {"intent": "test_cached_intent"}
    route_intent("some random cached command")
    mock_execute.assert_called_once()
    assert mock_execute.call_args[0][0]["intent"] == "test_cached_intent"
    mock_local.assert_not_called()
    mock_gemini.assert_not_called()
    
    # Reset
    mock_execute.reset_mock()
    mock_cache.return_value = None
    
    # Test 3: Ollama handles it
    mock_local.return_value = {"intent": "formpilot_autofill"}
    route_intent("autofill this form please")
    mock_execute.assert_called_once()
    assert mock_execute.call_args[0][0]["intent"] == "formpilot_autofill"
    mock_gemini.assert_not_called()
