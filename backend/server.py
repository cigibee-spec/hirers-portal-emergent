from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response, Request, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import httpx
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'buildforce_secret')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Create the main app
app = FastAPI(title="BuildForce API", version="1.0.0")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ========================= MODELS =========================

# Construction Job Categories
JOB_CATEGORIES = [
    "Electrician", "Plumber", "Carpenter", "Mason", "Heavy Equipment Operator",
    "Site Supervisor", "Project Manager", "Welder", "HVAC Technician", "Painter",
    "Roofer", "Concrete Worker", "Steel Worker", "Crane Operator", "Safety Officer",
    "Civil Engineer", "Architect", "Surveyor", "Foreman", "Laborer"
]

EXPERIENCE_LEVELS = ["Entry Level", "Junior (1-3 years)", "Mid-Level (3-5 years)", "Senior (5-10 years)", "Expert (10+ years)"]
EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Temporary", "Freelance"]

# User Models
class UserBase(BaseModel):
    email: EmailStr
    name: str
    user_type: str = Field(..., pattern="^(talent|hirer)$")

class TalentProfile(BaseModel):
    phone: Optional[str] = None
    location: Optional[str] = None
    categories: List[str] = []
    experience_level: Optional[str] = None
    skills: List[str] = []
    bio: Optional[str] = None
    availability: Optional[str] = "Available"
    expected_salary: Optional[str] = None
    resume_id: Optional[str] = None

class HirerProfile(BaseModel):
    company_name: Optional[str] = None
    company_description: Optional[str] = None
    company_website: Optional[str] = None
    company_size: Optional[str] = None
    company_logo: Optional[str] = None
    industry: Optional[str] = "Construction"
    location: Optional[str] = None
    phone: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    user_type: str = Field(..., pattern="^(talent|hirer)$")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    user_type: str
    picture: Optional[str] = None
    talent_profile: Optional[TalentProfile] = None
    hirer_profile: Optional[HirerProfile] = None
    subscription: Optional[dict] = None
    created_at: str

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

# Job Models
class JobCreate(BaseModel):
    title: str
    description: str
    category: str
    location: str
    employment_type: str
    experience_level: str
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    skills_required: List[str] = []
    benefits: List[str] = []
    application_deadline: Optional[str] = None

class JobResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    job_id: str
    title: str
    description: str
    category: str
    location: str
    employment_type: str
    experience_level: str
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    skills_required: List[str] = []
    benefits: List[str] = []
    application_deadline: Optional[str] = None
    company_name: str
    company_logo: Optional[str] = None
    hirer_id: str
    status: str
    created_at: str
    applications_count: int = 0

# Application Models
class ApplicationCreate(BaseModel):
    job_id: str
    cover_letter: Optional[str] = None

class ApplicationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    application_id: str
    job_id: str
    talent_id: str
    talent_name: str
    talent_email: str
    cover_letter: Optional[str] = None
    resume_id: Optional[str] = None
    status: str
    created_at: str
    job_title: Optional[str] = None
    company_name: Optional[str] = None

# Resume Models
class ResumeSection(BaseModel):
    title: str
    company: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None
    is_current: bool = False

class Education(BaseModel):
    degree: str
    institution: str
    location: Optional[str] = None
    graduation_year: Optional[str] = None
    field_of_study: Optional[str] = None

class ResumeCreate(BaseModel):
    full_name: str
    email: str
    phone: str
    location: str
    summary: Optional[str] = None
    experience: List[ResumeSection] = []
    education: List[Education] = []
    skills: List[str] = []
    certifications: List[str] = []
    languages: List[str] = []

class ResumeResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    resume_id: str
    user_id: str
    full_name: str
    email: str
    phone: str
    location: str
    summary: Optional[str] = None
    experience: List[ResumeSection] = []
    education: List[Education] = []
    skills: List[str] = []
    certifications: List[str] = []
    languages: List[str] = []
    created_at: str
    updated_at: str

# Subscription Models
SUBSCRIPTION_PLANS = {
    "basic": {"name": "Basic", "price": 49, "job_posts": 5, "resume_views": 50, "features": ["5 Job Posts/month", "50 Resume Views", "Email Support"]},
    "pro": {"name": "Pro", "price": 149, "job_posts": 25, "resume_views": 200, "features": ["25 Job Posts/month", "200 Resume Views", "Priority Support", "Featured Listings"]},
    "enterprise": {"name": "Enterprise", "price": 299, "job_posts": -1, "resume_views": -1, "features": ["Unlimited Job Posts", "Unlimited Resume Views", "Dedicated Account Manager", "API Access", "Custom Branding"]}
}

