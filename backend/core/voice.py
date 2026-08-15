import os
import time
import queue
import logging
import threading
import numpy as np
import sounddevice as sd
from openwakeword.model import Model
from faster_whisper import WhisperModel
import wave
import tempfile

def remove_duplicate_sentences(text: str) -> str:
    parts = text.split("?")
    seen = set()
    cleaned = []
    
    for p in parts:
        p = p.strip()
        if p and p not in seen:
            seen.add(p)
            cleaned.append(p)
            
    return "? ".join(cleaned)

log = logging.getLogger("voice")
logging.basicConfig(level=logging.INFO)

# --- Config ---
WAKE_WORD_MODEL = "hey_jarvis"
WHISPER_MODEL_SIZE = os.environ.get("WHISPER_MODEL", "base.en")
VAD_ENERGY_THRESHOLD = 0.015
VAD_SILENCE_DURATION = 1.5  # seconds
SAMPLE_RATE = 16000
CHUNK_SIZE = 1280  # 80ms chunks for openwakeword

# Initialize models globally (lazy load or load at startup)
wakeword_model = None
whisper_model = None
audio_queue = queue.Queue()
listening_for_command = False
recorded_frames = []
is_speaking = False

def init_models():
    global wakeword_model, whisper_model
    log.info("Loading OpenWakeWord model...")
    wakeword_model = Model(wakeword_models=[WAKE_WORD_MODEL])
    log.info(f"Loading Whisper model ({WHISPER_MODEL_SIZE})...")
    # Using CPU for better compatibility on arbitrary systems; change to "cuda" if desired.
    whisper_model = WhisperModel(WHISPER_MODEL_SIZE, device="cpu", compute_type="int8")
    log.info("Models loaded successfully.")

def audio_callback(indata, frames, time_info, status):
    if status:
        log.warning(status)
    if is_speaking:
        return
    # Openwakeword expects 16khz 16-bit integers
    audio_queue.put(indata.copy())

def stream_tts(text: str):
    """Simple TTS using ElevenLabs API from environment."""
    global is_speaking
    log.info(f"JARVIS: {text}")
    api_key = os.environ.get("ELEVENLABS_API_KEY")
    if not api_key:
        log.warning("ELEVENLABS_API_KEY not set. Skipping TTS playback.")
        return
    try:
        from elevenlabs.client import ElevenLabs
        client = ElevenLabs(api_key=api_key)
        vid = os.environ.get("ELEVENLABS_VOICE_ID") or "EXAVITQu4vr4xnSDxMaL"
        audio_generator = client.text_to_speech.convert(
            voice_id=vid,
            text=text,
            model_id="eleven_multilingual_v2",
            output_format="pcm_24000"
        )
        raw = b"".join(audio_generator)
        pcm_i16 = np.frombuffer(raw, dtype=np.int16)
        pcm_f = pcm_i16.astype(np.float32) / 32768.0
        is_speaking = True
        sd.play(pcm_f, 24000)
        sd.wait()
    except Exception as e:
        log.error(f"TTS Error: {e}")
    finally:
        is_speaking = False

def _rms(data: np.ndarray) -> float:
    return float(np.sqrt(np.mean(data**2)))

def start_listening(router_callback):
    """
    Main loop that captures audio, checks for wake word, 
    records command, transcribes, and passes to router.
    """
    if wakeword_model is None or whisper_model is None:
        init_models()

    log.info("Starting audio stream. Say 'Hey Jarvis'...")
    with sd.InputStream(samplerate=SAMPLE_RATE, channels=1, dtype="int16", blocksize=CHUNK_SIZE, callback=audio_callback):
        global listening_for_command, recorded_frames
        silence_start_time = None
        
        while True:
            try:
                audio_chunk = audio_queue.get(timeout=1.0)
            except queue.Empty:
                continue

            # Convert to numpy array for processing
            chunk_np = np.frombuffer(audio_chunk, dtype=np.int16)

            if not listening_for_command:
                # 1. Listen for Wake Word
                prediction = wakeword_model.predict(chunk_np)
                for mdl, score in prediction.items():
                    if score > 0.75:  # threshold increased
                        log.info("Wake word detected! Listening for command...")
                        listening_for_command = True
                        recorded_frames = []
                        silence_start_time = time.time()
                        break
            else:
                # 2. Record command until silence
                recorded_frames.append(chunk_np)
                chunk_f32 = chunk_np.astype(np.float32) / 32768.0
                energy = _rms(chunk_f32)
                
                if energy > VAD_ENERGY_THRESHOLD:
                    silence_start_time = time.time()  # reset silence timer
                
                if time.time() - silence_start_time > VAD_SILENCE_DURATION:
                    log.info("Silence detected. Processing command...")
                    listening_for_command = False
                    
                    # 3. Transcribe and route
                    process_command(recorded_frames, router_callback)
                    recorded_frames = []

def process_command(frames, router_callback):
    audio_data = np.concatenate(frames)
    
    # Save temporarily to wav for faster-whisper compatibility
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        with wave.open(tmp.name, 'wb') as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(SAMPLE_RATE)
            wf.writeframes(audio_data.tobytes())
        tmp_path = tmp.name

    try:
        segments, _ = whisper_model.transcribe(tmp_path, beam_size=1)
        transcript = " ".join([segment.text for segment in segments]).strip()
        transcript = remove_duplicate_sentences(transcript)
        
        # Clean transcript of common Whisper hallucinations / short filler words
        normalized = transcript.lower().strip()
        for garbage in ["you", "oh", ". . .", "...", "thank you", "bye", "okay"]:
            if normalized == garbage:
                log.info(f"[VOICE_IGNORED] Discarded filler/hallucination: '{transcript}'")
                return
        
        if not transcript.strip():
            log.info("[VOICE_IGNORED] Empty transcript")
            return
            
        if len(transcript.split()) < 2:
            log.info(f"[VOICE_IGNORED] Transcript too short (< 2 words): '{transcript}'")
            return

        log.info(f"Transcript: {transcript}")
        router_callback(transcript)
    except Exception as e:
        log.error(f"Transcription error: {e}")
    finally:
        try:
            os.remove(tmp_path)
        except Exception:
            pass
