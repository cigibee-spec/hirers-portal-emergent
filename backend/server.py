from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response, Request, Query, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import io
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import httpx
import requests
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

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
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')
SENDFOX_API_KEY = os.environ.get('SENDFOX_API_KEY')

# Create the main app
app = FastAPI(title="BuildForce API", version="1.0.0")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize storage on startup
@app.on_event("startup")
async def startup_event():
    try:
        from services.storage import init_storage
        init_storage()
        logger.info("Object storage initialized")
    except Exception as e:
        logger.warning(f"Storage init failed (non-critical): {e}")

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

# Payment Models
class PaymentCheckoutRequest(BaseModel):
    plan: str = Field(..., pattern="^(basic|pro|enterprise)$")
    payment_method: str = Field(default="stripe", pattern="^(stripe|paypal|paymongo)$")
    origin_url: str

class PaymentStatusRequest(BaseModel):
    session_id: str

# Message Models
class MessageCreate(BaseModel):
    recipient_id: str
    content: str

class MessageResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    message_id: str
    sender_id: str
    sender_name: str
    recipient_id: str
    content: str
    is_read: bool = False
    created_at: str

# Job Alert Models
class JobAlertCreate(BaseModel):
    categories: List[str] = []
    locations: List[str] = []
    experience_levels: List[str] = []
    keywords: List[str] = []

class JobAlertResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    alert_id: str
    user_id: str
    categories: List[str] = []
    locations: List[str] = []
    experience_levels: List[str] = []
    keywords: List[str] = []
    is_active: bool = True
    created_at: str

# Company Profile Models
class CompanyProfileResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    name: str
    company_name: Optional[str] = None
    company_description: Optional[str] = None
    company_website: Optional[str] = None
    company_size: Optional[str] = None
    company_logo: Optional[str] = None
    industry: Optional[str] = None
    location: Optional[str] = None
    active_jobs_count: int = 0

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

    # Send email notification via SendFox
    try:
        from services.email_service import send_application_notification
        send_application_notification(
            applicant_email=application.get("talent_email", ""),
            applicant_name=application.get("talent_name", ""),
            status=status,
            job_title=application.get("job_title", ""),
            company_name=application.get("company_name", "")
        )
    except Exception as e:
        logger.warning(f"Email notification failed: {e}")

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

# ========================= RESUME UPLOAD & ATS PARSING =========================