class SubscriptionCreate(BaseModel):
    plan: str = Field(..., pattern="^(basic|pro|enterprise)$")

class SubscriptionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    subscription_id: str
    user_id: str
    plan: str
    status: str
    job_posts_used: int
    resume_views_used: int
    start_date: str
    end_date: str

# AI Enhancement Models
class AIEnhanceRequest(BaseModel):
    text: str
    section_type: str = Field(..., pattern="^(summary|experience|skills)$")

# ========================= AUTH HELPERS =========================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, user_type: str) -> str:
    payload = {
        "user_id": user_id,
        "user_type": user_type,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request, credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    # Try cookie first, then Authorization header
    token = request.cookies.get("session_token")
    if not token and credentials:
        token = credentials.credentials
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if it's a session token (from Google OAuth)
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if session:
        expires_at = session.get("expires_at")
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Session expired")
        user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
        if user:
            return user
    
    # Try JWT token
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"user_id": payload["user_id"]}, {"_id": 0})
        if user:
            return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        pass
    
    raise HTTPException(status_code=401, detail="Invalid authentication")

# ========================= AUTH ENDPOINTS =========================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "name": user_data.name,
        "user_type": user_data.user_type,
        "picture": None,
        "talent_profile": TalentProfile().model_dump() if user_data.user_type == "talent" else None,
        "hirer_profile": HirerProfile().model_dump() if user_data.user_type == "hirer" else None,
        "subscription": None,
        "created_at": now
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, user_data.user_type)
    user_response = {k: v for k, v in user_doc.items() if k != "password"}
    
    return {"token": token, "user": UserResponse(**user_response)}

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_token(user["user_id"], user["user_type"])
    user_response = {k: v for k, v in user.items() if k != "password"}
    
    return {"token": token, "user": UserResponse(**user_response)}

