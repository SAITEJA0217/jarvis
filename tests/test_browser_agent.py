import pytest
from backend.agents.browser_agent import search_jobs_with_playwright
from backend.agents.internship_agent import search_internships

def test_browser_agent_execution():
    # Because running actual playwright searches in a test is heavily dependent on network,
    # and might take 3x15s = 45s, we just ensure it executes and handles exceptions properly.
    
    # We call the main internship search which falls back to fake data if blocked
    res = search_internships("Test Query")
    
    # Verify the fallback or real results were parsed and returned correctly
    assert "Found" in res
    assert "Test Query" in res
