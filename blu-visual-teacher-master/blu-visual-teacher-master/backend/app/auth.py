"""Authentication and authorization for the local Blu backend.

Design notes
------------
* Passwords are stored only as PBKDF2-HMAC-SHA256 hashes (per-user random
  salt) — never plain text.
* Sessions are random 256-bit tokens kept server-side in SQLite and exposed
  to the browser only as an HttpOnly, SameSite=Lax cookie, so no token is
  ever readable from frontend JavaScript or localStorage.
* Roles are `student` (default) and `admin`. Registration always creates a
  student; admin accounts are created by the CLI tool in scripts/create_admin.py.
* Authorization is enforced here on the server — the frontend never decides.
"""

from __future__ import annotations

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from pydantic import BaseModel, Field

from .db import connect, now

SESSION_COOKIE = "blu_session"
SESSION_DAYS = 14
PBKDF2_ITERATIONS = 310_000


# --------------------------------------------------------------------------- #
# schema
# --------------------------------------------------------------------------- #
def init_auth() -> None:
    with connect() as c:
        c.executescript(
            """
            CREATE TABLE IF NOT EXISTS users(
                id            TEXT PRIMARY KEY,
                name          TEXT NOT NULL,
                email         TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role          TEXT NOT NULL DEFAULT 'student',
                language      TEXT NOT NULL DEFAULT 'en',
                phone         TEXT,
                created_at    TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS sessions(
                token      TEXT PRIMARY KEY,
                user_id    TEXT NOT NULL,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL
            );
            """
        )


# --------------------------------------------------------------------------- #
# passwords
# --------------------------------------------------------------------------- #
def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        scheme, iterations, salt_hex, digest_hex = stored.split("$")
        if scheme != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), bytes.fromhex(salt_hex), int(iterations)
        )
        return hmac.compare_digest(digest.hex(), digest_hex)
    except (ValueError, TypeError):
        return False


# --------------------------------------------------------------------------- #
# request models
# --------------------------------------------------------------------------- #
class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=8, max_length=128)
    language: str = Field(default="en", max_length=16)
    phone: str | None = Field(default=None, max_length=32)


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=128)
    remember: bool = False


class ProfileUpdate(BaseModel):
    language: str | None = Field(default=None, max_length=16)


# --------------------------------------------------------------------------- #
# helpers
# --------------------------------------------------------------------------- #
def _public(row) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "role": row["role"],
        "language": row["language"],
        "phone": row["phone"],
        "createdAt": row["created_at"],
    }


def _normalise_email(email: str) -> str:
    return email.strip().lower()


def _start_session(response: Response, user_id: str, remember: bool) -> None:
    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS)
    with connect() as c:
        c.execute("DELETE FROM sessions WHERE expires_at < ?", (now(),))
        c.execute(
            "INSERT INTO sessions(token,user_id,created_at,expires_at) VALUES(?,?,?,?)",
            (token, user_id, now(), expires.isoformat()),
        )
    kwargs = dict(
        key=SESSION_COOKIE,
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,  # local http backend
        path="/",
    )
    if remember:
        kwargs["max_age"] = SESSION_DAYS * 86400
    response.set_cookie(**kwargs)


def get_current_user(session: str | None = Cookie(default=None, alias=SESSION_COOKIE)) -> dict:
    if not session:
        raise HTTPException(status_code=401, detail="Not signed in")
    with connect() as c:
        row = c.execute(
            "SELECT s.expires_at AS expires_at, u.* FROM sessions s "
            "JOIN users u ON u.id = s.user_id WHERE s.token = ?",
            (session,),
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=401, detail="Session expired")
        if row["expires_at"] < now():
            c.execute("DELETE FROM sessions WHERE token = ?", (session,))
            raise HTTPException(status_code=401, detail="Session expired")
        return _public(row)


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Administrator access required")
    return user


# --------------------------------------------------------------------------- #
# routes
# --------------------------------------------------------------------------- #
router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", status_code=201)
def register(body: RegisterRequest, response: Response):
    email = _normalise_email(body.email)
    if "@" not in email or email.startswith("@") or email.endswith("@"):
        raise HTTPException(status_code=422, detail="Enter a valid email address.")
    with connect() as c:
        if c.execute("SELECT 1 FROM users WHERE email = ?", (email,)).fetchone():
            raise HTTPException(status_code=409, detail="An account with this email already exists.")
        user_id = "u_" + secrets.token_hex(8)
        # Registration always creates a student — the role is never client-selected.
        c.execute(
            "INSERT INTO users(id,name,email,password_hash,role,language,phone,created_at) "
            "VALUES(?,?,?,?,?,?,?,?)",
            (
                user_id,
                body.name.strip(),
                email,
                hash_password(body.password),
                "student",
                body.language,
                body.phone.strip() if body.phone else None,
                now(),
            ),
        )
        row = c.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    _start_session(response, user_id, remember=True)
    return {"user": _public(row)}


@router.post("/login")
def login(body: LoginRequest, response: Response):
    email = _normalise_email(body.email)
    with connect() as c:
        row = c.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    # Same message for unknown email and wrong password — no account enumeration.
    if row is None or not verify_password(body.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    _start_session(response, row["id"], body.remember)
    return {"user": _public(row)}


@router.post("/logout")
def logout(response: Response, session: str | None = Cookie(default=None, alias=SESSION_COOKIE)):
    if session:
        with connect() as c:
            c.execute("DELETE FROM sessions WHERE token = ?", (session,))
    response.delete_cookie(SESSION_COOKIE, path="/")
    return {"ok": True}


@router.get("/me")
def me(user: dict = Depends(get_current_user)):
    return {"user": user}


@router.patch("/me")
def update_me(body: ProfileUpdate, user: dict = Depends(get_current_user)):
    if body.language is not None:
        with connect() as c:
            c.execute("UPDATE users SET language = ? WHERE id = ?", (body.language, user["id"]))
        user["language"] = body.language
    return {"user": user}


@router.post("/forgot-password")
def forgot_password():
    # No mail transport is configured for this local backend; be honest about it.
    raise HTTPException(
        status_code=501,
        detail="Password reset by email is not configured on this local backend. Ask an administrator to reset the account.",
    )
