import logging
from datetime import datetime
from backend.memory.memory_manager import store_application, get_all_applications, update_application_status, get_all_resumes

log = logging.getLogger("application_tracker")

def track_new_application(company: str, role: str, source: str = "Manual Voice Entry", notes: str = "") -> str:
    """Tracks a new application and links it to the most recently generated resume."""
    log.info(f"Tracking new application for {role} at {company}")
    
    # Try to grab the most recent resume ID
    resumes = get_all_resumes()
    resume_id = resumes[0]["id"] if resumes else -1
    
    date_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    success = store_application(
        company=company,
        role=role,
        source=source,
        resume_id=resume_id,
        status="Applied",
        applied_at=date_str,
        notes=notes
    )
    
    if success:
        return "Application has been added successfully."
    else:
        return "I was unable to track that application."

def summarize_applications() -> str:
    """Returns a voice-friendly summary of total applications."""
    apps = get_all_applications()
    count = len(apps)
    
    if count == 0:
        return "You have not tracked any applications yet."
    elif count == 1:
        return "You currently have 1 tracked application."
    else:
        return f"You currently have {count} tracked applications."

def update_status(company: str, role: str, new_status: str) -> str:
    """Updates the status of an existing application."""
    log.info(f"Updating application status for {company} - {role} to {new_status}")
    
    success = update_application_status(company, role, new_status)
    if success:
        return f"Application status updated to {new_status}."
    else:
        return "I couldn't find that application to update."
