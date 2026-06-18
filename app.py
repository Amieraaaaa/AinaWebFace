import base64
import os
from flask import Flask, request, jsonify, send_from_directory
from jose import jwt, JWTError
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder=".")

# Supabase JWT secret is base64-encoded — decode it to raw bytes for python-jose
_raw_secret = base64.b64decode(os.environ["SUPABASE_JWT_SECRET"])


def verify_supabase_jwt(authorization: str) -> dict | None:
    """Return decoded JWT payload or None if invalid/missing."""
    if not authorization.startswith("Bearer "):
        return None
    token = authorization[len("Bearer "):].strip()
    try:
        payload = jwt.decode(
            token,
            _raw_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return payload
    except JWTError:
        return None


# ── Static pages ─────────────────────────────────────────────────────────────

@app.get("/")
def index():
    return send_from_directory(".", "login.html")


@app.get("/login.html")
def login_page():
    return send_from_directory(".", "login.html")


@app.get("/profile.html")
def profile_page():
    return send_from_directory(".", "profile.html")


@app.get("/supabase-config.js")
def supabase_config():
    return send_from_directory(".", "supabase-config.js",
                               mimetype="application/javascript")


@app.get("/results.html")
def results_page():
    return send_from_directory(".", "results.html")


@app.get("/history.html")
def history_page():
    return send_from_directory(".", "history.html")


# ── Protected API ─────────────────────────────────────────────────────────────

@app.get("/api/me")
def me():
    """
    Verifies the Supabase JWT sent by the browser and returns the decoded claims.
    This is a demonstration of how FastAPI's security.py would protect routes.
    """
    payload = verify_supabase_jwt(request.headers.get("Authorization", ""))
    if payload is None:
        return jsonify({"error": "Unauthorised — invalid or missing token"}), 401

    return jsonify({
        "user": {
            "sub":   payload.get("sub"),       # Supabase user UUID
            "email": payload.get("email"),
            "role":  payload.get("role"),       # 'authenticated'
        }
    }), 200


if __name__ == "__main__":
    app.run(debug=True, port=5000)
