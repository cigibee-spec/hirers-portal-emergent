import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { API } from '../App';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { 
  HardHat, ArrowLeft, Save, Sparkles, Plus, X, Trash2, 
  User, Mail, Phone, MapPin, FileText, Briefcase, GraduationCap, Award
} from 'lucide-react';

const COMMON_SKILLS = [
  "Blueprint Reading", "OSHA Certified", "Heavy Machinery Operation", "Welding",
  "Electrical Systems", "Plumbing", "Carpentry", "Concrete Work",
  "Safety Management", "Project Management", "Team Leadership", "Quality Control"
];

export default function ResumeBuilder() {
  const { user, getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template');
  
  const [resume, setResume] = useState({
    full_name: user?.name || '',
    email: user?.email || '',
    phone: '',
    location: '',
    summary: '',
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    languages: []
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enhancing, setEnhancing] = useState(null);
  const [skillInput, setSkillInput] = useState('');
  const [certInput, setCertInput] = useState('');
  const [langInput, setLangInput] = useState('');

  useEffect(() => {
    fetchResume();
  }, []);

  const fetchResume = async () => {
    try {
      const response = await fetch(`${API}/resumes/my-resume`, {
        credentials: 'include',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        if (data) {
          setResume(data);
          setLoading(false);
          return;
        }
      }

      // If no existing resume, try loading template
      if (templateId) {
        try {
          const tplRes = await fetch(`${API}/resume-templates/${templateId}`);
          if (tplRes.ok) {
            const tpl = await tplRes.json();
            const sec = tpl.sections || {};
            setResume(prev => ({
              ...prev,
              full_name: prev.full_name || sec.full_name || '',
              email: prev.email || sec.email || '',
              phone: sec.phone || '',
              location: sec.location || '',
              summary: sec.summary || '',
              experience: sec.experience || [],
              education: sec.education || [],
              skills: sec.skills || [],
              certifications: sec.certifications || [],
              languages: sec.languages || []
            }));
            toast.success(`Template "${tpl.name}" loaded! Customize it with your details.`);
          }
        } catch (e) {
          console.error('Template load failed:', e);
        }
      }
    } catch (error) {
      console.error('Failed to fetch resume:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!resume.full_name || !resume.email || !resume.phone || !resume.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API}/resumes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        credentials: 'include',
        body: JSON.stringify(resume)
      });

      if (response.ok) {
        toast.success('Resume saved successfully!');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to save resume');
      }
    } catch (error) {
      toast.error('Failed to save resume');
    } finally {
      setSaving(false);
    }
  };

  const handleAIEnhance = async (sectionType, text) => {
    if (!text.trim()) {
      toast.error('Please enter some text to enhance');
      return;
    }

    setEnhancing(sectionType);
    try {
      const response = await fetch(`${API}/ai/enhance-resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        credentials: 'include',
        body: JSON.stringify({ text, section_type: sectionType })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (sectionType === 'summary') {
          setResume({ ...resume, summary: data.enhanced_text });
        } else if (sectionType === 'skills') {
          const newSkills = data.enhanced_text.split(',').map(s => s.trim()).filter(s => s);
          const uniqueSkills = [...new Set([...resume.skills, ...newSkills])];
          setResume({ ...resume, skills: uniqueSkills });
        }
        
        toast.success('Text enhanced with AI!');
      } else {
        toast.error('Failed to enhance text');
      }
    } catch (error) {
      toast.error('AI enhancement failed');
    } finally {
      setEnhancing(null);
    }
  };

  const addExperience = () => {
    setResume({
      ...resume,
      experience: [...resume.experience, {
        title: '',
        company: '',
        location: '',
        start_date: '',
        end_date: '',
        description: '',
        is_current: false
      }]
    });
  };

  const updateExperience = (index, field, value) => {
    const updated = [...resume.experience];
    updated[index] = { ...updated[index], [field]: value };
    setResume({ ...resume, experience: updated });
  };

  const removeExperience = (index) => {
    setResume({ ...resume, experience: resume.experience.filter((_, i) => i !== index) });
  };

  const addEducation = () => {
    setResume({
      ...resume,
      education: [...resume.education, {
        degree: '',
        institution: '',
        location: '',
        graduation_year: '',
        field_of_study: ''
      }]
    });
  };

  const updateEducation = (index, field, value) => {
    const updated = [...resume.education];
    updated[index] = { ...updated[index], [field]: value };
    setResume({ ...resume, education: updated });
  };

  const removeEducation = (index) => {
    setResume({ ...resume, education: resume.education.filter((_, i) => i !== index) });
  };

  const addSkill = () => {
    if (skillInput.trim() && !resume.skills.includes(skillInput.trim())) {
      setResume({ ...resume, skills: [...resume.skills, skillInput.trim()] });
      setSkillInput('');
    }
  };

  const addCertification = () => {
    if (certInput.trim() && !resume.certifications.includes(certInput.trim())) {
      setResume({ ...resume, certifications: [...resume.certifications, certInput.trim()] });
      setCertInput('');
    }
  };

  const addLanguage = () => {
    if (langInput.trim() && !resume.languages.includes(langInput.trim())) {
      setResume({ ...resume, languages: [...resume.languages, langInput.trim()] });
      setLangInput('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-concrete-white">
        <div className="w-12 h-12 border-4 border-safety-orange border-t-transparent rounded-full animate-spin"></div>
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

            <Button 
              onClick={handleSave}
              disabled={saving}
              className="bg-safety-orange hover:bg-safety-orange-dark text-white rounded-sm"
              data-testid="save-resume-btn"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Resume'}
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/talent/dashboard')}
          className="flex items-center gap-2 text-slate-600 hover:text-safety-orange transition-colors mb-6"
          data-testid="back-to-dashboard-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-blueprint-navy mb-2" data-testid="resume-builder-title">
            ATS-Optimized Resume Builder
          </h1>
          <p className="text-slate-600">
            Create a professional resume tailored for construction industry ATS systems
          </p>
        </div>

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="bg-white border border-steel-grey rounded-sm p-1 flex-wrap h-auto gap-1">
            <TabsTrigger value="personal" className="rounded-sm data-[state=active]:bg-safety-orange data-[state=active]:text-white">
              <User className="w-4 h-4 mr-1" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="summary" className="rounded-sm data-[state=active]:bg-safety-orange data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-1" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="experience" className="rounded-sm data-[state=active]:bg-safety-orange data-[state=active]:text-white">
              <Briefcase className="w-4 h-4 mr-1" />
              Experience
            </TabsTrigger>
            <TabsTrigger value="education" className="rounded-sm data-[state=active]:bg-safety-orange data-[state=active]:text-white">
              <GraduationCap className="w-4 h-4 mr-1" />
              Education
            </TabsTrigger>
            <TabsTrigger value="skills" className="rounded-sm data-[state=active]:bg-safety-orange data-[state=active]:text-white">
              <Award className="w-4 h-4 mr-1" />
              Skills
            </TabsTrigger>
          </TabsList>

          {/* Personal Information */}
          <TabsContent value="personal">
            <Card className="border border-steel-grey rounded-sm">
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-safety-orange" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Full Name *</Label>
                    <Input
                      value={resume.full_name}
                      onChange={(e) => setResume({ ...resume, full_name: e.target.value })}
                      placeholder="John Smith"
                      className="rounded-sm"
                      data-testid="resume-name-input"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="email"
                        value={resume.email}
                        onChange={(e) => setResume({ ...resume, email: e.target.value })}
                        placeholder="you@example.com"
                        className="pl-10 rounded-sm"
                        data-testid="resume-email-input"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Phone *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        value={resume.phone}
                        onChange={(e) => setResume({ ...resume, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                        className="pl-10 rounded-sm"
                        data-testid="resume-phone-input"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Location *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        value={resume.location}
                        onChange={(e) => setResume({ ...resume, location: e.target.value })}
                        placeholder="City, State"
                        className="pl-10 rounded-sm"
                        data-testid="resume-location-input"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Professional Summary */}
          <TabsContent value="summary">
            <Card className="border border-steel-grey rounded-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-safety-orange" />
                  Professional Summary
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAIEnhance('summary', resume.summary)}
                  disabled={enhancing === 'summary' || !resume.summary}
                  className="rounded-sm"
                  data-testid="ai-enhance-summary-btn"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {enhancing === 'summary' ? 'Enhancing...' : 'AI Enhance'}
                </Button>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={resume.summary}
                  onChange={(e) => setResume({ ...resume, summary: e.target.value })}
                  placeholder="Write a brief professional summary highlighting your construction experience, skills, and career goals. The AI can help optimize this for ATS systems."
                  rows={6}
                  className="rounded-sm resize-none"
                  data-testid="resume-summary-input"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Tip: Include keywords relevant to construction jobs you're targeting (e.g., safety protocols, certifications, specialized equipment)
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Work Experience */}
          <TabsContent value="experience">
            <Card className="border border-steel-grey rounded-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-safety-orange" />
                  Work Experience
                </CardTitle>
                <Button
                  onClick={addExperience}
                  variant="outline"
                  size="sm"
                  className="rounded-sm"
                  data-testid="add-experience-btn"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Experience
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {resume.experience.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-steel-grey rounded-sm">
                    <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 mb-2">No work experience added yet</p>
                    <Button onClick={addExperience} variant="outline" size="sm" className="rounded-sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Job
                    </Button>
                  </div>
                ) : (
                  resume.experience.map((exp, index) => (
                    <div key={index} className="p-4 border border-steel-grey rounded-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-blueprint-navy">Experience #{index + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExperience(index)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Job Title</Label>
                          <Input
                            value={exp.title}
                            onChange={(e) => updateExperience(index, 'title', e.target.value)}
                            placeholder="e.g., Senior Electrician"
                            className="rounded-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Company</Label>
                          <Input
                            value={exp.company}
                            onChange={(e) => updateExperience(index, 'company', e.target.value)}
                            placeholder="Company name"
                            className="rounded-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Location</Label>
                          <Input
                            value={exp.location}
                            onChange={(e) => updateExperience(index, 'location', e.target.value)}
                            placeholder="City, State"
                            className="rounded-sm"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-sm font-medium">Start Date</Label>
                            <Input
                              value={exp.start_date}
                              onChange={(e) => updateExperience(index, 'start_date', e.target.value)}
                              placeholder="MM/YYYY"
                              className="rounded-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium">End Date</Label>
                            <Input
                              value={exp.end_date}
                              onChange={(e) => updateExperience(index, 'end_date', e.target.value)}
                              placeholder="MM/YYYY or Present"
                              disabled={exp.is_current}
                              className="rounded-sm"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Description</Label>
                        <Textarea
                          value={exp.description}
                          onChange={(e) => updateExperience(index, 'description', e.target.value)}
                          placeholder="Describe your responsibilities and achievements..."
                          rows={3}
                          className="rounded-sm resize-none"
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Education */}
          <TabsContent value="education">
            <Card className="border border-steel-grey rounded-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-safety-orange" />
                  Education & Training
                </CardTitle>
                <Button
                  onClick={addEducation}
                  variant="outline"
                  size="sm"
                  className="rounded-sm"
                  data-testid="add-education-btn"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Education
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {resume.education.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-steel-grey rounded-sm">
                    <GraduationCap className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 mb-2">No education added yet</p>
                    <Button onClick={addEducation} variant="outline" size="sm" className="rounded-sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Education
                    </Button>
                  </div>
                ) : (
                  resume.education.map((edu, index) => (
                    <div key={index} className="p-4 border border-steel-grey rounded-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-blueprint-navy">Education #{index + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEducation(index)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Degree / Certificate</Label>
                          <Input
                            value={edu.degree}
                            onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                            placeholder="e.g., Journeyman Electrician License"
                            className="rounded-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Institution</Label>
                          <Input
                            value={edu.institution}
                            onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                            placeholder="School or training center"
                            className="rounded-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Field of Study</Label>
                          <Input
                            value={edu.field_of_study}
                            onChange={(e) => updateEducation(index, 'field_of_study', e.target.value)}
                            placeholder="e.g., Electrical Technology"
                            className="rounded-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Graduation Year</Label>
                          <Input
                            value={edu.graduation_year}
                            onChange={(e) => updateEducation(index, 'graduation_year', e.target.value)}
                            placeholder="YYYY"
                            className="rounded-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Skills & Certifications */}
          <TabsContent value="skills">
            <div className="space-y-6">
              {/* Skills */}
              <Card className="border border-steel-grey rounded-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="font-heading text-lg flex items-center gap-2">
                    <Award className="w-5 h-5 text-safety-orange" />
                    Skills
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAIEnhance('skills', resume.skills.join(', '))}
                    disabled={enhancing === 'skills' || resume.skills.length === 0}
                    className="rounded-sm"
                    data-testid="ai-suggest-skills-btn"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {enhancing === 'skills' ? 'Suggesting...' : 'AI Suggest More'}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-4">
                    <Input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      placeholder="Add a skill"
                      className="rounded-sm"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                      data-testid="skill-input"
                    />
                    <Button onClick={addSkill} variant="outline" className="rounded-sm">
                      Add
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {resume.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="rounded-sm flex items-center gap-1 bg-safety-orange/10 text-safety-orange">
                        {skill}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => setResume({ ...resume, skills: resume.skills.filter((_, i) => i !== index) })}
                        />
                      </Badge>
                    ))}
                  </div>

                  <div className="border-t border-steel-grey pt-4">
                    <p className="text-sm text-slate-500 mb-2">Common construction skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {COMMON_SKILLS.filter(s => !resume.skills.includes(s)).map((skill, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="rounded-sm cursor-pointer hover:bg-slate-100"
                          onClick={() => setResume({ ...resume, skills: [...resume.skills, skill] })}
                        >
                          + {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Certifications */}
              <Card className="border border-steel-grey rounded-sm">
                <CardHeader>
                  <CardTitle className="font-heading text-lg">Certifications & Licenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-4">
                    <Input
                      value={certInput}
                      onChange={(e) => setCertInput(e.target.value)}
                      placeholder="Add a certification"
                      className="rounded-sm"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                      data-testid="certification-input"
                    />
                    <Button onClick={addCertification} variant="outline" className="rounded-sm">
                      Add
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {resume.certifications.map((cert, index) => (
                      <Badge key={index} variant="secondary" className="rounded-sm flex items-center gap-1">
                        {cert}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => setResume({ ...resume, certifications: resume.certifications.filter((_, i) => i !== index) })}
                        />
                      </Badge>
                    ))}
                    {resume.certifications.length === 0 && (
                      <p className="text-sm text-slate-500">No certifications added</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Languages */}
              <Card className="border border-steel-grey rounded-sm">
                <CardHeader>
                  <CardTitle className="font-heading text-lg">Languages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-4">
                    <Input
                      value={langInput}
                      onChange={(e) => setLangInput(e.target.value)}
                      placeholder="Add a language"
                      className="rounded-sm"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                      data-testid="language-input"
                    />
                    <Button onClick={addLanguage} variant="outline" className="rounded-sm">
                      Add
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {resume.languages.map((lang, index) => (
                      <Badge key={index} variant="secondary" className="rounded-sm flex items-center gap-1">
                        {lang}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => setResume({ ...resume, languages: resume.languages.filter((_, i) => i !== index) })}
                        />
                      </Badge>
                    ))}
                    {resume.languages.length === 0 && (
                      <p className="text-sm text-slate-500">No languages added</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Save Button Fixed at Bottom for Mobile */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-steel-grey p-4 md:hidden">
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-safety-orange hover:bg-safety-orange-dark text-white rounded-sm"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Resume'}
          </Button>
        </div>
      </div>
    </div>
  );
}
