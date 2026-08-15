import os
import json
import logging
import string
import google.generativeai as genai
from backend.skills.desktop import open_chrome, open_github, open_cursor, open_youtube, open_linkedin, open_internlink
from backend.core.voice import stream_tts
from backend.memory.memory_manager import store_memory, retrieve_memory, delete_memory, check_llm_cache, store_llm_cache
from backend.core.local_llm import route_intent_local
from backend.agents.internship_agent import search_internships
from backend.agents.resume_agent import generate_resume_for_role
from backend.agents.application_tracker import track_new_application, summarize_applications, update_status
from backend.agents.formpilot_agent import fill_mock_form

log = logging.getLogger("agent_router")

SYSTEM_PROMPT = """You are the intent router for JARVIS OS.
Analyze the user's transcript and output valid JSON only.

Possible intents:
- "desktop_control" (requires "action": e.g., "open_chrome", "open_github", "open_cursor", "open_youtube")
- "internship_search" (requires "query")
- "multi_action" (requires "actions" array of natural language command strings)
- "memory_store" (requires "key" and "value")
- "memory_retrieve" (requires "key")
- "memory_delete" (requires "key")
- "resume_generation" (requires "role", optional "format" e.g. "pdf")
- "track_application" (requires "company" and "role")
- "list_applications" (no args)
- "update_application" (requires "company", "role", and "status")
- "formpilot_autofill" (no args)
- "unknown" (if none match)

Include a "confidence" float (0.0 to 1.0).

Output strictly JSON without markdown blocks.
Example: {"intent": "memory_store", "key": "favorite editor", "value": "Antigravity", "confidence": 0.95}"""
def normalize_transcript(transcript: str) -> str:
    """Removes punctuation, converts to lowercase, and strips wake words."""
    t = transcript.translate(str.maketrans('', '', string.punctuation)).lower().strip()
    if t.startswith("hey jarvis "):
        t = t[11:].strip()
    elif t.startswith("hey jarvis"):
        t = t[10:].strip()
    elif t.startswith("jarvis "):
        t = t[7:].strip()
    elif t.startswith("jarvis"):
        t = t[6:].strip()
    return t.strip()

def route_intent_gemini(transcript: str) -> dict:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set.")
    
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.5-flash", system_instruction=SYSTEM_PROMPT)
    log.info(f"Sending to Gemini: '{transcript}'")
    
    # We use GenerationConfig to ensure JSON response if supported, or just prompt strongly
    response = model.generate_content(
        transcript,
        generation_config=genai.types.GenerationConfig(
            response_mime_type="application/json",
            temperature=0.1
        )
    )
    
    text = response.text.strip()
    log.info(f"Gemini Raw Response: {text}")
    
    # Remove markdown code blocks if the model ignored the mime_type instruction
    if text.startswith("```json"):
        text = text[7:-3].strip()
    elif text.startswith("```"):
        text = text[3:-3].strip()
        
    parsed = json.loads(text)
    log.info(f"Parsed JSON Intent: {json.dumps(parsed, indent=2)}")
    return parsed

