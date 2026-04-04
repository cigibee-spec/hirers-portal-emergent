import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { API } from '../App';
import { useAuth } from '../context/AuthContext';
import { HardHat, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  const { getAuthHeaders, checkAuth, isAuthenticated } = useAuth();
  const [status, setStatus] = useState('checking');
  const [plan, setPlan] = useState('');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }
    pollPaymentStatus();
  }, [sessionId]);

  const pollPaymentStatus = async (attempt = 0) => {
    if (attempt >= 5) {
      setStatus('timeout');
      return;
    }

    try {
      const headers = isAuthenticated ? { ...getAuthHeaders() } : {};
      const response = await fetch(`${API}/payments/status/${sessionId}`, {
        credentials: 'include',
        headers
      });

      if (!response.ok) throw new Error('Failed to check status');
      const data = await response.json();

      if (data.payment_status === 'paid') {
        setStatus('success');
        setPlan(data.plan || '');
        await checkAuth();
        return;
      }

      if (data.status === 'expired') {
        setStatus('expired');
        return;
      }

      setAttempts(attempt + 1);
      setTimeout(() => pollPaymentStatus(attempt + 1), 2000);
    } catch (err) {
      if (attempt < 4) {
        setTimeout(() => pollPaymentStatus(attempt + 1), 2000);
      } else {
        setStatus('error');
      }
    }
  };

  return (
    <div className="min-h-screen bg-concrete-white flex flex-col">
      <nav className="bg-white border-b border-steel-grey">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-safety-orange rounded-sm flex items-center justify-center">
                <HardHat className="w-6 h-6 text-white" />
              </div>
              <span className="font-heading font-bold text-xl text-blueprint-navy">BuildForce</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center" data-testid="payment-result">
          {(status === 'checking') && (
            <div>
              <Loader2 className="w-16 h-16 text-safety-orange animate-spin mx-auto mb-4" />
              <h1 className="font-heading text-2xl font-bold text-blueprint-navy mb-2">
                Verifying Payment...
              </h1>
              <p className="text-slate-600">Please wait while we confirm your payment.</p>
            </div>
          )}

          {status === 'success' && (
            <div>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="font-heading text-2xl font-bold text-blueprint-navy mb-2" data-testid="payment-success-title">
                Payment Successful!
              </h1>
              <p className="text-slate-600 mb-2">Your subscription has been activated.</p>
              {plan && <p className="text-safety-orange font-semibold mb-6 capitalize">{plan} Plan</p>}
              <Button
                onClick={() => navigate('/hirer/dashboard')}
                className="bg-safety-orange hover:bg-safety-orange-dark text-white rounded-sm"
                data-testid="go-dashboard-btn"
              >
                Go to Dashboard
              </Button>
            </div>
          )}

          {(status === 'error' || status === 'expired' || status === 'timeout') && (
            <div>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="font-heading text-2xl font-bold text-blueprint-navy mb-2">
                {status === 'timeout' ? 'Verification Timed Out' : 'Payment Issue'}
              </h1>
              <p className="text-slate-600 mb-6">
                {status === 'timeout'
                  ? 'We could not verify your payment. If you were charged, your subscription will be activated shortly.'
                  : 'Something went wrong. Please try again or contact support.'}
              </p>
              <Button
                onClick={() => navigate('/pricing')}
                className="bg-safety-orange hover:bg-safety-orange-dark text-white rounded-sm"
              >
                Back to Pricing
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
