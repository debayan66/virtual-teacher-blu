import json
from urllib.request import Request,urlopen
from .config import OLLAMA_URL,OLLAMA_MODEL
def status():
    try:
        with urlopen(Request(OLLAMA_URL+"/api/tags"),timeout=2) as r: models=[m.get("name","") for m in json.load(r).get("models",[])]
        return {"reachable":True,"models":models,"selectedModelAvailable":any(m==OLLAMA_MODEL or m.startswith(OLLAMA_MODEL+":") for m in models)}
    except Exception: return {"reachable":False,"models":[],"selectedModelAvailable":False}
def generate(topic,level,minutes):
    st=status()
    if not st["reachable"]: raise RuntimeError("Ollama is not running. Install Ollama and pull a local model, or use the bundled sample.")
    if not st["selectedModelAvailable"]: raise RuntimeError(f"Selected model {OLLAMA_MODEL} is not installed. Run: ollama pull {OLLAMA_MODEL}")
    prompt=f'''Create an accurate {minutes}-minute {level} lesson about {topic}. Return JSON only: title and scenes. Provide four scenes with kind title, diagram or code; title, duration, narration, captions (array), headline, sub, points and lines. Include a useful recap.'''
    req=Request(OLLAMA_URL+"/api/generate",data=json.dumps({"model":OLLAMA_MODEL,"prompt":prompt,"stream":False,"format":"json","options":{"temperature":0.2,"num_predict":1800}}).encode(),headers={"Content-Type":"application/json"})
    with urlopen(req,timeout=120) as r: data=json.loads(json.load(r)["response"])
    scenes=[]
    for i,x in enumerate(data["scenes"]):
        kind=x.get("kind","title")
        if kind not in ("title","diagram","code"): kind="title"
        scenes.append({"id":f"g{i+1}","kind":kind,"duration":max(5,int(x.get("duration",10))),"title":str(x.get("title","Scene"))[:80],"narration":{"en":str(x.get("narration",""))},"captions":{"en":x.get("captions",[]) if isinstance(x.get("captions"),list) else [str(x.get("captions",""))]},"eyebrow":"LESSON","headline":x.get("headline",x.get("title","")),"sub":x.get("sub",""),"points":x.get("points",[])[:4],"file":"example.txt","language":"text","lines":x.get("lines",[])[:12],"nodes":[],"edges":[],"steps":[],"legend":[],"beats":[],"probes":[]})
    if len(scenes)<3: raise ValueError("Local model returned fewer than three scenes.")
    from datetime import datetime,timezone
    import uuid
    return {"id":"lesson-"+uuid.uuid4().hex[:12],"title":str(data.get("title",topic))[:100],"topic":topic,"level":level,"durationMinutes":minutes,"languages":["en"],"sample":False,"createdAt":datetime.now(timezone.utc).isoformat(),"status":"ready","scenes":scenes}
