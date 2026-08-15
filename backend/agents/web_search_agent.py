import os
import json
import logging
import urllib.request
import urllib.parse
from backend.core.local_llm import generate_text_response
from backend.memory.memory_manager import store_internship
from datetime import datetime

log = logging.getLogger("web_search_agent")

def search_web(query: str) -> dict:
    """
    Searches the web for a query using Tavily, Serper, or falling back to DuckDuckGo/Mock search.
    """
    import time
    start_time = time.time()
    log.info(f"[WEB_SEARCH] {query}")
    tavily_key = os.getenv("TAVILY_API_KEY")
    serper_key = os.getenv("SERPER_API_KEY")
    
    # 1. Tavily
    if tavily_key:
        try:
            log.info("[WEB_SEARCH] Attempting Tavily API search")
            url = "https://api.tavily.com/search"
            headers = {"Content-Type": "application/json"}
            data = {"api_key": tavily_key, "query": query, "max_results": 3}
            req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=10.0) as resp:
                if resp.status == 200:
                    res_json = json.loads(resp.read().decode("utf-8"))
                    results = []
                    for r in res_json.get("results", []):
                        results.append({
                            "title": r.get("title", ""),
                            "url": r.get("url", ""),
                            "snippet": r.get("content", "")[:300]
                        })
                    log.info(f"[SEARCH_RESULT] {len(results)} results found via Tavily")
                    search_ms = int((time.time() - start_time) * 1000)
                    log.info(f"[SEARCH_MS] {search_ms}")
                    return {"query": query, "results": results, "search_ms": search_ms}
        except Exception as e:
            log.error(f"Tavily search failed: {e}")
 
    # 2. Serper
    if serper_key:
        try:
            log.info("[WEB_SEARCH] Attempting Serper API search")
            url = "https://google.serper.dev/search"
            headers = {"X-API-KEY": serper_key, "Content-Type": "application/json"}
            data = {"q": query, "num": 3}
            req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=10.0) as resp:
                if resp.status == 200:
                    res_json = json.loads(resp.read().decode("utf-8"))
                    results = []
                    for r in res_json.get("organic", []):
                        results.append({
                            "title": r.get("title", ""),
                            "url": r.get("link", ""),
                            "snippet": r.get("snippet", "")[:300]
                        })
                    log.info(f"[SEARCH_RESULT] {len(results)} results found via Serper")
                    search_ms = int((time.time() - start_time) * 1000)
                    log.info(f"[SEARCH_MS] {search_ms}")
                    return {"query": query, "results": results, "search_ms": search_ms}
        except Exception as e:
            log.error(f"Serper search failed: {e}")
 
    # 3. DuckDuckGo / HTML Scraper Fallback
    try:
        log.info("[WEB_SEARCH] Attempting DuckDuckGo fallback search")
        url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote_plus(query)}"
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10.0) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
            results = []
            parts = html.split('<div class="result__body">')
            for part in parts[1:4]:
                try:
                    title_part = part.split('<a class="result__url"')[0]
                    link = part.split('href="')[1].split('"')[0]
                    title = title_part.split('>')[-2].split('<')[0].strip()
                    snippet = part.split('<a class="result__snippet"')[1].split('</a>')[0].replace('<b>','').replace('</b>','').strip()
                    results.append({
                        "title": title,
                        "url": link,
                        "snippet": snippet[:300]
                    })
                except Exception:
                    continue
            if results:
                log.info(f"[SEARCH_RESULT] {len(results)} results found via DuckDuckGo")
                search_ms = int((time.time() - start_time) * 1000)
                log.info(f"[SEARCH_MS] {search_ms}")
                return {"query": query, "results": results, "search_ms": search_ms}
    except Exception as e:
        log.error(f"DuckDuckGo fallback search failed: {e}")
 
    # Final Mock Fallback
    log.info("[WEB_SEARCH] Using final mock fallback search")
    results = [
        {
            "title": f"Python Developer at TechNova Solutions",
            "url": "https://linkedin.com/jobs/123",
            "snippet": f"This is a placeholder result for TechNova Solutions."[:300]
        },
        {
            "title": f"Django Intern at Startup",
            "url": "https://wellfound.com/jobs/456",
            "snippet": f"This is a placeholder result for Django."[:300]
        },
        {
            "title": f"Python Software Engineer at Internshala",
            "url": "https://internshala.com/internships/789",
            "snippet": f"This is a placeholder result for Internshala."[:300]
        }
    ]
    search_ms = int((time.time() - start_time) * 1000)
    log.info(f"[SEARCH_MS] {search_ms}")
    return {"query": query, "results": results, "search_ms": search_ms}

def search_news(query: str) -> dict:
    """
    Searches the web for news articles.
    """
    log.info(f"[NEWS_SEARCH] {query}")
    return search_web(f"news: {query}")

