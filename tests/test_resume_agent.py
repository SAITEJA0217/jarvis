import os
import pytest
from backend.agents.resume_agent import generate_resume_for_role
from backend.memory.memory_manager import get_all_resumes

def test_resume_generation():
    initial_count = len(get_all_resumes())
    
    # Run the generation
    # Warning: this makes an actual API call to Gemini
    success = generate_resume_for_role("AI internships")
    assert success is True
    
    # Verify the database
    resumes = get_all_resumes()
    assert len(resumes) > initial_count
    
    latest_resume = resumes[0]
    assert latest_resume["role"] == "AI internships"
    
    # Verify the file exists
    file_path_abs = os.path.join(os.path.dirname(__file__), "..", latest_resume["markdown_path"])
    pdf_path_abs = os.path.join(os.path.dirname(__file__), "..", latest_resume["pdf_path"])
    assert os.path.exists(file_path_abs)
    assert os.path.exists(pdf_path_abs)
    
    # Check that it's somewhat reasonably sized
    with open(file_path_abs, "r", encoding="utf-8") as f:
        content = f.read()
    
    assert len(content) > 100
    assert "Karka Saiteja Reddy" in content
