import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';
import { 
  HardHat, Building2, Users, Briefcase, Search, FileText, 
  CheckCircle, ArrowRight, Star, Menu, X, Zap, Shield, Clock
} from 'lucide-react';

const HERO_IMAGE = "https://images.unsplash.com/photo-1760449867527-26d7d732f88e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBjb25zdHJ1Y3Rpb24lMjBzaXRlJTIwc2t5bGluZXxlbnwwfHx8fDE3NjcyODM5NjN8MA&ixlib=rb-4.1.0&q=85";
const WORKER_IMAGE = "https://images.unsplash.com/photo-1760025128820-1548e72b3cba?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjB3b3JrZXIlMjBwb3J0cmFpdCUyMHNhZmV0eSUyMGdlYXJ8ZW58MHx8fHwxNzY3MjgzOTYxfDA&ixlib=rb-4.1.0&q=85";
const PLANNING_IMAGE = "https://images.pexels.com/photos/9617893/pexels-photo-9617893.jpeg";

const JOB_CATEGORIES = [
  { name: "Electrician", icon: Zap, count: 234 },
  { name: "Plumber", icon: Building2, count: 189 },
  { name: "Carpenter", icon: HardHat, count: 312 },
  { name: "Heavy Equipment", icon: Building2, count: 156 },
  { name: "Site Supervisor", icon: Users, count: 98 },
  { name: "Welder", icon: Shield, count: 167 }
];

const STATS = [
  { value: "10,000+", label: "Active Jobs" },
  { value: "5,000+", label: "Companies" },
  { value: "50,000+", label: "Skilled Workers" },
  { value: "95%", label: "Success Rate" }
];

