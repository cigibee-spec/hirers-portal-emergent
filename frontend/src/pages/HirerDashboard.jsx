import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { API } from '../App';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { 
  HardHat, Plus, Briefcase, Users, FileText, Settings, LogOut,
  Building2, MapPin, DollarSign, Clock, Edit, Trash2, Eye, CheckCircle, X, Save, ChevronRight,
  BarChart3, MessageSquare, TrendingUp, Calendar, Video
} from 'lucide-react';

const JOB_CATEGORIES = [
  "Electrician", "Plumber", "Carpenter", "Mason", "Heavy Equipment Operator",
  "Site Supervisor", "Project Manager", "Welder", "HVAC Technician", "Painter",
  "Roofer", "Concrete Worker", "Steel Worker", "Crane Operator", "Safety Officer"
];

const EXPERIENCE_LEVELS = ["Entry Level", "Junior (1-3 years)", "Mid-Level (3-5 years)", "Senior (5-10 years)", "Expert (10+ years)"];
const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Temporary", "Freelance"];

const EMPTY_JOB = {
  title: '',
  description: '',
  category: '',
  location: '',
  employment_type: '',
  experience_level: '',
  salary_min: '',
  salary_max: '',
  skills_required: [],
  benefits: [],
  application_deadline: ''
};

