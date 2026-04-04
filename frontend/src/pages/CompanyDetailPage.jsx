import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { API } from '../App';
import {
  HardHat, Building2, MapPin, Globe, Users, Briefcase, ArrowLeft, ArrowRight, DollarSign, Clock
} from 'lucide-react';

export default function CompanyDetailPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompany();
  }, [userId]);

  const fetchCompany = async () => {
    setLoading(true);
    try {
      const [compRes, jobsRes] = await Promise.all([
        fetch(`${API}/companies/${userId}`),
        fetch(`${API}/companies/${userId}/jobs`)
      ]);
      if (compRes.ok) setCompany(await compRes.json());
      if (jobsRes.ok) setJobs(await jobsRes.json());
    } catch (err) {
      console.error('Failed to fetch company:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-concrete-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-safety-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-concrete-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold text-blueprint-navy mb-4">Company Not Found</h1>
          <Button onClick={() => navigate('/companies')} className="bg-safety-orange text-white rounded-sm">
            Back to Companies
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-concrete-white">
      <nav className="sticky top-0 z-50 bg-white border-b border-steel-grey">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-safety-orange rounded-sm flex items-center justify-center">
              <HardHat className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-bold text-xl text-blueprint-navy">BuildForce</span>
          </Link>
        </div>
      </nav>

      {/* Back */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <button onClick={() => navigate('/companies')} className="flex items-center gap-1 text-slate-600 hover:text-safety-orange text-sm mb-6" data-testid="back-to-companies">
          <ArrowLeft className="w-4 h-4" /> Back to Companies
        </button>
      </div>

      {/* Company Header */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-8" data-testid="company-detail">
        <div className="bg-white border border-steel-grey rounded-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="w-20 h-20 bg-blueprint-navy/10 rounded-sm flex items-center justify-center flex-shrink-0">
              <Building2 className="w-10 h-10 text-blueprint-navy" />
            </div>
            <div className="flex-1">
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-blueprint-navy mb-2">
                {company.company_name || company.name}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-4">
                {company.location && (
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {company.location}</span>
                )}
                {company.industry && (
                  <span className="flex items-center gap-1"><Building2 className="w-4 h-4" /> {company.industry}</span>
                )}
                {company.company_size && (
                  <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {company.company_size}</span>
                )}
                {company.company_website && (
                  <a href={company.company_website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-safety-orange hover:underline">
                    <Globe className="w-4 h-4" /> Website
                  </a>
                )}
              </div>
              {company.company_description && (
                <p className="text-slate-600">{company.company_description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Jobs */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="font-heading text-xl font-bold text-blueprint-navy mb-4">
          Open Positions ({jobs.length})
        </h2>

        {jobs.length === 0 ? (
          <div className="text-center py-8 bg-white border border-steel-grey rounded-sm">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No open positions right now.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card
                key={job.job_id}
                className="border-steel-grey hover:border-safety-orange/50 transition-all cursor-pointer rounded-sm"
                onClick={() => navigate(`/jobs/${job.job_id}`)}
                data-testid={`company-job-${job.job_id}`}
              >
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-heading font-bold text-blueprint-navy">{job.title}</h3>
                      <div className="flex flex-wrap gap-3 text-sm text-slate-500 mt-1">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {job.employment_type}</span>
                        {(job.salary_min || job.salary_max) && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {job.salary_min && `$${job.salary_min.toLocaleString()}`}
                            {job.salary_min && job.salary_max && ' - '}
                            {job.salary_max && `$${job.salary_max.toLocaleString()}`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className="border-safety-orange text-safety-orange">{job.category}</Badge>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