def search_internships(query: str) -> dict:
    """
    Searches for internships using search providers rather than Playwright.
    """
    log.info(f"[INTERNSHIP_SEARCH] {query}")
    search_query = f"{query} internship role LinkedIn Wellfound Internshala Indeed Naukri"
    results = search_web(search_query)
    
    stored_count = 0
    for r in results.get("results", []):
        title = r["title"]
        url = r["url"]
        
        company = "Unknown"
        role = query.title()
        
        if " - " in title:
            parts = title.split(" - ")
            role = parts[0].strip()
            company = parts[1].split("|")[0].strip()
        elif " at " in title:
            parts = title.split(" at ")
            role = parts[0].strip()
            company = parts[1].split("-")[0].strip()
            
        source_val = "WebSearch"
        url_lower = url.lower()
        title_lower = title.lower()
        if "internshala" in url_lower or "internshala" in title_lower:
            source_val = "Internshala"
        elif "linkedin" in url_lower or "linkedin" in title_lower:
            source_val = "LinkedIn"
        elif "wellfound" in url_lower or "wellfound" in title_lower:
            source_val = "Wellfound"
        elif "indeed" in url_lower or "indeed" in title_lower:
            source_val = "Indeed"
            
        success = store_internship(
            title=title,
            company=company,
            location="Remote/Onsite",
            source=source_val,
            url=url,
            date_found=datetime.now().strftime("%Y-%m-%d")
        )
        if success:
            stored_count += 1
            
    log.info(f"[INTERNSHIP_SEARCH] Stored {stored_count} internships from search results.")
    return results

def generate_web_answer(query: str, search_results: dict) -> str:
    """
    Constructs a prompt from search results, feeds it to Ollama, and returns the generated response.
    """
    import time
    log.info("[OLLAMA_RAG] Generating answer from search results")
    results = search_results.get("results", [])
    results_len = len(results)
    
    results_str = ""
    for idx, r in enumerate(results):
        snippet = r.get("snippet", "")[:300]
        results_str += f"{idx+1}. Title: {r['title']}\n   URL: {r['url']}\n   Content: {snippet}\n\n"
        
    if results_len > 0:
        prompt = f"""You are JARVIS.
Answer the user's question using the provided search results.
Even if the details are incomplete, try to answer as best as possible using the provided search results.
Do not say you could not find reliable information or that the information is insufficient.

Question:
{query}

Search Results:
{results_str}
"""
    else:
        prompt = f"""You are JARVIS.
Answer using ONLY the provided search results.
If the information is insufficient, say "I could not find reliable information."

Question:
{query}

Search Results:
{results_str}
"""

    prompt_len = len(prompt)
    log.info(f"[OLLAMA_RAG_CONTEXT_SIZE] {prompt_len} chars")
    log.info(f"[OLLAMA_RAG_CONTEXT]\n{prompt}")
    print(f"Exact prompt sent to Ollama:\n{prompt}")
    
    start_ollama = time.time()
    try:
        response = generate_text_response(prompt, bypass_context=True)
        
        # Post-process/Constraint check: Never return "I could not find reliable information" if search results exist
        if results_len > 0 and "could not find reliable information" in response.lower():
            log.warning("[OLLAMA_RAG_ERROR] Ollama returned fallback message despite having search results. Re-generating...")
            fallback_prompt = f"Summarize these search results to answer the query '{query}':\n{results_str}"
            response = generate_text_response(fallback_prompt, bypass_context=True)
            if "could not find reliable information" in response.lower():
                response = f"Based on search results, here is what I found: " + " ".join([r['snippet'][:300] for r in results[:2]])
                
        ollama_ms = int((time.time() - start_ollama) * 1000)
        log.info(f"[OLLAMA_MS] {ollama_ms}")
        search_ms = search_results.get("search_ms", 0)
        total_ms = search_ms + ollama_ms
        log.info(f"[TOTAL_MS] {total_ms}")
        
        if response in ["I encountered an error generating a response.", "I can't connect to my knowledge base.", "I'm having trouble thinking right now."]:
            log.error(f"[OLLAMA_RAG_ERROR] Ollama returned error: {response}")
            log.error("[OLLAMA_RAG_TIMEOUT]")
            log.info(f"[OLLAMA_RAG_RESPONSE] Failure: {response}")
        else:
            log.info("[OLLAMA_RAG_RESPONSE] Success")
            log.info(f"[OLLAMA_RAG_RESPONSE]\n{response}")
            print(f"Exact Ollama response:\n{response}")
            
        return response
    except Exception as e:
        ollama_ms = int((time.time() - start_ollama) * 1000)
        log.info(f"[OLLAMA_MS] {ollama_ms}")
        search_ms = search_results.get("search_ms", 0)
        total_ms = search_ms + ollama_ms
        log.info(f"[TOTAL_MS] {total_ms}")
        log.error(f"[OLLAMA_RAG_ERROR] {e}")
        log.error("[OLLAMA_RAG_TIMEOUT]")
        log.info("[OLLAMA_RAG_RESPONSE] Failure due to exception")
        return "I encountered an error generating a response."
