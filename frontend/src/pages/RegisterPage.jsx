import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { HardHat, Mail, Lock, User, ArrowRight, Users, Building2 } from 'lucide-react';

export default function RegisterPage() {
  const [userType, setUserType] = useState('talent');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (isAuthenticated) {
    const redirectTo = user?.user_type === 'talent' ? '/talent/dashboard' : '/hirer/dashboard';
    navigate(redirectTo, { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const userData = await register({ name, email, password, user_type: userType });
      toast.success('Account created successfully!');
      
      const redirectTo = userData.user_type === 'talent' ? '/talent/dashboard' : '/hirer/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (error) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/talent/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-concrete-white flex">
      {/* Left Side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(https://images.unsplash.com/photo-1603516270950-26e4f5004ffd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwyfHxjb25zdHJ1Y3Rpb24lMjB3b3JrZXIlMjBwb3J0cmFpdCUyMHNhZmV0eSUyMGdlYXJ8ZW58MHx8fHwxNzY3MjgzOTYxfDA&ixlib=rb-4.1.0&q=85)` 
          }}
        >
          <div className="absolute inset-0 bg-blueprint-navy/80"></div>
        </div>
        <div className="relative h-full flex items-center justify-center p-12">
          <div className="text-white max-w-md">
            <h2 className="font-heading text-3xl font-bold mb-4">
              Join the #1 Construction Job Platform
            </h2>
            <p className="text-slate-300 text-lg mb-6">
              Whether you're looking for work or hiring, BuildForce connects you with the best in the industry.
            </p>
            <ul className="space-y-3">
              {[
                "Free account for job seekers",
                "AI-powered resume builder",
                "Direct connection with employers"
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-2 text-slate-300">
                  <div className="w-2 h-2 bg-safety-orange rounded-full"></div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8" data-testid="register-logo">
            <div className="w-10 h-10 bg-safety-orange rounded-sm flex items-center justify-center">
              <HardHat className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-bold text-xl text-blueprint-navy">BuildForce</span>
          </Link>

          <Card className="border border-steel-grey rounded-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="font-heading text-2xl font-bold text-blueprint-navy">
                Create Account
              </CardTitle>
              <CardDescription>
                Join BuildForce and start your journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* User Type Tabs */}
              <Tabs value={userType} onValueChange={setUserType} className="mb-6">
                <TabsList className="grid w-full grid-cols-2 rounded-sm">
                  <TabsTrigger 
                    value="talent" 
                    className="rounded-sm data-[state=active]:bg-safety-orange data-[state=active]:text-white"
                    data-testid="register-talent-tab"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Job Seeker
                  </TabsTrigger>
                  <TabsTrigger 
                    value="hirer"
                    className="rounded-sm data-[state=active]:bg-safety-orange data-[state=active]:text-white"
                    data-testid="register-hirer-tab"
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    Employer
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    {userType === 'talent' ? 'Full Name' : 'Company Name'}
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder={userType === 'talent' ? 'John Smith' : 'ABC Construction'}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 rounded-sm border-steel-grey focus:ring-safety-orange focus:border-safety-orange"
                      required
                      data-testid="register-name-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 rounded-sm border-steel-grey focus:ring-safety-orange focus:border-safety-orange"
                      required
                      data-testid="register-email-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 rounded-sm border-steel-grey focus:ring-safety-orange focus:border-safety-orange"
                      required
                      data-testid="register-password-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 rounded-sm border-steel-grey focus:ring-safety-orange focus:border-safety-orange"
                      required
                      data-testid="register-confirm-password-input"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-safety-orange hover:bg-safety-orange-dark text-white font-bold rounded-sm"
                  data-testid="register-submit-btn"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-steel-grey"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignup}
                className="w-full border-steel-grey hover:bg-slate-50 rounded-sm"
                data-testid="google-signup-btn"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              <p className="mt-6 text-center text-sm text-slate-600">
                Already have an account?{' '}
                <Link to="/login" className="text-safety-orange hover:underline font-medium" data-testid="login-link">
                  Sign in
                </Link>
              </p>

              {userType === 'hirer' && (
                <p className="mt-4 text-center text-xs text-slate-500">
                  Employers will need to subscribe to post jobs.{' '}
                  <Link to="/pricing" className="text-safety-orange hover:underline">
                    View plans
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