@api_router.post("/auth/session")
async def process_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Call Emergent Auth API
    async with httpx.AsyncClient() as http_client:
        auth_response = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if auth_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        auth_data = auth_response.json()
    
    # Check if user exists
    user = await db.users.find_one({"email": auth_data["email"]}, {"_id": 0})
    
    if not user:
        # Create new user (default to talent, they can switch later)
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()
        
        user = {
            "user_id": user_id,
            "email": auth_data["email"],
            "name": auth_data["name"],
            "picture": auth_data.get("picture"),
            "user_type": "talent",
            "talent_profile": TalentProfile().model_dump(),
            "hirer_profile": None,
            "subscription": None,
            "created_at": now
        }
        await db.users.insert_one(user)
    else:
        user_id = user["user_id"]
        # Update picture if changed
        if auth_data.get("picture") and user.get("picture") != auth_data["picture"]:
            await db.users.update_one({"user_id": user_id}, {"$set": {"picture": auth_data["picture"]}})
            user["picture"] = auth_data["picture"]
    
    # Store session
    session_token = auth_data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.update_one(
        {"user_id": user_id},
        {"$set": {
            "session_token": session_token,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    return UserResponse(**{k: v for k, v in user.items() if k != "password"})

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(**{k: v for k, v in current_user.items() if k != "password"})

@api_router.post("/auth/logout")
async def logout(response: Response, current_user: dict = Depends(get_current_user)):
    await db.user_sessions.delete_one({"user_id": current_user["user_id"]})
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.put("/auth/switch-user-type")
async def switch_user_type(current_user: dict = Depends(get_current_user)):
    new_type = "hirer" if current_user["user_type"] == "talent" else "talent"
    
    update_data = {"user_type": new_type}
    if new_type == "talent" and not current_user.get("talent_profile"):
        update_data["talent_profile"] = TalentProfile().model_dump()
    elif new_type == "hirer" and not current_user.get("hirer_profile"):
        update_data["hirer_profile"] = HirerProfile().model_dump()
    
    await db.users.update_one({"user_id": current_user["user_id"]}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    return UserResponse(**{k: v for k, v in updated_user.items() if k != "password"})

# ========================= PROFILE ENDPOINTS =========================

@api_router.put("/profile/talent", response_model=UserResponse)
async def update_talent_profile(profile: TalentProfile, current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "talent":
        raise HTTPException(status_code=403, detail="Only talents can update talent profile")
    
    await db.users.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": {"talent_profile": profile.model_dump()}}
    )
    
    updated_user = await db.users.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    return UserResponse(**{k: v for k, v in updated_user.items() if k != "password"})

@api_router.put("/profile/hirer", response_model=UserResponse)
async def update_hirer_profile(profile: HirerProfile, current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "hirer":
        raise HTTPException(status_code=403, detail="Only hirers can update company profile")
    
    await db.users.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": {"hirer_profile": profile.model_dump()}}
    )
    
    updated_user = await db.users.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    return UserResponse(**{k: v for k, v in updated_user.items() if k != "password"})

# ========================= JOB ENDPOINTS =========================

@api_router.post("/jobs", response_model=JobResponse)
async def create_job(job_data: JobCreate, current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "hirer":
        raise HTTPException(status_code=403, detail="Only hirers can post jobs")
    
    # Check subscription
    subscription = current_user.get("subscription")
    if not subscription or subscription.get("status") != "active":
        raise HTTPException(status_code=403, detail="Active subscription required to post jobs")
    
    plan = SUBSCRIPTION_PLANS.get(subscription.get("plan", ""), {})
    job_limit = plan.get("job_posts", 0)
    if job_limit != -1 and subscription.get("job_posts_used", 0) >= job_limit:
        raise HTTPException(status_code=403, detail="Job post limit reached. Please upgrade your plan.")
    
    job_id = f"job_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    hirer_profile = current_user.get("hirer_profile") or {}
    
    job_doc = {
        "job_id": job_id,
        **job_data.model_dump(),
        "company_name": hirer_profile.get("company_name") or current_user["name"],
        "company_logo": hirer_profile.get("company_logo"),
        "hirer_id": current_user["user_id"],
        "status": "active",
        "created_at": now,
        "applications_count": 0
    }
    
    await db.jobs.insert_one(job_doc)
    
    # Update subscription usage
    await db.users.update_one(
        {"user_id": current_user["user_id"]},
        {"$inc": {"subscription.job_posts_used": 1}}
    )
    
    return JobResponse(**job_doc)

@api_router.get("/jobs", response_model=List[JobResponse])
async def list_jobs(
    category: Optional[str] = None,
    location: Optional[str] = None,
    experience_level: Optional[str] = None,
    employment_type: Optional[str] = None,
    salary_min: Optional[int] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    query = {"status": "active"}
    
    if category:
        query["category"] = category
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    if experience_level:
        query["experience_level"] = experience_level
    if employment_type:
        query["employment_type"] = employment_type
    if salary_min:
        query["salary_max"] = {"$gte": salary_min}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"company_name": {"$regex": search, "$options": "i"}}
        ]
    
    skip = (page - 1) * limit
    jobs = await db.jobs.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return [JobResponse(**job) for job in jobs]

@api_router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    job = await db.jobs.find_one({"job_id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobResponse(**job)

@api_router.get("/jobs/hirer/my-jobs", response_model=List[JobResponse])
async def get_my_jobs(current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "hirer":
        raise HTTPException(status_code=403, detail="Only hirers can view their posted jobs")
    
    jobs = await db.jobs.find({"hirer_id": current_user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [JobResponse(**job) for job in jobs]

@api_router.put("/jobs/{job_id}", response_model=JobResponse)
async def update_job(job_id: str, job_data: JobCreate, current_user: dict = Depends(get_current_user)):
    job = await db.jobs.find_one({"job_id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job["hirer_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to update this job")
    
    await db.jobs.update_one({"job_id": job_id}, {"$set": job_data.model_dump()})
    updated_job = await db.jobs.find_one({"job_id": job_id}, {"_id": 0})
    return JobResponse(**updated_job)

@api_router.delete("/jobs/{job_id}")
async def delete_job(job_id: str, current_user: dict = Depends(get_current_user)):
    job = await db.jobs.find_one({"job_id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job["hirer_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this job")
    
    await db.jobs.update_one({"job_id": job_id}, {"$set": {"status": "closed"}})
    return {"message": "Job closed successfully"}

# ========================= APPLICATION ENDPOINTS =========================

@api_router.post("/applications", response_model=ApplicationResponse)
async def apply_to_job(application: ApplicationCreate, current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "talent":
        raise HTTPException(status_code=403, detail="Only talents can apply to jobs")
    
    # Check if already applied
    existing = await db.applications.find_one({
        "job_id": application.job_id,
        "talent_id": current_user["user_id"]
    }, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Already applied to this job")
    
    job = await db.jobs.find_one({"job_id": application.job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Get resume if exists
    resume = await db.resumes.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    
    application_id = f"app_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    app_doc = {
        "application_id": application_id,
        "job_id": application.job_id,
        "talent_id": current_user["user_id"],
        "talent_name": current_user["name"],
        "talent_email": current_user["email"],
        "cover_letter": application.cover_letter,
        "resume_id": resume["resume_id"] if resume else None,
        "status": "pending",
        "created_at": now,
        "job_title": job["title"],
        "company_name": job["company_name"]
    }
    
    await db.applications.insert_one(app_doc)
    
    # Update job applications count
    await db.jobs.update_one({"job_id": application.job_id}, {"$inc": {"applications_count": 1}})
    
    return ApplicationResponse(**app_doc)

@api_router.get("/applications/my-applications", response_model=List[ApplicationResponse])
async def get_my_applications(current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "talent":
        raise HTTPException(status_code=403, detail="Only talents can view their applications")
    
    applications = await db.applications.find(
        {"talent_id": current_user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return [ApplicationResponse(**app) for app in applications]

@api_router.get("/applications/job/{job_id}", response_model=List[ApplicationResponse])
async def get_job_applications(job_id: str, current_user: dict = Depends(get_current_user)):
    job = await db.jobs.find_one({"job_id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job["hirer_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to view applications")
    
    applications = await db.applications.find({"job_id": job_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [ApplicationResponse(**app) for app in applications]

@api_router.put("/applications/{application_id}/status")
async def update_application_status(
    application_id: str,
    status: str = Query(..., pattern="^(pending|reviewed|shortlisted|rejected|hired)$"),
    current_user: dict = Depends(get_current_user)
):
    application = await db.applications.find_one({"application_id": application_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    job = await db.jobs.find_one({"job_id": application["job_id"]}, {"_id": 0})
    if job["hirer_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.applications.update_one({"application_id": application_id}, {"$set": {"status": status}})
    return {"message": "Status updated"}

# ========================= RESUME ENDPOINTS =========================

@api_router.post("/resumes", response_model=ResumeResponse)
async def create_resume(resume_data: ResumeCreate, current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "talent":
        raise HTTPException(status_code=403, detail="Only talents can create resumes")
    
    # Check if resume exists
    existing = await db.resumes.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    
    now = datetime.now(timezone.utc).isoformat()
    
    if existing:
        # Update existing resume
        await db.resumes.update_one(
            {"user_id": current_user["user_id"]},
            {"$set": {**resume_data.model_dump(), "updated_at": now}}
        )
        resume = await db.resumes.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    else:
        # Create new resume
        resume_id = f"resume_{uuid.uuid4().hex[:12]}"
        resume = {
            "resume_id": resume_id,
            "user_id": current_user["user_id"],
            **resume_data.model_dump(),
            "created_at": now,
            "updated_at": now
        }
        await db.resumes.insert_one(resume)
        
        # Update user profile with resume_id
        await db.users.update_one(
            {"user_id": current_user["user_id"]},
            {"$set": {"talent_profile.resume_id": resume_id}}
        )
    
    return ResumeResponse(**resume)

@api_router.get("/resumes/my-resume", response_model=Optional[ResumeResponse])
async def get_my_resume(current_user: dict = Depends(get_current_user)):
    resume = await db.resumes.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    if not resume:
        return None
    return ResumeResponse(**resume)

@api_router.get("/resumes/{resume_id}", response_model=ResumeResponse)
async def get_resume(resume_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "hirer":
        raise HTTPException(status_code=403, detail="Only hirers can view resumes")
    
    # Check subscription for resume views
    subscription = current_user.get("subscription")
    if not subscription or subscription.get("status") != "active":
        raise HTTPException(status_code=403, detail="Active subscription required to view resumes")
    
    plan = SUBSCRIPTION_PLANS.get(subscription.get("plan", ""), {})
    view_limit = plan.get("resume_views", 0)
    if view_limit != -1 and subscription.get("resume_views_used", 0) >= view_limit:
        raise HTTPException(status_code=403, detail="Resume view limit reached. Please upgrade your plan.")
    
    resume = await db.resumes.find_one({"resume_id": resume_id}, {"_id": 0})
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    # Update view count
    await db.users.update_one(
        {"user_id": current_user["user_id"]},
        {"$inc": {"subscription.resume_views_used": 1}}
    )
    
    return ResumeResponse(**resume)

# ========================= SUBSCRIPTION ENDPOINTS =========================

@api_router.get("/subscriptions/plans")
async def get_subscription_plans():
    return SUBSCRIPTION_PLANS

@api_router.post("/subscriptions", response_model=SubscriptionResponse)
async def create_subscription(sub_data: SubscriptionCreate, current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "hirer":
        raise HTTPException(status_code=403, detail="Only hirers can subscribe")
    
    subscription_id = f"sub_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    end_date = now + timedelta(days=30)
    
    subscription = {
        "subscription_id": subscription_id,
        "user_id": current_user["user_id"],
        "plan": sub_data.plan,
        "status": "active",
        "job_posts_used": 0,
        "resume_views_used": 0,
        "start_date": now.isoformat(),
        "end_date": end_date.isoformat()
    }
    
    await db.users.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": {"subscription": subscription}}
    )
    
    return SubscriptionResponse(**subscription)

@api_router.get("/subscriptions/my-subscription", response_model=Optional[SubscriptionResponse])
async def get_my_subscription(current_user: dict = Depends(get_current_user)):
    subscription = current_user.get("subscription")
    if not subscription:
        return None
    return SubscriptionResponse(**subscription)

# ========================= AI ENHANCEMENT ENDPOINTS =========================

@api_router.post("/ai/enhance-resume")
async def enhance_resume_text(request: AIEnhanceRequest, current_user: dict = Depends(get_current_user)):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    prompts = {
        "summary": "You are an expert ATS resume writer for the construction industry. Improve this professional summary to be more impactful, keyword-rich for ATS systems, and highlight construction-relevant skills. Keep it concise (3-4 sentences). Only return the improved text, no explanations.",
        "experience": "You are an expert ATS resume writer for the construction industry. Improve this job experience description to be more impactful with action verbs, quantifiable achievements, and construction-industry keywords for ATS optimization. Keep the same format. Only return the improved text, no explanations.",
        "skills": "You are an expert ATS resume writer for the construction industry. Given these skills, suggest additional relevant construction industry skills and certifications that would improve ATS matching. Return as a comma-separated list. Only return the skills, no explanations."
    }
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"resume_{current_user['user_id']}_{uuid.uuid4().hex[:8]}",
            system_message=prompts.get(request.section_type, prompts["summary"])
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text=request.text)
        response = await chat.send_message(user_message)
        
        return {"enhanced_text": response, "original_text": request.text}
    except Exception as e:
        logger.error(f"AI enhancement error: {e}")
        raise HTTPException(status_code=500, detail="AI enhancement failed")

# ========================= SAVED JOBS ENDPOINTS =========================

@api_router.post("/saved-jobs/{job_id}")
async def save_job(job_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "talent":
        raise HTTPException(status_code=403, detail="Only talents can save jobs")
    
    job = await db.jobs.find_one({"job_id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Check if already saved
    existing = await db.saved_jobs.find_one({
        "user_id": current_user["user_id"],
        "job_id": job_id
    }, {"_id": 0})
    
    if existing:
        # Remove from saved
        await db.saved_jobs.delete_one({"user_id": current_user["user_id"], "job_id": job_id})
        return {"saved": False, "message": "Job removed from saved"}
    else:
        # Add to saved
        await db.saved_jobs.insert_one({
            "user_id": current_user["user_id"],
            "job_id": job_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        return {"saved": True, "message": "Job saved"}

@api_router.get("/saved-jobs", response_model=List[JobResponse])
async def get_saved_jobs(current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "talent":
        raise HTTPException(status_code=403, detail="Only talents can view saved jobs")
    
    saved = await db.saved_jobs.find({"user_id": current_user["user_id"]}, {"_id": 0}).to_list(100)
    job_ids = [s["job_id"] for s in saved]
    
    jobs = await db.jobs.find({"job_id": {"$in": job_ids}}, {"_id": 0}).to_list(100)
    return [JobResponse(**job) for job in jobs]

# ========================= UTILITY ENDPOINTS =========================

@api_router.get("/categories")
async def get_categories():
    return {"categories": JOB_CATEGORIES}

@api_router.get("/experience-levels")
async def get_experience_levels():
    return {"levels": EXPERIENCE_LEVELS}

@api_router.get("/employment-types")
async def get_employment_types():
    return {"types": EMPLOYMENT_TYPES}

@api_router.get("/talents/search", response_model=List[UserResponse])
async def search_talents(
    category: Optional[str] = None,
    location: Optional[str] = None,
    experience_level: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user["user_type"] != "hirer":
        raise HTTPException(status_code=403, detail="Only hirers can search talents")
    
    query = {"user_type": "talent"}
    
    if category:
        query["talent_profile.categories"] = category
    if location:
        query["talent_profile.location"] = {"$regex": location, "$options": "i"}
    if experience_level:
        query["talent_profile.experience_level"] = experience_level
    
    talents = await db.users.find(query, {"_id": 0, "password": 0}).limit(50).to_list(50)
    return [UserResponse(**t) for t in talents]

@api_router.get("/")
async def root():
    return {"message": "BuildForce API - Construction Job Market Platform"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
