import pytest
from backend.agents.application_tracker import track_new_application, summarize_applications, update_status
from backend.memory.memory_manager import get_all_applications

def test_application_tracker():
    # 1. Track a new application
    initial_count = len(get_all_applications())
    response = track_new_application("Google", "Software Engineer Intern", "Direct")
    assert "successfully" in response
    
    apps = get_all_applications()
    assert len(apps) == initial_count + 1
    
    # Verify the most recent is Google
    latest = apps[0]
    assert latest["company"] == "Google"
    assert latest["role"] == "Software Engineer Intern"
    assert latest["status"] == "Applied"
    
    # 2. Update status
    update_msg = update_status("Google", "Software Engineer Intern", "Interviewing")
    assert "Interviewing" in update_msg
    
    apps_updated = get_all_applications()
    assert apps_updated[0]["status"] == "Interviewing"
    
    # 3. Summarize
    summary = summarize_applications()
    assert str(len(apps_updated)) in summary
