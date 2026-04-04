# BuildForce - Construction Manpower Recruiting Platform

## Original Problem Statement
Create an Employment and Job Market app for Construction manpower recruiting (similar to monster.com). Companies subscribe as Hirers; construction talents upload resumes for free. Resumes must be ATS format-compliant.

## User Personas
- **Talents (Job Seekers)**: Free access. Search jobs, build/upload ATS resumes, apply, get AI job matching, set alerts, message hirers, view leaderboard, use templates.
- **Hirers (Employers)**: Subscription tiers. Post jobs, review applications, schedule interviews, view analytics, message talents, manage company profiles.
- **Admin**: Platform management. View dashboard stats, manage users, monitor revenue.

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn UI
- Backend: FastAPI (Python)
- Database: MongoDB
- Auth: JWT + Emergent Google OAuth
- AI: Emergent LLM (Claude Sonnet 4.5 - resume enhancement, deep job matching)
- Payments: Stripe (real test key), PayPal (MOCKED), PayMongo (MOCKED)
- Email: SendFox
- Storage: Emergent Object Storage

## Subscription Tiers
- Basic ($49/mo): 5 job posts, 50 resume views
- Pro ($149/mo): 25 job posts, 200 resume views, featured listings
- Enterprise ($299/mo): Unlimited posts, unlimited views, priority support, dedicated manager

## What's Been Implemented

### Phase 1 (Initial MVP)
- Auth (JWT + Google OAuth)
- Job listing/search/filtering with construction categories
- Resume builder with AI enhancement
- Basic subscription flow
- Landing page, auth pages, dashboards

### Phase 2 (Priority Features)
- Resume file upload (PDF/DOCX) with ATS parsing and scoring
- Resume PDF export/download
- Stripe/PayPal/PayMongo payment checkout
- Company directory and detail pages
- In-app messaging system
- AI job matching algorithm
- Job alerts (CRUD)
- Hirer analytics dashboard
- SendFox email notifications

### Phase 3 (Advanced Features) - Completed April 2026
- Resume Score Leaderboard (anonymized ATS score distribution with percentiles)
- Advanced AI Deep Match (LLM-powered resume-to-job analysis with strengths/gaps/tips)
- Job Recommendation Engine (profile + activity-based smart recommendations)
- Resume Template Library (6 construction-specific ATS-optimized templates)
- Interview Scheduling (video/phone/in-person with CRUD, status management)
- Bulk Resume Upload (up to 5 files with individual ATS scoring)
- Admin Dashboard (platform overview, user management, revenue tracking)
- Mobile-responsive layout optimization

## Key Pages & Routes
- / - Landing page
- /jobs - Job search with filters
- /jobs/:id - Job details
- /companies - Company directory
- /companies/:id - Company profile
- /leaderboard - ATS Score Leaderboard
- /resume-templates - Template library
- /pricing - Subscription plans with payment method selector
- /payment/success - Payment confirmation
- /talent/dashboard - Talent dashboard (7 tabs)
- /talent/resume-builder - Resume builder (supports ?template=)
- /hirer/dashboard - Hirer dashboard (4 tabs)
- /messages - In-app messaging
- /interviews - Interview management
- /admin - Admin dashboard

## Key API Endpoints
- Auth: POST /api/auth/login, /api/auth/register
- Jobs: GET /api/jobs, POST /api/jobs
- Resume: POST /api/resumes, POST /api/resumes/upload, POST /api/resumes/bulk-upload, GET /api/resumes/download-pdf
- Payments: POST /api/payments/checkout, GET /api/payments/status/{id}
- Companies: GET /api/companies, GET /api/companies/{id}
- Messaging: POST /api/messages, GET /api/messages/conversations, GET /api/messages/thread/{id}
- Alerts: POST /api/job-alerts, GET /api/job-alerts
- AI: POST /api/ai/deep-match/{job_id}, GET /api/ai/match-jobs, POST /api/talent/resume/enhance
- Analytics: GET /api/analytics/hirer
- Interviews: POST /api/interviews, GET /api/interviews, PUT /api/interviews/{id}/status
- Recommendations: GET /api/recommendations
- Templates: GET /api/resume-templates, GET /api/resume-templates/{id}
- Leaderboard: GET /api/leaderboard/ats-scores
- Admin: GET /api/admin/dashboard, GET /api/admin/users, PUT /api/admin/users/{id}/status

## DB Collections
users, jobs, applications, resumes, uploaded_resumes, messages, job_alerts, payment_transactions, interviews

## MOCKED Integrations
- PayPal payment checkout (no API keys provided)
- PayMongo payment checkout (no API keys provided)

## Backlog (if needed)
- Real PayPal/PayMongo integration when keys provided
- Push notification system (browser notifications)
- Video interview SDK integration (currently provides meeting link)
- Advanced resume parsing with OCR
- Applicant tracking system (ATS) for hirers
- Multi-language support
