import pytest
from backend.core.router import normalize_transcript, route_intent_fallback

def test_normalization():
    assert normalize_transcript("Open GitHub.") == "open github"
    assert normalize_transcript("Open Chrome, please!") == "open chrome please"
    assert normalize_transcript("  Hey Jarvis...  ") == "hey jarvis"

def test_fallback_chrome():
    res = route_intent_fallback("open chrome")
    assert res["intent"] == "desktop_control"
    assert res["action"] == "open_chrome"

def test_fallback_github():
    res = route_intent_fallback("launch github")
    assert res["intent"] == "desktop_control"
    assert res["action"] == "open_github"

def test_fallback_cursor():
    res = route_intent_fallback("open cursor")
    assert res["intent"] == "desktop_control"
    assert res["action"] == "open_cursor"

def test_fallback_youtube():
    res = route_intent_fallback("open youtube")
    assert res["intent"] == "desktop_control"
    assert res["action"] == "open_youtube"

def test_fallback_unknown():
    res = route_intent_fallback("do my homework")
    assert res["intent"] == "unknown"