export default function LandingPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getDashboardLink = () => {
    if (!isAuthenticated) return '/login';
    return user?.user_type === 'talent' ? '/talent/dashboard' : '/hirer/dashboard';
  };

  return (
    <div className="min-h-screen bg-concrete-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-steel-grey">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
              <div className="w-10 h-10 bg-safety-orange rounded-sm flex items-center justify-center">
                <HardHat className="w-6 h-6 text-white" />
              </div>
              <span className="font-heading font-bold text-xl text-blueprint-navy">BuildForce</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link to="/jobs" className="text-slate-600 hover:text-safety-orange transition-colors font-medium" data-testid="nav-jobs">
                Find Jobs
              </Link>
              <Link to="/pricing" className="text-slate-600 hover:text-safety-orange transition-colors font-medium" data-testid="nav-pricing">
                For Employers
              </Link>
              {isAuthenticated ? (
                <Button 
                  onClick={() => navigate(getDashboardLink())} 
                  className="bg-safety-orange hover:bg-safety-orange-dark text-white font-bold rounded-sm"
                  data-testid="nav-dashboard-btn"
                >
                  Dashboard
                </Button>
              ) : (
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate('/login')}
                    className="font-medium"
                    data-testid="nav-login-btn"
                  >
                    Sign In
                  </Button>
                  <Button 
                    onClick={() => navigate('/register')} 
                    className="bg-safety-orange hover:bg-safety-orange-dark text-white font-bold rounded-sm"
                    data-testid="nav-register-btn"
                  >
                    Get Started
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-btn"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-steel-grey p-4 space-y-4">
            <Link to="/jobs" className="block text-slate-600 font-medium py-2">Find Jobs</Link>
            <Link to="/pricing" className="block text-slate-600 font-medium py-2">For Employers</Link>
            {isAuthenticated ? (
              <Button onClick={() => navigate(getDashboardLink())} className="w-full bg-safety-orange text-white">
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

      {/* Hero Section */}
      <section className="relative pt-16 min-h-[90vh] flex items-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-blueprint-navy/80 to-blueprint-navy/95"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-safety-orange/20 border border-safety-orange/30 rounded-sm px-4 py-2 mb-6">
              <span className="w-2 h-2 bg-safety-orange rounded-full animate-pulse"></span>
              <span className="text-safety-orange font-medium text-sm uppercase tracking-wide">
                #1 Construction Job Platform
              </span>
            </div>
            
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Build Your Career in<br />
              <span className="text-safety-orange">Construction</span>
            </h1>
            
            <p className="text-lg text-slate-300 mb-8 leading-relaxed max-w-2xl">
              Connect with top construction companies. Whether you're a skilled tradesperson 
              or an employer seeking talent, BuildForce is your platform for success.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg"
                onClick={() => navigate('/jobs')}
                className="bg-safety-orange hover:bg-safety-orange-dark text-white font-bold rounded-sm px-8 py-6 text-base uppercase tracking-wide"
                data-testid="hero-find-jobs-btn"
              >
                <Search className="w-5 h-5 mr-2" />
                Find Jobs
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate('/pricing')}
                className="border-2 border-white text-white hover:bg-white hover:text-blueprint-navy font-bold rounded-sm px-8 py-6 text-base uppercase tracking-wide"
                data-testid="hero-post-jobs-btn"
              >
                <Briefcase className="w-5 h-5 mr-2" />
                Post Jobs
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-12 border-b border-steel-grey">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="font-heading text-3xl sm:text-4xl font-bold text-safety-orange mb-1">
                  {stat.value}
                </p>
                <p className="text-slate-600 font-medium uppercase tracking-wide text-sm">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Job Categories */}
      <section className="py-20 bg-concrete-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-blueprint-navy mb-4">
              Browse by Trade
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Find opportunities in your specialized construction trade
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {JOB_CATEGORIES.map((category, index) => (
              <Card 
                key={index}
                className="group cursor-pointer border border-steel-grey hover:border-safety-orange/50 rounded-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                onClick={() => navigate(`/jobs?category=${category.name}`)}
                data-testid={`category-card-${category.name.toLowerCase().replace(' ', '-')}`}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-slate-100 group-hover:bg-safety-orange/10 rounded-sm flex items-center justify-center mx-auto mb-3 transition-colors">
                    <category.icon className="w-6 h-6 text-slate-600 group-hover:text-safety-orange transition-colors" />
                  </div>
                  <h3 className="font-heading font-semibold text-blueprint-navy mb-1">{category.name}</h3>
                  <p className="text-sm text-slate-500">{category.count} jobs</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button 
              variant="outline" 
              onClick={() => navigate('/jobs')}
              className="border-blueprint-navy text-blueprint-navy hover:bg-blueprint-navy hover:text-white font-bold rounded-sm"
              data-testid="view-all-categories-btn"
            >
              View All Categories
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* For Talents Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-safety-orange/10 rounded-sm px-3 py-1 mb-4">
                <Users className="w-4 h-4 text-safety-orange" />
                <span className="text-safety-orange font-medium text-sm uppercase tracking-wide">For Talents</span>
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-blueprint-navy mb-6">
                Launch Your Construction Career
              </h2>
              <ul className="space-y-4 mb-8">
                {[
                  "Create ATS-optimized resumes with AI assistance",
                  "Get matched with jobs that fit your skills",
                  "Apply to multiple jobs with one click",
                  "Track your applications in real-time"
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-safety-orange flex-shrink-0 mt-0.5" />
                    <span className="text-slate-600">{item}</span>
                  </li>
                ))}
              </ul>
              <Button 
                onClick={() => navigate('/register')}
                className="bg-safety-orange hover:bg-safety-orange-dark text-white font-bold rounded-sm px-6"
                data-testid="talent-signup-btn"
              >
                Create Free Account
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            <div className="relative">
              <img 
                src={WORKER_IMAGE} 
                alt="Construction worker" 
                className="rounded-sm shadow-xl w-full"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-sm shadow-lg border border-steel-grey">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-blueprint-navy">100% Free</p>
                    <p className="text-sm text-slate-500">For job seekers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Employers Section */}
      <section className="py-20 bg-blueprint-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 relative">
              <img 
                src={PLANNING_IMAGE} 
                alt="Construction planning" 
                className="rounded-sm shadow-xl w-full"
              />
              <div className="absolute -bottom-6 -right-6 bg-safety-orange p-4 rounded-sm shadow-lg">
                <div className="text-white">
                  <p className="font-heading font-bold text-2xl">3x Faster</p>
                  <p className="text-sm opacity-90">Average hiring time</p>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-sm px-3 py-1 mb-4">
                <Building2 className="w-4 h-4 text-safety-orange" />
                <span className="text-safety-orange font-medium text-sm uppercase tracking-wide">For Employers</span>
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-6">
                Find Skilled Workers Fast
              </h2>
              <ul className="space-y-4 mb-8">
                {[
                  "Access 50,000+ verified construction professionals",
                  "Post unlimited jobs with Enterprise plan",
                  "Advanced search and filtering tools",
                  "Dedicated account management"
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-safety-orange flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>
              <Button 
                onClick={() => navigate('/pricing')}
                className="bg-safety-orange hover:bg-safety-orange-dark text-white font-bold rounded-sm px-6"
                data-testid="employer-pricing-btn"
              >
                View Pricing Plans
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-concrete-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-blueprint-navy mb-4">
              Trusted by Industry Leaders
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "BuildForce helped us fill 20 positions in just two weeks. The quality of candidates is outstanding.",
                name: "Michael Chen",
                role: "HR Director, BuildRight Construction",
                rating: 5
              },
              {
                quote: "As an electrician, I found my dream job within days. The AI resume builder really made a difference.",
                name: "Sarah Johnson",
                role: "Master Electrician",
                rating: 5
              },
              {
                quote: "The subscription is worth every penny. We've reduced our hiring costs by 40%.",
                name: "David Martinez",
                role: "CEO, Martinez & Sons",
                rating: 5
              }
            ].map((testimonial, index) => (
              <Card key={index} className="border border-steel-grey rounded-sm">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-caution-yellow text-caution-yellow" />
                    ))}
                  </div>
                  <p className="text-slate-600 mb-6 italic">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-semibold text-blueprint-navy">{testimonial.name}</p>
                    <p className="text-sm text-slate-500">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-safety-orange">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Build Your Future?
          </h2>
          <p className="text-white/90 text-lg mb-8">
            Join thousands of construction professionals and companies already on BuildForce
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => navigate('/register')}
              className="bg-white text-safety-orange hover:bg-slate-100 font-bold rounded-sm px-8"
              data-testid="cta-get-started-btn"
            >
              Get Started Free
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate('/jobs')}
              className="border-2 border-white text-white hover:bg-white hover:text-safety-orange font-bold rounded-sm px-8"
              data-testid="cta-browse-jobs-btn"
            >
              Browse Jobs
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blueprint-navy text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-safety-orange rounded-sm flex items-center justify-center">
                  <HardHat className="w-6 h-6 text-white" />
                </div>
                <span className="font-heading font-bold text-xl">BuildForce</span>
              </div>
              <p className="text-slate-400 text-sm">
                The #1 platform for construction employment and recruiting.
              </p>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4">For Talents</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/jobs" className="hover:text-safety-orange transition-colors">Browse Jobs</Link></li>
                <li><Link to="/register" className="hover:text-safety-orange transition-colors">Create Account</Link></li>
                <li><Link to="/talent/resume-builder" className="hover:text-safety-orange transition-colors">Resume Builder</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4">For Employers</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/pricing" className="hover:text-safety-orange transition-colors">Pricing</Link></li>
                <li><Link to="/register" className="hover:text-safety-orange transition-colors">Post a Job</Link></li>
                <li><Link to="/register" className="hover:text-safety-orange transition-colors">Browse Talent</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-safety-orange transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-safety-orange transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-safety-orange transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8 text-center text-sm text-slate-400">
            <p>&copy; {new Date().getFullYear()} BuildForce. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
