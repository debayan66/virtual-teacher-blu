"""Create an admin account for the local Blu backend.

Usage (from the backend folder):
    .venv/Scripts/python.exe scripts/create_admin.py you@example.com "Your Name"
The script prompts for a password on the terminal (never on the command line
or in code) and stores only the PBKDF2 hash.

Admin is intentionally impossible to self-select during registration.
"""
import getpass
import secrets
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.auth import hash_password, init_auth  # noqa: E402
from app.db import connect, now  # noqa: E402


def main() -> None:
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(2)
    email = sys.argv[1].strip().lower()
    name = sys.argv[2].strip()
    if "@" not in email:
        print("Invalid email address.")
        sys.exit(2)
    password = getpass.getpass("Password (min 8 characters): ")
    if len(password) < 8:
        print("Password must be at least 8 characters.")
        sys.exit(2)
    if password != getpass.getpass("Repeat password: "):
        print("Passwords do not match.")
        sys.exit(2)

    init_auth()
    with connect() as c:
        existing = c.execute("SELECT id, role FROM users WHERE email = ?", (email,)).fetchone()
        if existing:
            if existing["role"] == "admin":
                print(f"{email} is already an admin.")
                return
            c.execute("UPDATE users SET role = 'admin' WHERE id = ?", (existing["id"],))
            print(f"Promoted {email} to admin.")
            return
        user_id = "u_" + secrets.token_hex(8)
        c.execute(
            "INSERT INTO users(id,name,email,password_hash,role,language,phone,created_at) "
            "VALUES(?,?,?,?,?,?,?,?)",
            (user_id, name, email, hash_password(password), "admin", "en", None, now()),
        )
    print(f"Admin account created for {email}.")


if __name__ == "__main__":
    main()