@api_router.post("/resumes/upload")
async def upload_resume_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    if current_user["user_type"] != "talent":
        raise HTTPException(status_code=403, detail="Only talents can upload resumes")

    allowed_types = {
        "application/pdf": "pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
        "application/msword": "doc"
    }

    content_type = file.content_type or ""
    file_ext = file.filename.split(".")[-1].lower() if file.filename else ""

    if content_type not in allowed_types and file_ext not in ["pdf", "docx", "doc"]:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are accepted")

    file_data = await file.read()
    if len(file_data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be under 10MB")

    # Upload to storage
    try:
        from services.storage import upload_file
        storage_result = upload_file(
            current_user["user_id"],
            file.filename or f"resume.{file_ext}",
            file_data,
            content_type or "application/octet-stream"
        )
    except Exception as e:
        logger.error(f"Storage upload error: {e}")
        storage_result = {"storage_path": "", "original_filename": file.filename, "size": len(file_data)}

    # Parse resume text
    extracted_text = ""
    try:
        if file_ext == "pdf" or "pdf" in content_type:
            import pdfplumber
            with pdfplumber.open(io.BytesIO(file_data)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        extracted_text += page_text + "\n"
        elif file_ext == "docx" or "wordprocessingml" in content_type:
            from docx import Document
            doc = Document(io.BytesIO(file_data))
            extracted_text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
    except Exception as e:
        logger.error(f"Resume parsing error: {e}")
        extracted_text = ""

    # ATS scoring
    ats_score = 0
    ats_feedback = []
    if extracted_text:
        text_lower = extracted_text.lower()
        checks = [
            (any(w in text_lower for w in ["email", "@", "phone", "contact"]), 15, "Contact information found"),
            (any(w in text_lower for w in ["experience", "work history", "employment"]), 15, "Work experience section found"),
            (any(w in text_lower for w in ["education", "degree", "university", "college"]), 10, "Education section found"),
            (any(w in text_lower for w in ["skills", "competencies", "proficiencies"]), 10, "Skills section found"),
            (any(w in text_lower for w in ["certification", "certified", "license", "osha"]), 10, "Certifications found"),
            (len(extracted_text) > 200, 10, "Sufficient content length"),
            (len(extracted_text) > 500, 5, "Detailed content"),
            (any(w in text_lower for w in ["construction", "building", "site", "safety", "project"]), 10, "Construction industry keywords found"),
            (any(w in text_lower for w in ["managed", "led", "supervised", "implemented", "developed"]), 10, "Action verbs used"),
            (not any(w in text_lower for w in ["photo", "picture", "headshot", "image"]), 5, "No photo reference (ATS-friendly)"),
        ]
        for check, score, feedback in checks:
            if check:
                ats_score += score
                ats_feedback.append({"passed": True, "feedback": feedback, "points": score})
            else:
                ats_feedback.append({"passed": False, "feedback": f"Missing: {feedback}", "points": 0})

    # Store file reference
    file_record = {
        "file_id": f"file_{uuid.uuid4().hex[:12]}",
        "user_id": current_user["user_id"],
        "storage_path": storage_result.get("storage_path", ""),
        "original_filename": file.filename,
        "content_type": content_type,
        "size": len(file_data),
        "extracted_text": extracted_text[:5000],
        "ats_score": ats_score,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.uploaded_resumes.insert_one(file_record)

    return {
        "file_id": file_record["file_id"],
        "filename": file.filename,
        "ats_score": ats_score,
        "ats_feedback": ats_feedback,
        "extracted_text_preview": extracted_text[:500] if extracted_text else "Could not extract text",
        "size": len(file_data)
    }


@api_router.get("/resumes/download-pdf")
async def download_resume_pdf(current_user: dict = Depends(get_current_user)):
    resume = await db.resumes.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    if not resume:
        raise HTTPException(status_code=404, detail="No resume found. Please create one first.")

    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
    from reportlab.lib.units import inch
    from reportlab.lib.colors import HexColor

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch, leftMargin=0.75*inch, rightMargin=0.75*inch)
    styles = getSampleStyleSheet()

    name_style = ParagraphStyle('Name', parent=styles['Title'], fontSize=18, spaceAfter=2, textColor=HexColor('#1a365d'))
    contact_style = ParagraphStyle('Contact', parent=styles['Normal'], fontSize=10, textColor=HexColor('#4a5568'), spaceAfter=8)
    section_style = ParagraphStyle('Section', parent=styles['Heading2'], fontSize=12, textColor=HexColor('#1a365d'), spaceBefore=12, spaceAfter=4, borderWidth=0)
    body_style = ParagraphStyle('Body', parent=styles['Normal'], fontSize=10, leading=14, spaceAfter=4)
    sub_style = ParagraphStyle('Sub', parent=styles['Normal'], fontSize=10, leading=13, textColor=HexColor('#4a5568'))

    story = []
    story.append(Paragraph(resume.get("full_name", ""), name_style))
    contact_parts = [resume.get("email", ""), resume.get("phone", ""), resume.get("location", "")]
    story.append(Paragraph(" | ".join([p for p in contact_parts if p]), contact_style))
    story.append(HRFlowable(width="100%", thickness=1, color=HexColor('#e2e8f0')))

    if resume.get("summary"):
        story.append(Paragraph("PROFESSIONAL SUMMARY", section_style))
        story.append(Paragraph(resume["summary"], body_style))

    if resume.get("experience"):
        story.append(Paragraph("WORK EXPERIENCE", section_style))
        for exp in resume["experience"]:
            title_text = f"<b>{exp.get('title', '')}</b>"
            if exp.get("company"):
                title_text += f" - {exp['company']}"
            story.append(Paragraph(title_text, body_style))
            date_parts = []
            if exp.get("start_date"):
                date_parts.append(exp["start_date"])
            if exp.get("end_date"):
                date_parts.append(exp["end_date"])
            elif exp.get("is_current"):
                date_parts.append("Present")
            if date_parts or exp.get("location"):
                meta = " | ".join(date_parts)
                if exp.get("location"):
                    meta += f" | {exp['location']}"
                story.append(Paragraph(meta, sub_style))
            if exp.get("description"):
                story.append(Paragraph(exp["description"], body_style))
            story.append(Spacer(1, 4))

    if resume.get("education"):
        story.append(Paragraph("EDUCATION", section_style))
        for edu in resume["education"]:
            edu_text = f"<b>{edu.get('degree', '')}</b>"
            if edu.get("field_of_study"):
                edu_text += f" in {edu['field_of_study']}"
            story.append(Paragraph(edu_text, body_style))
            meta_parts = []
            if edu.get("institution"):
                meta_parts.append(edu["institution"])
            if edu.get("graduation_year"):
                meta_parts.append(edu["graduation_year"])
            if meta_parts:
                story.append(Paragraph(" | ".join(meta_parts), sub_style))

    if resume.get("skills"):
        story.append(Paragraph("SKILLS", section_style))
        story.append(Paragraph(", ".join(resume["skills"]), body_style))

    if resume.get("certifications"):
        story.append(Paragraph("CERTIFICATIONS", section_style))
        for cert in resume["certifications"]:
            story.append(Paragraph(f"- {cert}", body_style))

    if resume.get("languages"):
        story.append(Paragraph("LANGUAGES", section_style))
        story.append(Paragraph(", ".join(resume["languages"]), body_style))

    doc.build(story)
    buffer.seek(0)

    filename = f"{resume.get('full_name', 'resume').replace(' ', '_')}_Resume.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


# ========================= PAYMENT ENDPOINTS =========================

@api_router.post("/payments/checkout")
async def create_payment_checkout(
    request: Request,
    checkout_data: PaymentCheckoutRequest,
    current_user: dict = Depends(get_current_user)
):
    if current_user["user_type"] != "hirer":
        raise HTTPException(status_code=403, detail="Only hirers can subscribe")

    plan = SUBSCRIPTION_PLANS.get(checkout_data.plan)
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid plan")

    amount = float(plan["price"])
    origin_url = checkout_data.origin_url
    method = checkout_data.payment_method

    if method == "stripe":
        if not STRIPE_API_KEY:
            raise HTTPException(status_code=500, detail="Stripe not configured")

        host_url = str(request.base_url).rstrip("/")
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

        success_url = f"{origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{origin_url}/pricing"

        metadata = {
            "user_id": current_user["user_id"],
            "plan": checkout_data.plan,
            "payment_method": "stripe"
        }

        checkout_req = CheckoutSessionRequest(
            amount=amount,
            currency="usd",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata
        )
        session = await stripe_checkout.create_checkout_session(checkout_req)

        # Store transaction
        txn = {
            "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
            "user_id": current_user["user_id"],
            "session_id": session.session_id,
            "plan": checkout_data.plan,
            "amount": amount,
            "currency": "usd",
            "payment_method": "stripe",
            "payment_status": "initiated",
            "metadata": metadata,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payment_transactions.insert_one(txn)

        return {"url": session.url, "session_id": session.session_id}

    elif method == "paypal":
        # PayPal - MOCKED (no API keys provided)
        mock_session_id = f"paypal_{uuid.uuid4().hex[:16]}"
        txn = {
            "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
            "user_id": current_user["user_id"],
            "session_id": mock_session_id,
            "plan": checkout_data.plan,
            "amount": amount,
            "currency": "usd",
            "payment_method": "paypal",
            "payment_status": "initiated",
            "metadata": {"user_id": current_user["user_id"], "plan": checkout_data.plan},
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payment_transactions.insert_one(txn)
        # Simulate auto-complete for demo
        await _activate_subscription(current_user["user_id"], checkout_data.plan, mock_session_id)
        return {"url": f"{origin_url}/payment/success?session_id={mock_session_id}", "session_id": mock_session_id, "mocked": True}

    elif method == "paymongo":
        # PayMongo - MOCKED (no API keys provided)
        mock_session_id = f"paymongo_{uuid.uuid4().hex[:16]}"
        txn = {
            "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
            "user_id": current_user["user_id"],
            "session_id": mock_session_id,
            "plan": checkout_data.plan,
            "amount": amount,
            "currency": "usd",
            "payment_method": "paymongo",
            "payment_status": "initiated",
            "metadata": {"user_id": current_user["user_id"], "plan": checkout_data.plan},
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payment_transactions.insert_one(txn)
        await _activate_subscription(current_user["user_id"], checkout_data.plan, mock_session_id)
        return {"url": f"{origin_url}/payment/success?session_id={mock_session_id}", "session_id": mock_session_id, "mocked": True}

    raise HTTPException(status_code=400, detail="Invalid payment method")


async def _activate_subscription(user_id: str, plan: str, session_id: str):
    now = datetime.now(timezone.utc)
    subscription = {
        "subscription_id": f"sub_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "plan": plan,
        "status": "active",
        "job_posts_used": 0,
        "resume_views_used": 0,
        "start_date": now.isoformat(),
        "end_date": (now + timedelta(days=30)).isoformat()
    }
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"subscription": subscription}}
    )
    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {"payment_status": "paid"}}
    )


