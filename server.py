#!/usr/bin/env python3
"""VANTA Observatory: static server and a small, dependency-free booking API."""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import re
import secrets
import time
from collections import defaultdict, deque
from datetime import date, datetime, timezone
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT / "public"
DATA = ROOT / "data"
VISITS_FILE = DATA / "visits.json"
HOST = os.environ.get("VANTA_HOST", "127.0.0.1")
PORT = int(os.environ.get("VANTA_PORT", "8002"))
ADMIN_KEY = os.environ.get("VANTA_ADMIN_KEY", "vanta-demo-2026")
MAX_BODY = 16_384
RATE_LIMIT = 8
RATE_WINDOW_SECONDS = 60
EMAIL_PATTERN = re.compile(r"^[^@\s]{1,64}@[^@\s]{1,190}\.[^@\s]{2,24}$")
MISSIONS = {"lunar", "nebula", "deep"}
rate_buckets: dict[str, deque[float]] = defaultdict(deque)


def load_visits() -> list[dict]:
    if not VISITS_FILE.exists():
        return []
    try:
        content = json.loads(VISITS_FILE.read_text(encoding="utf-8"))
        return content if isinstance(content, list) else []
    except (json.JSONDecodeError, OSError):
        return []


def save_visits(visits: list[dict]) -> None:
    DATA.mkdir(exist_ok=True)
    temporary = VISITS_FILE.with_suffix(".tmp")
    temporary.write_text(json.dumps(visits, ensure_ascii=False, indent=2), encoding="utf-8")
    os.replace(temporary, VISITS_FILE)


def normalize_text(value: object, maximum: int) -> str:
    if not isinstance(value, str):
        return ""
    return " ".join(value.strip().split())[:maximum]


def validate(payload: object) -> tuple[dict, dict]:
    if not isinstance(payload, dict):
        return {}, {"request": "Nieprawidłowy format danych."}

    clean = {
        "name": normalize_text(payload.get("name"), 80),
        "email": normalize_text(payload.get("email"), 254).lower(),
        "guests": normalize_text(payload.get("guests"), 2),
        "date": normalize_text(payload.get("date"), 10),
        "mission": normalize_text(payload.get("mission"), 20),
        "message": normalize_text(payload.get("message"), 500),
        "consent": payload.get("consent") is True,
    }
    errors = {}
    if len(clean["name"]) < 2:
        errors["name"] = "Podaj co najmniej 2 znaki."
    if not EMAIL_PATTERN.fullmatch(clean["email"]):
        errors["email"] = "Podaj prawidłowy adres email."
    try:
        guests = int(clean["guests"])
        if guests < 1 or guests > 6:
            raise ValueError
    except ValueError:
        errors["guests"] = "Liczba osób musi mieścić się od 1 do 6."
    try:
        requested_date = date.fromisoformat(clean["date"])
        if requested_date <= date.today():
            errors["date"] = "Wybierz datę późniejszą niż dzisiaj."
    except ValueError:
        errors["date"] = "Podaj prawidłową datę."
    if clean["mission"] not in MISSIONS:
        errors["mission"] = "Wybierz dostępną ekspedycję."
    if not clean["consent"]:
        errors["consent"] = "Zgoda na kontakt jest wymagana."
    return clean, errors


class VantaHandler(SimpleHTTPRequestHandler):
    server_version = "Vanta/1.0"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PUBLIC), **kwargs)

    def end_headers(self) -> None:
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        self.send_header(
            "Content-Security-Policy",
            "default-src 'self'; script-src 'self'; style-src 'self'; "
            "img-src 'self' data:; connect-src 'self'; font-src 'self'; "
            "object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
        )
        self.send_header("Cross-Origin-Resource-Policy", "same-origin")
        super().end_headers()

    def log_message(self, message: str, *args: object) -> None:
        print(f"[{self.log_date_time_string()}] {self.address_string()} {message % args}")

    @property
    def client_ip(self) -> str:
        return self.client_address[0]

    def json_response(self, status: HTTPStatus, payload: dict) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def rate_limited(self) -> bool:
        now = time.monotonic()
        bucket = rate_buckets[self.client_ip]
        while bucket and now - bucket[0] > RATE_WINDOW_SECONDS:
            bucket.popleft()
        if len(bucket) >= RATE_LIMIT:
            return True
        bucket.append(now)
        return False

    def read_json(self) -> object:
        content_type = self.headers.get("Content-Type", "")
        if "application/json" not in content_type:
            raise ValueError("Content-Type musi być application/json.")
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError as error:
            raise ValueError("Nieprawidłowy rozmiar żądania.") from error
        if length <= 0 or length > MAX_BODY:
            raise ValueError("Nieprawidłowy rozmiar żądania.")
        try:
            return json.loads(self.rfile.read(length))
        except (json.JSONDecodeError, UnicodeDecodeError) as error:
            raise ValueError("Nieprawidłowy JSON.") from error

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path == "/api/health":
            self.json_response(HTTPStatus.OK, {"status": "ok", "service": "vanta-observatory"})
            return
        if path == "/api/visits":
            self.handle_admin_visits()
            return
        if path.startswith("/api/"):
            self.json_response(HTTPStatus.NOT_FOUND, {"error": "Nie znaleziono endpointu."})
            return
        super().do_GET()

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        if path != "/api/visits":
            self.json_response(HTTPStatus.NOT_FOUND, {"error": "Nie znaleziono endpointu."})
            return
        if self.rate_limited():
            self.json_response(
                HTTPStatus.TOO_MANY_REQUESTS,
                {"error": "Zbyt wiele prób. Spróbuj ponownie za minutę."},
            )
            return
        try:
            payload = self.read_json()
        except ValueError as error:
            self.json_response(HTTPStatus.BAD_REQUEST, {"error": str(error)})
            return
        clean, errors = validate(payload)
        if errors:
            self.json_response(
                HTTPStatus.UNPROCESSABLE_ENTITY,
                {"error": "Popraw oznaczone pola.", "fields": errors},
            )
            return

        visits = load_visits()
        identifier = f"VX-{secrets.token_hex(3).upper()}"
        visits.append(
            {
                "id": identifier,
                **clean,
                "submitted_at": datetime.now(timezone.utc).isoformat(),
                "source_hash": hashlib.sha256(self.client_ip.encode()).hexdigest()[:12],
                "status": "new",
            }
        )
        save_visits(visits)
        self.json_response(HTTPStatus.CREATED, {"ok": True, "id": identifier})

    def handle_admin_visits(self) -> None:
        supplied_key = self.headers.get("X-Admin-Key", "")
        if not hmac.compare_digest(supplied_key, ADMIN_KEY):
            self.json_response(HTTPStatus.UNAUTHORIZED, {"error": "Brak dostępu."})
            return
        visits = load_visits()
        self.json_response(HTTPStatus.OK, {"count": len(visits), "visits": visits})


def run() -> None:
    DATA.mkdir(exist_ok=True)
    server = ThreadingHTTPServer((HOST, PORT), VantaHandler)
    print(f"VANTA Observatory działa na http://{HOST}:{PORT}")
    print("Zatrzymaj serwer skrótem Ctrl+C.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nZamykanie VANTA Observatory.")
    finally:
        server.server_close()


if __name__ == "__main__":
    run()
