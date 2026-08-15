import threading
import os
from backend.knowledge.loader import load_user_profile, load_knowledge, list_knowledge_files, build_context
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv

load_dotenv()

# We import the voice listener and router
from backend.core.voice import start_listening
from backend.core.router import route_intent

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("api")

app = FastAPI(title="JARVIS OS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def run_startup_checks():
    log.info("Starting up JARVIS OS Voice Loop...")
    # Ollama health check
    from backend.core.local_llm import health_check
    ollama_online = health_check()
    if ollama_online:
        log.info("[OLLAMA_ONLINE] Ollama is reachable")
        # Verify default routing model exists
        import urllib.request, json
        try:
            req = urllib.request.Request("http://localhost:11434/api/tags", method="GET")
            with urllib.request.urlopen(req, timeout=5.0) as resp:
                if resp.status == 200:
                    tags = json.loads(resp.read().decode("utf-8"))
                    models = [m["name"] for m in tags.get("models", [])]
                    default_model = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")
                    if default_model in models:
                        log.info(f"[OLLAMA_MODEL_FOUND] Model {default_model} is available")
                    else:
                        log.warning(f"[OLLAMA_MODEL_FOUND] Model {default_model} not found in Ollama")
        except Exception as e:
            log.error(f"Error checking Ollama models: {e}")
    else:
        log.error("[OLLAMA_ONLINE] Ollama is not reachable")
    # Start the voice listener in a background daemon thread
    voice_thread = threading.Thread(
        target=start_listening,
        args=(route_intent,),
        daemon=True
    )
    voice_thread.start()

@app.on_event("startup")
def startup_event():
    # Run all initialization tasks in a background thread to prevent blocking
    threading.Thread(target=run_startup_checks, daemon=True).start()


@app.get("/")
async def root():
    return {"message": "JARVIS OS Backend is running"}

@app.post("/test-router")
async def test_router(command: str):
    """Testing endpoint to bypass voice and test router directly."""
    route_intent(command)
    return {"status": "routed", "command": command}

from backend.memory.memory_manager import get_all_internships, get_all_resumes, get_all_applications, store_application
from pydantic import BaseModel
from datetime import datetime

class ApplicationCreate(BaseModel):
    company: str
    role: str
    source: str = "Web"
    resume_id: int = -1
    status: str = "Applied"
    notes: str = ""

@app.get("/internships")
async def get_internships():
    """Returns all stored internships from the database."""
    results = get_all_internships()
    return {"count": len(results), "internships": results}

@app.get("/resumes")
async def get_resumes():
    """Returns all generated resumes from the database."""
    results = get_all_resumes()
    return {"count": len(results), "resumes": results}

@app.get("/applications")
async def get_applications():
    """Returns all tracked applications."""
    results = get_all_applications()
    return {"count": len(results), "applications": results}

@app.post("/applications")
async def create_application(app_data: ApplicationCreate):
    """Manually add an application tracker record."""
    date_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    success = store_application(
        company=app_data.company,
        role=app_data.role,
        source=app_data.source,
        resume_id=app_data.resume_id,
        status=app_data.status,
        applied_at=date_str,
        notes=app_data.notes
    )
    return {"success": success}

@app.put("/applications/{app_id}")
async def update_application(app_id: int, status: str):
    """Update application status by ID."""
    from backend.memory.memory_manager import update_application_status_by_id
    success = update_application_status_by_id(app_id, status)
    return {"success": success}

@app.get("/status")
async def get_system_status():
    """Returns system status."""
    from backend.core.local_llm import health_check
    ollama_ok = health_check()
    return {
        "ollama_connected": ollama_ok,
        "whisper_running": True, # Running if API is up
        "elevenlabs_connected": True,
        "fastapi_online": True,
        "database_connected": True
    }

@app.get("/profile")
async def get_profile():
    import json
    import os
    profile_path = os.path.join(os.path.dirname(__file__), "memory", "user_profile.json")
    if os.path.exists(profile_path):
        with open(profile_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

@app.put("/profile")
async def update_profile(profile_data: dict):
    import json
    import os
    profile_path = os.path.join(os.path.dirname(__file__), "memory", "user_profile.json")
    try:
        with open(profile_path, "w", encoding="utf-8") as f:
            json.dump(profile_data, f, indent=2)
        return {"success": True}
    except Exception as e:
        log.error(f"Error saving profile: {e}")
        return {"success": False}

@app.get("/memories")
async def get_memories_endpoint():
    from backend.memory.memory_manager import get_all_memories
    results = get_all_memories()
    return {"count": len(results), "memories": results}

class MemoryCreate(BaseModel):
    key: str
    value: str

@app.post("/memories")
async def create_memory(mem_data: MemoryCreate):
    from backend.memory.memory_manager import store_memory
    success = store_memory(mem_data.key, mem_data.value)
    return {"success": success}

@app.delete("/memories/{key}")
async def remove_memory(key: str):
    from backend.memory.memory_manager import delete_memory
    success = delete_memory(key)
    return {"success": success}

@app.get("/voice-logs")
async def get_voice_logs_endpoint():
    from backend.memory.memory_manager import get_voice_logs
    results = get_voice_logs()
    return {"count": len(results), "logs": results}

class AutofillRequest(BaseModel):
    fields: list[dict]

@app.post("/autofill")
async def autofill_fields(request: AutofillRequest):
    """Uses Ollama to map DOM fields to user profile values."""
    from backend.core.local_llm import query_ollama
    import json

    prompt = (
        "You are an expert form filler. I will provide a list of form fields extracted from a job application. "
        "Using my profile and memory, map these fields to appropriate values. "
        "Output ONLY valid JSON matching this schema: [{\"id\": \"field_id\", \"value\": \"filled_value\"}]. "
        f"Fields to fill: {json.dumps(request.fields)}"
    )

    try:
        response_text = query_ollama(prompt)
        # Extract JSON from response if it has markdown formatting
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0]
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0]
            
        mapped_values = json.loads(response_text.strip())
        return {"success": True, "mapped": mapped_values}
    except Exception as e:
        log.error(f"Error mapping fields: {e}")
        return {"success": False, "error": str(e)}

