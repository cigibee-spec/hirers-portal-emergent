import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { API } from '../App';
import { 
  HardHat, Check, Star, ArrowRight, Building2, Menu, X, 
  Briefcase, Users, Shield, Clock, Zap
} from 'lucide-react';

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 49,
    description: 'Perfect for small businesses starting to hire',
    features: [
      '5 Job Posts per month',
      '50 Resume Views',
      'Email Support',
      'Basic Analytics',
      'Company Profile'
    ],
    highlighted: false
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 149,
    description: 'Ideal for growing construction companies',
    features: [
      '25 Job Posts per month',
      '200 Resume Views',
      'Priority Support',
      'Featured Job Listings',
      'Advanced Analytics',
      'Applicant Tracking',
      'Team Collaboration'
    ],
    highlighted: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299,
    description: 'For large organizations with high-volume hiring',
    features: [
      'Unlimited Job Posts',
      'Unlimited Resume Views',
      'Dedicated Account Manager',
      'API Access',
      'Custom Branding',
      'Advanced Reporting',
      'Priority Placement',
      'Bulk Import/Export'
    ],
    highlighted: false
  }
];

export default function PricingPage() {
  const { user, isAuthenticated, getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [subscribing, setSubscribing] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSubscribe = async (planId) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to subscribe');
      navigate('/register');
      return;
    }

    if (user?.user_type !== 'hirer') {
      toast.error('Please register as an employer to subscribe');
      navigate('/register');
      return;
    }

    setSubscribing(planId);
    try {
      const response = await fetch(`${API}/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        credentials: 'include',
        body: JSON.stringify({ plan: planId })
      });

      if (response.ok) {
        toast.success('Subscription activated successfully!');
        navigate('/hirer/dashboard');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to subscribe');
      }
    } catch (error) {
      toast.error('Failed to subscribe');
    } finally {
      setSubscribing(null);
    }
  };

  return (
    <div className="min-h-screen bg-concrete-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-steel-grey">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-safety-orange rounded-sm flex items-center justify-center">
                <HardHat className="w-6 h-6 text-white" />
              </div>
              <span className="font-heading font-bold text-xl text-blueprint-navy">BuildForce</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link to="/jobs" className="text-slate-600 hover:text-safety-orange transition-colors font-medium">
                Find Jobs
              </Link>
              <Link to="/pricing" className="text-safety-orange font-medium">
                For Employers
              </Link>
              {isAuthenticated ? (
                <Button 
                  onClick={() => navigate(user?.user_type === 'talent' ? '/talent/dashboard' : '/hirer/dashboard')}
                  className="bg-safety-orange hover:bg-safety-orange-dark text-white font-bold rounded-sm"
                >
                  Dashboard
                </Button>
              ) : (
                <div className="flex items-center gap-3">
                  <Button variant="ghost" onClick={() => navigate('/login')}>Sign In</Button>
                  <Button onClick={() => navigate('/register')} className="bg-safety-orange text-white rounded-sm">
                    Get Started
                  </Button>
                </div>
              )}
            </div>

            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-steel-grey p-4 space-y-4">
            <Link to="/jobs" className="block text-slate-600 py-2">Find Jobs</Link>
            <Link to="/pricing" className="block text-safety-orange font-medium py-2">For Employers</Link>
            {isAuthenticated ? (
              <Button onClick={() => navigate(user?.user_type === 'talent' ? '/talent/dashboard' : '/hirer/dashboard')} className="w-full bg-safety-orange text-white">
                Dashboard
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => navigate('/login')} className="w-full">Sign In</Button>
                <Button onClick={() => navigate('/register')} className="w-full bg-safety-orange text-white">Get Started</Button>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="bg-blueprint-navy py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-safety-orange/20 border border-safety-orange/30 rounded-sm px-4 py-2 mb-6">
            <Building2 className="w-4 h-4 text-safety-orange" />
            <span className="text-safety-orange font-medium text-sm uppercase tracking-wide">For Employers</span>
          </div>
          
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Find the Best Construction Talent
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Choose a plan that fits your hiring needs. Post jobs, access our talent pool, 
            and build your team with the best in the industry.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white py-8 border-b border-steel-grey">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Users, value: '50,000+', label: 'Skilled Workers' },
              { icon: Briefcase, value: '10,000+', label: 'Jobs Posted' },
              { icon: Clock, value: '3 Days', label: 'Avg. Time to Hire' },
              { icon: Star, value: '4.9/5', label: 'Employer Rating' }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-10 h-10 bg-safety-orange/10 rounded-sm flex items-center justify-center mx-auto mb-2">
                  <stat.icon className="w-5 h-5 text-safety-orange" />
                </div>
                <p className="font-heading font-bold text-xl text-blueprint-navy">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-blueprint-navy mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-slate-600">
              No hidden fees. Cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {PLANS.map((plan) => (
              <Card 
                key={plan.id}
                className={`relative border rounded-sm transition-all ${
                  plan.highlighted 
                    ? 'border-safety-orange shadow-lg scale-105 z-10' 
                    : 'border-steel-grey hover:border-safety-orange/50'
                }`}
                data-testid={`pricing-card-${plan.id}`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-safety-orange text-white text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-sm">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="font-heading text-xl text-blueprint-navy">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-heading font-bold text-blueprint-navy">${plan.price}</span>
                    <span className="text-slate-500">/month</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">{plan.description}</p>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                        <Check className="w-5 h-5 text-safety-orange flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={subscribing === plan.id}
                    className={`w-full rounded-sm font-bold ${
                      plan.highlighted
                        ? 'bg-safety-orange hover:bg-safety-orange-dark text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-blueprint-navy'
                    }`}
                    data-testid={`subscribe-btn-${plan.id}`}
                  >
                    {subscribing === plan.id ? 'Processing...' : 'Get Started'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-16 sm:py-20 border-t border-steel-grey">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-blueprint-navy mb-4">
              Why Choose BuildForce for Hiring?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: 'Verified Talent Pool',
                description: 'Access 50,000+ pre-screened construction professionals with verified skills and experience.'
              },
              {
                icon: Zap,
                title: 'Fast Hiring',
                description: 'Fill positions 3x faster with our advanced matching algorithm and applicant tracking.'
              },
              {
                icon: Shield,
                title: 'Quality Guaranteed',
                description: 'Our platform ensures you connect with serious, qualified candidates ready to work.'
              }
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-14 h-14 bg-safety-orange/10 rounded-sm flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-7 h-7 text-safety-orange" />
                </div>
                <h3 className="font-heading font-semibold text-lg text-blueprint-navy mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-safety-orange py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-4">
            Ready to Build Your Team?
          </h2>
          <p className="text-white/90 mb-8">
            Join thousands of construction companies already hiring on BuildForce
          </p>
          <Button 
            onClick={() => navigate('/register')}
            className="bg-white text-safety-orange hover:bg-slate-100 font-bold rounded-sm px-8"
            data-testid="cta-signup-btn"
          >
            Create Employer Account
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blueprint-navy text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-safety-orange rounded-sm flex items-center justify-center">
              <HardHat className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-bold text-lg">BuildForce</span>
          </div>
          <p className="text-sm text-slate-400">
            &copy; {new Date().getFullYear()} BuildForce. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