def route_intent_fallback(transcript: str, fallback: bool = False) -> dict:
    t = normalize_transcript(transcript)
    log.info(f"[KEYWORD_ROUTER] Evaluating fallback for: '{t}'")
    
    # "Who am I" check
    if t == "who am i":
        log.info("[KNOWLEDGE_QUERY] Matched 'who am i'")
        return {"intent": "knowledge_query", "query": "Who am I", "confidence": 1.0}

    # Detect real-time questions for web_search intent
    realtime_keywords = [
        "latest news", "today", "current", "weather", "stock price",
        "ai news", "who is ceo", "what happened",
        "latest update", "announcements", "news"
    ]
    for rtk in realtime_keywords:
        if rtk in t:
            log.info(f"[WEB_SEARCH] Real-time query detected: {rtk}")
            return {"intent": "web_search", "query": transcript, "confidence": 1.0}
            
    # Match Memory retrieve ONLY if transcript contains memory keywords: my, me, mine, startup, profile, name, phone, email, university
    memory_keywords = ["my", "me", "mine", "startup", "profile", "name", "phone", "email", "university"]
    has_memory_keyword = any(mk in f" {t} " for mk in memory_keywords)

    if t.startswith("remember "):
        # e.g. "remember my favorite editor is antigravity"
        if " is " in t:
            parts = t[9:].split(" is ", 1)
            return {"intent": "memory_store", "key": parts[0].strip(), "value": parts[1].strip(), "confidence": 0.8}
        
    elif t.startswith("what is "):
        if has_memory_keyword:
            return {"intent": "memory_retrieve", "key": t[8:].strip(), "confidence": 0.8}
        
    elif t.startswith("when do i "):
        if has_memory_keyword:
            return {"intent": "memory_retrieve", "key": t[10:].strip(), "confidence": 0.8}
        
    elif t.startswith("what university "):
        return {"intent": "memory_retrieve", "key": "university", "confidence": 0.8}
        
    elif t.startswith("forget "):
        return {"intent": "memory_delete", "key": t[7:].strip(), "confidence": 0.8}
    
    # Personal Profile lookups mapped to knowledge queries so context-injected Ollama/Gemini can answer
    personal_keywords = [
        "what is my full name", "what is my name", "who i am", 
        "what is my phone number", "what is my phone", 
        "what is my email", "what is my email address",
        "what is my github username", "what is my github", 
        "what is my university", "which university", "about me", "myself"
    ]
    for pk in personal_keywords:
        if pk in t:
            log.info(f"[KNOWLEDGE_QUERY] Matched personal info request: '{pk}'")
            return {"intent": "knowledge_query", "query": transcript, "confidence": 1.0}

    if "chrome" in t and ("open" in t or "launch" in t):
        return {"intent": "desktop_control", "action": "open_chrome", "confidence": 0.9}
    elif "github" in t and ("open" in t or "launch" in t):
        return {"intent": "desktop_control", "action": "open_github", "confidence": 0.9}
    elif "cursor" in t and ("open" in t or "launch" in t):
        return {"intent": "desktop_control", "action": "open_cursor", "confidence": 0.9}
    elif "youtube" in t and ("open" in t or "launch" in t):
        return {"intent": "desktop_control", "action": "open_youtube", "confidence": 0.9}
    elif "linkedin" in t and ("open" in t or "launch" in t):
        return {"intent": "desktop_control", "action": "open_linkedin", "confidence": 0.9}
    elif "internlink" in t and ("open" in t or "launch" in t):
        return {"intent": "desktop_control", "action": "open_internlink", "confidence": 0.9}
    elif "internship" in t:
        query = t
        if "search for " in t:
            query = t.split("search for ")[1].strip()
        elif "search " in t:
            query = t.split("search ")[1].strip()
        elif "find " in t:
            query = t.split("find ")[1].strip()
        return {"intent": "internship_search", "query": query, "confidence": 0.7}
        
    if fallback:
        # Catch-all: Route general queries to Ollama directly (general_llm)
        log.info("[GENERAL_LLM] Routing query to general LLM")
        return {"intent": "general_llm", "query": transcript, "confidence": 1.0}
        
    return {"intent": "unknown", "confidence": 0.0}

