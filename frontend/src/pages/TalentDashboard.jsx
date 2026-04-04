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
import { API } from '../App';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { 
  HardHat, User, FileText, Briefcase, Bookmark, Settings, LogOut,
  MapPin, Mail, Phone, Edit, Save, X, ArrowRight, Building2, Clock, ChevronRight,
  Upload, Download, Target, Bell, MessageSquare, Calendar, Sparkles, Star
} from 'lucide-react';

const JOB_CATEGORIES = [
  "Electrician", "Plumber", "Carpenter", "Mason", "Heavy Equipment Operator",
  "Site Supervisor", "Project Manager", "Welder", "HVAC Technician", "Painter",
  "Roofer", "Concrete Worker", "Steel Worker", "Crane Operator", "Safety Officer"
];

const EXPERIENCE_LEVELS = ["Entry Level", "Junior (1-3 years)", "Mid-Level (3-5 years)", "Senior (5-10 years)", "Expert (10+ years)"];

export default function TalentDashboard() {
  const { user, logout, getAuthHeaders, updateUser, switchUserType } = useAuth();
  const navigate = useNavigate();
  
  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profile, setProfile] = useState(user?.talent_profile || {});
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [newAlert, setNewAlert] = useState({ categories: [], locations: [], keywords: [] });
  const [alertKeyword, setAlertKeyword] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [deepMatchResult, setDeepMatchResult] = useState(null);
  const [deepMatchLoading, setDeepMatchLoading] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResults, setBulkResults] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appsRes, savedRes] = await Promise.all([
        fetch(`${API}/applications/my-applications`, {
          credentials: 'include',
          headers: getAuthHeaders()
        }),
        fetch(`${API}/saved-jobs`, {
          credentials: 'include',
          headers: getAuthHeaders()
        })
      ]);

      if (appsRes.ok) {
        setApplications(await appsRes.json());
      }
      if (savedRes.ok) {
        setSavedJobs(await savedRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const response = await fetch(`${API}/profile/talent`, {
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
        toast.success('Profile updated successfully');
        setEditingProfile(false);
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleSwitchToHirer = async () => {
    try {
      await switchUserType();
      toast.success('Switched to employer account');
      navigate('/hirer/dashboard');
    } catch (error) {
      toast.error('Failed to switch account type');
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API}/resumes/upload`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setUploadResult(data);
        toast.success(`Resume uploaded! ATS Score: ${data.ats_score}/100`);
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Upload failed');
      }
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`${API}/resumes/download-pdf`, {
        credentials: 'include',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resume.pdf';
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Resume downloaded!');
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Download failed');
      }
    } catch (err) {
      toast.error('Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const fetchMatchedJobs = async () => {
    setMatchLoading(true);
    try {
      const res = await fetch(`${API}/ai/match-jobs`, {
        credentials: 'include',
        headers: getAuthHeaders()
      });
      if (res.ok) setMatchedJobs(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setMatchLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`${API}/job-alerts`, {
        credentials: 'include', headers: getAuthHeaders()
      });
      if (res.ok) setAlerts(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const createAlert = async () => {
    try {
      const res = await fetch(`${API}/job-alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        credentials: 'include',
        body: JSON.stringify(newAlert)
      });
      if (res.ok) {
        toast.success('Job alert created!');
        fetchAlerts();
        setNewAlert({ categories: [], locations: [], keywords: [] });
      }
    } catch (err) {
      toast.error('Failed to create alert');
    }
  };

  const deleteAlert = async (alertId) => {
    try {
      await fetch(`${API}/job-alerts/${alertId}`, {
        method: 'DELETE', credentials: 'include', headers: getAuthHeaders()
      });
      fetchAlerts();
    } catch (err) {
      toast.error('Failed to delete alert');
    }
  };

  const fetchRecommendations = async () => {
    setRecsLoading(true);
    try {
      const res = await fetch(`${API}/recommendations`, {
        credentials: 'include', headers: getAuthHeaders()
      });
      if (res.ok) setRecommendations(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setRecsLoading(false);
    }
  };

  const handleDeepMatch = async (jobId) => {
    setDeepMatchLoading(true);
    setDeepMatchResult(null);
    try {
      const res = await fetch(`${API}/ai/deep-match/${jobId}`, {
        method: 'POST', credentials: 'include', headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setDeepMatchResult(data);
      } else {
        toast.error('AI analysis failed');
      }
    } catch (err) {
      toast.error('Failed to get AI analysis');
    } finally {
      setDeepMatchLoading(false);
    }
  };

  const handleBulkUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setBulkUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(f => formData.append('files', f));
      const res = await fetch(`${API}/resumes/bulk-upload`, {
        method: 'POST', headers: getAuthHeaders(), credentials: 'include', body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setBulkResults(data);
        toast.success(`${data.uploaded} file(s) uploaded!`);
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Bulk upload failed');
      }
    } catch (err) {
      toast.error('Bulk upload failed');
    } finally {
      setBulkUploading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-blue-100 text-blue-800',
      shortlisted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      hired: 'bg-emerald-100 text-emerald-800'
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
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

            <div className="flex items-center gap-4">
              <Link to="/jobs" className="text-slate-600 hover:text-safety-orange transition-colors font-medium hidden sm:block">
                Find Jobs
              </Link>
              <Button 
                variant="ghost" 
                onClick={handleLogout}
                className="text-slate-600"
                data-testid="logout-btn"
              >
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
              {user?.picture ? (
                <img src={user.picture} alt={user.name} className="w-14 h-14 rounded-sm object-cover" />
              ) : (
                <User className="w-8 h-8 text-safety-orange" />
              )}
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-blueprint-navy" data-testid="talent-dashboard">
                Welcome, {user?.name}
              </h1>
              <p className="text-slate-600">Job Seeker Dashboard</p>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button 
              onClick={() => navigate('/talent/resume-builder')}
              className="bg-safety-orange hover:bg-safety-orange-dark text-white rounded-sm"
              data-testid="build-resume-btn"
            >
              <FileText className="w-4 h-4 mr-2" />
              Build Resume
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="rounded-sm"
              data-testid="download-resume-btn"
            >
              <Download className="w-4 h-4 mr-2" />
              {downloading ? 'Downloading...' : 'Download PDF'}
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/messages')}
              className="rounded-sm"
              data-testid="messages-btn"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/interviews')}
              className="rounded-sm"
              data-testid="interviews-btn"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Interviews
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/resume-templates')}
              className="rounded-sm"
              data-testid="templates-btn"
            >
              <FileText className="w-4 h-4 mr-2" />
              Templates
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSwitchToHirer}
              className="rounded-sm"
              data-testid="switch-to-hirer-btn"
            >
              Switch to Employer
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Applications', value: applications.length, icon: Briefcase },
            { label: 'Saved Jobs', value: savedJobs.length, icon: Bookmark },
            { label: 'Profile Views', value: '23', icon: User },
            { label: 'Interviews', value: applications.filter(a => a.status === 'shortlisted').length, icon: Clock }
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
        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList className="bg-white border border-steel-grey rounded-sm p-1 flex-wrap">
            <TabsTrigger value="applications" className="rounded-sm data-[state=active]:bg-safety-orange data-[state=active]:text-white">
              Applications
            </TabsTrigger>
            <TabsTrigger value="saved" className="rounded-sm data-[state=active]:bg-safety-orange data-[state=active]:text-white">
              Saved Jobs
            </TabsTrigger>
            <TabsTrigger value="recommended" className="rounded-sm data-[state=active]:bg-safety-orange data-[state=active]:text-white" onClick={fetchRecommendations}>
              Recommended
            </TabsTrigger>
            <TabsTrigger value="resume" className="rounded-sm data-[state=active]:bg-safety-orange data-[state=active]:text-white">
              Resume Upload
            </TabsTrigger>
            <TabsTrigger value="matching" className="rounded-sm data-[state=active]:bg-safety-orange data-[state=active]:text-white" onClick={fetchMatchedJobs}>
              AI Match
            </TabsTrigger>
            <TabsTrigger value="alerts" className="rounded-sm data-[state=active]:bg-safety-orange data-[state=active]:text-white" onClick={fetchAlerts}>
              Alerts
            </TabsTrigger>
            <TabsTrigger value="profile" className="rounded-sm data-[state=active]:bg-safety-orange data-[state=active]:text-white">
              Profile
            </TabsTrigger>
          </TabsList>

          {/* Applications Tab */}
          <TabsContent value="applications">
            <Card className="border border-steel-grey rounded-sm">
              <CardHeader>
                <CardTitle className="font-heading text-lg">My Applications</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse flex items-center gap-4 p-4 border border-steel-grey rounded-sm">
                        <div className="w-12 h-12 bg-slate-200 rounded-sm"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
                          <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : applications.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="font-heading font-semibold text-lg text-blueprint-navy mb-2">No applications yet</h3>
                    <p className="text-slate-600 mb-4">Start applying to jobs to track your applications here</p>
                    <Button onClick={() => navigate('/jobs')} className="bg-safety-orange text-white rounded-sm">
                      Browse Jobs
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((app) => (
                      <div 
                        key={app.application_id}
                        className="flex items-center justify-between p-4 border border-steel-grey rounded-sm hover:border-safety-orange/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/jobs/${app.job_id}`)}
                        data-testid={`application-${app.application_id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-sm flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-slate-400" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-blueprint-navy">{app.job_title}</h4>
                            <p className="text-sm text-slate-600">{app.company_name}</p>
                            <p className="text-xs text-slate-500">Applied {formatDate(app.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={`${getStatusColor(app.status)} rounded-sm capitalize`}>
                            {app.status}
                          </Badge>
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Saved Jobs Tab */}
          <TabsContent value="saved">
            <Card className="border border-steel-grey rounded-sm">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Saved Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                {savedJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Bookmark className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="font-heading font-semibold text-lg text-blueprint-navy mb-2">No saved jobs</h3>
                    <p className="text-slate-600 mb-4">Save jobs you're interested in to review later</p>
                    <Button onClick={() => navigate('/jobs')} className="bg-safety-orange text-white rounded-sm">
                      Browse Jobs
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedJobs.map((job) => (
                      <div 
                        key={job.job_id}
                        className="flex items-center justify-between p-4 border border-steel-grey rounded-sm hover:border-safety-orange/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/jobs/${job.job_id}`)}
                        data-testid={`saved-job-${job.job_id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-sm flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-slate-400" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-blueprint-navy">{job.title}</h4>
                            <p className="text-sm text-slate-600">{job.company_name}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <MapPin className="w-3 h-3" />
                              {job.location}
                            </div>
                          </div>
                        </div>
                        <Button 
                          className="bg-safety-orange hover:bg-safety-orange-dark text-white rounded-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/jobs/${job.job_id}`);
                          }}
                        >
                          View Job
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommended">
            <Card className="border border-steel-grey rounded-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-heading text-lg flex items-center gap-2"><Star className="w-5 h-5 text-safety-orange" /> Recommended For You</CardTitle>
                <Button onClick={fetchRecommendations} disabled={recsLoading} variant="outline" className="rounded-sm" data-testid="refresh-recs-btn">
                  {recsLoading ? 'Loading...' : 'Refresh'}
                </Button>
              </CardHeader>
              <CardContent>
                {recsLoading ? (
                  <div className="text-center py-8">
                    <div className="w-10 h-10 border-4 border-safety-orange border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  </div>
                ) : recommendations.length === 0 ? (
                  <div className="text-center py-8">
                    <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">Complete your profile to get personalized recommendations.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recommendations.map((job) => (
                      <div key={job.job_id} className="border border-steel-grey rounded-sm p-4 hover:border-safety-orange/50 transition-all" data-testid={`rec-job-${job.job_id}`}>
                        <div className="flex flex-col sm:flex-row justify-between gap-3">
                          <div className="cursor-pointer flex-1" onClick={() => navigate(`/jobs/${job.job_id}`)}>
                            <h4 className="font-heading font-semibold text-blueprint-navy">{job.title}</h4>
                            <p className="text-sm text-slate-500">{job.company_name} - {job.location}</p>
                            {job.reasons?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {job.reasons.map((r, i) => (
                                  <Badge key={i} variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50">{r}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="text-center">
                              <div className="text-lg font-bold text-safety-orange">{job.relevance_score}%</div>
                              <p className="text-xs text-slate-400">Fit</p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => handleDeepMatch(job.job_id)} disabled={deepMatchLoading} className="rounded-sm text-xs" data-testid={`deep-match-${job.job_id}`}>
                              <Sparkles className="w-3 h-3 mr-1" /> AI Analysis
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Deep Match Result Modal */}
                {deepMatchResult && (
                  <div className="mt-6 p-4 bg-slate-50 rounded-sm border border-steel-grey" data-testid="deep-match-result">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-heading font-semibold text-blueprint-navy flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-safety-orange" /> AI Deep Match Analysis
                      </h4>
                      <button onClick={() => setDeepMatchResult(null)}><X className="w-4 h-4 text-slate-400" /></button>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{deepMatchResult.job_title} at {deepMatchResult.company_name}</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">Match Score</p>
                        <div className="text-3xl font-bold text-safety-orange">{deepMatchResult.analysis?.match_percentage || 0}%</div>
                      </div>
                      {deepMatchResult.analysis?.strengths?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-green-700 mb-1">Strengths</p>
                          {deepMatchResult.analysis.strengths.map((s, i) => <p key={i} className="text-sm text-slate-600">+ {s}</p>)}
                        </div>
                      )}
                      {deepMatchResult.analysis?.gaps?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-red-700 mb-1">Areas to Improve</p>
                          {deepMatchResult.analysis.gaps.map((g, i) => <p key={i} className="text-sm text-slate-600">- {g}</p>)}
                        </div>
                      )}
                      {deepMatchResult.analysis?.interview_tips?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-blue-700 mb-1">Interview Tips</p>
                          {deepMatchResult.analysis.interview_tips.map((t, i) => <p key={i} className="text-sm text-slate-600">{i+1}. {t}</p>)}
                        </div>
                      )}
                    </div>
                    {deepMatchResult.analysis?.recommendation && (
                      <p className="mt-3 text-sm text-slate-700 bg-white p-3 rounded border border-steel-grey">{deepMatchResult.analysis.recommendation}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resume Upload Tab */}
          <TabsContent value="resume">
            <Card className="border border-steel-grey rounded-sm">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Upload Resume for ATS Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-w-lg">
                  <p className="text-sm text-slate-600 mb-4">Upload your existing resume (PDF or DOCX) to get an ATS compatibility score and suggestions.</p>
                  <div className="border-2 border-dashed border-steel-grey rounded-sm p-8 text-center mb-4">
                    <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <label className="cursor-pointer">
                      <span className="text-safety-orange font-medium hover:underline">Choose file</span>
                      <span className="text-slate-500"> or drag and drop</span>
                      <input
                        type="file"
                        accept=".pdf,.docx"
                        onChange={handleResumeUpload}
                        className="hidden"
                        data-testid="resume-upload-input"
                      />
                    </label>
                    <p className="text-xs text-slate-400 mt-2">PDF or DOCX, max 10MB</p>
                  </div>
                  {uploading && (
                    <div className="flex items-center gap-2 text-safety-orange">
                      <div className="w-5 h-5 border-2 border-safety-orange border-t-transparent rounded-full animate-spin" />
                      Analyzing resume...
                    </div>
                  )}
                  {uploadResult && (
                    <div className="mt-4 space-y-4" data-testid="upload-result">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className={`text-3xl font-bold ${uploadResult.ats_score >= 70 ? 'text-green-600' : uploadResult.ats_score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {uploadResult.ats_score}
                          </div>
                          <p className="text-xs text-slate-500">ATS Score</p>
                        </div>
                        <div className="flex-1">
                          <div className="w-full bg-slate-200 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full ${uploadResult.ats_score >= 70 ? 'bg-green-500' : uploadResult.ats_score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${uploadResult.ats_score}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      {uploadResult.ats_feedback && (
                        <div className="space-y-2">
                          <p className="font-medium text-sm text-blueprint-navy">ATS Feedback:</p>
                          {uploadResult.ats_feedback.map((fb, i) => (
                            <div key={i} className={`flex items-center gap-2 text-sm ${fb.passed ? 'text-green-700' : 'text-red-600'}`}>
                              {fb.passed ? <span>+{fb.points}</span> : <span>0</span>}
                              {fb.feedback}
                            </div>
                          ))}
                        </div>
                      )}
                      {uploadResult.extracted_text_preview && (
                        <div>
                          <p className="font-medium text-sm text-blueprint-navy mb-1">Extracted Text Preview:</p>
                          <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded max-h-32 overflow-y-auto">{uploadResult.extracted_text_preview}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bulk Upload Section */}
                <div className="mt-8 pt-6 border-t border-steel-grey">
                  <h3 className="font-heading font-semibold text-blueprint-navy mb-3">Bulk Upload (up to 5 files)</h3>
                  <div className="border-2 border-dashed border-steel-grey rounded-sm p-6 text-center">
                    <label className="cursor-pointer">
                      <span className="text-safety-orange font-medium hover:underline">Choose multiple files</span>
                      <input
                        type="file"
                        accept=".pdf,.docx"
                        multiple
                        onChange={handleBulkUpload}
                        className="hidden"
                        data-testid="bulk-upload-input"
                      />
                    </label>
                    <p className="text-xs text-slate-400 mt-1">PDF or DOCX, max 5 files</p>
                  </div>
                  {bulkUploading && (
                    <div className="flex items-center gap-2 text-safety-orange mt-3">
                      <div className="w-5 h-5 border-2 border-safety-orange border-t-transparent rounded-full animate-spin" />
                      Uploading files...
                    </div>
                  )}
                  {bulkResults && (
                    <div className="mt-3 space-y-2" data-testid="bulk-results">
                      <p className="text-sm font-medium">{bulkResults.uploaded} file(s) uploaded</p>
                      {bulkResults.results.map((r, i) => (
                        <div key={i} className={`text-sm flex items-center justify-between p-2 rounded ${r.status === 'uploaded' ? 'bg-green-50' : 'bg-red-50'}`}>
                          <span>{r.filename}</span>
                          <span>{r.status === 'uploaded' ? `ATS: ${r.ats_score}` : r.reason}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="matching">
            <Card className="border border-steel-grey rounded-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-heading text-lg">AI Job Matching</CardTitle>
                <Button onClick={fetchMatchedJobs} disabled={matchLoading} variant="outline" className="rounded-sm" data-testid="refresh-match-btn">
                  <Target className="w-4 h-4 mr-2" />
                  {matchLoading ? 'Finding...' : 'Find Matches'}
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">Jobs matched based on your profile skills, categories, location, and experience level.</p>
                {matchLoading ? (
                  <div className="text-center py-8">
                    <div className="w-10 h-10 border-4 border-safety-orange border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-slate-500">Finding best matches...</p>
                  </div>
                ) : matchedJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">Click "Find Matches" to discover jobs that fit your profile.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {matchedJobs.map((job) => (
                      <div
                        key={job.job_id}
                        className="border border-steel-grey rounded-sm p-4 hover:border-safety-orange/50 cursor-pointer transition-all"
                        onClick={() => navigate(`/jobs/${job.job_id}`)}
                        data-testid={`match-job-${job.job_id}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-heading font-semibold text-blueprint-navy">{job.title}</h4>
                            <p className="text-sm text-slate-500">{job.company_name} - {job.location}</p>
                            {job.match_reasons?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {job.match_reasons.map((r, i) => (
                                  <Badge key={i} variant="outline" className="text-xs border-green-300 text-green-700 bg-green-50">{r}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-center flex-shrink-0">
                            <div className={`text-lg font-bold ${job.match_score >= 70 ? 'text-green-600' : job.match_score >= 40 ? 'text-yellow-600' : 'text-slate-500'}`}>
                              {job.match_score}%
                            </div>
                            <p className="text-xs text-slate-400">Match</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts">
            <Card className="border border-steel-grey rounded-sm">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Job Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6 p-4 bg-slate-50 rounded-sm">
                  <p className="font-medium text-sm text-blueprint-navy mb-3">Create New Alert</p>
                  <div className="grid sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <Label className="text-xs">Category</Label>
                      <Select onValueChange={(v) => setNewAlert(prev => ({ ...prev, categories: [...prev.categories, v] }))}>
                        <SelectTrigger><SelectValue placeholder="Add category" /></SelectTrigger>
                        <SelectContent>
                          {JOB_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {newAlert.categories.map((c, i) => (
                          <Badge key={i} variant="outline" className="text-xs cursor-pointer" onClick={() => setNewAlert(prev => ({ ...prev, categories: prev.categories.filter((_, idx) => idx !== i) }))}>
                            {c} <X className="w-3 h-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Keywords</Label>
                      <div className="flex gap-1">
                        <Input
                          value={alertKeyword}
                          onChange={(e) => setAlertKeyword(e.target.value)}
                          placeholder="Add keyword"
                          className="text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && alertKeyword.trim()) {
                              setNewAlert(prev => ({ ...prev, keywords: [...prev.keywords, alertKeyword.trim()] }));
                              setAlertKeyword('');
                            }
                          }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {newAlert.keywords.map((k, i) => (
                          <Badge key={i} variant="outline" className="text-xs cursor-pointer" onClick={() => setNewAlert(prev => ({ ...prev, keywords: prev.keywords.filter((_, idx) => idx !== i) }))}>
                            {k} <X className="w-3 h-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button onClick={createAlert} className="bg-safety-orange text-white rounded-sm text-sm" data-testid="create-alert-btn">
                    <Bell className="w-4 h-4 mr-1" /> Create Alert
                  </Button>
                </div>

                {alerts.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">No job alerts yet.</p>
                ) : (
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <div key={alert.alert_id} className="flex items-center justify-between border border-steel-grey rounded-sm p-3" data-testid={`alert-${alert.alert_id}`}>
                        <div>
                          <div className="flex flex-wrap gap-1">
                            {alert.categories.map((c, i) => <Badge key={i} className="text-xs bg-blue-100 text-blue-800">{c}</Badge>)}
                            {alert.keywords.map((k, i) => <Badge key={i} variant="outline" className="text-xs">{k}</Badge>)}
                          </div>
                          <p className="text-xs text-slate-400 mt-1">Created {new Date(alert.created_at).toLocaleDateString()}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => deleteAlert(alert.alert_id)}>
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="border border-steel-grey rounded-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-heading text-lg">My Profile</CardTitle>
                {!editingProfile ? (
                  <Button 
                    variant="outline" 
                    onClick={() => setEditingProfile(true)}
                    className="rounded-sm"
                    data-testid="edit-profile-btn"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setEditingProfile(false);
                        setProfile(user?.talent_profile || {});
                      }}
                      className="rounded-sm"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleProfileUpdate}
                      className="bg-safety-orange text-white rounded-sm"
                      data-testid="save-profile-btn"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <div className="flex items-center gap-2 mt-1 p-3 bg-slate-50 rounded-sm">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">{user?.email}</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    {editingProfile ? (
                      <Input
                        value={profile.phone || ''}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="Enter phone number"
                        className="rounded-sm"
                        data-testid="profile-phone-input"
                      />
                    ) : (
                      <div className="flex items-center gap-2 mt-1 p-3 bg-slate-50 rounded-sm">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">{profile.phone || 'Not set'}</span>
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
                        data-testid="profile-location-input"
                      />
                    ) : (
                      <div className="flex items-center gap-2 mt-1 p-3 bg-slate-50 rounded-sm">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">{profile.location || 'Not set'}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Experience Level</Label>
                    {editingProfile ? (
                      <Select 
                        value={profile.experience_level || undefined} 
                        onValueChange={(value) => setProfile({ ...profile, experience_level: value })}
                      >
                        <SelectTrigger className="rounded-sm" data-testid="profile-experience-select">
                          <SelectValue placeholder="Select experience" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPERIENCE_LEVELS.map(level => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="mt-1 p-3 bg-slate-50 rounded-sm">
                        <span className="text-slate-600">{profile.experience_level || 'Not set'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <Label className="text-sm font-medium">Job Categories</Label>
                  {editingProfile ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {JOB_CATEGORIES.map(cat => (
                        <Badge
                          key={cat}
                          variant={profile.categories?.includes(cat) ? 'default' : 'outline'}
                          className={`cursor-pointer rounded-sm ${
                            profile.categories?.includes(cat) 
                              ? 'bg-safety-orange text-white' 
                              : 'hover:bg-slate-100'
                          }`}
                          onClick={() => {
                            const cats = profile.categories || [];
                            setProfile({
                              ...profile,
                              categories: cats.includes(cat) 
                                ? cats.filter(c => c !== cat)
                                : [...cats, cat]
                            });
                          }}
                        >
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {profile.categories?.length > 0 ? (
                        profile.categories.map(cat => (
                          <Badge key={cat} className="bg-safety-orange/10 text-safety-orange rounded-sm">
                            {cat}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-slate-500 text-sm">No categories selected</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bio */}
                <div>
                  <Label className="text-sm font-medium">Bio</Label>
                  {editingProfile ? (
                    <Textarea
                      value={profile.bio || ''}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      placeholder="Tell employers about yourself..."
                      rows={4}
                      className="mt-1 rounded-sm resize-none"
                      data-testid="profile-bio-input"
                    />
                  ) : (
                    <div className="mt-1 p-3 bg-slate-50 rounded-sm min-h-[100px]">
                      <span className="text-slate-600 whitespace-pre-wrap">
                        {profile.bio || 'No bio added yet'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Expected Salary */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Expected Salary (Annual)</Label>
                    {editingProfile ? (
                      <Input
                        value={profile.expected_salary || ''}
                        onChange={(e) => setProfile({ ...profile, expected_salary: e.target.value })}
                        placeholder="e.g., $50,000 - $70,000"
                        className="rounded-sm"
                        data-testid="profile-salary-input"
                      />
                    ) : (
                      <div className="mt-1 p-3 bg-slate-50 rounded-sm">
                        <span className="text-slate-600">{profile.expected_salary || 'Not set'}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Availability</Label>
                    {editingProfile ? (
                      <Select 
                        value={profile.availability || "Available"} 
                        onValueChange={(value) => setProfile({ ...profile, availability: value })}
                      >
                        <SelectTrigger className="rounded-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Available">Available</SelectItem>
                          <SelectItem value="Not Available">Not Available</SelectItem>
                          <SelectItem value="Open to Offers">Open to Offers</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="mt-1 p-3 bg-slate-50 rounded-sm">
                        <Badge className={`rounded-sm ${
                          profile.availability === 'Available' ? 'bg-green-100 text-green-800' :
                          profile.availability === 'Not Available' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {profile.availability || 'Available'}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
