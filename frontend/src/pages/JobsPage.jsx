import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { API } from '../App';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { 
  HardHat, Search, MapPin, Briefcase, Clock, DollarSign, 
  Filter, X, Building2, Bookmark, BookmarkCheck, Menu
} from 'lucide-react';

const JOB_CATEGORIES = [
  "Electrician", "Plumber", "Carpenter", "Mason", "Heavy Equipment Operator",
  "Site Supervisor", "Project Manager", "Welder", "HVAC Technician", "Painter",
  "Roofer", "Concrete Worker", "Steel Worker", "Crane Operator", "Safety Officer",
  "Civil Engineer", "Architect", "Surveyor", "Foreman", "Laborer"
];

const EXPERIENCE_LEVELS = ["Entry Level", "Junior (1-3 years)", "Mid-Level (3-5 years)", "Senior (5-10 years)", "Expert (10+ years)"];
const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Temporary", "Freelance"];

export default function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, getAuthHeaders } = useAuth();
  
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Filter states
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [experienceLevel, setExperienceLevel] = useState(searchParams.get('experience') || '');
  const [employmentType, setEmploymentType] = useState(searchParams.get('type') || '');

  useEffect(() => {
    fetchJobs();
    if (isAuthenticated && user?.user_type === 'talent') {
      fetchSavedJobs();
    }
  }, [searchParams, isAuthenticated, user]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchParams.get('search')) params.append('search', searchParams.get('search'));
      if (searchParams.get('category')) params.append('category', searchParams.get('category'));
      if (searchParams.get('location')) params.append('location', searchParams.get('location'));
      if (searchParams.get('experience')) params.append('experience_level', searchParams.get('experience'));
      if (searchParams.get('type')) params.append('employment_type', searchParams.get('type'));

      const response = await fetch(`${API}/jobs?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedJobs = async () => {
    try {
      const response = await fetch(`${API}/saved-jobs`, {
        credentials: 'include',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setSavedJobs(new Set(data.map(job => job.job_id)));
      }
    } catch (error) {
      console.error('Failed to fetch saved jobs:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (location) params.set('location', location);
    if (experienceLevel) params.set('experience', experienceLevel);
    if (employmentType) params.set('type', employmentType);
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setLocation('');
    setExperienceLevel('');
    setEmploymentType('');
    setSearchParams({});
  };

  const toggleSaveJob = async (jobId) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to save jobs');
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`${API}/saved-jobs/${jobId}`, {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        if (data.saved) {
          setSavedJobs(prev => new Set([...prev, jobId]));
          toast.success('Job saved');
        } else {
          setSavedJobs(prev => {
            const newSet = new Set(prev);
            newSet.delete(jobId);
            return newSet;
          });
          toast.success('Job removed from saved');
        }
      }
    } catch (error) {
      toast.error('Failed to save job');
    }
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Not specified';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `From $${min.toLocaleString()}`;
    return `Up to $${max.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-concrete-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-steel-grey">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2" data-testid="jobs-logo">
              <div className="w-10 h-10 bg-safety-orange rounded-sm flex items-center justify-center">
                <HardHat className="w-6 h-6 text-white" />
              </div>
              <span className="font-heading font-bold text-xl text-blueprint-navy">BuildForce</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link to="/jobs" className="text-safety-orange font-medium">Find Jobs</Link>
              <Link to="/pricing" className="text-slate-600 hover:text-safety-orange transition-colors">For Employers</Link>
              {isAuthenticated ? (
                <Button 
                  onClick={() => navigate(user?.user_type === 'talent' ? '/talent/dashboard' : '/hirer/dashboard')}
                  className="bg-safety-orange hover:bg-safety-orange-dark text-white font-bold rounded-sm"
                  data-testid="jobs-dashboard-btn"
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
            <Link to="/jobs" className="block text-safety-orange font-medium py-2">Find Jobs</Link>
            <Link to="/pricing" className="block text-slate-600 py-2">For Employers</Link>
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

      {/* Search Header */}
      <div className="bg-blueprint-navy py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-6">
            Find Construction Jobs
          </h1>
          
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Job title, keywords, or company"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-12 rounded-sm bg-white border-0"
                data-testid="job-search-input"
              />
            </div>
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="City, state, or remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-10 h-12 rounded-sm bg-white border-0"
                data-testid="job-location-input"
              />
            </div>
            <Button 
              type="submit" 
              className="h-12 px-8 bg-safety-orange hover:bg-safety-orange-dark text-white font-bold rounded-sm"
              data-testid="job-search-btn"
            >
              <Search className="w-5 h-5 mr-2" />
              Search Jobs
            </Button>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="lg:hidden mb-4">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="w-full rounded-sm"
                data-testid="toggle-filters-btn"
              >
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>

            <div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
              <Card className="border border-steel-grey rounded-sm">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading font-semibold text-blueprint-navy">Filters</h3>
                    <button
                      onClick={clearFilters}
                      className="text-sm text-safety-orange hover:underline"
                      data-testid="clear-filters-btn"
                    >
                      Clear all
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Category</label>
                    <Select value={category || "all"} onValueChange={(v) => setCategory(v === "all" ? "" : v)}>
                      <SelectTrigger className="rounded-sm" data-testid="category-filter">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {JOB_CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Experience Level</label>
                    <Select value={experienceLevel || "all"} onValueChange={(v) => setExperienceLevel(v === "all" ? "" : v)}>
                      <SelectTrigger className="rounded-sm" data-testid="experience-filter">
                        <SelectValue placeholder="Any Experience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Experience</SelectItem>
                        {EXPERIENCE_LEVELS.map(level => (
                          <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Employment Type</label>
                    <Select value={employmentType || "all"} onValueChange={(v) => setEmploymentType(v === "all" ? "" : v)}>
                      <SelectTrigger className="rounded-sm" data-testid="employment-type-filter">
                        <SelectValue placeholder="Any Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Type</SelectItem>
                        {EMPLOYMENT_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={handleSearch}
                    className="w-full bg-safety-orange hover:bg-safety-orange-dark text-white rounded-sm"
                    data-testid="apply-filters-btn"
                  >
                    Apply Filters
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Job Listings */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-600">
                {loading ? 'Loading...' : `${jobs.length} jobs found`}
              </p>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="border border-steel-grey rounded-sm animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <Card className="border border-steel-grey rounded-sm">
                <CardContent className="p-12 text-center">
                  <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="font-heading font-semibold text-lg text-blueprint-navy mb-2">
                    No jobs found
                  </h3>
                  <p className="text-slate-600 mb-4">
                    Try adjusting your filters or search terms
                  </p>
                  <Button onClick={clearFilters} variant="outline" className="rounded-sm">
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <Card 
                    key={job.job_id}
                    className="border border-steel-grey rounded-sm hover:border-safety-orange/50 hover:shadow-md transition-all cursor-pointer group"
                    data-testid={`job-card-${job.job_id}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1" onClick={() => navigate(`/jobs/${job.job_id}`)}>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-slate-100 rounded-sm flex items-center justify-center">
                              {job.company_logo ? (
                                <img src={job.company_logo} alt={job.company_name} className="w-10 h-10 object-contain" />
                              ) : (
                                <Building2 className="w-6 h-6 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-heading font-semibold text-lg text-blueprint-navy group-hover:text-safety-orange transition-colors">
                                {job.title}
                              </h3>
                              <p className="text-slate-600">{job.company_name}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-3">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {job.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-4 h-4" />
                              {job.employment_type}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              {formatSalary(job.salary_min, job.salary_max)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDate(job.created_at)}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="rounded-sm bg-slate-100 text-slate-700">
                              {job.category}
                            </Badge>
                            <Badge variant="secondary" className="rounded-sm bg-slate-100 text-slate-700">
                              {job.experience_level}
                            </Badge>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSaveJob(job.job_id);
                          }}
                          className="p-2 hover:bg-slate-100 rounded-sm transition-colors"
                          data-testid={`save-job-${job.job_id}`}
                        >
                          {savedJobs.has(job.job_id) ? (
                            <BookmarkCheck className="w-5 h-5 text-safety-orange" />
                          ) : (
                            <Bookmark className="w-5 h-5 text-slate-400 hover:text-safety-orange" />
                          )}
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
