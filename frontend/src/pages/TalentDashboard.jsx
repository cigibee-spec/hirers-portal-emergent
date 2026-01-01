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
  MapPin, Mail, Phone, Edit, Save, X, ArrowRight, Building2, Clock, ChevronRight
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
          <div className="flex gap-3">
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
          <TabsList className="bg-white border border-steel-grey rounded-sm p-1">
            <TabsTrigger value="applications" className="rounded-sm data-[state=active]:bg-safety-orange data-[state=active]:text-white">
              Applications
            </TabsTrigger>
            <TabsTrigger value="saved" className="rounded-sm data-[state=active]:bg-safety-orange data-[state=active]:text-white">
              Saved Jobs
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
                        value={profile.experience_level || ''} 
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
                        value={profile.availability || 'Available'} 
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
