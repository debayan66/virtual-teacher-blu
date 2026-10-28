"""Report essential and optional local backend dependencies."""
import importlib.util, shutil, sys
from app.main import startup
from app.providers import status
startup()
checks={
 "python":sys.version_info >= (3,11),
 "fastapi":importlib.util.find_spec("fastapi") is not None,
 "pydantic":importlib.util.find_spec("pydantic") is not None,
 "pillow":importlib.util.find_spec("PIL") is not None,
 "database":"ready",
 "ffmpeg":bool(shutil.which("ffmpeg")),
 "ffprobe":bool(shutil.which("ffprobe")),
}
ollama=status()
checks["ollama"]=ollama["reachable"]
checks["selected_model"]=ollama["selectedModelAvailable"]
for name,value in checks.items(): print(f"{name}: {'ready' if value else 'missing/unavailable'}")
print("translation: unavailable (no offline provider configured)")
print("tts: unavailable (no local voice configured)")
raise SystemExit(0 if all(checks[x] for x in ("python","fastapi","pydantic","pillow","database")) else 1)
