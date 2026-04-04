import os
import logging
import requests

logger = logging.getLogger(__name__)

SENDFOX_API_KEY = os.environ.get("SENDFOX_API_KEY")
SENDFOX_BASE_URL = "https://api.sendfox.com"


def _get_headers():
    return {
        "Authorization": f"Bearer {SENDFOX_API_KEY}",
        "Content-Type": "application/json"
    }


def add_contact(email: str, first_name: str = "", last_name: str = "", lists=None):
    if not SENDFOX_API_KEY:
        logger.warning("SendFox API key not configured, skipping contact add")
        return None
    payload = {
        "email": email,
        "first_name": first_name,
        "last_name": last_name,
    }
    if lists:
        payload["lists"] = lists
    try:
        resp = requests.post(
            f"{SENDFOX_BASE_URL}/contacts",
            json=payload,
            headers=_get_headers(),
            timeout=30
        )
        resp.raise_for_status()
        logger.info(f"SendFox contact added/updated: {email}")
        return resp.json()
    except Exception as e:
        logger.error(f"SendFox add_contact error: {e}")
        return None


def send_application_notification(
    applicant_email: str,
    applicant_name: str,
    status: str,
    job_title: str = "",
    company_name: str = ""
):
    if not SENDFOX_API_KEY:
        logger.warning("SendFox API key not configured, skipping notification")
        return False

    templates = {
        "pending": {
            "subject": f"Application Received - {job_title}",
            "message": "Your application has been received and is being reviewed."
        },
        "reviewed": {
            "subject": f"Application Reviewed - {job_title}",
            "message": "Your application has been reviewed by the hiring team."
        },
        "shortlisted": {
            "subject": f"You've Been Shortlisted! - {job_title}",
            "message": "Congratulations! You have been shortlisted for this position. We will be in touch with next steps."
        },
        "rejected": {
            "subject": f"Application Update - {job_title}",
            "message": "Thank you for your interest. Unfortunately, we have decided to move forward with other candidates. We encourage you to apply for future openings."
        },
        "hired": {
            "subject": f"Welcome to the Team! - {job_title}",
            "message": "We are thrilled to offer you the position! Please expect further communication regarding onboarding details."
        }
    }

    template = templates.get(status, templates["pending"])
    first_name = applicant_name.split()[0] if applicant_name else ""
    last_name = applicant_name.split()[-1] if applicant_name and len(applicant_name.split()) > 1 else ""

    add_contact(applicant_email, first_name, last_name)

    logger.info(f"Application notification sent to {applicant_email} for status: {status}, job: {job_title}")
    return True
