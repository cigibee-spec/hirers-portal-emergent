"""
BuildForce API Tests - Iteration 3
Testing new features: Resume Upload, PDF Export, Payments, Companies, Messages, Job Alerts, AI Matching, Analytics
"""
import pytest
import requests
import os
import time
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://hirers-portal-dev.preview.emergentagent.com').rstrip('/')

# Test credentials
TALENT_EMAIL = "testtalent@buildforce.com"
TALENT_PASSWORD = "Test1234!"
HIRER_EMAIL = "testhirer@buildforce.com"
HIRER_PASSWORD = "Test1234!"


class TestHealthAndBasics:
    """Basic API health and connectivity tests"""
    
    def test_jobs_endpoint_accessible(self):
        """Test that jobs endpoint is accessible"""
        response = requests.get(f"{BASE_URL}/api/jobs")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Jobs endpoint accessible, found {len(data)} jobs")
    
    def test_subscription_plans_accessible(self):
        """Test subscription plans endpoint"""
        response = requests.get(f"{BASE_URL}/api/subscriptions/plans")
        assert response.status_code == 200
        data = response.json()
        assert "basic" in data
        assert "pro" in data
        assert "enterprise" in data
        print(f"Subscription plans: {list(data.keys())}")


class TestAuthentication:
    """Authentication flow tests"""
    
    def test_talent_login(self):
        """Test talent user login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TALENT_EMAIL,
            "password": TALENT_PASSWORD
        })
        # If user doesn't exist, try to register
        if response.status_code == 401:
            reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": TALENT_EMAIL,
                "password": TALENT_PASSWORD,
                "name": "Test Talent",
                "user_type": "talent"
            })
            if reg_response.status_code == 200:
                data = reg_response.json()
                assert "token" in data
                assert data["user"]["user_type"] == "talent"
                print(f"Talent registered and logged in: {data['user']['email']}")
                return
            elif reg_response.status_code == 400 and "already registered" in reg_response.text.lower():
                # Try login again
                response = requests.post(f"{BASE_URL}/api/auth/login", json={
                    "email": TALENT_EMAIL,
                    "password": TALENT_PASSWORD
                })
        
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["user_type"] == "talent"
        print(f"Talent logged in: {data['user']['email']}")
    
    def test_hirer_login(self):
        """Test hirer user login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": HIRER_EMAIL,
            "password": HIRER_PASSWORD
        })
        # If user doesn't exist, try to register
        if response.status_code == 401:
            reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": HIRER_EMAIL,
                "password": HIRER_PASSWORD,
                "name": "Test Hirer",
                "user_type": "hirer"
            })
            if reg_response.status_code == 200:
                data = reg_response.json()
                assert "token" in data
                assert data["user"]["user_type"] == "hirer"
                print(f"Hirer registered and logged in: {data['user']['email']}")
                return
            elif reg_response.status_code == 400 and "already registered" in reg_response.text.lower():
                response = requests.post(f"{BASE_URL}/api/auth/login", json={
                    "email": HIRER_EMAIL,
                    "password": HIRER_PASSWORD
                })
        
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["user_type"] == "hirer"
        print(f"Hirer logged in: {data['user']['email']}")


class TestCompaniesEndpoint:
    """Company profiles endpoint tests"""
    
    def test_list_companies(self):
        """Test GET /api/companies - list all companies"""
        response = requests.get(f"{BASE_URL}/api/companies")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Companies endpoint returned {len(data)} companies")
    
    def test_search_companies(self):
        """Test company search functionality"""
        response = requests.get(f"{BASE_URL}/api/companies?search=test")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Company search returned {len(data)} results")


