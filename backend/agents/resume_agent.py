import os
import json
import logging
from datetime import datetime
import google.generativeai as genai
from backend.memory.memory_manager import store_resume
import markdown
from playwright.sync_api import sync_playwright

log = logging.getLogger("resume_agent")

def load_profile():
    profile_path = os.path.join(os.path.dirname(__file__), "..", "memory", "user_profile.json")
    try:
        if os.path.exists(profile_path):
            with open(profile_path, "r") as f:
                return json.load(f)
    except Exception as e:
        log.error(f"Error loading profile: {e}")
    return {}

def generate_pdf_from_markdown(md_content: str, output_pdf_path: str):
    """Converts markdown content to PDF via Playwright."""
    html_content = markdown.markdown(md_content)
    
    # Basic CSS for professional resume look
    styled_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; margin: 40px; color: #333; }}
            h1, h2, h3 {{ color: #111; margin-bottom: 10px; }}
            h1 {{ border-bottom: 2px solid #333; padding-bottom: 5px; }}
            h2 {{ border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 20px; }}
            ul {{ padding-left: 20px; }}
            li {{ margin-bottom: 5px; }}
        </style>
    </head>
    <body>
        {html_content}
    </body>
    </html>
    """
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_content(styled_html)
        page.pdf(path=output_pdf_path, format="A4", margin={"top": "20px", "right": "20px", "bottom": "20px", "left": "20px"})
        browser.close()

def generate_resume_for_role(role: str, format: str = "md") -> bool:
    """Generates a tailored resume for the given role using Gemini."""
    log.info(f"Generating resume for role: {role}")
    
    profile = load_profile()
    if not profile:
        log.error("Could not load user profile.")
        return False
        
    prompt = f"""
    You are an expert technical resume writer.
    I need a markdown formatted resume tailored for the following role: {role}
    
    Here is my base profile:
    {json.dumps(profile, indent=2)}
    
    Instructions:
    1. Write a compelling 2-3 sentence summary tailored specifically for {role}.
    2. Reorder my skills so the most relevant ones are first.
    3. Reorder my projects and add hypothetical bullet points that make them sound highly relevant to {role}.
    4. Keep it strictly in professional Markdown format.
    5. Do not include any conversational filler (no "Here is your resume:"), just the markdown.
    """
    
    try:
        from dotenv import load_dotenv
        load_dotenv()
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            log.error("GEMINI_API_KEY not set in environment.")
            return False
            
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        markdown_content = response.text.strip()
        
        # Determine file path
        resumes_dir = os.path.join(os.path.dirname(__file__), "..", "memory", "resumes")
        os.makedirs(resumes_dir, exist_ok=True)
        
        # Clean role for filename (e.g. "AI internships" -> "ai_internships")
        safe_role = "".join(c if c.isalnum() else "_" for c in role.lower()).strip("_")
        file_name_md = f"resume_{safe_role}.md"
        file_name_pdf = f"resume_{safe_role}.pdf"
        
        file_path_md = os.path.join(resumes_dir, file_name_md)
        file_path_pdf = os.path.join(resumes_dir, file_name_pdf)
        
        with open(file_path_md, "w", encoding="utf-8") as f:
            f.write(markdown_content)
            
        pdf_relative_path = ""
        if format == "pdf" or True: # we will always generate PDF if it's updated, or just do it if format == pdf. Actually let's just always do it.
            generate_pdf_from_markdown(markdown_content, file_path_pdf)
            pdf_relative_path = f"backend/memory/resumes/{file_name_pdf}"
            
        # Store in database
        date_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # We store relative path from backend for cleanliness
        md_relative_path = f"backend/memory/resumes/{file_name_md}"
        success = store_resume(role, md_relative_path, pdf_relative_path, date_str)
        
        return success
    except Exception as e:
        log.error(f"Failed to generate resume: {e}")
        return False
