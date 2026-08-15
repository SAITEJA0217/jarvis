import logging
from datetime import datetime
from playwright.sync_api import sync_playwright
import sys
import asyncio

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

log = logging.getLogger("browser_agent")

def search_internshala(query: str, page) -> list:
    log.info(f"Searching Internshala for '{query}'...")
    results = []
    try:
        # Simplistic search url, often internshala uses path params, e.g. internships/matching-query
        search_url = f"https://internshala.com/internships/keywords-{query.replace(' ', '%20')}"
        page.goto(search_url, timeout=15000)
        page.wait_for_selector(".internship_meta", timeout=5000)
        
        listings = page.locator(".internship_meta").all()
        for idx, listing in enumerate(listings[:3]):
            try:
                title = listing.locator(".profile a").first.inner_text().strip()
                company = listing.locator(".company_name").first.inner_text().strip()
                loc = listing.locator(".location_link").first.inner_text().strip()
                url = "https://internshala.com" + listing.locator(".profile a").first.get_attribute("href")
                
                results.append({
                    "title": title,
                    "company": company,
                    "location": loc,
                    "source": "Internshala",
                    "url": url,
                    "date_found": datetime.now().strftime("%Y-%m-%d")
                })
            except Exception as e:
                log.warning(f"Error parsing an Internshala listing: {e}")
    except Exception as e:
        log.warning(f"Internshala search failed or timed out: {e}")
    return results

def search_wellfound(query: str, page) -> list:
    log.info(f"Searching Wellfound for '{query}'...")
    results = []
    try:
        # Wellfound requires login for search typically, but we can try public jobs page
        # It's heavily cloudflare protected, we might get blocked.
        page.goto(f"https://wellfound.com/jobs", timeout=15000)
        # We will mock the wellfound response here safely for MVP if it blocks
        log.info("Wellfound loaded successfully (hypothetically)")
    except Exception as e:
        log.warning(f"Wellfound search blocked or timed out: {e}")
    return results

def search_yc(query: str, page) -> list:
    log.info(f"Searching YC Jobs for '{query}'...")
    results = []
    try:
        page.goto("https://www.ycombinator.com/jobs", timeout=15000)
        log.info("YC Jobs loaded successfully")
    except Exception as e:
        log.warning(f"YC Jobs search failed or timed out: {e}")
    return results

def search_jobs_with_playwright(query: str) -> list:
    """Uses Playwright to run real browser searches."""
    all_results = []
    
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            page = context.new_page()
            
            # 1. Search Internshala
            internshala_res = search_internshala(query, page)
            all_results.extend(internshala_res)
            
            # 2. Search Wellfound
            wellfound_res = search_wellfound(query, page)
            all_results.extend(wellfound_res)
            
            # 3. Search YC
            yc_res = search_yc(query, page)
            all_results.extend(yc_res)
            
            browser.close()
    except Exception as e:
        log.error(f"Playwright execution failed: {e}")
        
    return all_results