def execute_intent(parsed: dict, speak: bool = True) -> str:
    intent = parsed.get("intent")
    action = parsed.get("action")
    actions = parsed.get("actions", [])
    
    response_msg = ""
    
    if intent == "desktop_control":
        if action == "open_chrome":
            success = open_chrome()
            response_msg = "Opening Chrome Sir" if success else "I encountered an issue opening Chrome."
        elif action == "open_github":
            success = open_github()
            response_msg = "Opening GitHub Sir" if success else "I encountered an issue opening GitHub."
        elif action == "open_cursor":
            success = open_cursor()
            response_msg = "Opening Cursor Sir" if success else "I encountered an issue opening Cursor."
        elif action == "open_youtube":
            success = open_youtube()
            response_msg = "Opening YouTube Sir" if success else "I encountered an issue opening YouTube."
        elif action == "open_linkedin":
            success = open_linkedin()
            response_msg = "Opening LinkedIn Sir" if success else "I encountered an issue opening LinkedIn."
        elif action == "open_internlink":
            success = open_internlink()
            response_msg = "Opening InternLink Sir" if success else "I encountered an issue opening InternLink."
        if speak and response_msg:
            stream_tts(response_msg)
            
    elif intent == "multi_action":
        log.info(f"Executing multi actions: {actions}")
        msg = f"Executing {len(actions)} actions in sequence."
        if speak:
            stream_tts(msg)
        sub_responses = []
        for act in actions:
            log.info(f"Sub-action execution: {act}")
            if speak:
                sub_res = route_intent(act)
            else:
                sub_res = route_intent(act, speak=False)
            if sub_res and isinstance(sub_res, str):
                sub_responses.append(sub_res)
        response_msg = "; ".join(sub_responses) if sub_responses else msg
        
    elif intent == "internship_search":
        query = parsed.get("query", "internships")
        log.info(f"[INTERNSHIP_SEARCH] {query}")
        response_msg = search_internships(query)
        if speak:
            stream_tts(response_msg)
            
    elif intent == "web_search":
        query = parsed.get("query", "")
        log.info(f"[WEB_SEARCH] Routing real-time search: {query}")
        if speak:
            stream_tts("Searching the web for you...")
        from backend.agents.web_search_agent import search_web as agent_search_web, generate_web_answer
        search_results = agent_search_web(query)
        response_msg = generate_web_answer(query, search_results)
        if speak:
            stream_tts(response_msg)
            
    elif intent == "knowledge_query":
        query = parsed.get("query", "")
        log.info(f"[KNOWLEDGE_QUERY] {query}")
        from backend.core.local_llm import generate_text_response
        if speak:
            stream_tts("Let me think...")
        prompt = f"Explain '{query}' briefly and concisely in one or two sentences."
        response_msg = generate_text_response(prompt)
        if speak:
            stream_tts(response_msg)
            
    elif intent == "general_llm":
        query = parsed.get("query", "")
        log.info(f"[GENERAL_LLM] [OLLAMA_GENERAL] Answering query: {query}")
        from backend.core.local_llm import generate_text_response
        if speak:
            stream_tts("Let me look that up...")
        response_msg = generate_text_response(query, bypass_context=True)
        if speak:
            stream_tts(response_msg)
            
    elif intent == "memory_store":
        key = parsed.get("key")
        value = parsed.get("value")
        if key and value:
            store_memory(key, value)
            response_msg = "I have saved that."
            if speak:
                stream_tts(response_msg)
                
    elif intent == "memory_retrieve":
        key = parsed.get("key")
        if key:
            val = retrieve_memory(key)
            if val:
                display_key = key.replace("my ", "")
                response_msg = f"Your {display_key} is {val}"
            else:
                response_msg = "I don't have that in my memory."
            if speak:
                stream_tts(response_msg)
                
    elif intent == "memory_delete":
        key = parsed.get("key")
        log.info(f"[MEMORY_QUERY] Deleting memory for: {key}")
        success = delete_memory(key)
        if success:
            response_msg = f"I have forgotten {key}."
        else:
            response_msg = "I couldn't find that memory to delete."
        if speak:
            stream_tts(response_msg)
            
    elif intent == "resume_generation":
        role = parsed.get("role", "general")
        format_flag = parsed.get("format", "md")
        log.info(f"Generating resume for: {role} (format: {format_flag})")
        if speak:
            stream_tts("I am writing your resume now...")
        success = generate_resume_for_role(role, format=format_flag)
        if success:
            if format_flag == "pdf":
                response_msg = "Resume generated successfully. PDF saved and indexed."
            else:
                response_msg = "Resume generated successfully."
        else:
            response_msg = "I encountered an error while generating your resume."
        if speak:
            stream_tts(response_msg)
            
    elif intent == "track_application":
        company = parsed.get("company", "Unknown")
        role = parsed.get("role", "Unknown")
        response_msg = track_new_application(company, role)
        if speak:
            stream_tts(response_msg)
            
    elif intent == "list_applications":
        response_msg = summarize_applications()
        if speak:
            stream_tts(response_msg)
            
    elif intent == "update_application":
        company = parsed.get("company", "")
        role = parsed.get("role", "")
        status = parsed.get("status", "Updated")
        response_msg = update_status(company, role, status)
        if speak:
            stream_tts(response_msg)
            
    elif intent == "formpilot_autofill":
        log.info("Triggering FormPilot Autofill...")
        if speak:
            stream_tts("I am filling the form now.")
        response_msg = fill_mock_form()
        if speak:
            stream_tts(response_msg)
            
    else:
        log.info("Intent = unknown")
        response_msg = "I am not sure how to help with that yet."
        if speak:
            stream_tts(response_msg)
            
    return response_msg

