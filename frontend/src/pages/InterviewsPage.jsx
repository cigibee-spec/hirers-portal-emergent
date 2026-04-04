import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { API } from '../App';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import {
  HardHat, Calendar, Video, Phone, MapPin, Clock, CheckCircle, X, ArrowLeft
} from 'lucide-react';

export default function InterviewsPage() {
  const { user, getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const res = await fetch(`${API}/interviews`, {
        credentials: 'include', headers: getAuthHeaders()
      });
      if (res.ok) setInterviews(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (interviewId, status) => {
    try {
      const res = await fetch(`${API}/interviews/${interviewId}/status?status=${status}`, {
        method: 'PUT', credentials: 'include', headers: getAuthHeaders()
      });
      if (res.ok) {
        toast.success(`Interview ${status}`);
        fetchInterviews();
      }
    } catch (err) {
      toast.error('Failed to update interview');
    }
  };

  const typeIcons = { video: Video, phone: Phone, in_person: MapPin };
  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    completed: 'bg-slate-100 text-slate-800',
    rescheduled: 'bg-yellow-100 text-yellow-800'
  };

  const upcomingInterviews = interviews.filter(i => i.status !== 'cancelled' && i.status !== 'completed' && new Date(i.scheduled_at) > new Date());
  const pastInterviews = interviews.filter(i => i.status === 'completed' || i.status === 'cancelled' || new Date(i.scheduled_at) <= new Date());

  return (
    <div className="min-h-screen bg-concrete-white">
      <nav className="bg-white border-b border-steel-grey">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-safety-orange rounded-sm flex items-center justify-center">
              <HardHat className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-bold text-xl text-blueprint-navy">BuildForce</span>
          </Link>
          <Button variant="ghost" onClick={() => navigate(user?.user_type === 'talent' ? '/talent/dashboard' : '/hirer/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Dashboard
          </Button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="interviews-page">
        <h1 className="font-heading text-2xl font-bold text-blueprint-navy mb-6 flex items-center gap-2">
          <Calendar className="w-6 h-6" /> My Interviews
        </h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-safety-orange border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : interviews.length === 0 ? (
          <div className="text-center py-12" data-testid="no-interviews">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="font-heading text-xl font-bold text-blueprint-navy mb-2">No Interviews Scheduled</h2>
            <p className="text-slate-500">
              {user?.user_type === 'talent' 
                ? 'Apply to jobs and get shortlisted to receive interview invitations.'
                : 'Shortlist candidates and schedule interviews from your applications tab.'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {upcomingInterviews.length > 0 && (
              <div>
                <h2 className="font-heading text-lg font-semibold text-blueprint-navy mb-3">Upcoming</h2>
                <div className="space-y-3">
                  {upcomingInterviews.map((intv) => {
                    const TypeIcon = typeIcons[intv.interview_type] || Calendar;
                    return (
                      <Card key={intv.interview_id} className="border-steel-grey rounded-sm" data-testid={`interview-${intv.interview_id}`}>
                        <CardContent className="p-5">
                          <div className="flex flex-col sm:flex-row justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <TypeIcon className="w-5 h-5 text-safety-orange" />
                                <h3 className="font-heading font-semibold text-blueprint-navy">{intv.job_title}</h3>
                              </div>
                              <p className="text-sm text-slate-600 mb-1">
                                {user?.user_type === 'talent' ? `With ${intv.company_name}` : `Candidate: ${intv.talent_name}`}
                              </p>
                              <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(intv.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(intv.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  {' '}({intv.duration_minutes}min)
                                </span>
                              </div>
                              {intv.meeting_link && intv.interview_type === 'video' && (
                                <a href={intv.meeting_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-safety-orange hover:underline mt-2">
                                  <Video className="w-3 h-3" /> Join Video Call
                                </a>
                              )}
                              {intv.notes && <p className="text-xs text-slate-400 mt-2">Note: {intv.notes}</p>}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge className={statusColors[intv.status]}>{intv.status}</Badge>
                              {intv.status === 'scheduled' && (
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => updateStatus(intv.interview_id, 'confirmed')} className="bg-green-600 hover:bg-green-700 text-white rounded-sm text-xs">
                                    <CheckCircle className="w-3 h-3 mr-1" /> Confirm
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => updateStatus(intv.interview_id, 'cancelled')} className="text-red-600 border-red-300 rounded-sm text-xs">
                                    <X className="w-3 h-3 mr-1" /> Cancel
                                  </Button>
                                </div>
                              )}
                              {intv.status === 'confirmed' && user?.user_type === 'hirer' && (
                                <Button size="sm" onClick={() => updateStatus(intv.interview_id, 'completed')} className="bg-blueprint-navy text-white rounded-sm text-xs">
                                  Mark Complete
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {pastInterviews.length > 0 && (
              <div>
                <h2 className="font-heading text-lg font-semibold text-slate-500 mb-3">Past</h2>
                <div className="space-y-2 opacity-70">
                  {pastInterviews.map((intv) => (
                    <div key={intv.interview_id} className="flex items-center justify-between bg-white border border-steel-grey rounded-sm p-4">
                      <div>
                        <p className="font-medium text-sm text-blueprint-navy">{intv.job_title}</p>
                        <p className="text-xs text-slate-500">{new Date(intv.scheduled_at).toLocaleDateString()}</p>
                      </div>
                      <Badge className={statusColors[intv.status]}>{intv.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
