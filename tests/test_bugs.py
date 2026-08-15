import pytest
from backend.memory.memory_manager import retrieve_memory
from backend.core.router import route_intent, execute_intent
from unittest.mock import patch, MagicMock

def test_profile_retrieval():
    # 'github username' should fetch SAITEJA0217 from user_profile.json
    val = retrieve_memory("github username")
    assert val == "SAITEJA0217"
    
    val2 = retrieve_memory("university")
    assert val2 == "Malla Reddy University"

def test_empty_transcript(caplog):
    # route_intent with empty string should just return
    route_intent("   ")
    assert "Transcript received" not in caplog.text

@patch("backend.core.router.route_intent")
@patch("backend.core.router.stream_tts")
def test_multi_action_execution(mock_tts, mock_route_intent):
    parsed = {
        "intent": "multi_action",
        "actions": ["Open github", "What is my github username?"]
    }
    execute_intent(parsed)
    
    # route_intent should have been called twice
    assert mock_route_intent.call_count == 2
    mock_route_intent.assert_any_call("Open github")
    mock_route_intent.assert_any_call("What is my github username?")
