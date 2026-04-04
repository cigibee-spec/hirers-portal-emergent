# BuildForce - Construction Manpower Recruiting Platform

## Original Problem Statement
Create an Employment and Job Market app for Construction manpower recruiting (similar to monster.com). Companies subscribe as Hirers; construction talents upload resumes for free. Resumes must be ATS format-compliant.

## User Personas
- **Talents (Job Seekers)**: Free access. Search jobs, build/upload ATS resumes, apply, get AI job matching, set alerts, message hirers, view leaderboard, use templates.
- **Hirers (Employers)**: Subscription tiers. Post jobs, review applications, schedule interviews, view analytics, message talents, manage company profiles.
- **Admin**: Platform management. View dashboard stats, manage users, monitor revenue.

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn UI, PWA
- Backend: FastAPI (Python)
- Database: MongoDB
- Auth: JWT + Emergent Google OAuth
- AI: Emergent LLM (Claude Sonnet - resume enhancement, deep job matching)
- Payments: Stripe (real test key), PayPal (MOCKED), PayMongo (MOCKED)
- Email: SendFox
- Storage: Emergent Object Storage

## PWA Features
- manifest.json with app metadata, icons, shortcuts
- Service worker with stale-while-revalidate caching
- Installable on iOS & Android home screens
- Offline indicator when connectivity lost
- Install prompt with dismissal memory (7-day cooldown)
- Mobile bottom navigation (context-aware: public/talent/hirer)
- Safe area support for notched devices
- Touch-optimized targets (44px minimum)
- iOS zoom prevention on input focus (16px font)
- Standalone mode selection disabling

## Subscription Tiers
- Basic ($49/mo): 5 job posts, 50 resume views
- Pro ($149/mo): 25 job posts, 200 resume views, featured listings
- Enterprise ($299/mo): Unlimited posts, unlimited views, priority support

## What's Been Implemented

### Phase 1 (Initial MVP)
- Auth (JWT + Google OAuth), job listing/search/filtering, resume builder with AI enhancement, subscription flow, landing page + dashboards

### Phase 2 (Priority Features)
- Resume file upload with ATS parsing/scoring, PDF export, Stripe/PayPal/PayMongo payments, company directory, in-app messaging, AI job matching, job alerts, hirer analytics, SendFox notifications

### Phase 3 (Advanced Features)
- Resume Score Leaderboard, Advanced AI Deep Match (LLM), Job Recommendations, 6 Resume Templates, Interview Scheduling, Bulk Resume Upload, Admin Dashboard

### Phase 4 (PWA Mobile App) - Completed April 2026
- PWA manifest & service worker with offline caching
- Mobile bottom navigation (context-aware tabs)
- PWA install prompt with smart dismissal
- Offline status indicator
- Mobile-responsive optimization (safe areas, touch targets, iOS zoom fix)
- Landing page "Get the App" section
- Updated footer with all feature links
- Updated mobile hamburger menu with all navigation links

## Key Routes
- / - Landing | /jobs - Job search | /companies - Company directory | /leaderboard - ATS Leaderboard
- /resume-templates - Template library | /pricing - Plans | /payment/success - Confirmation
- /talent/dashboard - Talent hub (7 tabs) | /talent/resume-builder - Builder (?template= supported)
- /hirer/dashboard - Hirer hub (4 tabs) | /messages - Messaging | /interviews - Interview mgmt | /admin - Admin

## MOCKED Integrations
- PayPal, PayMongo payment checkout (no API keys provided)

## Backlog
- Real PayPal/PayMongo integration when keys provided
- Push notification system (browser)
- Video interview SDK integration
- Multi-language support
