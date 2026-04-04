import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { API } from '../App';
import { useAuth } from '../context/AuthContext';
import {
  HardHat, FileText, Briefcase, Wrench, HardHatIcon, Shield, Truck, Droplets, ArrowRight
} from 'lucide-react';

const CATEGORY_ICONS = {
  'General': Briefcase,
  'Electrician': Wrench,
  'Project Manager': HardHatIcon,
  'Heavy Equipment Operator': Truck,
  'Plumber': Droplets,
  'Safety Officer': Shield,
};

export default function ResumeTemplatesPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/resume-templates`)
      .then(r => r.json())
      .then(d => setTemplates(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleUseTemplate = (templateId) => {
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }
    navigate(`/talent/resume-builder?template=${templateId}`);
  };

  return (
    <div className="min-h-screen bg-concrete-white">
      <nav className="sticky top-0 z-50 bg-white border-b border-steel-grey">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-safety-orange rounded-sm flex items-center justify-center">
              <HardHat className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-bold text-xl text-blueprint-navy">BuildForce</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link to="/jobs" className="text-slate-600 hover:text-safety-orange font-medium">Find Jobs</Link>
            <Link to="/companies" className="text-slate-600 hover:text-safety-orange font-medium">Companies</Link>
            <Link to="/leaderboard" className="text-slate-600 hover:text-safety-orange font-medium">Leaderboard</Link>
          </div>
        </div>
      </nav>

      <section className="bg-blueprint-navy py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <FileText className="w-12 h-12 text-safety-orange mx-auto mb-4" />
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
            Resume Templates
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            ATS-optimized templates designed for construction professionals. Pick one and customize it in minutes.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-safety-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="templates-grid">
            {templates.map((tpl) => {
              const Icon = CATEGORY_ICONS[tpl.category] || FileText;
              return (
                <Card key={tpl.template_id} className="border-steel-grey hover:border-safety-orange/50 transition-all rounded-sm group" data-testid={`template-${tpl.template_id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-safety-orange/10 rounded-sm flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-safety-orange" />
                      </div>
                      <div>
                        <CardTitle className="font-heading text-base text-blueprint-navy">{tpl.name}</CardTitle>
                        <Badge variant="outline" className="mt-1 text-xs border-slate-300">{tpl.category}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 mb-4">{tpl.description}</p>
                    <Button
                      onClick={() => handleUseTemplate(tpl.template_id)}
                      className="w-full bg-blueprint-navy hover:bg-blueprint-navy/90 text-white rounded-sm group-hover:bg-safety-orange group-hover:text-white transition-colors"
                      data-testid={`use-template-${tpl.template_id}`}
                    >
                      Use This Template <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
