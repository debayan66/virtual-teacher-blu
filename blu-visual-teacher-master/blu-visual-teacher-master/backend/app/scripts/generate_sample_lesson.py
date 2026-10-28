"""Initialize the local database and persist the bundled firewall lesson."""
from app.main import startup
from app.sample import firewall_lesson
from app.db import save_lesson
startup()
sample=firewall_lesson()
save_lesson(sample)
print("Bundled sample lesson saved: "+sample["id"])
print("To export it, install FFmpeg and use the studio export action.")
