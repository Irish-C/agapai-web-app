from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse
from src.utils.input_sanitization import get_sanitized_json
import smtplib
from email.message import EmailMessage
import os

router = APIRouter()

SUPPORT_EMAIL = os.environ.get("SUPPORT_EMAIL", "w4makeithappen@gmail.com")
SMTP_SERVER = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", 587))
SMTP_USER = os.environ.get("SMTP_USER", SUPPORT_EMAIL)
SMTP_PASS = os.environ.get("SMTP_PASS", "")

@router.post("/contact")
async def contact_support(request: Request):
    data = await get_sanitized_json(request)
    name = data.get("name")
    email = data.get("email")
    message = data.get("message")
    if not name or not email or not message:
        return JSONResponse({"status": "error", "message": "All fields are required."}, status_code=400)
    try:
        msg = EmailMessage()
        msg["Subject"] = f"Support Request from {name}"
        msg["From"] = email
        msg["To"] = SUPPORT_EMAIL
        msg.set_content(f"Name: {name}\nEmail: {email}\n\nMessage:\n{message}")
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
        return {"status": "success", "message": "Message sent successfully."}
    except Exception as e:
        return JSONResponse({"status": "error", "message": f"Failed to send message: {str(e)}"}, status_code=500)