class TestTalentFeatures:
    """Talent-specific feature tests (requires auth)"""
    
    @pytest.fixture(autouse=True)
    def setup_talent_auth(self):
        """Setup talent authentication"""
        # Try login first
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TALENT_EMAIL,
            "password": TALENT_PASSWORD
        })
        if response.status_code != 200:
            # Register if login fails
            response = requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": TALENT_EMAIL,
                "password": TALENT_PASSWORD,
                "name": "Test Talent",
                "user_type": "talent"
            })
        
        if response.status_code == 200:
            self.token = response.json().get("token")
            self.user = response.json().get("user")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Could not authenticate talent user")
    
    def test_get_my_applications(self):
        """Test GET /api/applications/my-applications"""
        response = requests.get(
            f"{BASE_URL}/api/applications/my-applications",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Talent has {len(data)} applications")
    
    def test_get_saved_jobs(self):
        """Test GET /api/saved-jobs"""
        response = requests.get(
            f"{BASE_URL}/api/saved-jobs",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Talent has {len(data)} saved jobs")
    
    def test_ai_job_matching(self):
        """Test GET /api/ai/match-jobs - AI job matching"""
        response = requests.get(
            f"{BASE_URL}/api/ai/match-jobs",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"AI matching returned {len(data)} matched jobs")
        if data:
            assert "match_score" in data[0]
            print(f"Top match score: {data[0].get('match_score', 0)}%")
    
    def test_job_alerts_crud(self):
        """Test job alerts CRUD operations"""
        # Create alert
        create_response = requests.post(
            f"{BASE_URL}/api/job-alerts",
            headers={**self.headers, "Content-Type": "application/json"},
            json={
                "categories": ["Electrician"],
                "locations": ["New York"],
                "keywords": ["senior"]
            }
        )
        assert create_response.status_code == 200
        alert = create_response.json()
        assert "alert_id" in alert
        print(f"Created job alert: {alert['alert_id']}")
        
        # Get alerts
        get_response = requests.get(
            f"{BASE_URL}/api/job-alerts",
            headers=self.headers
        )
        assert get_response.status_code == 200
        alerts = get_response.json()
        assert isinstance(alerts, list)
        assert len(alerts) > 0
        print(f"Found {len(alerts)} job alerts")
        
        # Delete alert
        delete_response = requests.delete(
            f"{BASE_URL}/api/job-alerts/{alert['alert_id']}",
            headers=self.headers
        )
        assert delete_response.status_code == 200
        print(f"Deleted job alert: {alert['alert_id']}")
    
    def test_resume_download_pdf(self):
        """Test GET /api/resumes/download-pdf - PDF export"""
        response = requests.get(
            f"{BASE_URL}/api/resumes/download-pdf",
            headers=self.headers
        )
        # May return 404 if no resume exists, or 200 with PDF
        if response.status_code == 200:
            assert response.headers.get("content-type") == "application/pdf"
            print("Resume PDF download successful")
        elif response.status_code == 404:
            print("No resume found for PDF download (expected if no resume created)")
        else:
            print(f"PDF download returned status: {response.status_code}")


class TestHirerFeatures:
    """Hirer-specific feature tests (requires auth)"""
    
    @pytest.fixture(autouse=True)
    def setup_hirer_auth(self):
        """Setup hirer authentication"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": HIRER_EMAIL,
            "password": HIRER_PASSWORD
        })
        if response.status_code != 200:
            response = requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": HIRER_EMAIL,
                "password": HIRER_PASSWORD,
                "name": "Test Hirer",
                "user_type": "hirer"
            })
        
        if response.status_code == 200:
            self.token = response.json().get("token")
            self.user = response.json().get("user")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Could not authenticate hirer user")
    
    def test_hirer_analytics(self):
        """Test GET /api/analytics/hirer - hirer analytics"""
        response = requests.get(
            f"{BASE_URL}/api/analytics/hirer",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_jobs" in data
        assert "active_jobs" in data
        assert "total_applications" in data
        print(f"Hirer analytics: {data.get('total_jobs')} total jobs, {data.get('active_jobs')} active")
    
    def test_get_my_jobs(self):
        """Test GET /api/jobs/hirer/my-jobs"""
        response = requests.get(
            f"{BASE_URL}/api/jobs/hirer/my-jobs",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Hirer has {len(data)} jobs posted")


class TestMessaging:
    """In-app messaging tests"""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Setup authentication for messaging tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TALENT_EMAIL,
            "password": TALENT_PASSWORD
        })
        if response.status_code != 200:
            response = requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": TALENT_EMAIL,
                "password": TALENT_PASSWORD,
                "name": "Test Talent",
                "user_type": "talent"
            })
        
        if response.status_code == 200:
            self.token = response.json().get("token")
            self.user = response.json().get("user")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Could not authenticate user for messaging")
    
    def test_get_conversations(self):
        """Test GET /api/messages/conversations"""
        response = requests.get(
            f"{BASE_URL}/api/messages/conversations",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} conversations")
    
    def test_get_inbox(self):
        """Test GET /api/messages/inbox"""
        response = requests.get(
            f"{BASE_URL}/api/messages/inbox",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Inbox has {len(data)} messages")
    
    def test_send_message_requires_valid_recipient(self):
        """Test POST /api/messages - requires valid recipient"""
        response = requests.post(
            f"{BASE_URL}/api/messages",
            headers={**self.headers, "Content-Type": "application/json"},
            json={
                "recipient_id": "invalid_user_id",
                "content": "Test message"
            }
        )
        # Should return 404 for invalid recipient
        assert response.status_code == 404
        print("Message to invalid recipient correctly rejected")


class TestPayments:
    """Payment endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup_hirer_auth(self):
        """Setup hirer authentication for payment tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": HIRER_EMAIL,
            "password": HIRER_PASSWORD
        })
        if response.status_code != 200:
            response = requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": HIRER_EMAIL,
                "password": HIRER_PASSWORD,
                "name": "Test Hirer",
                "user_type": "hirer"
            })
        
        if response.status_code == 200:
            self.token = response.json().get("token")
            self.user = response.json().get("user")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Could not authenticate hirer for payment tests")
    
    def test_payment_checkout_stripe(self):
        """Test POST /api/payments/checkout with Stripe"""
        response = requests.post(
            f"{BASE_URL}/api/payments/checkout",
            headers={**self.headers, "Content-Type": "application/json"},
            json={
                "plan": "basic",
                "payment_method": "stripe",
                "origin_url": "https://hirers-portal-dev.preview.emergentagent.com"
            }
        )
        # Should return checkout URL or error if Stripe not configured
        if response.status_code == 200:
            data = response.json()
            assert "url" in data or "session_id" in data
            print(f"Stripe checkout initiated: {data.get('session_id', 'N/A')}")
        else:
            print(f"Stripe checkout returned: {response.status_code} - {response.text[:100]}")
    
    def test_payment_checkout_paypal_mocked(self):
        """Test POST /api/payments/checkout with PayPal (MOCKED)"""
        response = requests.post(
            f"{BASE_URL}/api/payments/checkout",
            headers={**self.headers, "Content-Type": "application/json"},
            json={
                "plan": "basic",
                "payment_method": "paypal",
                "origin_url": "https://hirers-portal-dev.preview.emergentagent.com"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "url" in data
        assert data.get("mocked") == True
        print(f"PayPal checkout (MOCKED): {data.get('session_id', 'N/A')}")
    
    def test_payment_checkout_paymongo_mocked(self):
        """Test POST /api/payments/checkout with PayMongo (MOCKED)"""
        response = requests.post(
            f"{BASE_URL}/api/payments/checkout",
            headers={**self.headers, "Content-Type": "application/json"},
            json={
                "plan": "pro",
                "payment_method": "paymongo",
                "origin_url": "https://hirers-portal-dev.preview.emergentagent.com"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "url" in data
        assert data.get("mocked") == True
        print(f"PayMongo checkout (MOCKED): {data.get('session_id', 'N/A')}")
    
    def test_payment_status_check(self):
        """Test GET /api/payments/status/{session_id}"""
        # First create a mocked payment
        checkout_response = requests.post(
            f"{BASE_URL}/api/payments/checkout",
            headers={**self.headers, "Content-Type": "application/json"},
            json={
                "plan": "basic",
                "payment_method": "paypal",
                "origin_url": "https://hirers-portal-dev.preview.emergentagent.com"
            }
        )
        if checkout_response.status_code == 200:
            session_id = checkout_response.json().get("session_id")
            
            # Check status
            status_response = requests.get(
                f"{BASE_URL}/api/payments/status/{session_id}",
                headers=self.headers
            )
            assert status_response.status_code == 200
            data = status_response.json()
            assert "payment_status" in data
            print(f"Payment status: {data.get('payment_status')}")


class TestResumeUpload:
    """Resume upload and ATS parsing tests"""
    
    @pytest.fixture(autouse=True)
    def setup_talent_auth(self):
        """Setup talent authentication"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TALENT_EMAIL,
            "password": TALENT_PASSWORD
        })
        if response.status_code != 200:
            response = requests.post(f"{BASE_URL}/api/auth/register", json={
                "email": TALENT_EMAIL,
                "password": TALENT_PASSWORD,
                "name": "Test Talent",
                "user_type": "talent"
            })
        
        if response.status_code == 200:
            self.token = response.json().get("token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            pytest.skip("Could not authenticate talent for resume upload")
    
    def test_resume_upload_requires_file(self):
        """Test POST /api/resumes/upload - requires file"""
        response = requests.post(
            f"{BASE_URL}/api/resumes/upload",
            headers=self.headers
        )
        # Should return 422 for missing file
        assert response.status_code == 422
        print("Resume upload correctly requires file")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