export default function HirerDashboard() {
  const { user, logout, getAuthHeaders, updateUser, switchUserType, checkAuth } = useAuth();
  const navigate = useNavigate();
  
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState({});
  const [loading, setLoading] = useState(true);
  const [showJobDialog, setShowJobDialog] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [jobForm, setJobForm] = useState(EMPTY_JOB);
  const [savingJob, setSavingJob] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profile, setProfile] = useState(user?.hirer_profile || {});
  const [skillInput, setSkillInput] = useState('');
  const [benefitInput, setBenefitInput] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [schedulingInterview, setSchedulingInterview] = useState(null);
  const [interviewForm, setInterviewForm] = useState({ scheduled_at: '', duration_minutes: 30, interview_type: 'video', notes: '' });

  const subscription = user?.subscription;
  const hasActiveSubscription = subscription?.status === 'active';

  useEffect(() => {
    if (hasActiveSubscription) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [hasActiveSubscription]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/jobs/hirer/my-jobs`, {
        credentials: 'include',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const jobsData = await response.json();
        setJobs(jobsData);

        // Fetch applications for each job
        const appsMap = {};
        for (const job of jobsData) {
          const appRes = await fetch(`${API}/applications/job/${job.job_id}`, {
            credentials: 'include',
            headers: getAuthHeaders()
          });
          if (appRes.ok) {
            appsMap[job.job_id] = await appRes.json();
          }
        }
        setApplications(appsMap);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = () => {
    setEditingJob(null);
    setJobForm(EMPTY_JOB);
    setShowJobDialog(true);
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    setJobForm({
      ...job,
      salary_min: job.salary_min?.toString() || '',
      salary_max: job.salary_max?.toString() || ''
    });
    setShowJobDialog(true);
  };

  const handleSaveJob = async () => {
    if (!jobForm.title || !jobForm.description || !jobForm.category || !jobForm.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSavingJob(true);
    try {
      const payload = {
        ...jobForm,
        salary_min: jobForm.salary_min ? parseInt(jobForm.salary_min) : null,
        salary_max: jobForm.salary_max ? parseInt(jobForm.salary_max) : null
      };

      const url = editingJob 
        ? `${API}/jobs/${editingJob.job_id}`
        : `${API}/jobs`;

      const response = await fetch(url, {
        method: editingJob ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success(editingJob ? 'Job updated successfully' : 'Job posted successfully');
        setShowJobDialog(false);
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to save job');
      }
    } catch (error) {
      toast.error('Failed to save job');
    } finally {
      setSavingJob(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!confirm('Are you sure you want to close this job?')) return;

    try {
      const response = await fetch(`${API}/jobs/${jobId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        toast.success('Job closed successfully');
        fetchData();
      } else {
        toast.error('Failed to close job');
      }
    } catch (error) {
      toast.error('Failed to close job');
    }
  };

  const handleUpdateApplicationStatus = async (applicationId, status) => {
    try {
      const response = await fetch(`${API}/applications/${applicationId}/status?status=${status}`, {
        method: 'PUT',
        credentials: 'include',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        toast.success('Application status updated');
        fetchData();
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const response = await fetch(`${API}/profile/hirer`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        credentials: 'include',
        body: JSON.stringify(profile)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        updateUser(updatedUser);
        toast.success('Company profile updated');
        setEditingProfile(false);
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleSwitchToTalent = async () => {
    try {
      await switchUserType();
      toast.success('Switched to job seeker account');
      navigate('/talent/dashboard');
    } catch (error) {
      toast.error('Failed to switch account type');
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`${API}/analytics/hirer`, {
        credentials: 'include', headers: getAuthHeaders()
      });
      if (res.ok) setAnalytics(await res.json());
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleScheduleInterview = async (app) => {
    if (!interviewForm.scheduled_at) {
      toast.error('Please select a date and time');
      return;
    }
    try {
      const res = await fetch(`${API}/interviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        credentials: 'include',
        body: JSON.stringify({
          application_id: app.application_id,
          talent_id: app.talent_id,
          job_id: app.job_id,
          scheduled_at: new Date(interviewForm.scheduled_at).toISOString(),
          duration_minutes: interviewForm.duration_minutes,
          interview_type: interviewForm.interview_type,
          notes: interviewForm.notes
        })
      });
      if (res.ok) {
        toast.success('Interview scheduled!');
        setSchedulingInterview(null);
        setInterviewForm({ scheduled_at: '', duration_minutes: 30, interview_type: 'video', notes: '' });
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Failed to schedule');
      }
    } catch (err) {
      toast.error('Failed to schedule interview');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const addSkill = () => {
    if (skillInput.trim() && !jobForm.skills_required.includes(skillInput.trim())) {
      setJobForm({ ...jobForm, skills_required: [...jobForm.skills_required, skillInput.trim()] });
      setSkillInput('');
    }
  };

  const addBenefit = () => {
    if (benefitInput.trim() && !jobForm.benefits.includes(benefitInput.trim())) {
      setJobForm({ ...jobForm, benefits: [...jobForm.benefits, benefitInput.trim()] });
      setBenefitInput('');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const totalApplications = Object.values(applications).reduce((sum, apps) => sum + apps.length, 0);

  // No subscription view
  if (!hasActiveSubscription) {
    return (
      <div className="min-h-screen bg-concrete-white">
        <nav className="sticky top-0 z-50 bg-white border-b border-steel-grey">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-safety-orange rounded-sm flex items-center justify-center">
                  <HardHat className="w-6 h-6 text-white" />
                </div>
                <span className="font-heading font-bold text-xl text-blueprint-navy">BuildForce</span>
              </Link>
              <Button variant="ghost" onClick={handleLogout} className="text-slate-600">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </nav>

        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 bg-safety-orange/10 rounded-sm flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-10 h-10 text-safety-orange" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-blueprint-navy mb-4" data-testid="hirer-dashboard">
            Welcome, {user?.name}
          </h1>
          <p className="text-slate-600 text-lg mb-8">
            You need an active subscription to post jobs and view applications.
          </p>
          <Button 
            onClick={() => navigate('/pricing')}
            className="bg-safety-orange hover:bg-safety-orange-dark text-white font-bold rounded-sm px-8 py-3"
            data-testid="subscribe-cta-btn"
          >
            View Subscription Plans
          </Button>
          <div className="mt-6">
            <Button variant="link" onClick={handleSwitchToTalent} className="text-slate-600">
              Switch to Job Seeker Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

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

            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={handleLogout} className="text-slate-600" data-testid="logout-btn">
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-safety-orange/10 rounded-sm flex items-center justify-center">
              <Building2 className="w-8 h-8 text-safety-orange" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-blueprint-navy">
                {profile.company_name || user?.name}
              </h1>
              <p className="text-slate-600">Employer Dashboard</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={handleCreateJob}
              className="bg-safety-orange hover:bg-safety-orange-dark text-white rounded-sm"
              data-testid="post-job-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Post New Job
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/messages')}
              className="rounded-sm"
              data-testid="hirer-messages-btn"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/interviews')}
              className="rounded-sm"
              data-testid="hirer-interviews-btn"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Interviews
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSwitchToTalent}
              className="rounded-sm"
            >
              Switch to Job Seeker
            </Button>
          </div>
        </div>

        {/* Subscription Banner */}
        <Card className="mb-6 bg-gradient-to-r from-blueprint-navy to-blueprint-navy-light text-white border-0 rounded-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className="bg-safety-orange text-white rounded-sm uppercase">
                {subscription?.plan}
              </Badge>
              <span>
                {subscription?.plan === 'enterprise' ? 'Unlimited' : `${subscription?.job_posts_used || 0} / ${subscription?.plan === 'pro' ? 25 : 5}`} job posts used
              </span>
            </div>
            <Button variant="secondary" size="sm" className="rounded-sm" onClick={() => navigate('/pricing')}>
              Upgrade Plan
            </Button>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Active Jobs', value: jobs.filter(j => j.status === 'active').length, icon: Briefcase },
            { label: 'Total Applications', value: totalApplications, icon: FileText },
            { label: 'Resume Views', value: subscription?.resume_views_used || 0, icon: Eye },
            { label: 'Shortlisted', value: Object.values(applications).flat().filter(a => a.status === 'shortlisted').length, icon: CheckCircle }
          ].map((stat, index) => (
            <Card key={index} className="border border-steel-grey rounded-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-safety-orange/10 rounded-sm flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-safety-orange" />
                </div>
                <div>
                  <p className="font-heading font-bold text-xl text-blueprint-navy">{stat.value}</p>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="jobs" className="space-y-6">
          <TabsList className="bg-white border border-steel-grey rounded-sm p-1 flex-wrap">
            <TabsTrigger value="jobs" className="rounded-sm data-[state=active]:bg-safety-orange data-[state=active]:text-white">
              My Jobs
            </TabsTrigger>
            <TabsTrigger value="applications" className="rounded-sm data-[state=active]:bg-safety-orange data-[state=active]:text-white">
              Applications
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-sm data-[state=active]:bg-safety-orange data-[state=active]:text-white" onClick={fetchAnalytics}>
              Analytics
            </TabsTrigger>
            <TabsTrigger value="company" className="rounded-sm data-[state=active]:bg-safety-orange data-[state=active]:text-white">
              Company Profile
            </TabsTrigger>
          </TabsList>

          {/* Jobs Tab */}
          <TabsContent value="jobs">
            <Card className="border border-steel-grey rounded-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-heading text-lg">Posted Jobs</CardTitle>
                <Button onClick={handleCreateJob} className="bg-safety-orange text-white rounded-sm" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  New Job
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse p-4 border border-steel-grey rounded-sm">
                        <div className="h-5 bg-slate-200 rounded w-1/3 mb-2"></div>
                        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                      </div>
                    ))}
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="font-heading font-semibold text-lg text-blueprint-navy mb-2">No jobs posted yet</h3>
                    <p className="text-slate-600 mb-4">Create your first job posting to start receiving applications</p>
                    <Button onClick={handleCreateJob} className="bg-safety-orange text-white rounded-sm">
                      Post Your First Job
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {jobs.map((job) => (
                      <div 
                        key={job.job_id}
                        className="flex items-center justify-between p-4 border border-steel-grey rounded-sm hover:border-safety-orange/50 transition-colors"
                        data-testid={`job-listing-${job.job_id}`}
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-blueprint-navy">{job.title}</h4>
                            <Badge className={`rounded-sm ${job.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                              {job.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{job.applications_count} applicants</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(job.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/jobs/${job.job_id}`)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditJob(job)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteJob(job.job_id)} className="text-red-500 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications">
            <Card className="border border-steel-grey rounded-sm">
              <CardHeader>
                <CardTitle className="font-heading text-lg">All Applications</CardTitle>
              </CardHeader>
              <CardContent>
                {totalApplications === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="font-heading font-semibold text-lg text-blueprint-navy mb-2">No applications yet</h3>
                    <p className="text-slate-600">Applications will appear here when candidates apply to your jobs</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {jobs.map((job) => (
                      applications[job.job_id]?.length > 0 && (
                        <div key={job.job_id}>
                          <h4 className="font-semibold text-blueprint-navy mb-3 flex items-center gap-2">
                            {job.title}
                            <Badge variant="outline" className="rounded-sm">{applications[job.job_id].length}</Badge>
                          </h4>
                          <div className="space-y-2">
                            {applications[job.job_id].map((app) => (
                              <div 
                                key={app.application_id}
                                className="p-3 border border-steel-grey rounded-sm"
                                data-testid={`application-item-${app.application_id}`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-blueprint-navy">{app.talent_name}</p>
                                    <p className="text-sm text-slate-500">{app.talent_email}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="rounded-sm text-xs"
                                      onClick={() => setSchedulingInterview(schedulingInterview === app.application_id ? null : app.application_id)}
                                      data-testid={`schedule-btn-${app.application_id}`}
                                    >
                                      <Calendar className="w-3 h-3 mr-1" /> Interview
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="rounded-sm text-xs"
                                      onClick={() => navigate(`/messages`)}
                                    >
                                      <MessageSquare className="w-3 h-3 mr-1" /> Message
                                    </Button>
                                    <Select 
                                      value={app.status} 
                                      onValueChange={(value) => handleUpdateApplicationStatus(app.application_id, value)}
                                    >
                                      <SelectTrigger className="w-32 rounded-sm text-sm">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="reviewed">Reviewed</SelectItem>
                                        <SelectItem value="shortlisted">Shortlisted</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                        <SelectItem value="hired">Hired</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                {/* Interview Scheduling Form */}
                                {schedulingInterview === app.application_id && (
                                  <div className="mt-3 p-3 bg-slate-50 rounded-sm border border-steel-grey space-y-3" data-testid={`interview-form-${app.application_id}`}>
                                    <p className="text-sm font-medium text-blueprint-navy flex items-center gap-1"><Calendar className="w-4 h-4" /> Schedule Interview</p>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <Label className="text-xs">Date & Time</Label>
                                        <Input
                                          type="datetime-local"
                                          value={interviewForm.scheduled_at}
                                          onChange={(e) => setInterviewForm(prev => ({ ...prev, scheduled_at: e.target.value }))}
                                          className="text-sm"
                                          data-testid="interview-datetime"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs">Type</Label>
                                        <Select value={interviewForm.interview_type} onValueChange={(v) => setInterviewForm(prev => ({ ...prev, interview_type: v }))}>
                                          <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="video">Video Call</SelectItem>
                                            <SelectItem value="phone">Phone</SelectItem>
                                            <SelectItem value="in_person">In Person</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                    <Input
                                      placeholder="Notes (optional)"
                                      value={interviewForm.notes}
                                      onChange={(e) => setInterviewForm(prev => ({ ...prev, notes: e.target.value }))}
                                      className="text-sm"
                                    />
                                    <div className="flex gap-2">
                                      <Button size="sm" onClick={() => handleScheduleInterview(app)} className="bg-safety-orange text-white rounded-sm text-xs" data-testid={`confirm-schedule-${app.application_id}`}>
                                        <Video className="w-3 h-3 mr-1" /> Schedule
                                      </Button>
                                      <Button size="sm" variant="ghost" onClick={() => setSchedulingInterview(null)} className="text-xs">Cancel</Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <Card className="border border-steel-grey rounded-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" /> Hiring Analytics
                </CardTitle>
                <Button variant="outline" onClick={fetchAnalytics} disabled={analyticsLoading} className="rounded-sm" data-testid="refresh-analytics-btn">
                  <TrendingUp className="w-4 h-4 mr-2" /> Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="text-center py-8">
                    <div className="w-10 h-10 border-4 border-safety-orange border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  </div>
                ) : !analytics ? (
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">Click Refresh to load analytics</p>
                  </div>
                ) : (
                  <div className="space-y-6" data-testid="analytics-data">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Total Jobs', value: analytics.total_jobs, color: 'text-blue-600' },
                        { label: 'Active Jobs', value: analytics.active_jobs, color: 'text-green-600' },
                        { label: 'Total Applications', value: analytics.total_applications, color: 'text-safety-orange' },
                        { label: 'Hired', value: analytics.hired, color: 'text-emerald-600' },
                      ].map((s, i) => (
                        <div key={i} className="bg-slate-50 rounded-sm p-4 text-center">
                          <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                          <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="bg-yellow-50 rounded-sm p-4 text-center">
                        <p className="text-xl font-bold text-yellow-600">{analytics.pending_applications}</p>
                        <p className="text-xs text-slate-500">Pending Review</p>
                      </div>
                      <div className="bg-green-50 rounded-sm p-4 text-center">
                        <p className="text-xl font-bold text-green-600">{analytics.shortlisted_applications}</p>
                        <p className="text-xs text-slate-500">Shortlisted</p>
                      </div>
                      <div className="bg-blue-50 rounded-sm p-4 text-center">
                        <p className="text-xl font-bold text-blue-600">{analytics.subscription?.plan || 'none'}</p>
                        <p className="text-xs text-slate-500">Current Plan</p>
                      </div>
                    </div>
                    {analytics.job_breakdown?.length > 0 && (
                      <div>
                        <h4 className="font-heading font-semibold text-blueprint-navy mb-3">Job Performance</h4>
                        <div className="space-y-2">
                          {analytics.job_breakdown.map((j, i) => (
                            <div key={i} className="flex items-center justify-between border border-steel-grey rounded-sm p-3">
                              <div>
                                <p className="font-medium text-blueprint-navy text-sm">{j.title}</p>
                                <p className="text-xs text-slate-500">{j.status} - {new Date(j.created_at).toLocaleDateString()}</p>
                              </div>
                              <Badge variant="outline" className="border-safety-orange text-safety-orange">{j.applications} apps</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Profile Tab */}
          <TabsContent value="company">
            <Card className="border border-steel-grey rounded-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-heading text-lg">Company Profile</CardTitle>
                {!editingProfile ? (
                  <Button variant="outline" onClick={() => setEditingProfile(true)} className="rounded-sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { setEditingProfile(false); setProfile(user?.hirer_profile || {}); }} className="rounded-sm">
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleProfileUpdate} className="bg-safety-orange text-white rounded-sm">
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Company Name</Label>
                    {editingProfile ? (
                      <Input
                        value={profile.company_name || ''}
                        onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                        placeholder="Enter company name"
                        className="rounded-sm"
                      />
                    ) : (
                      <div className="mt-1 p-3 bg-slate-50 rounded-sm">
                        <span className="text-slate-600">{profile.company_name || 'Not set'}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Location</Label>
                    {editingProfile ? (
                      <Input
                        value={profile.location || ''}
                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                        placeholder="City, State"
                        className="rounded-sm"
                      />
                    ) : (
                      <div className="mt-1 p-3 bg-slate-50 rounded-sm flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">{profile.location || 'Not set'}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Company Size</Label>
                    {editingProfile ? (
                      <Select value={profile.company_size || undefined} onValueChange={(value) => setProfile({ ...profile, company_size: value })}>
                        <SelectTrigger className="rounded-sm">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-10">1-10 employees</SelectItem>
                          <SelectItem value="11-50">11-50 employees</SelectItem>
                          <SelectItem value="51-200">51-200 employees</SelectItem>
                          <SelectItem value="201-500">201-500 employees</SelectItem>
                          <SelectItem value="500+">500+ employees</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="mt-1 p-3 bg-slate-50 rounded-sm">
                        <span className="text-slate-600">{profile.company_size || 'Not set'}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Website</Label>
                    {editingProfile ? (
                      <Input
                        value={profile.company_website || ''}
                        onChange={(e) => setProfile({ ...profile, company_website: e.target.value })}
                        placeholder="https://yourcompany.com"
                        className="rounded-sm"
                      />
                    ) : (
                      <div className="mt-1 p-3 bg-slate-50 rounded-sm">
                        <span className="text-slate-600">{profile.company_website || 'Not set'}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Company Description</Label>
                  {editingProfile ? (
                    <Textarea
                      value={profile.company_description || ''}
                      onChange={(e) => setProfile({ ...profile, company_description: e.target.value })}
                      placeholder="Tell job seekers about your company..."
                      rows={4}
                      className="mt-1 rounded-sm resize-none"
                    />
                  ) : (
                    <div className="mt-1 p-3 bg-slate-50 rounded-sm min-h-[100px]">
                      <span className="text-slate-600 whitespace-pre-wrap">
                        {profile.company_description || 'No description added yet'}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Job Dialog */}
      <Dialog open={showJobDialog} onOpenChange={setShowJobDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              {editingJob ? 'Edit Job' : 'Post New Job'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Job Title *</Label>
                <Input
                  value={jobForm.title}
                  onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                  placeholder="e.g., Senior Electrician"
                  className="rounded-sm"
                  data-testid="job-title-input"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium">Category *</Label>
                <Select value={jobForm.category || undefined} onValueChange={(value) => setJobForm({ ...jobForm, category: value })}>
                  <SelectTrigger className="rounded-sm" data-testid="job-category-select">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Location *</Label>
                <Input
                  value={jobForm.location}
                  onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                  placeholder="City, State"
                  className="rounded-sm"
                  data-testid="job-location-input"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Employment Type *</Label>
                <Select value={jobForm.employment_type || undefined} onValueChange={(value) => setJobForm({ ...jobForm, employment_type: value })}>
                  <SelectTrigger className="rounded-sm">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Experience Level *</Label>
                <Select value={jobForm.experience_level || undefined} onValueChange={(value) => setJobForm({ ...jobForm, experience_level: value })}>
                  <SelectTrigger className="rounded-sm">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_LEVELS.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-sm font-medium">Min Salary</Label>
                  <Input
                    type="number"
                    value={jobForm.salary_min}
                    onChange={(e) => setJobForm({ ...jobForm, salary_min: e.target.value })}
                    placeholder="50000"
                    className="rounded-sm"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Max Salary</Label>
                  <Input
                    type="number"
                    value={jobForm.salary_max}
                    onChange={(e) => setJobForm({ ...jobForm, salary_max: e.target.value })}
                    placeholder="80000"
                    className="rounded-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Job Description *</Label>
              <Textarea
                value={jobForm.description}
                onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                placeholder="Describe the role, responsibilities, and requirements..."
                rows={5}
                className="rounded-sm resize-none"
                data-testid="job-description-input"
              />
            </div>

            <div>
              <Label className="text-sm font-medium">Required Skills</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="Add a skill"
                  className="rounded-sm"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <Button type="button" onClick={addSkill} variant="outline" className="rounded-sm">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {jobForm.skills_required.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="rounded-sm flex items-center gap-1">
                    {skill}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => setJobForm({ ...jobForm, skills_required: jobForm.skills_required.filter((_, i) => i !== index) })}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Benefits</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={benefitInput}
                  onChange={(e) => setBenefitInput(e.target.value)}
                  placeholder="Add a benefit"
                  className="rounded-sm"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                />
                <Button type="button" onClick={addBenefit} variant="outline" className="rounded-sm">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {jobForm.benefits.map((benefit, index) => (
                  <Badge key={index} variant="secondary" className="rounded-sm flex items-center gap-1">
                    {benefit}
                    <X 
                      className="w-3 h-3 cursor-pointer" 
                      onClick={() => setJobForm({ ...jobForm, benefits: jobForm.benefits.filter((_, i) => i !== index) })}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowJobDialog(false)} className="rounded-sm">
              Cancel
            </Button>
            <Button 
              onClick={handleSaveJob} 
              disabled={savingJob}
              className="bg-safety-orange hover:bg-safety-orange-dark text-white rounded-sm"
              data-testid="save-job-btn"
            >
              {savingJob ? 'Saving...' : (editingJob ? 'Update Job' : 'Post Job')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
