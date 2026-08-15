import pytest
import os
from backend.agents.formpilot_agent import fill_mock_form
from backend.memory.memory_manager import get_all_applications, get_all_resumes, store_resume

def test_formpilot_execution():
    # Make sure at least one resume exists to upload
    resumes = get_all_resumes()
    if not resumes:
        # Create a dummy resume
        dummy_path = os.path.join(os.path.dirname(__file__), "..", "backend", "memory", "resumes", "dummy.md")
        os.makedirs(os.path.dirname(dummy_path), exist_ok=True)
        with open(dummy_path, "w") as f:
            f.write("# Dummy Resume")
        store_resume("Dummy", "backend/memory/resumes/dummy.md", "", "2026-01-01")
    
    initial_apps = len(get_all_applications())
    
    # Run the formpilot (headless playwright)
    result = fill_mock_form()
    
    assert "successfully" in result
    
    # Verify tracker integration
    final_apps = len(get_all_applications())
    assert final_apps == initial_apps + 1
    
    latest_app = get_all_applications()[0]
    assert latest_app["source"] == "FormPilot"
