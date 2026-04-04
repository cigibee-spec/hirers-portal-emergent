import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { API } from '../App';
import {
  HardHat, Search, Building2, MapPin, Briefcase, Users, Menu, X, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CompaniesPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async (q = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('search', q);
      const res = await fetch(`${API}/companies?${params}`);
      if (res.ok) setCompanies(await res.json());
    } catch (err) {
      console.error('Failed to fetch companies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCompanies(search);
  };

  return (
    <div className="min-h-screen bg-concrete-white">
      {/* Nav */}
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
              <Link to="/jobs" className="text-slate-600 hover:text-safety-orange transition-colors font-medium">Find Jobs</Link>
              <Link to="/companies" className="text-safety-orange font-medium">Companies</Link>
              <Link to="/pricing" className="text-slate-600 hover:text-safety-orange transition-colors font-medium">For Employers</Link>
              {isAuthenticated ? (
                <Button onClick={() => navigate(user?.user_type === 'talent' ? '/talent/dashboard' : '/hirer/dashboard')} className="bg-safety-orange hover:bg-safety-orange-dark text-white font-bold rounded-sm">Dashboard</Button>
              ) : (
                <div className="flex items-center gap-3">
                  <Button variant="ghost" onClick={() => navigate('/login')}>Sign In</Button>
                  <Button onClick={() => navigate('/register')} className="bg-safety-orange text-white rounded-sm">Get Started</Button>
                </div>
              )}
            </div>
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-steel-grey p-4 space-y-3">
            <Link to="/jobs" className="block text-slate-600 py-2">Find Jobs</Link>
            <Link to="/companies" className="block text-safety-orange font-medium py-2">Companies</Link>
            <Link to="/pricing" className="block text-slate-600 py-2">For Employers</Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="bg-blueprint-navy py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Construction Companies
          </h1>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            Explore top construction companies hiring on BuildForce
          </p>
          <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search companies..."
                className="pl-10 bg-white border-steel-grey"
                data-testid="company-search-input"
              />
            </div>
            <Button type="submit" className="bg-safety-orange hover:bg-safety-orange-dark text-white rounded-sm" data-testid="company-search-btn">
              Search
            </Button>
          </form>
        </div>
      </section>

      {/* Companies Grid */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-safety-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-600">Loading companies...</p>
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-12" data-testid="no-companies">
              <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h2 className="font-heading text-xl font-bold text-blueprint-navy mb-2">No Companies Found</h2>
              <p className="text-slate-500">Check back later for new companies.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {companies.map((company) => (
                <Card
                  key={company.user_id}
                  className="border-steel-grey hover:border-safety-orange/50 transition-all cursor-pointer rounded-sm"
                  onClick={() => navigate(`/companies/${company.user_id}`)}
                  data-testid={`company-card-${company.user_id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 bg-blueprint-navy/10 rounded-sm flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-7 h-7 text-blueprint-navy" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-heading font-bold text-blueprint-navy truncate">
                          {company.company_name || company.name}
                        </h3>
                        <p className="text-sm text-slate-500">{company.industry || 'Construction'}</p>
                      </div>
                    </div>
                    {company.location && (
                      <p className="flex items-center gap-1 text-sm text-slate-600 mb-2">
                        <MapPin className="w-4 h-4" /> {company.location}
                      </p>
                    )}
                    {company.company_size && (
                      <p className="flex items-center gap-1 text-sm text-slate-600 mb-2">
                        <Users className="w-4 h-4" /> {company.company_size} employees
                      </p>
                    )}
                    <p className="flex items-center gap-1 text-sm text-safety-orange font-medium">
                      <Briefcase className="w-4 h-4" /> {company.active_jobs_count} active job{company.active_jobs_count !== 1 ? 's' : ''}
                    </p>
                    {company.company_description && (
                      <p className="text-sm text-slate-500 mt-3 line-clamp-2">{company.company_description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
