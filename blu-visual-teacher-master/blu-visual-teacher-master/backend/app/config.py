from pathlib import Path
import os
ROOT = Path(__file__).resolve().parents[1]
_env_file = ROOT / ".env"
if _env_file.is_file():
    for _line in _env_file.read_text(encoding="utf-8").splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _key, _value = _line.split("=", 1)
            os.environ.setdefault(_key.strip(), _value.strip().strip("\\\"").strip("'"))
DATA = Path(os.getenv("BLU_DATA_DIR", ROOT / "data")).resolve()
GENERATED = Path(os.getenv("BLU_GENERATED_DIR", ROOT / "generated")).resolve()
DB_PATH = Path(os.getenv("BLU_DATABASE", DATA / "blu.sqlite3")).resolve()
OLLAMA_URL = os.getenv("BLU_OLLAMA_URL", "http://127.0.0.1:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("BLU_OLLAMA_MODEL", "qwen2.5:3b")
def ensure_dirs():
    DATA.mkdir(parents=True, exist_ok=True)
    for n in ("lessons","audio","scenes","exports","temporary"): (GENERATED/n).mkdir(parents=True,exist_ok=True)
