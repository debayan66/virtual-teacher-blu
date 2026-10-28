import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

device = "cuda:0" if torch.cuda.is_available() else "cpu"
LANG_CODES = {"en": "eng_Latn", "hi": "hin_Deva", "bn": "ben_Beng",
              "te": "tel_Telu", "kn": "kan_Knda"}

def _pre(sents, src, tgt):
    return [f"{src} {tgt} {s.strip()}" for s in sents]

def _post(dec, tgt):
    return [d.strip() for d in dec]

_models = {}

def _load(direction):
    if direction not in _models:
        repo = ("ai4bharat/indictrans2-en-indic-dist-200M" if direction == "en-indic"
                else "ai4bharat/indictrans2-indic-en-dist-200M")
        tok = AutoTokenizer.from_pretrained(repo, trust_remote_code=True)
        mdl = AutoModelForSeq2SeqLM.from_pretrained(repo, trust_remote_code=True).to(device)
        _models[direction] = (tok, mdl)
    return _models[direction]

def translate(sentences, src, tgt):
    """Codes: en, hi, bn, te, kn"""
    if src == tgt:
        return sentences
    if src != "en" and tgt != "en":
        sentences = translate(sentences, src, "en")
        src = "en"
    direction = "en-indic" if src == "en" else "indic-en"
    tok, mdl = _load(direction)
    s, t = LANG_CODES[src], LANG_CODES[tgt]
    batch = _pre(sentences, s, t)
    inp = tok(batch, truncation=True, padding="longest", return_tensors="pt").to(device)
    with torch.no_grad():
        out = mdl.generate(**inp, num_beams=5, max_length=256)
    dec = tok.batch_decode(out, skip_special_tokens=True)
    return _post(dec, t)

if __name__ == "__main__":
    sents = ["Plants make food using sunlight.", "This process is called photosynthesis."]
    for lang in ["hi", "bn", "te", "kn"]:
        print(lang, translate(sents, "en", lang))
    print("hi->en", translate(["पौधे सूर्य के प्रकाश से भोजन बनाते हैं।"], "hi", "en"))