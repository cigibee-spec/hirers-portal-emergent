import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { API } from '../App';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { 
  HardHat, MapPin, Briefcase, Clock, DollarSign, Building2, 
  ArrowLeft, Bookmark, BookmarkCheck, CheckCircle, Send, Menu, X
} from 'lucide-react';

export default function JobDetailPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, getAuthHeaders } = useAuth();
  
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchJob();
    if (isAuthenticated && user?.user_type === 'talent') {
      checkSavedStatus();
      checkApplicationStatus();
    }
  }, [jobId, isAuthenticated, user]);

  const fetchJob = async () => {
    try {
      const response = await fetch(`${API}/jobs/${jobId}`);
      if (response.ok) {
        const data = await response.json();
        setJob(data);
      } else {
        toast.error('Job not found');
        navigate('/jobs');
      }
    } catch (error) {
      console.error('Failed to fetch job:', error);
      toast.error('Failed to load job');
    } finally {
      setLoading(false);
    }
  };

  const checkSavedStatus = async () => {
    try {
      const response = await fetch(`${API}/saved-jobs`, {
        credentials: 'include',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const savedJobs = await response.json();
        setIsSaved(savedJobs.some(j => j.job_id === jobId));
      }
    } catch (error) {
      console.error('Failed to check saved status:', error);
    }
  };

  const checkApplicationStatus = async () => {
    try {
      const response = await fetch(`${API}/applications/my-applications`, {
        credentials: 'include',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const applications = await response.json();
        setHasApplied(applications.some(app => app.job_id === jobId));
      }
    } catch (error) {
      console.error('Failed to check application status:', error);
    }
  };

  const toggleSaveJob = async () => {
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
        setIsSaved(data.saved);
        toast.success(data.saved ? 'Job saved' : 'Job removed from saved');
      }
    } catch (error) {
      toast.error('Failed to save job');
    }
  };

  const handleApply = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to apply');
      navigate('/login');
      return;
    }

    if (user?.user_type !== 'talent') {
      toast.error('Only job seekers can apply to jobs');
      return;
    }

    setApplying(true);
    try {
      const response = await fetch(`${API}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        credentials: 'include',
        body: JSON.stringify({
          job_id: jobId,
          cover_letter: coverLetter || null
        })
      });

      if (response.ok) {
        toast.success('Application submitted successfully!');
        setHasApplied(true);
        setShowApplyDialog(false);
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to submit application');
      }
    } catch (error) {
      toast.error('Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Not specified';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()} per year`;
    if (min) return `From $${min.toLocaleString()} per year`;
    return `Up to $${max.toLocaleString()} per year`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-concrete-white">
        <div className="w-12 h-12 border-4 border-safety-orange border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!job) return null;

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
            <Link to="/jobs" className="block text-slate-600 font-medium py-2">Find Jobs</Link>
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

      {/* Back Button */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <button
          onClick={() => navigate('/jobs')}
          className="flex items-center gap-2 text-slate-600 hover:text-safety-orange transition-colors"
          data-testid="back-to-jobs-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Jobs
        </button>
      </div>

      {/* Job Header */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border border-steel-grey rounded-sm">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-slate-100 rounded-sm flex items-center justify-center flex-shrink-0">
                  {job.company_logo ? (
                    <img src={job.company_logo} alt={job.company_name} className="w-14 h-14 object-contain" />
                  ) : (
                    <Building2 className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div>
                  <h1 className="font-heading text-2xl sm:text-3xl font-bold text-blueprint-navy mb-2" data-testid="job-title">
                    {job.title}
                  </h1>
                  <p className="text-lg text-slate-600 mb-4">{job.company_name}</p>
                  
                  <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      {job.employment_type}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Posted {formatDate(job.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={toggleSaveJob}
                  className="rounded-sm"
                  data-testid="save-job-btn"
                >
                  {isSaved ? (
                    <BookmarkCheck className="w-5 h-5 text-safety-orange" />
                  ) : (
                    <Bookmark className="w-5 h-5" />
                  )}
                </Button>
                
                {hasApplied ? (
                  <Button disabled className="bg-green-600 text-white rounded-sm" data-testid="applied-badge">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Applied
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowApplyDialog(true)}
                    className="bg-safety-orange hover:bg-safety-orange-dark text-white font-bold rounded-sm px-6"
                    data-testid="apply-now-btn"
                  >
                    Apply Now
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job Details */}
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <div className="md:col-span-2 space-y-6">
            {/* Description */}
            <Card className="border border-steel-grey rounded-sm">
              <CardContent className="p-6">
                <h2 className="font-heading text-xl font-bold text-blueprint-navy mb-4">Job Description</h2>
                <div className="prose prose-slate max-w-none text-slate-600 whitespace-pre-line" data-testid="job-description">
                  {job.description}
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
            {job.skills_required?.length > 0 && (
              <Card className="border border-steel-grey rounded-sm">
                <CardContent className="p-6">
                  <h2 className="font-heading text-xl font-bold text-blueprint-navy mb-4">Required Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {job.skills_required.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="rounded-sm bg-slate-100 text-slate-700">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Benefits */}
            {job.benefits?.length > 0 && (
              <Card className="border border-steel-grey rounded-sm">
                <CardContent className="p-6">
                  <h2 className="font-heading text-xl font-bold text-blueprint-navy mb-4">Benefits</h2>
                  <ul className="space-y-2">
                    {job.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center gap-2 text-slate-600">
                        <CheckCircle className="w-4 h-4 text-safety-orange flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border border-steel-grey rounded-sm">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-heading font-semibold text-blueprint-navy">Job Overview</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-safety-orange/10 rounded-sm flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-safety-orange" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Salary</p>
                      <p className="font-medium text-blueprint-navy">{formatSalary(job.salary_min, job.salary_max)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-safety-orange/10 rounded-sm flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-safety-orange" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Category</p>
                      <p className="font-medium text-blueprint-navy">{job.category}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-safety-orange/10 rounded-sm flex items-center justify-center">
                      <Clock className="w-5 h-5 text-safety-orange" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Experience</p>
                      <p className="font-medium text-blueprint-navy">{job.experience_level}</p>
                    </div>
                  </div>

                  {job.application_deadline && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-sm flex items-center justify-center">
                        <Clock className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Deadline</p>
                        <p className="font-medium text-red-600">{formatDate(job.application_deadline)}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-steel-grey">
                  <p className="text-sm text-slate-500 mb-1">Applications</p>
                  <p className="font-mono font-medium text-blueprint-navy">{job.applications_count} applicants</p>
                </div>
              </CardContent>
            </Card>

            {/* Company Card */}
            <Card className="border border-steel-grey rounded-sm">
              <CardContent className="p-6">
                <h3 className="font-heading font-semibold text-blueprint-navy mb-4">About the Company</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-sm flex items-center justify-center">
                    {job.company_logo ? (
                      <img src={job.company_logo} alt={job.company_name} className="w-10 h-10 object-contain" />
                    ) : (
                      <Building2 className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-blueprint-navy">{job.company_name}</p>
                    <p className="text-sm text-slate-500">Construction Company</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Apply Dialog */}
      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent className="sm:max-w-lg rounded-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Apply for {job.title}</DialogTitle>
            <DialogDescription>
              at {job.company_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Cover Letter (Optional)
              </label>
              <Textarea
                placeholder="Tell the employer why you're a great fit for this role..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={6}
                className="rounded-sm resize-none"
                data-testid="cover-letter-input"
              />
            </div>
            
            <p className="text-sm text-slate-500">
              Your profile and resume will be shared with the employer.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApplyDialog(false)} className="rounded-sm">
              Cancel
            </Button>
            <Button 
              onClick={handleApply} 
              disabled={applying}
              className="bg-safety-orange hover:bg-safety-orange-dark text-white rounded-sm"
              data-testid="submit-application-btn"
            >
              {applying ? 'Submitting...' : 'Submit Application'}
              <Send className="w-4 h-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
