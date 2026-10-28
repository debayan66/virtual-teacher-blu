import json,os,shutil,subprocess,textwrap
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
from .config import GENERATED
W,H=1280,720
def font(size):
    for p in ("C:/Windows/Fonts/segoeui.ttf","C:/Windows/Fonts/arial.ttf"):
        if Path(p).exists(): return ImageFont.truetype(p,size)
    return ImageFont.load_default()
def draw(scene,path,caption=""):
    im=Image.new("RGB",(W,H),(9,14,31)); d=ImageDraw.Draw(im)
    d.rectangle((0,0,W,8),fill=(83,221,197))
    d.text((65,55),scene.get("eyebrow","BLU VISUAL TEACHER"),font=font(22),fill=(83,221,197))
    kind=scene["kind"]
    if kind=="diagram":
        nodes={n["id"]:n for n in scene.get("nodes",[])}
        for e in scene.get("edges",[]):
            a,b=nodes.get(e["from"]),nodes.get(e["to"])
            if a and b:
                p=(int(a["x"]*W/100),int(a["y"]*H/100)); q=(int(b["x"]*W/100),int(b["y"]*H/100))
                col={"good":(70,210,155),"bad":(248,100,116)}.get(e.get("tone"),(112,142,201))
                d.line((p,q),fill=col,width=5); d.text(((p[0]+q[0])//2,(p[1]+q[1])//2-24),e.get("label",""),font=font(20),fill=col)
        for n in nodes.values():
            x,y=int(n["x"]*W/100),int(n["y"]*H/100); col={"good":(38,112,88),"bad":(138,54,68),"focus":(61,80,160)}.get(n.get("tone"),(39,52,80))
            d.rounded_rectangle((x-120,y-55,x+120,y+55),radius=18,fill=col,outline=(105,132,185),width=2)
            d.text((x-90,y-20),n["label"],font=font(24),fill="white"); d.text((x-90,y+12),n.get("sub",""),font=font(16),fill=(190,204,229))
    elif kind=="code":
        d.text((65,110),scene.get("file","example.txt"),font=font(20),fill=(164,181,216)); d.rounded_rectangle((65,150,1210,570),radius=16,fill=(17,25,45),outline=(55,74,110),width=2)
        for i,line in enumerate(scene.get("lines",[])[:12]): d.text((95,180+i*30),str(line)[:110],font=font(19),fill=(154,226,206))
        d.text((65,615),scene.get("sub",""),font=font(22),fill=(204,216,238))
    else:
        d.text((65,145),scene.get("headline",scene["title"]),font=font(50),fill=(244,247,255))
        d.text((65,290),scene.get("sub",""),font=font(26),fill=(174,190,218))
        for i,x in enumerate(scene.get("points",[])[:4]): d.text((90,385+i*55),"• "+str(x)[:95],font=font(23),fill=(220,228,244))
    if caption:
        lines=textwrap.wrap(str(caption),width=90)[:2]
        d.rounded_rectangle((55,620,1225,700),radius=16,fill=(4,8,19),outline=(83,221,197),width=2)
        for i,line in enumerate(lines): d.text((80,632+i*28),line,font=font(22),fill=(250,252,255))
    path.parent.mkdir(parents=True,exist_ok=True); im.save(path,format="JPEG",quality=92)
def stamp(t):
    s=int(t); return f"{s//3600:02}:{s//60%60:02}:{s%60:02},{int(t%1*1000):03}"
def export(lesson,jid,resolution="720p",burn_in=True):
    ffmpeg=shutil.which(os.getenv("BLU_FFMPEG","ffmpeg"))
    ffprobe=shutil.which(os.getenv("BLU_FFPROBE","ffprobe"))
    if not ffmpeg: raise RuntimeError("FFmpeg is required for MP4 export. Install it or set BLU_FFMPEG to its executable, then restart the backend.")
    folder=GENERATED/"temporary"/jid; folder.mkdir(parents=True,exist_ok=True)
    frames=[]; cues=[]; elapsed=0; idx=1
    for si,scene in enumerate(lesson["scenes"]):
        text=scene.get("captions",{}).get("en",[]) or [scene.get("narration",{}).get("en","")]
        if isinstance(text,str): text=[text]
        text=[str(x) for x in text] or [""]
        segment=scene["duration"]/len(text)
        for ci,cue in enumerate(text):
            start=elapsed+ci*segment; end=elapsed+(ci+1)*segment
            cues.extend([str(idx),f"{stamp(start)} --> {stamp(end)}",cue,""]); idx+=1
            caption=cue if burn_in else ""
            p=folder/f"scene_{si:03}_cue_{ci:03}.jpg"
            draw(scene,p,caption); frames.append((p,segment))
        elapsed+=scene["duration"]
    concat=folder/"frames.txt"
    with concat.open("w",encoding="utf-8") as f:
        for p,duration in frames: f.write(f"file '{p.as_posix()}'\nduration {duration}\n")
        f.write(f"file '{frames[-1][0].as_posix()}'\n")
    (folder/"captions.srt").write_text("\n".join(cues),encoding="utf-8")
    heights={"480p":480,"720p":720,"1080p":1080}; h=heights[resolution]; w=h*16//9
    out=GENERATED/"exports"/f"{jid}.mp4"
    found=subprocess.run([ffmpeg,"-hide_banner","-encoders"],capture_output=True,text=True,timeout=20)
    codecs=found.stdout+found.stderr
    codec=next((name for name in ("libx264","libopenh264","h264_mf","mpeg4") if name in codecs),"")
    if not codec: raise RuntimeError("This FFmpeg build has no supported MP4 video encoder (H.264 or MPEG-4).")
    cmd=[ffmpeg,"-y","-hide_banner","-loglevel","error","-f","concat","-safe","0","-i",str(concat),
         "-f","lavfi","-i",f"sine=frequency=440:duration={elapsed}","-vf",f"scale={w}:{h}",
         "-c:v",codec,"-b:v","2M","-pix_fmt","yuv420p","-c:a","aac","-shortest","-movflags","+faststart",str(out)]
    proc=subprocess.run(cmd,capture_output=True,text=True,timeout=900)
    if proc.returncode: raise RuntimeError("FFmpeg export failed: "+proc.stderr[-1200:])
    if ffprobe:
        probe=subprocess.run([ffprobe,"-v","error","-show_entries","stream=codec_type","-of","json",str(out)],capture_output=True,text=True,timeout=30)
        streams=[x["codec_type"] for x in json.loads(probe.stdout).get("streams",[])] if probe.returncode==0 else []
    else:
        probe=subprocess.run([ffmpeg,"-hide_banner","-i",str(out)],capture_output=True,text=True,timeout=30)
        stderr=probe.stderr
        streams=(["video"] if "Video:" in stderr else [])+(["audio"] if "Audio:" in stderr else [])
    if not out.is_file() or out.stat().st_size<1000 or "video" not in streams or "audio" not in streams:
        raise RuntimeError("MP4 did not pass audio/video stream verification.")
    return out,out.stat().st_size

