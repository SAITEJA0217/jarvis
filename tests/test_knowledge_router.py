import pytest
from backend.core.router import route_intent_fallback
import os
import sys

def test_knowledge_routing():
    # "What is my phone number" -> memory_retrieve
    res = route_intent_fallback("what is my phone number")
    assert res["intent"] == "memory_retrieve"
    assert res["key"] == "my phone number"

    # "What is my GitHub username" -> memory_retrieve
    res = route_intent_fallback("what is my github username")
    assert res["intent"] == "memory_retrieve"
    assert res["key"] == "my github username"
    
    # "What is AI" -> should be unknown to fallback router (so it goes to Ollama as knowledge_query)
    res = route_intent_fallback("what is ai")
    assert res["intent"] == "unknown"

    # "What is FastAPI" -> unknown to fallback
    res = route_intent_fallback("what is fastapi")
    assert res["intent"] == "unknown"

def test_internship_parsing():
    # Find AI internships
    res = route_intent_fallback("find ai internships")
    assert res["intent"] == "internship_search"
    assert res["query"] == "ai internships"

    # Find React internships in Hyderabad
    res = route_intent_fallback("find react internships in hyderabad")
    assert res["intent"] == "internship_search"
    assert res["query"] == "react internships in hyderabad"
    
    # Search internships
    res = route_intent_fallback("search internships")
    assert res["intent"] == "internship_search"
    assert res["query"] == "internships"
