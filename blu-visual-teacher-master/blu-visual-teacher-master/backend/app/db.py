import json, sqlite3
from datetime import datetime,timezone
from .config import DB_PATH,ensure_dirs
def now(): return datetime.now(timezone.utc).isoformat()
def connect():
    ensure_dirs(); c=sqlite3.connect(DB_PATH,timeout=20); c.row_factory=sqlite3.Row; c.execute("PRAGMA journal_mode=WAL"); return c
def init_db():
    with connect() as c:
        c.executescript("""CREATE TABLE IF NOT EXISTS lessons(id TEXT PRIMARY KEY,payload TEXT NOT NULL,created_at TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY,lesson_id TEXT,kind TEXT,state TEXT,percent INTEGER,stage TEXT,payload TEXT,updated_at TEXT);
        CREATE TABLE IF NOT EXISTS exports(id TEXT PRIMARY KEY,lesson_id TEXT,payload TEXT,created_at TEXT);""")
        rows=c.execute("SELECT id,payload FROM jobs WHERE state IN ('queued','rendering','encoding')").fetchall()
        for row in rows:
            payload=json.loads(row["payload"])
            payload.update(state="failed",stage="interrupted",error="Backend restarted before this job completed.")
            c.execute("UPDATE jobs SET state='failed',stage='interrupted',payload=?,updated_at=? WHERE id=?",
                      (json.dumps(payload),now(),row["id"]))
def save_lesson(x):
    with connect() as c: c.execute("INSERT OR REPLACE INTO lessons VALUES(?,?,?)",(x["id"],json.dumps(x,ensure_ascii=False),x.get("createdAt",now())))
def lesson(x):
    with connect() as c: r=c.execute("SELECT payload FROM lessons WHERE id=?",(x,)).fetchone()
    return json.loads(r["payload"]) if r else None
def lessons():
    with connect() as c: rs=c.execute("SELECT payload FROM lessons ORDER BY created_at DESC").fetchall()
    return [json.loads(r["payload"]) for r in rs]
def save_job(j):
    with connect() as c: c.execute("INSERT OR REPLACE INTO jobs VALUES(?,?,?,?,?,?,?,?)",(j["jobId"],j.get("lessonId"),j.get("kind","export"),j["state"],j["percent"],j["stage"],json.dumps(j),now()))
def job(x):
    with connect() as c: r=c.execute("SELECT payload FROM jobs WHERE id=?",(x,)).fetchone()
    return json.loads(r["payload"]) if r else None
def save_export(x):
    with connect() as c: c.execute("INSERT OR REPLACE INTO exports VALUES(?,?,?,?)",(x["id"],x["lessonId"],json.dumps(x),now()))