@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, current_user: dict = Depends(get_current_user)):
    txn = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if txn["payment_method"] == "stripe" and txn["payment_status"] != "paid":
        try:
            host_url = "https://integrations.emergentagent.com"
            webhook_url = f"{host_url}/api/webhook/stripe"
            stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
            status = await stripe_checkout.get_checkout_status(session_id)

            if status.payment_status == "paid":
                plan = txn.get("metadata", {}).get("plan", txn.get("plan", "basic"))
                await _activate_subscription(txn["user_id"], plan, session_id)
                return {"status": "complete", "payment_status": "paid", "plan": plan}
            return {"status": status.status, "payment_status": status.payment_status}
        except Exception as e:
            logger.error(f"Stripe status check error: {e}")
            return {"status": "unknown", "payment_status": txn["payment_status"]}

    return {"status": "complete" if txn["payment_status"] == "paid" else txn["payment_status"], "payment_status": txn["payment_status"], "plan": txn.get("plan")}


@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    try:
        body = await request.body()
        host_url = str(request.base_url).rstrip("/")
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        webhook_response = await stripe_checkout.handle_webhook(body, request.headers.get("Stripe-Signature"))

        if webhook_response.payment_status == "paid":
            session_id = webhook_response.session_id
            metadata = webhook_response.metadata or {}
            user_id = metadata.get("user_id")
            plan = metadata.get("plan", "basic")

            if user_id:
                existing = await db.payment_transactions.find_one({"session_id": session_id, "payment_status": "paid"})
                if not existing:
                    await _activate_subscription(user_id, plan, session_id)

        return {"status": "received"}
    except Exception as e:
        logger.error(f"Stripe webhook error: {e}")
        return {"status": "error"}


