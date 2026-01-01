import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { HardHat } from 'lucide-react';

export default function AuthCallback() {
  const { processGoogleAuth } = useAuth();
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Use ref to prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        // Extract session_id from URL fragment
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const sessionId = params.get('session_id');

        if (!sessionId) {
          toast.error('Authentication failed: No session ID');
          navigate('/login', { replace: true });
          return;
        }

        // Process the session
        const userData = await processGoogleAuth(sessionId);
        
        toast.success('Welcome to BuildForce!');
        
        // Redirect based on user type
        const redirectTo = userData.user_type === 'talent' ? '/talent/dashboard' : '/hirer/dashboard';
        
        // Clear the hash and navigate
        window.history.replaceState(null, '', window.location.pathname);
        navigate(redirectTo, { replace: true, state: { user: userData } });
      } catch (error) {
        console.error('Auth callback error:', error);
        toast.error('Authentication failed. Please try again.');
        navigate('/login', { replace: true });
      }
    };

    processAuth();
  }, [processGoogleAuth, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-concrete-white">
      <div className="text-center">
        <div className="w-16 h-16 bg-safety-orange rounded-sm flex items-center justify-center mx-auto mb-4">
          <HardHat className="w-10 h-10 text-white animate-pulse" />
        </div>
        <h2 className="font-heading text-xl font-bold text-blueprint-navy mb-2">
          Completing Sign In...
        </h2>
        <p className="text-slate-600">Please wait while we set up your account</p>
        <div className="mt-6 w-12 h-12 border-4 border-safety-orange border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
}