def route_intent(transcript: str, speak: bool = True) -> str:
    """
    Intelligent LLM Intent Router with fallback.
    """
    normalized_t = normalize_transcript(transcript)
    if not normalized_t or len(normalized_t.split()) < 2:
        log.info("[VOICE_DISCARDED] Transcript empty, punctuation only, or < 2 words")
        return ""
        
    log.info(f"Transcript received (raw): '{transcript}'")
    log.info(f"Transcript normalized: '{normalized_t}'")
    parsed = None
    
    # 1. LOCAL RULE ROUTER (Instant)
    parsed = route_intent_fallback(transcript, fallback=False)
    if parsed.get("intent") != "unknown":
        log.info(f"[LOCAL_RULE] {parsed.get('intent')}")
        from backend.memory.memory_manager import log_voice_command
        log_voice_command(normalized_t, parsed.get("intent"), "[LOCAL_RULE]")
        return execute_intent(parsed, speak=speak)
        
    # 2. LLM CACHE HIT
    cached_intent = check_llm_cache(normalized_t)
    if cached_intent:
        log.info(f"[CACHE_HIT] {cached_intent.get('intent')}")
        from backend.memory.memory_manager import log_voice_command
        log_voice_command(normalized_t, cached_intent.get("intent"), "[CACHE_HIT]")
        return execute_intent(cached_intent, speak=speak)
        
    # 3. OLLAMA (Local LLM)
    parsed = route_intent_local(transcript)
    if parsed and parsed.get("intent") != "unknown":
        log.info(f"[OLLAMA] {parsed.get('intent')}")
        store_llm_cache(normalized_t, parsed)
        from backend.memory.memory_manager import log_voice_command
        log_voice_command(normalized_t, parsed.get("intent"), "[OLLAMA]")
        return execute_intent(parsed, speak=speak)
        
    # 4. GEMINI (Premium Fallback / Complex Tasks)
    if len(normalized_t.split()) >= 2:
        try:
            parsed = route_intent_gemini(transcript)
            if parsed and parsed.get("intent") != "unknown":
                log.info(f"[GEMINI] {parsed.get('intent')}")
                store_llm_cache(normalized_t, parsed)
                from backend.memory.memory_manager import log_voice_command
                log_voice_command(normalized_t, parsed.get("intent"), "[GEMINI]")
                return execute_intent(parsed, speak=speak)
        except Exception as e:
            log.warning(f"Gemini Routing Failed: {e}.")
            
    # 5. FINAL FALLBACK (Keyword Router)
    log.info("[KEYWORD_ROUTER] Unknown intent")
    parsed = route_intent_fallback(transcript, fallback=True)
    return execute_intent(parsed, speak=speak)