# ========================= COMPANY PROFILES (PUBLIC) =========================

@api_router.get("/companies", response_model=List[CompanyProfileResponse])
async def list_companies(
    search: Optional[str] = None,
    location: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    query = {"user_type": "hirer", "hirer_profile.company_name": {"$ne": None}}
    if search:
        query["$or"] = [
            {"hirer_profile.company_name": {"$regex": search, "$options": "i"}},
            {"hirer_profile.company_description": {"$regex": search, "$options": "i"}}
        ]
    if location:
        query["hirer_profile.location"] = {"$regex": location, "$options": "i"}

    skip = (page - 1) * limit
    hirers = await db.users.find(query, {"_id": 0, "password": 0}).skip(skip).limit(limit).to_list(limit)

    results = []
    for h in hirers:
        hp = h.get("hirer_profile") or {}
        job_count = await db.jobs.count_documents({"hirer_id": h["user_id"], "status": "active"})
        results.append(CompanyProfileResponse(
            user_id=h["user_id"],
            name=h.get("name", ""),
            company_name=hp.get("company_name"),
            company_description=hp.get("company_description"),
            company_website=hp.get("company_website"),
            company_size=hp.get("company_size"),
            company_logo=hp.get("company_logo"),
            industry=hp.get("industry"),
            location=hp.get("location"),
            active_jobs_count=job_count
        ))
    return results


@api_router.get("/companies/{user_id}", response_model=CompanyProfileResponse)
async def get_company_profile(user_id: str):
    hirer = await db.users.find_one({"user_id": user_id, "user_type": "hirer"}, {"_id": 0, "password": 0})
    if not hirer:
        raise HTTPException(status_code=404, detail="Company not found")
    hp = hirer.get("hirer_profile") or {}
    job_count = await db.jobs.count_documents({"hirer_id": user_id, "status": "active"})
    return CompanyProfileResponse(
        user_id=hirer["user_id"],
        name=hirer.get("name", ""),
        company_name=hp.get("company_name"),
        company_description=hp.get("company_description"),
        company_website=hp.get("company_website"),
        company_size=hp.get("company_size"),
        company_logo=hp.get("company_logo"),
        industry=hp.get("industry"),
        location=hp.get("location"),
        active_jobs_count=job_count
    )


@api_router.get("/companies/{user_id}/jobs", response_model=List[JobResponse])
async def get_company_jobs(user_id: str):
    jobs = await db.jobs.find({"hirer_id": user_id, "status": "active"}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [JobResponse(**job) for job in jobs]


# ========================= MESSAGING ENDPOINTS =========================

@api_router.post("/messages", response_model=MessageResponse)
async def send_message(msg: MessageCreate, current_user: dict = Depends(get_current_user)):
    recipient = await db.users.find_one({"user_id": msg.recipient_id}, {"_id": 0})
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")

    message_doc = {
        "message_id": f"msg_{uuid.uuid4().hex[:12]}",
        "sender_id": current_user["user_id"],
        "sender_name": current_user["name"],
        "recipient_id": msg.recipient_id,
        "content": msg.content,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.messages.insert_one(message_doc)
    return MessageResponse(**message_doc)


@api_router.get("/messages/inbox", response_model=List[MessageResponse])
async def get_inbox(current_user: dict = Depends(get_current_user)):
    msgs = await db.messages.find(
        {"recipient_id": current_user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return [MessageResponse(**m) for m in msgs]


@api_router.get("/messages/sent", response_model=List[MessageResponse])
async def get_sent_messages(current_user: dict = Depends(get_current_user)):
    msgs = await db.messages.find(
        {"sender_id": current_user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return [MessageResponse(**m) for m in msgs]


@api_router.get("/messages/conversations")
async def get_conversations(current_user: dict = Depends(get_current_user)):
    pipeline = [
        {"$match": {"$or": [
            {"sender_id": current_user["user_id"]},
            {"recipient_id": current_user["user_id"]}
        ]}},
        {"$sort": {"created_at": -1}},
        {"$group": {
            "_id": {"$cond": [
                {"$eq": ["$sender_id", current_user["user_id"]]},
                "$recipient_id",
                "$sender_id"
            ]},
            "last_message": {"$first": "$$ROOT"},
            "unread_count": {"$sum": {"$cond": [
                {"$and": [
                    {"$eq": ["$recipient_id", current_user["user_id"]]},
                    {"$eq": ["$is_read", False]}
                ]}, 1, 0
            ]}}
        }},
        {"$project": {"_id": 0, "partner_id": "$_id", "last_message": 1, "unread_count": 1}}
    ]
    convos = await db.messages.aggregate(pipeline).to_list(50)
    # Get partner names
    for c in convos:
        partner = await db.users.find_one({"user_id": c["partner_id"]}, {"_id": 0, "name": 1, "user_type": 1, "picture": 1})
        c["partner_name"] = partner.get("name", "Unknown") if partner else "Unknown"
        c["partner_type"] = partner.get("user_type", "") if partner else ""
        c["partner_picture"] = partner.get("picture") if partner else None
        if c.get("last_message"):
            c["last_message"].pop("_id", None)
    return convos


@api_router.get("/messages/thread/{partner_id}", response_model=List[MessageResponse])
async def get_message_thread(partner_id: str, current_user: dict = Depends(get_current_user)):
    msgs = await db.messages.find({
        "$or": [
            {"sender_id": current_user["user_id"], "recipient_id": partner_id},
            {"sender_id": partner_id, "recipient_id": current_user["user_id"]}
        ]
    }, {"_id": 0}).sort("created_at", 1).to_list(200)
    # Mark as read
    await db.messages.update_many(
        {"sender_id": partner_id, "recipient_id": current_user["user_id"], "is_read": False},
        {"$set": {"is_read": True}}
    )
    return [MessageResponse(**m) for m in msgs]


# ========================= JOB ALERTS =========================

@api_router.post("/job-alerts", response_model=JobAlertResponse)
async def create_job_alert(alert_data: JobAlertCreate, current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "talent":
        raise HTTPException(status_code=403, detail="Only talents can create job alerts")
    alert = {
        "alert_id": f"alert_{uuid.uuid4().hex[:12]}",
        "user_id": current_user["user_id"],
        **alert_data.model_dump(),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.job_alerts.insert_one(alert)
    return JobAlertResponse(**alert)


@api_router.get("/job-alerts", response_model=List[JobAlertResponse])
async def get_job_alerts(current_user: dict = Depends(get_current_user)):
    alerts = await db.job_alerts.find(
        {"user_id": current_user["user_id"]}, {"_id": 0}
    ).to_list(20)
    return [JobAlertResponse(**a) for a in alerts]


@api_router.delete("/job-alerts/{alert_id}")
async def delete_job_alert(alert_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.job_alerts.delete_one({"alert_id": alert_id, "user_id": current_user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert deleted"}


# ========================= AI JOB MATCHING =========================

@api_router.get("/ai/match-jobs")
async def ai_match_jobs(current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "talent":
        raise HTTPException(status_code=403, detail="Only talents can use job matching")

    talent_profile = current_user.get("talent_profile") or {}
    resume = await db.resumes.find_one({"user_id": current_user["user_id"]}, {"_id": 0})

    skills = talent_profile.get("skills", [])
    categories = talent_profile.get("categories", [])
    exp_level = talent_profile.get("experience_level", "")
    location = talent_profile.get("location", "")

    if resume:
        skills = list(set(skills + resume.get("skills", [])))

    # Build match query
    query = {"status": "active"}
    or_conditions = []
    if categories:
        or_conditions.append({"category": {"$in": categories}})
    if skills:
        or_conditions.append({"skills_required": {"$in": skills}})
    if location:
        or_conditions.append({"location": {"$regex": location, "$options": "i"}})
    if exp_level:
        or_conditions.append({"experience_level": exp_level})

    if or_conditions:
        query["$or"] = or_conditions

    jobs = await db.jobs.find(query, {"_id": 0}).sort("created_at", -1).limit(20).to_list(20)

    # Score each job
    scored_jobs = []
    for job in jobs:
        score = 0
        reasons = []
        if job.get("category") in categories:
            score += 30
            reasons.append("Category match")
        job_skills = set(job.get("skills_required", []))
        matching_skills = job_skills.intersection(set(skills))
        if matching_skills:
            score += min(len(matching_skills) * 10, 30)
            reasons.append(f"{len(matching_skills)} skill(s) match")
        if location and location.lower() in job.get("location", "").lower():
            score += 20
            reasons.append("Location match")
        if exp_level and exp_level == job.get("experience_level"):
            score += 20
            reasons.append("Experience level match")

        scored_jobs.append({
            **{k: v for k, v in job.items()},
            "match_score": min(score, 100),
            "match_reasons": reasons
        })

    scored_jobs.sort(key=lambda x: x["match_score"], reverse=True)
    return scored_jobs[:10]


# ========================= HIRER ANALYTICS =========================

@api_router.get("/analytics/hirer")
async def get_hirer_analytics(current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "hirer":
        raise HTTPException(status_code=403, detail="Only hirers can view analytics")

    user_id = current_user["user_id"]
    total_jobs = await db.jobs.count_documents({"hirer_id": user_id})
    active_jobs = await db.jobs.count_documents({"hirer_id": user_id, "status": "active"})

    # Application stats
    jobs = await db.jobs.find({"hirer_id": user_id}, {"_id": 0, "job_id": 1}).to_list(1000)
    job_ids = [j["job_id"] for j in jobs]

    total_apps = await db.applications.count_documents({"job_id": {"$in": job_ids}})
    pending_apps = await db.applications.count_documents({"job_id": {"$in": job_ids}, "status": "pending"})
    shortlisted_apps = await db.applications.count_documents({"job_id": {"$in": job_ids}, "status": "shortlisted"})
    hired_apps = await db.applications.count_documents({"job_id": {"$in": job_ids}, "status": "hired"})

    # Per-job breakdown
    job_stats = []
    for j in jobs[:20]:
        jid = j["job_id"]
        job_doc = await db.jobs.find_one({"job_id": jid}, {"_id": 0, "title": 1, "created_at": 1, "status": 1, "applications_count": 1})
        app_count = await db.applications.count_documents({"job_id": jid})
        if job_doc:
            job_stats.append({
                "job_id": jid,
                "title": job_doc.get("title", ""),
                "status": job_doc.get("status", ""),
                "applications": app_count,
                "created_at": job_doc.get("created_at", "")
            })

    subscription = current_user.get("subscription") or {}

    return {
        "total_jobs": total_jobs,
        "active_jobs": active_jobs,
        "total_applications": total_apps,
        "pending_applications": pending_apps,
        "shortlisted_applications": shortlisted_apps,
        "hired": hired_apps,
        "subscription": {
            "plan": subscription.get("plan", "none"),
            "status": subscription.get("status", "inactive"),
            "job_posts_used": subscription.get("job_posts_used", 0),
            "resume_views_used": subscription.get("resume_views_used", 0),
        },
        "job_breakdown": job_stats
    }


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
