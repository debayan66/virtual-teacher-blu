import time
from pathlib import Path

import torch
import soundfile as sf
from parler_tts import ParlerTTSForConditionalGeneration
from transformers import AutoTokenizer

base = Path(__file__).resolve().parent
device = "cuda:0" if torch.cuda.is_available() else "cpu"
MODEL_ID = "ai4bharat/indic-parler-tts"

print("Device:", device)
print("Loading model (first run downloads several GB)...")
model = ParlerTTSForConditionalGeneration.from_pretrained(MODEL_ID).to(device)
tok = AutoTokenizer.from_pretrained(MODEL_ID)
desc_tok = AutoTokenizer.from_pretrained(model.config.text_encoder._name_or_path)

tests = {
    "hi": ("Divya",   "नमस्ते। आज हम प्रकाश संश्लेषण के बारे में सीखेंगे।"),
    "bn": ("Aditi",   "নমস্কার, আজ আমরা সালোকসংশ্লেষণ সম্পর্কে শিখব।"),
    "te": ("Lalitha", "నమస్కారం, ఈ రోజు మనం కిరణజన్య సంయోగక్రియ గురించి నేర్చుకుందాం."),
    "kn": ("Anu",     "ನಮಸ್ಕಾರ, ಇಂದು ನಾವು ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆಯ ಬಗ್ಗೆ ಕಲಿಯೋಣ."),
}

for lang, (speaker, text) in tests.items():
    desc = (f"{speaker}'s voice is clear and expressive, moderate speed and pitch, "
            "very clear audio with no background noise.")
    d = desc_tok(desc, return_tensors="pt").to(device)
    p = tok(text, return_tensors="pt").to(device)

    t0 = time.time()
    with torch.no_grad():
        audio = model.generate(
            input_ids=d.input_ids, attention_mask=d.attention_mask,
            prompt_input_ids=p.input_ids, prompt_attention_mask=p.attention_mask)
    wav = audio.cpu().numpy().squeeze()
    out = base / f"test_parler_{lang}.wav"
    sf.write(str(out), wav, model.config.sampling_rate)
    secs = len(wav) / model.config.sampling_rate
    print(f"{lang}: saved {out.name} | {secs:.1f}s audio in {time.time() - t0:.1f}s")