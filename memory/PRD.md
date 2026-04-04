# BuildForce - Construction Manpower Recruiting Platform

## Original Problem Statement
Create an Employment and Job Market app for Construction manpower recruiting (similar to monster.com). Companies subscribe as Hirers; construction talents upload resumes for free. Resumes must be ATS format-compliant.

## User Personas
- **Talents (Job Seekers)**: Free access. Search jobs, build/upload ATS resumes, apply, get AI job matching, set alerts, message hirers.
- **Hirers (Employers)**: Subscription tiers. Post jobs, review applications, view analytics, message talents, manage company profiles.

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn UI
- Backend: FastAPI (Python)
- Database: MongoDB
- Auth: JWT + Emergent Google OAuth
- AI: Emergent LLM (resume enhancement, job matching)
- Payments: Stripe (real), PayPal (MOCKED), PayMongo (MOCKED)
- Email: SendFox
- Storage: Emergent Object Storage

## Core Requirements
1. Two user types: Talents (free) & Hirers (subscription tiers)
2. ATS-compliant resume builder with AI suggestions
3. Job search with filtering (category, location, salary, experience)
4. Construction-specific categories
5. Payment integration: Stripe + PayPal + PayMongo
6. Email notifications via SendFox
7. Company profiles and employer branding
8. In-app messaging
9. AI job matching
10. Job alerts
11. Hirer analytics

## Subscription Tiers
- Basic ($49/mo): 5 job posts, 50 resume views
- Pro ($149/mo): 15 job posts, 200 resume views, featured listings
- Enterprise ($299/mo): Unlimited posts, unlimited views, priority support, dedicated manager

## What's Been Implemented

### Phase 1 (Initial MVP) - Completed
- Auth (JWT + Google OAuth)
- Job listing/search/filtering
- Resume builder with AI enhancement
- Basic subscription flow
- Landing page, auth pages, dashboards

### Phase 2 (Current Iteration) - Completed April 2026
- Resume file upload (PDF/DOCX) with ATS parsing and scoring
- Resume PDF export/download
- Stripe payment checkout (real test key)
- PayPal payment checkout (MOCKED)
- PayMongo payment checkout (MOCKED)
- Company directory and detail pages
- In-app messaging system
- AI job matching algorithm
- Job alerts (CRUD)
- Hirer analytics dashboard
- SendFox email notifications on application status changes

## Key API Endpoints
- Auth: POST /api/auth/login, /api/auth/register
- Jobs: GET /api/jobs, POST /api/jobs
- Resume: GET /api/talent/resume, POST /api/talent/resume, POST /api/resumes/upload, GET /api/resumes/download-pdf
- Payments: POST /api/payments/checkout, GET /api/payments/status/{session_id}, POST /api/webhook/stripe
- Companies: GET /api/companies, GET /api/companies/{user_id}, GET /api/companies/{user_id}/jobs
- Messaging: POST /api/messages, GET /api/messages/inbox, GET /api/messages/conversations, GET /api/messages/thread/{partner_id}
- Alerts: POST /api/job-alerts, GET /api/job-alerts, DELETE /api/job-alerts/{alert_id}
- AI: GET /api/ai/match-jobs, POST /api/talent/resume/enhance
- Analytics: GET /api/analytics/hirer

## DB Collections
- users, jobs, applications, resumes, uploaded_resumes, messages, job_alerts, payment_transactions

## Prioritized Backlog
### P0 - Done
All features from priority 1-3 are implemented.

### P1 - Next
- Real PayPal integration (requires API keys from user)
- Real PayMongo integration (requires API keys from user)
- Interview scheduling feature
- Bulk resume upload/parsing

### P2 - Future
- Advanced AI matching with LLM-based analysis
- Push notifications
- Job recommendation engine
- Resume template library
- Mobile-responsive optimization pass
- Admin dashboard for platform management
- Application tracking system (ATS) for hirers
- Video interview integration
