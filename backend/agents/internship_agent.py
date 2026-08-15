import json
import os
import logging
from datetime import datetime
from backend.memory.memory_manager import store_internship

log = logging.getLogger("internship_agent")

def load_profile():
    profile_path = os.path.join(os.path.dirname(__file__), "..", "memory", "user_profile.json")
    try:
        if os.path.exists(profile_path):
            with open(profile_path, "r") as f:
                return json.load(f)
    except Exception as e:
        log.error(f"Error loading profile: {e}")
    return {}

from backend.agents.browser_agent import search_jobs_with_playwright

def search_internships(query: str) -> str:
    log.info(f"Starting real internship search for: {query}")
    profile = load_profile()
    
    log.info(f"Loaded personalization profile. Skills: {profile.get('skills', [])}, Roles: {profile.get('preferred_role', [])}")
    
    # Run Web Search Agent based search instead of Playwright scraper
    from backend.agents.web_search_agent import search_internships as web_search_for_internships
    search_data = web_search_for_internships(query)
    results = search_data.get("results", [])
    
    # Fallback to a single generic if no results found
    if not results:
        log.warning("Web search returned 0 results. Using fallback.")
        results = [{
            "title": f"Fallback {query.title()} Intern",
            "company": "Private Company",
            "location": "Remote",
            "source": "Web",
            "url": "https://example.com",
            "date_found": datetime.now().strftime("%Y-%m-%d")
        }]
    
    count = len(results)
    top_opportunity = results[0]["title"] if results else "None"
    
    # Simple parse for company name from top result
    top_company = "Unknown"
    if results:
        title = results[0]["title"]
        if " - " in title:
            top_company = title.split(" - ")[1].split("|")[0].strip()
        elif " at " in title:
            top_company = title.split(" at ")[1].split("-")[0].strip()
            
    response_msg = f"Found {count} {query} internships. The top opportunity is {top_opportunity} at {top_company}."
    log.info(response_msg)
    
    return response_msg

