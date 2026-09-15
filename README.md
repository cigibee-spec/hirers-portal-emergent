# BuildForce

A job/hiring portal connecting employers ("hirers") with job seekers, with AI-assisted resume matching.

## Stack

- **Backend**: FastAPI (Python), MongoDB (Motor), JWT auth, Stripe payments
- **Frontend**: React (Create React App + Craco), Tailwind CSS, Radix UI

## Features

- Auth (register/login, session, role switching between hirer and job seeker)
- Job postings, categories, employment types, experience levels
- Applications and status tracking
- AI resume enhancement and job matching (`/ai/*`)
- Messaging between hirers and applicants
- Interview scheduling
- Hirer analytics dashboard and admin panel
- Stripe checkout for payments

## Project structure

```
backend/    FastAPI app (server.py), services (email, storage)
frontend/   React app (src/, components.json, Tailwind config)
tests/      Test suite
```

## Getting started

**Backend**
```bash
cd backend
pip install -r requirements.txt
# configure .env: MONGO_URL, DB_NAME, JWT_SECRET, STRIPE_API_KEY, etc.
uvicorn server:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm start
```
