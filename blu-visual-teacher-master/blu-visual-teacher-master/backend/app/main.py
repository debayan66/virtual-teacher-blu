import uuid,threading,shutil,os
from pathlib import Path
from fastapi import FastAPI,HTTPException,Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from .config import GENERATED,ensure_dirs
from .db import init_db,lesson,lessons,save_lesson,save_job,job,save_export
from .models import GenerateRequest,ExportRequest
from .sample import firewall_lesson
from .providers import status,generate
from .render import export
from .languages import registry,installed
from .auth import router as auth_router,init_auth,get_current_user,require_admin
app=FastAPI(title="Blu Visual Teacher Local API",version="1.0.0")
app.add_middleware(CORSMiddleware,allow_origins=["http://127.0.0.1:5173","http://localhost:5173"],allow_methods=["GET","POST","PATCH"],allow_headers=["*"],allow_credentials=True)
app.include_router(auth_router)
@app.on_event("startup")
def startup():
    ensure_dirs(); init_db(); init_auth()
    if not lesson("sample-firewall"): save_lesson(firewall_lesson())
@app.get("/api/health")
def health():
    x=status(); return {"service":"Blu Visual Teacher","version":"1.0.0","models":x["models"],"ollamaReachable":x["reachable"],"selectedModelAvailable":x["selectedModelAvailable"]}
@app.get("/api/diagnostics")
def diagnostics(): 
    x=status(); return {"database":"ready","storage":"ready","ffmpeg":bool(shutil.which(os.getenv("BLU_FFMPEG","ffmpeg"))),"ffprobe":bool(shutil.which("ffprobe")),"ollama":x["reachable"],"selectedModel":x["selectedModelAvailable"],"translation":"unavailable: no offline engine configured","tts":"unavailable: no local voice configured","sample":"ready; export audio is demonstration tone"}
# Reading lessons is allowed for the labelled sample fallback; every mutation
# below requires a valid session cookie (authorization enforced server-side).
@app.get("/api/lessons")
def get_lessons(): return lessons()
@app.get("/api/lessons/{lesson_id}")
def get_lesson(lesson_id):
    x=lesson(lesson_id)
    if not x: raise HTTPException(404,detail="Lesson not found")
    return x
@app.post("/api/lessons/sample")
def get_sample(user:dict=Depends(get_current_user)):
    x=firewall_lesson(); save_lesson(x); return x
@app.post("/api/lessons")
def create_lesson(body:GenerateRequest,user:dict=Depends(get_current_user)):
    if body.narration!="en" or body.captions!="en": raise HTTPException(501,detail="Offline translation and narration for the requested language are not configured; choose English or install verified local language assets.")
    try: x=generate(body.topic,body.level,body.minutes)
    except Exception as e: raise HTTPException(503,detail=str(e))
    x["languages"]=[body.narration]
    for s in x["scenes"]:
        s["narration"]={body.narration:s["narration"].get("en","")}; s["captions"]={body.captions:s["captions"].get("en",[])}
    save_lesson(x); return {"lessonId":x["id"],"status":"ready","lesson":x}
@app.get("/api/languages")
def languages(): return registry()
@app.get("/api/languages/{code}")
def language(code):
    if not any(x["code"]==code for x in registry()): raise HTTPException(404,detail="Unknown language code")
    return {"code":code,"installed":installed(code),"assets":["system font"] if installed(code) else []}
@app.post("/api/languages/{code}/prepare")
def prepare(code,user:dict=Depends(get_current_user)): raise HTTPException(501,detail="No offline language assets are configured; nothing was downloaded.")
@app.post("/api/exports")
def start_export(body:ExportRequest,user:dict=Depends(get_current_user)):
    if body.format!="mp4": raise HTTPException(501,detail="Only MP4 export is currently supported.")
    if body.captions not in ("","en"): raise HTTPException(501,detail="Only English caption rendering is configured.")
    if not lesson(body.lessonId): raise HTTPException(404,detail="Lesson not found")
    j={"jobId":uuid.uuid4().hex,"lessonId":body.lessonId,"state":"queued","percent":0,"stage":"queued"}; save_job(j)
    def work():
        try:
            j.update(state="rendering",percent=10,stage="rendering scenes"); save_job(j)
            path,size=export(lesson(body.lessonId),j["jobId"],body.resolution,body.burnInCaptions)
            save_export({"id":j["jobId"],"lessonId":body.lessonId,"file":path.name,"bytes":size,"audio":"demonstration tone only"})
            j.update(state="done",percent=100,stage="verified",file=path.name,path=f"/api/exports/{j['jobId']}/download",bytes=size,audio="demonstration tone only"); save_job(j)
        except Exception as e: j.update(state="failed",percent=0,stage="failed",error=str(e)); save_job(j)
    threading.Thread(target=work,daemon=True).start(); return {"jobId":j["jobId"]}
@app.get("/api/exports/{job_id}")
def export_progress(job_id):
    x=job(job_id)
    if not x: raise HTTPException(404,detail="Export not found")
    return x
@app.get("/api/exports/{job_id}/captions")
def export_captions(job_id):
    if not job(job_id): raise HTTPException(404,detail="Export not found")
    p=(GENERATED/"temporary"/job_id/"captions.srt").resolve()
    if p.parent!=(GENERATED/"temporary"/job_id).resolve() or not p.is_file(): raise HTTPException(404,detail="Captions not found")
    return FileResponse(p,media_type="application/x-subrip",filename="captions.srt")
@app.get("/api/exports/{job_id}/download")
def download(job_id):
    x=job(job_id)
    if not x or x["state"]!="done": raise HTTPException(404,detail="Verified export is not available")
    p=(GENERATED/"exports"/Path(x["file"]).name).resolve()
    if p.parent!=(GENERATED/"exports").resolve() or not p.is_file(): raise HTTPException(404,detail="Export file not found")
    return FileResponse(p,media_type="video/mp4",filename=p.name)
@app.get("/api/users")
def list_users(admin:dict=Depends(require_admin)):
    from .db import connect
    with connect() as c: rows=c.execute("SELECT id,name,email,role,language,created_at FROM users ORDER BY created_at").fetchall()
    return [{"id":r["id"],"name":r["name"],"email":r["email"],"role":r["role"],"language":r["language"],"createdAt":r["created_at"]} for r in rows]
