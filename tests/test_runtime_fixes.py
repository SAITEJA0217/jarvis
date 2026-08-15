import pytest
from backend.core.router import route_intent_fallback
from backend.agents.browser_agent import search_jobs_with_playwright
import os
import sys

def test_internship_search_parsing():
    # Test query extraction
    parsed1 = route_intent_fallback("search for ai internships")
    assert parsed1["intent"] == "internship_search"
    assert parsed1["query"] == "ai internships"
    
    parsed2 = route_intent_fallback("find software engineering internships in london")
    assert parsed2["intent"] == "internship_search"
    assert parsed2["query"] == "software engineering internships in london"
    
    parsed3 = route_intent_fallback("internship")
    assert parsed3["intent"] == "internship_search"
    assert parsed3["query"] == "internship"

def test_profile_retrieval_fallback():
    # Should resolve purely locally without Gemini
    parsed = route_intent_fallback("what is my full name")
    assert parsed["intent"] == "memory_retrieve"
    assert parsed["key"] == "my full name"

@pytest.mark.skipif(sys.platform != "win32", reason="Testing Windows asyncio fix specifically")
def test_browser_agent_startup():
    # Just run a quick search to ensure it doesn't crash with NotImplementedError asyncio.create_subprocess_exec
    # It will launch playwright and hit search_jobs_with_playwright
    # We will search a dummy query and it should return an empty list gracefully
    try:
        results = search_jobs_with_playwright("dummy search query xyz123")
        assert isinstance(results, list)
    except NotImplementedError:
        pytest.fail("NotImplementedError raised! Event loop policy fix failed.")
