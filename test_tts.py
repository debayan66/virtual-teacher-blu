from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

base = Path(__file__).resolve().parent

kokoro = Kokoro(
    str(base / "models" / "kokoro-v1.0.onnx"),
    str(base / "models" / "voices-v1.0.bin"),
)

samples, sample_rate = kokoro.create(
    "नमस्ते। आज हम प्रकाश संश्लेषण के बारे में सीखेंगे।",
    voice="hf_alpha",
    speed=np.float32(1.0),
    lang="hi",
)

output = base / "test_hindi.wav"
sf.write(str(output), samples, sample_rate)
print(f"Saved: {output}")