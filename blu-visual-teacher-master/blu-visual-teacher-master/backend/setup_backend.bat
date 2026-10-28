@echo off
cd /d "%~dp0"
where py >nul 2>nul || (echo Install Python 3.11 or 3.12 first.& pause & exit /b 1)
if not exist .venv py -3 -m venv .venv
call .venv\Scripts\activate.bat
python -m pip install --upgrade pip
if errorlevel 1 (pause & exit /b 1)
python -m pip install -r requirements.txt
if errorlevel 1 (pause & exit /b 1)
python -c "from app.main import startup; startup(); print('Database initialized and sample lesson saved')"
pause
