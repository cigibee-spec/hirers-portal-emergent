"""
BuildForce API Tests - Iteration 4
Tests for: Leaderboard, Resume Templates, Interviews, Admin Dashboard, Recommendations, Deep Match, Bulk Upload
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TALENT_EMAIL = "testtalent@buildforce.com"
TALENT_PASSWORD = "Test1234!"
HIRER_EMAIL = "testhirer@buildforce.com"
HIRER_PASSWORD = "Test1234!"
ADMIN_EMAIL = "admin@buildforce.com"
ADMIN_PASSWORD = "Admin1234!"


class TestPublicEndpoints:
    """Public endpoints that don't require authentication"""
    
    def test_leaderboard_ats_scores(self):
        """GET /api/leaderboard/ats-scores - returns ATS score distribution"""
        response = requests.get(f"{BASE_URL}/api/leaderboard/ats-scores")
        assert response.status_code == 200
        data = response.json()
        assert "total_resumes" in data
        assert "distribution" in data
        assert "average_score" in data
        assert "top_scores" in data
        assert "percentiles" in data
        print(f"Leaderboard: {data['total_resumes']} resumes, avg score: {data['average_score']}")
    
    def test_resume_templates_list(self):
        """GET /api/resume-templates - returns 6 templates"""
        response = requests.get(f"{BASE_URL}/api/resume-templates")
        assert response.status_code == 200
        templates = response.json()
        assert isinstance(templates, list)
        assert len(templates) == 6
        # Verify template structure
        for tpl in templates:
            assert "template_id" in tpl
            assert "name" in tpl
            assert "description" in tpl
            assert "category" in tpl
        print(f"Found {len(templates)} resume templates")
    
    def test_resume_template_by_id(self):
        """GET /api/resume-templates/{template_id} - returns specific template"""
        template_ids = [
            "tpl_construction_general",
            "tpl_electrician",
            "tpl_project_manager",
            "tpl_heavy_equipment",
            "tpl_plumber",
            "tpl_safety_officer"
        ]
        for tpl_id in template_ids:
            response = requests.get(f"{BASE_URL}/api/resume-templates/{tpl_id}")
            assert response.status_code == 200, f"Template {tpl_id} not found"
            data = response.json()
            assert data["template_id"] == tpl_id
            assert "sections" in data
            print(f"Template {tpl_id}: {data['name']}")
    
    def test_resume_template_not_found(self):
        """GET /api/resume-templates/{invalid_id} - returns 404"""
        response = requests.get(f"{BASE_URL}/api/resume-templates/invalid_template")
        assert response.status_code == 404


