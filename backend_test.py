#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import uuid

class BuildForceAPITester:
    def __init__(self, base_url="https://jobsite-match-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            details = f"Expected {expected_status}, got {response.status_code}"
            
            if not success:
                try:
                    error_data = response.json()
                    details += f" - {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f" - {response.text[:100]}"
            
            self.log_test(name, success, details if not success else "")
            
            return success, response.json() if success and response.content else {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test basic API health"""
        success, response = self.run_test(
            "API Health Check",
            "GET",
            "",
            200
        )
        return success

    def test_categories_endpoint(self):
        """Test job categories endpoint"""
        success, response = self.run_test(
            "Get Job Categories",
            "GET", 
            "categories",
            200
        )
        if success and 'categories' in response:
            categories = response['categories']
            if len(categories) > 0 and 'Electrician' in categories:
                self.log_test("Categories Content Validation", True)
            else:
                self.log_test("Categories Content Validation", False, "Missing expected categories")
        return success

    def test_subscription_plans(self):
        """Test subscription plans endpoint"""
        success, response = self.run_test(
            "Get Subscription Plans",
            "GET",
            "subscriptions/plans", 
            200
        )
        if success:
            plans = response
            expected_plans = ['basic', 'pro', 'enterprise']
            if all(plan in plans for plan in expected_plans):
                self.log_test("Subscription Plans Content", True)
            else:
                self.log_test("Subscription Plans Content", False, "Missing expected plans")
        return success

    def test_user_registration(self):
        """Test user registration for talent"""
        test_email = f"test_talent_{uuid.uuid4().hex[:8]}@example.com"
        test_data = {
            "email": test_email,
            "password": "TestPass123!",
            "name": "Test Talent User",
            "user_type": "talent"
        }
        
        success, response = self.run_test(
            "User Registration (Talent)",
            "POST",
            "auth/register",
            200,
            data=test_data
        )
        
        if success and 'token' in response and 'user' in response:
            self.token = response['token']
            self.user_data = response['user']
            self.log_test("Registration Token Received", True)
            
            # Validate user data
            user = response['user']
            if (user['email'] == test_email and 
                user['user_type'] == 'talent' and 
                user['name'] == "Test Talent User"):
                self.log_test("Registration User Data Validation", True)
            else:
                self.log_test("Registration User Data Validation", False, "User data mismatch")
        
        return success

    def test_user_login(self):
        """Test user login"""
        if not self.user_data:
            self.log_test("User Login", False, "No user data from registration")
            return False
            
        login_data = {
            "email": self.user_data['email'],
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.log_test("Login Token Received", True)
        
        return success

    def test_get_current_user(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        
        if success and response.get('user_type') == 'talent':
            self.log_test("Current User Data Validation", True)
        elif success:
            self.log_test("Current User Data Validation", False, "User type mismatch")
            
        return success

    def test_profile_update(self):
        """Test talent profile update"""
        profile_data = {
            "phone": "+1-555-123-4567",
            "location": "New York, NY",
            "categories": ["Electrician", "HVAC Technician"],
            "experience_level": "Mid-Level (3-5 years)",
            "skills": ["Blueprint Reading", "OSHA Certified"],
            "bio": "Experienced construction professional",
            "availability": "Available",
            "expected_salary": "$60,000 - $80,000"
        }
        
        success, response = self.run_test(
            "Update Talent Profile",
            "PUT",
            "profile/talent",
            200,
            data=profile_data
        )
        
        if success and response.get('talent_profile'):
            profile = response['talent_profile']
            if (profile.get('phone') == profile_data['phone'] and
                profile.get('location') == profile_data['location']):
                self.log_test("Profile Update Validation", True)
            else:
                self.log_test("Profile Update Validation", False, "Profile data not updated correctly")
        
        return success

    def test_jobs_listing(self):
        """Test jobs listing endpoint"""
        success, response = self.run_test(
            "Get Jobs Listing",
            "GET",
            "jobs",
            200
        )
        
        if success and isinstance(response, list):
            self.log_test("Jobs Listing Format", True)
        elif success:
            self.log_test("Jobs Listing Format", False, "Response is not a list")
            
        return success

    def test_jobs_with_filters(self):
        """Test jobs with search filters"""
        success, response = self.run_test(
            "Get Jobs with Category Filter",
            "GET",
            "jobs?category=Electrician",
            200
        )
        return success

    def test_switch_user_type(self):
        """Test switching from talent to hirer"""
        success, response = self.run_test(
            "Switch User Type to Hirer",
            "PUT",
            "auth/switch-user-type",
            200
        )
        
        if success and response.get('user_type') == 'hirer':
            self.log_test("User Type Switch Validation", True)
            self.user_data = response
        elif success:
            self.log_test("User Type Switch Validation", False, "User type not switched correctly")
            
        return success

    def test_subscription_creation(self):
        """Test creating a subscription for hirer"""
        subscription_data = {
            "plan": "basic"
        }
        
        success, response = self.run_test(
            "Create Subscription",
            "POST",
            "subscriptions",
            200,
            data=subscription_data
        )
        
        if success and response.get('plan') == 'basic':
            self.log_test("Subscription Creation Validation", True)
        elif success:
            self.log_test("Subscription Creation Validation", False, "Subscription plan mismatch")
            
        return success

    def test_job_creation(self):
        """Test creating a job posting"""
        job_data = {
            "title": "Senior Electrician",
            "description": "We are looking for an experienced electrician to join our team. Must have 5+ years of experience in commercial electrical work.",
            "category": "Electrician",
            "location": "New York, NY",
            "employment_type": "Full-time",
            "experience_level": "Senior (5-10 years)",
            "salary_min": 70000,
            "salary_max": 90000,
            "skills_required": ["Blueprint Reading", "OSHA Certified", "Commercial Wiring"],
            "benefits": ["Health Insurance", "401k", "Paid Time Off"]
        }
        
        success, response = self.run_test(
            "Create Job Posting",
            "POST",
            "jobs",
            200,
            data=job_data
        )
        
        if success and response.get('title') == job_data['title']:
            self.job_id = response.get('job_id')
            self.log_test("Job Creation Validation", True)
        elif success:
            self.log_test("Job Creation Validation", False, "Job data mismatch")
            
        return success

    def test_get_my_jobs(self):
        """Test getting hirer's posted jobs"""
        success, response = self.run_test(
            "Get My Posted Jobs",
            "GET",
            "jobs/hirer/my-jobs",
            200
        )
        
        if success and isinstance(response, list) and len(response) > 0:
            self.log_test("My Jobs Listing Validation", True)
        elif success:
            self.log_test("My Jobs Listing Validation", False, "No jobs found or invalid format")
            
        return success

    def test_resume_creation(self):
        """Test creating a resume (switch back to talent first)"""
        # Switch back to talent
        switch_success, _ = self.run_test(
            "Switch Back to Talent",
            "PUT", 
            "auth/switch-user-type",
            200
        )
        
        if not switch_success:
            return False
            
        resume_data = {
            "full_name": "Test Talent User",
            "email": self.user_data['email'],
            "phone": "+1-555-123-4567",
            "location": "New York, NY",
            "summary": "Experienced electrician with 5+ years in commercial construction",
            "experience": [
                {
                    "title": "Electrician",
                    "company": "ABC Construction",
                    "location": "New York, NY",
                    "start_date": "01/2020",
                    "end_date": "Present",
                    "description": "Performed electrical installations and maintenance",
                    "is_current": True
                }
            ],
            "education": [
                {
                    "degree": "Electrical Technology Certificate",
                    "institution": "Trade School NYC",
                    "location": "New York, NY",
                    "graduation_year": "2019",
                    "field_of_study": "Electrical Technology"
                }
            ],
            "skills": ["Blueprint Reading", "OSHA Certified", "Electrical Systems"],
            "certifications": ["OSHA 30", "Electrical License"],
            "languages": ["English", "Spanish"]
        }
        
        success, response = self.run_test(
            "Create Resume",
            "POST",
            "resumes",
            200,
            data=resume_data
        )
        
        if success and response.get('full_name') == resume_data['full_name']:
            self.resume_id = response.get('resume_id')
            self.log_test("Resume Creation Validation", True)
        elif success:
            self.log_test("Resume Creation Validation", False, "Resume data mismatch")
            
        return success

    def test_get_my_resume(self):
        """Test getting user's resume"""
        success, response = self.run_test(
            "Get My Resume",
            "GET",
            "resumes/my-resume",
            200
        )
        
        if success and response and response.get('full_name'):
            self.log_test("Resume Retrieval Validation", True)
        elif success:
            self.log_test("Resume Retrieval Validation", False, "Resume data missing or invalid")
            
        return success

    def test_ai_enhancement(self):
        """Test AI resume enhancement"""
        ai_data = {
            "text": "I am an electrician with experience",
            "section_type": "summary"
        }
        
        success, response = self.run_test(
            "AI Resume Enhancement",
            "POST",
            "ai/enhance-resume",
            200,
            data=ai_data
        )
        
        if success and response.get('enhanced_text'):
            self.log_test("AI Enhancement Response Validation", True)
        elif success:
            self.log_test("AI Enhancement Response Validation", False, "No enhanced text returned")
            
        return success

    def test_logout(self):
        """Test user logout"""
        success, response = self.run_test(
            "User Logout",
            "POST",
            "auth/logout",
            200
        )
        
        if success:
            self.token = None
            self.user_data = None
            
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting BuildForce API Tests...")
        print("=" * 50)
        
        # Basic API tests
        self.test_health_check()
        self.test_categories_endpoint()
        self.test_subscription_plans()
        
        # Authentication tests
        self.test_user_registration()
        self.test_user_login()
        self.test_get_current_user()
        
        # Profile tests
        self.test_profile_update()
        
        # Job listing tests
        self.test_jobs_listing()
        self.test_jobs_with_filters()
        
        # Hirer functionality tests
        self.test_switch_user_type()
        self.test_subscription_creation()
        self.test_job_creation()
        self.test_get_my_jobs()
        
        # Resume tests
        self.test_resume_creation()
        self.test_get_my_resume()
        
        # AI tests
        self.test_ai_enhancement()
        
        # Cleanup
        self.test_logout()
        
        # Print results
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"❌ {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    tester = BuildForceAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())