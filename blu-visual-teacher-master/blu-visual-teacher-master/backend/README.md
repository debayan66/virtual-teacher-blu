# Blu Visual Teacher — local backend

A Windows local FastAPI backend for the React studio in the parent folder. The Vite proxy already sends /api requests to 127.0.0.1:8788.

## Setup and run

Install Python 3.11 or 3.12. From this folder run setup_backend.bat, then run_backend.bat. API docs: http://127.0.0.1:8788/docs. Health: http://127.0.0.1:8788/api/health.

Equivalent manual commands:

    py -3 -m venv .venv
    .venv\Scripts\python -m pip install -r requirements.txt
    .venv\Scripts\python -m app.scripts.generate_sample_lesson
    .venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8788

Run tests after setup:

    .venv\Scripts\python -m pytest -q

The setup does not download models or language assets.

## Sample and MP4 export

A bundled sample, How a Firewall Protects a Computer, starts in SQLite automatically and can be refreshed with python -m app.scripts.generate_sample_lesson. Four distinct Pillow layouts are rendered: title, diagram, code, and recap. Captions are synchronized to cue timing, burned into the video frames when requested, and also saved as an SRT download. Export audio is a generated demonstration tone, not narration.

This machine has a local FFmpeg configured in the ignored .env file. BLU_FFMPEG may point to any FFmpeg executable. ffprobe is optional; when unavailable the backend asks FFmpeg to inspect the resulting file. The MP4 is marked done only when its video and audio streams are detected. On this machine the sample has been verified as a 60-second H.264/AAC MP4 at 852×480 (480p preset). Its audio is demonstration-only.

## Local AI generation

Install Ollama separately and pull a local model, for example: ollama pull qwen2.5:3b. Set BLU_OLLAMA_MODEL in .env to the installed model name. /api/health lists models actually detected. Generation fails with an actionable message when Ollama or the selected model is missing. Requests use Ollama's local HTTP API only; no cloud AI provider is used.

## Language readiness

The registry lists English, all 22 languages in India's Eighth Schedule, and Spanish, French, German, Japanese, Chinese, Korean, Arabic, and Swahili. A listed language is not considered operational: readiness currently reports only the bundled English caption/font path. Translation providers and TTS voices are not installed, so generation explicitly rejects non-English narration/captions and the prepare route reports that there are no local packs.

## API contract

- GET /api/health — service/version, discovered Ollama model names and selected-model readiness.
- GET /api/diagnostics — database/storage, FFmpeg, Ollama, translation, TTS, and sample status.
- GET /api/lessons and GET /api/lessons/{id} — persisted UI-shaped lesson data.
- POST /api/lessons — JSON {topic, level, minutes, narration, captions}; requires Ollama and supported English assets.
- POST /api/lessons/sample — create and return the bundled sample.
- GET /api/languages and GET /api/languages/{code} — language registry and per-language asset status.
- POST /api/languages/{code}/prepare — returns an explicit unavailable response; does not download files.
- POST /api/exports — JSON {lessonId, narration, captions, resolution, format, burnInCaptions}; returns {jobId}.
- GET /api/exports/{jobId} — persistent job state/progress.
- GET /api/exports/{jobId}/download — verified MP4 only.
- GET /api/exports/{jobId}/captions — SRT caption sidecar.

## Data and privacy

SQLite and generated lessons, frames, captions, and exports stay under data/ and generated/ by default. Set BLU_DATA_DIR, BLU_GENERATED_DIR, BLU_DATABASE, BLU_OLLAMA_URL, BLU_OLLAMA_MODEL, and BLU_FFMPEG in .env to configure local paths/services. Backend CORS is limited to the local Vite origins. Restarted in-flight jobs are marked interrupted instead of left queued.

## Current limits

Local Ollama lesson generation is implemented but needs an installed Ollama service and model. Offline translation, local speech synthesis, secondary captions, scene editing, lesson deletion, and export cancellation are not implemented. Export progress is persisted but currently has a small number of stage updates. Check /api/diagnostics before relying on optional features.

See THIRD_PARTY_NOTICES.md for dependencies and licensing checks.