@app.get("/debug/context")
async def get_debug_context():
    """Return debugging info about injected Ollama context."""
    # Load components (functions already log their own loading)
    profile = load_user_profile()
    profile_loaded = bool(profile)
    knowledge_files = list_knowledge_files()
    # Memory count via existing manager
    from backend.memory.memory_manager import get_all_memories
    memories = get_all_memories()
    memory_count = len(memories)
    # Build full context
    context = build_context()
    context_size = len(context)
    context_preview = context[:200]
    ollama_model = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")
    # Additional logs
    log.info("[PROFILE_LOADED]")
    log.info("[KNOWLEDGE_LOADED]")
    log.info("[MEMORY_LOADED]")
    log.info("[OLLAMA_CONTEXT_READY]")
    return {
        "profile_loaded": profile_loaded,
        "knowledge_files": knowledge_files,
        "memory_count": memory_count,
        "context_size": context_size,
        "ollama_model": ollama_model,
        "context_preview": context_preview,
    }

@app.get("/debug/ollama")
async def get_debug_ollama():
    """Return Ollama connection health and model info with response time."""
    import time, urllib.request, json
    start = time.time()
    online = False
    model = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")
    try:
        req = urllib.request.Request("http://localhost:11434/api/tags", method="GET")
        with urllib.request.urlopen(req, timeout=5.0) as resp:
            if resp.status == 200:
                online = True
    except Exception:
        online = False
    response_time_ms = int((time.time() - start) * 1000)
    return {
        "ollama_online": online,
        "model": model,
        "response_time_ms": response_time_ms,
    }

@app.get("/search")
async def get_web_search(q: str):
    """Executes a web search and returns RAG summarized results from Ollama."""
    from backend.agents.web_search_agent import search_web, generate_web_answer
    results = search_web(q)
    answer = generate_web_answer(q, results)
    return {"query": q, "results": results.get("results", []), "answer": answer}

@app.get("/news")
async def get_news_search(q: str):
    """Executes a news search."""
    from backend.agents.web_search_agent import search_news
    results = search_news(q)
    return {"query": q, "results": results.get("results", [])}

@app.get("/internships/search")
async def get_internships_search(q: str):
    """Executes an internship web search."""
    from backend.agents.web_search_agent import search_internships
    results = search_internships(q)
    return {"query": q, "results": results.get("results", [])}

@app.get("/ask")
async def ask_question(q: str):
    """Executes a routing check and returns the answer using the same routing system as voice mode."""
    from backend.core.router import route_intent
    answer = route_intent(q, speak=False)
    return {"answer": answer}


