import pytest
from backend.agents.internship_agent import search_internships
from backend.memory.memory_manager import get_all_internships

def test_internship_agent_search():
    # Initial count
    initial_count = len(get_all_internships())
    
    # Run mock search
    response = search_internships("Python")
    
    # Verify response
    assert "Found 3 Python internships" in response
    assert "TechNova Solutions" in response
    
    # Verify DB update
    final_results = get_all_internships()
    assert len(final_results) == initial_count + 3
    
    # Verify content
    top_result = final_results[0]
    # Because order is DESC, it should be the Internshala one (inserted last)
    assert "Internshala" == top_result["source"]
    assert "Python" in top_result["title"]