class TestTalentAuth:
    """Tests requiring talent authentication"""
    
    @pytest.fixture
    def talent_token(self):
        """Get talent auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TALENT_EMAIL,
            "password": TALENT_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Talent login failed")
        return response.json()["token"]
    
    def test_talent_login(self):
        """POST /api/auth/login - talent login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TALENT_EMAIL,
            "password": TALENT_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["user_type"] == "talent"
        print(f"Talent login successful: {data['user']['name']}")
    
    def test_recommendations(self, talent_token):
        """GET /api/recommendations - returns job recommendations for talent"""
        response = requests.get(
            f"{BASE_URL}/api/recommendations",
            headers={"Authorization": f"Bearer {talent_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Got {len(data)} job recommendations")
        if len(data) > 0:
            # Verify recommendation structure
            rec = data[0]
            assert "job_id" in rec
            assert "title" in rec
            assert "relevance_score" in rec
    
    def test_interviews_list_talent(self, talent_token):
        """GET /api/interviews - talent can list their interviews"""
        response = requests.get(
            f"{BASE_URL}/api/interviews",
            headers={"Authorization": f"Bearer {talent_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Talent has {len(data)} interviews")


class TestHirerAuth:
    """Tests requiring hirer authentication"""
    
    @pytest.fixture
    def hirer_token(self):
        """Get hirer auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": HIRER_EMAIL,
            "password": HIRER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Hirer login failed")
        return response.json()["token"]
    
    def test_hirer_login(self):
        """POST /api/auth/login - hirer login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": HIRER_EMAIL,
            "password": HIRER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["user_type"] == "hirer"
        print(f"Hirer login successful: {data['user']['name']}")
    
    def test_interviews_list_hirer(self, hirer_token):
        """GET /api/interviews - hirer can list their interviews"""
        response = requests.get(
            f"{BASE_URL}/api/interviews",
            headers={"Authorization": f"Bearer {hirer_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Hirer has {len(data)} interviews")


class TestAdminAuth:
    """Tests requiring admin authentication"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json()["token"]
    
    def test_admin_login(self):
        """POST /api/auth/login - admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        print(f"Admin login successful: {data['user']['name']}")
    
    def test_admin_dashboard(self, admin_token):
        """GET /api/admin/dashboard - returns platform stats"""
        response = requests.get(
            f"{BASE_URL}/api/admin/dashboard",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        # Verify dashboard structure
        assert "users" in data
        assert "total" in data["users"]
        assert "talents" in data["users"]
        assert "hirers" in data["users"]
        assert "jobs" in data
        assert "applications" in data
        assert "resumes" in data
        assert "messages" in data
        assert "interviews" in data
        assert "payments" in data
        assert "recent_users" in data
        print(f"Admin dashboard: {data['users']['total']} users, {data['jobs']['active']} active jobs, ${data['payments']['revenue']} revenue")
    
    def test_admin_users_list(self, admin_token):
        """GET /api/admin/users - returns paginated user list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "page" in data
        assert "users" in data
        assert isinstance(data["users"], list)
        print(f"Admin users: {data['total']} total, page {data['page']}")
    
    def test_admin_users_filter_by_type(self, admin_token):
        """GET /api/admin/users?user_type=talent - filter by user type"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users?user_type=talent",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        # All returned users should be talents
        for user in data["users"]:
            assert user["user_type"] == "talent"
        print(f"Found {len(data['users'])} talents")
    
    def test_admin_users_search(self, admin_token):
        """GET /api/admin/users?search=test - search users"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users?search=test",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        print(f"Search 'test': found {len(data['users'])} users")
    
    def test_admin_dashboard_forbidden_for_non_admin(self):
        """GET /api/admin/dashboard - returns 403 for non-admin"""
        # Login as regular hirer
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": HIRER_EMAIL,
            "password": HIRER_PASSWORD
        })
        if login_res.status_code != 200:
            pytest.skip("Hirer login failed")
        token = login_res.json()["token"]
        
        response = requests.get(
            f"{BASE_URL}/api/admin/dashboard",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 403
        print("Non-admin correctly denied access to admin dashboard")


class TestInterviewScheduling:
    """Tests for interview scheduling functionality"""
    
    @pytest.fixture
    def hirer_token(self):
        """Get hirer auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": HIRER_EMAIL,
            "password": HIRER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Hirer login failed")
        return response.json()["token"]
    
    def test_interview_requires_auth(self):
        """POST /api/interviews - requires authentication"""
        response = requests.post(f"{BASE_URL}/api/interviews", json={})
        assert response.status_code == 401
    
    def test_interview_requires_hirer(self):
        """POST /api/interviews - only hirers can schedule"""
        # Login as talent
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TALENT_EMAIL,
            "password": TALENT_PASSWORD
        })
        if login_res.status_code != 200:
            pytest.skip("Talent login failed")
        token = login_res.json()["token"]
        
        response = requests.post(
            f"{BASE_URL}/api/interviews",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "application_id": "test",
                "talent_id": "test",
                "job_id": "test",
                "scheduled_at": "2026-04-10T10:00:00Z"
            }
        )
        assert response.status_code == 403
        print("Talent correctly denied from scheduling interviews")


class TestBulkUpload:
    """Tests for bulk resume upload"""
    
    @pytest.fixture
    def talent_token(self):
        """Get talent auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TALENT_EMAIL,
            "password": TALENT_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Talent login failed")
        return response.json()["token"]
    
    def test_bulk_upload_requires_auth(self):
        """POST /api/resumes/bulk-upload - requires authentication"""
        response = requests.post(f"{BASE_URL}/api/resumes/bulk-upload")
        assert response.status_code == 401
    
    def test_bulk_upload_requires_talent(self):
        """POST /api/resumes/bulk-upload - only talents can upload"""
        # Login as hirer
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": HIRER_EMAIL,
            "password": HIRER_PASSWORD
        })
        if login_res.status_code != 200:
            pytest.skip("Hirer login failed")
        token = login_res.json()["token"]
        
        response = requests.post(
            f"{BASE_URL}/api/resumes/bulk-upload",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code in [403, 422]  # 403 forbidden or 422 no files
        print("Hirer correctly denied from bulk upload")


class TestDeepMatch:
    """Tests for AI deep match functionality"""
    
    @pytest.fixture
    def talent_token(self):
        """Get talent auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TALENT_EMAIL,
            "password": TALENT_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Talent login failed")
        return response.json()["token"]
    
    def test_deep_match_requires_auth(self):
        """POST /api/ai/deep-match/{job_id} - requires authentication"""
        response = requests.post(f"{BASE_URL}/api/ai/deep-match/test_job_id")
        assert response.status_code == 401
    
    def test_deep_match_job_not_found(self, talent_token):
        """POST /api/ai/deep-match/{invalid_job_id} - returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/ai/deep-match/invalid_job_id",
            headers={"Authorization": f"Bearer {talent_token}"}
        )
        assert response.status_code == 404
        print("Deep match correctly returns 404 for invalid job")


class TestExistingFeatures:
    """Verify existing features still work"""
    
    def test_jobs_list(self):
        """GET /api/jobs - returns job listings"""
        response = requests.get(f"{BASE_URL}/api/jobs")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} jobs")
    
    def test_subscription_plans(self):
        """GET /api/subscriptions/plans - returns plans"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        assert response.status_code == 200
        data = response.json()
        assert "basic" in data
        assert "pro" in data
        assert "enterprise" in data
        print("Subscription plans available")
    
    def test_companies_list(self):
        """GET /api/companies - returns company list"""
        response = requests.get(f"{BASE_URL}/api/companies")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} companies")
    
    def test_categories(self):
        """GET /api/categories - returns job categories"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) > 0
        print(f"Found {len(data['categories'])} categories")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
