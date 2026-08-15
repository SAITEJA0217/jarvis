import logging
import os
import json
from playwright.sync_api import sync_playwright
from backend.agents.application_tracker import track_new_application
from backend.memory.memory_manager import get_all_resumes

log = logging.getLogger("formpilot_agent")

def load_profile():
    profile_path = os.path.join(os.path.dirname(__file__), "..", "memory", "user_profile.json")
    try:
        if os.path.exists(profile_path):
            with open(profile_path, "r") as f:
                return json.load(f)
    except Exception as e:
        log.error(f"Error loading profile: {e}")
    return {}

def fill_mock_form():
    """Uses Playwright to autofill a local mock form with user_profile data."""
    log.info("Starting FormPilot automation...")
    
    profile = load_profile()
    if not profile:
        return "I could not load your user profile."
        
    full_name = profile.get("full_name", "Karka Saiteja Reddy")
    name_parts = full_name.split()
    first_name = name_parts[0]
    last_name = name_parts[-1] if len(name_parts) > 1 else ""
    
    email = profile.get("email", "karkasaiteja4@gmail.com")
    uni = profile.get("university", "Malla Reddy University")
    
    # Grab the latest resume
    resumes = get_all_resumes()
    resume_path = None
    if resumes:
        # absolute path
        rel_path = resumes[0]["markdown_path"] # backend/memory/resumes/resume_ai_internships.md
        resume_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", rel_path))
    
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            # Point to local mock form
            mock_url = f"file:///{os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'tests', 'mock_form.html'))}"
            page.goto(mock_url.replace("\\", "/"))
            
            # 1. Fill Text Inputs
            page.fill("#fname", first_name)
            page.fill("#lname", last_name)
            page.fill("#email", email)
            page.fill("#uni", uni)
            
            # 2. Select Dropdown
            # "bachelors" matches B.Tech
            page.select_option("#degree", "bachelors")
            
            # 3. Radio Buttons
            page.check("#relocate_yes")
            
            # 4. Upload Resume
            if resume_path and os.path.exists(resume_path):
                page.set_input_files("#resume", resume_path)
                
            # Submit Form
            page.click("#submit_btn")
            
            # Verify success message
            page.wait_for_selector("#success_message", state="visible", timeout=2000)
            
            browser.close()
            
        # 5. Application Tracker Integration
        track_new_application("Google", "AI Intern", "FormPilot")
        
        return "Form completed successfully. Application has been tracked."
        
    except Exception as e:
        log.error(f"FormPilot failed: {e}")
        return "I encountered an error while filling the form."
