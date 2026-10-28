@echo off
cd /d "%~dp0"
if not exist .venv\Scripts\python.exe (echo Run setup_backend.bat first.& pause & exit /b 1)
call .venv\Scripts\activate.bat
echo API: http://127.0.0.1:8788/api/health
echo Docs: http://127.0.0.1:8788/docs
python -m uvicorn app.main:app --host 127.0.0.1 --port 8788
