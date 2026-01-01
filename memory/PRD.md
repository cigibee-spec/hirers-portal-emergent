# BuildForce - Construction Job Market Platform PRD

## Original Problem Statement
Create an Employment and Job Market app for Construction manpower recruiting that has similar features to monster.com, where companies can subscribe as Hirers and construction talents can upload their resume for free. Resumes should be ATS format-compliant.

## User Choices
1. **Subscription Plans**: Multiple tiers - Basic ($49/mo), Pro ($149/mo), Enterprise ($299/mo)
2. **Resume Builder**: Both form-based and AI-powered with OpenAI GPT integration
3. **Job Categories**: Predefined construction categories (Electrician, Plumber, Carpenter, Mason, Heavy Equipment Operator, Site Supervisor, etc.)
4. **Features**: All key features - Job search & filtering, Company profiles, Resume parsing/matching
5. **Authentication**: Both JWT-based custom auth AND Emergent-managed Google social login

## User Personas

### 1. Construction Talent (Job Seeker)
- Free account
- Can create ATS-compliant resumes with AI enhancement
- Search and apply to jobs
- Save favorite jobs
- Track application status

### 2. Hirer (Employer/Company)
- Subscription required to post jobs
- Post and manage job listings
- View applicant resumes
- Track applications and update status
- Company profile management

## Core Requirements

### Authentication & Users
- [x] JWT-based email/password authentication
- [x] Google OAuth via Emergent Auth
- [x] Two user types: Talent and Hirer
- [x] Profile management for both types
- [x] Account type switching

### Job Management
- [x] Job posting with full details (title, description, category, location, salary, skills, benefits)
- [x] Job search with filters (category, location, experience level, employment type)
- [x] Job detail pages
- [x] Application tracking
- [x] Job saving for talents

### Resume Builder
- [x] Form-based resume creation
- [x] AI enhancement for summary and skills (OpenAI GPT-5.2)
- [x] ATS-compliant format
- [x] Sections: Personal, Summary, Experience, Education, Skills, Certifications, Languages

### Subscriptions
- [x] Three tiers: Basic, Pro, Enterprise
- [x] Job posting limits based on plan
- [x] Resume view limits based on plan
- [x] Subscription activation and management

## What's Been Implemented (January 2026)

### Backend (FastAPI + MongoDB)
- User registration, login, logout
- Google OAuth session handling
- Profile management (talent & hirer)
- Job CRUD operations
- Application submission and status management
- Resume CRUD with AI enhancement endpoint
- Subscription management
- Saved jobs functionality
- Categories and filter endpoints

### Frontend (React + Tailwind + Shadcn)
- Landing page with hero, stats, categories, testimonials
- Login/Register pages with email and Google OAuth
- Jobs page with search and advanced filtering
- Job detail page with apply functionality
- Talent Dashboard (profile, applications, saved jobs)
- Hirer Dashboard (jobs, applications, company profile)
- Resume Builder with 5 tabs and AI enhancement
- Pricing page with 3 subscription tiers

### Design System
- Industrial Precision theme (Safety Orange + Blueprint Navy)
- Manrope + IBM Plex Sans typography
- Sharp corners, technical borders
- Mobile responsive

## Prioritized Backlog

### P0 - Critical (Done)
- [x] User authentication (JWT + Google OAuth)
- [x] Job listing and search
- [x] Resume builder
- [x] Subscription system
- [x] Application submission

### P1 - High Priority (Next)
- [ ] Email notifications for applications
- [ ] Resume PDF export/download
- [ ] Advanced job matching algorithm
- [ ] Employer branding customization

### P2 - Medium Priority
- [ ] Job alerts and notifications
- [ ] Application analytics for employers
- [ ] Bulk resume upload/parsing
- [ ] Interview scheduling integration

### P3 - Future Enhancements
- [ ] Mobile app (React Native)
- [ ] Background check integration
- [ ] Skills assessment tests
- [ ] Video interview feature
- [ ] API for third-party integrations

## Tech Stack
- **Backend**: FastAPI, MongoDB (Motor), Python 3.11
- **Frontend**: React 19, Tailwind CSS, Shadcn UI
- **AI**: OpenAI GPT-5.2 via Emergent Integrations
- **Auth**: JWT + Emergent Google OAuth
- **Infrastructure**: Kubernetes, Nginx

## Next Action Items
1. Add email notifications for new applications
2. Implement resume PDF download feature
3. Build job matching algorithm based on skills
4. Add employer analytics dashboard
