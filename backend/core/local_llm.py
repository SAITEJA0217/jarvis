import os
import json
import logging
import urllib.request
from typing import Dict, Any

log = logging.getLogger("local_llm")

def initialize_ollama():
    """Check if Ollama is running and accessible."""
    return health_check()

def health_check() -> bool:
    try:
        req = urllib.request.Request("http://localhost:11434/api/tags", method="GET")
        with urllib.request.urlopen(req, timeout=60) as response:
            if response.status == 200:
                log.info("[OLLAMA_ONLINE] Ollama is reachable")
                return True
    except urllib.error.URLError as e:
        if isinstance(e.reason, TimeoutError) or "timed out" in str(e).lower():
            log.error("[OLLAMA_TIMEOUT] Ollama health check timed out")
            log.error("[OLLAMA_RAG_TIMEOUT]")
        else:
            log.error(f"[OLLAMA_OFFLINE] Ollama is offline or unreachable: {e}")
    except Exception as e:
        if "timed out" in str(e).lower():
            log.error("[OLLAMA_RAG_TIMEOUT]")
        log.error(f"[OLLAMA_ERROR] Ollama health check failed: {e}")
    return False

def check_ollama_health() -> dict:
    """Detect Ollama availability and return structured online/model information."""
    online = health_check()
    model = os.environ.get("OLLAMA_MODEL", "qwen2.5:7b")
    return {
        "online": online,
        "model": model
    }


def generate_json_response(prompt: str) -> Dict[str, Any]:
    """Generates a JSON response from the local Ollama model."""
    from dotenv import load_dotenv
    load_dotenv()
    
    model = os.environ.get("OLLAMA_MODEL", "qwen2.5:3b")
    url = "http://localhost:11434/api/generate"
    
    data = {
        "model": model,
        "prompt": prompt,
        "format": "json",
        "stream": False,
        "options": {
            "temperature": 0.1
        }
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    
    try:
        log.info("[OLLAMA_REQUEST] Sending JSON request to Ollama")
        try:
            with urllib.request.urlopen(req, timeout=60) as response:
                if response.status == 200:
                    result = json.loads(response.read().decode("utf-8"))
                    response_text = result.get("response", "")
                    log.info("[OLLAMA_RESPONSE] Received response from Ollama")
                    try:
                        parsed = json.loads(response_text)
                        return parsed
                    except json.JSONDecodeError:
                        log.error(f"Ollama returned invalid JSON: {response_text}")
                        return None
                else:
                    log.error(f"Ollama API error: {response.status}")
                    return None
        except urllib.error.URLError as e:
            if isinstance(e.reason, TimeoutError) or "timed out" in str(e).lower():
                log.error("[OLLAMA_TIMEOUT] Ollama request timed out")
                log.error("[OLLAMA_RAG_TIMEOUT]")
            else:
                log.error(f"Ollama connection error: {e}")
            return None
    except Exception as e:
        if "timed out" in str(e).lower():
            log.error("[OLLAMA_RAG_TIMEOUT]")
        log.error(f"[OLLAMA_ERROR] Unexpected error in generate_json_response: {e}")
        return None

def generate_text_response(prompt: str, bypass_context: bool = False) -> str:
    """Generates a plain text response from the local Ollama model."""
    from dotenv import load_dotenv
    from backend.knowledge.loader import inject_context
    load_dotenv()
    
    model = os.environ.get("OLLAMA_MODEL", "qwen2.5:3b")
    url = "http://localhost:11434/api/generate"
    
    if bypass_context:
        injected_prompt = prompt
    else:
        injected_prompt = inject_context(prompt)
    
    data = {
        "model": model,
        "prompt": injected_prompt,
        "stream": False,
        "options": {
            "temperature": 0.3
        }
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    
    try:
        log.info("[OLLAMA_REQUEST] Sending text request to Ollama")
        try:
            with urllib.request.urlopen(req, timeout=60) as response:
                if response.status == 200:
                    result = json.loads(response.read().decode("utf-8"))
                    log.info("[OLLAMA_RESPONSE] Received response from Ollama")
                    return result.get("response", "").strip()
                else:
                    log.error(f"Ollama API error: {response.status}")
                    return "I'm having trouble thinking right now."
        except urllib.error.URLError as e:
            if isinstance(e.reason, TimeoutError) or "timed out" in str(e).lower():
                log.error("[OLLAMA_TIMEOUT] Ollama request timed out")
                log.error("[OLLAMA_RAG_TIMEOUT]")
            else:
                log.error(f"Ollama connection error: {e}")
            return "I can't connect to my knowledge base."
    except Exception as e:
        if "timed out" in str(e).lower():
            log.error("[OLLAMA_RAG_TIMEOUT]")
        log.error(f"[OLLAMA_ERROR] Unexpected error in generate_text_response: {e}")
        return "I encountered an error generating a response."


def route_intent_local(transcript: str) -> Dict[str, Any]:
    """Routes the intent using Ollama with unified Knowledge Base context injected."""
    from backend.knowledge.loader import inject_context
    
    base_prompt = f"""
    You are the intent router for JARVIS OS.
    Analyze the user's transcript and output valid JSON only.

    Possible intents:
    - "desktop_control" (requires "action": e.g., "open_chrome", "open_github", "open_cursor", "open_youtube", "open_linkedin", "open_internlink")
    - "internship_search" (requires "query")
    - "multi_action" (requires "actions" array of objects with "intent" and "action")
    - "memory_store" (requires "key" and "value")
    - "memory_retrieve" (requires "key")
    - "memory_delete" (requires "key")
    - "resume_generation" (requires "role", optional "format" e.g. "pdf")
    - "track_application" (requires "company" and "role")
    - "list_applications" (no args)
    - "update_application" (requires "company", "role", and "status")
    - "formpilot_autofill" (no args)
    - "knowledge_query" (requires "query" e.g., "What is AI", "Explain neural networks")
    - "unknown" (if none match)

    Include a "confidence" float (0.0 to 1.0).

    Examples:
    Input: Open GitHub and Cursor
    {{"intent":"multi_action","actions":[{{"intent":"desktop_control","action":"open_github"}},{{"intent":"desktop_control","action":"open_cursor"}}],"confidence":0.95}}

    Input: Find AI internships
    {{"intent":"internship_search","query":"AI internships","confidence":0.90}}

    Input: Generate a PDF resume for AI internships
    {{"intent":"resume_generation","role":"AI internships","format":"pdf","confidence":0.95}}

    Input: Track application for Google Software Engineer Intern
    {{"intent":"track_application","company":"Google","role":"Software Engineer Intern","confidence":0.95}}
    
    Input: What is AI
    {{"intent":"knowledge_query","query":"AI","confidence":0.95}}
    
    Output strictly JSON without markdown blocks.
    """
    
    prompt = inject_context(base_prompt, transcript)
    
    log.info(f"Sending to Ollama: '{transcript}'")
    parsed = generate_json_response(prompt)
    if parsed:
        log.info(f"Ollama Parsed JSON Intent: {json.dumps(parsed, indent=2)}")
        return parsed
    return {"intent": "unknown", "confidence": 0.0}
