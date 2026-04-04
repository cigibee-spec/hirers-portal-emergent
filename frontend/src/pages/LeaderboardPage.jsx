import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { API } from '../App';
import { HardHat, Trophy, BarChart3, TrendingUp, Users } from 'lucide-react';

export default function LeaderboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/leaderboard/ats-scores`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const distributionColors = {
    '0-20': 'bg-red-500',
    '21-40': 'bg-orange-500',
    '41-60': 'bg-yellow-500',
    '61-80': 'bg-lime-500',
    '81-100': 'bg-green-500',
  };

  const maxCount = data ? Math.max(...Object.values(data.distribution), 1) : 1;

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
          </div>
        </div>
      </nav>

      <section className="bg-blueprint-navy py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Trophy className="w-12 h-12 text-safety-orange mx-auto mb-4" />
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
            ATS Score Leaderboard
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            See how construction resumes score on ATS compatibility. Anonymized data from the BuildForce community.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-safety-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          </div>
        ) : !data || data.total_resumes === 0 ? (
          <div className="text-center py-12" data-testid="leaderboard-empty">
            <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="font-heading text-xl font-bold text-blueprint-navy mb-2">No Data Yet</h2>
            <p className="text-slate-500">Upload your resume to be the first on the leaderboard!</p>
          </div>
        ) : (
          <div className="space-y-8" data-testid="leaderboard-data">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Resumes', value: data.total_resumes, icon: Users, color: 'text-blue-600' },
                { label: 'Average Score', value: data.average_score, icon: BarChart3, color: 'text-safety-orange' },
                { label: 'Top Score', value: data.top_scores[0] || 0, icon: Trophy, color: 'text-green-600' },
                { label: 'Median', value: data.percentiles?.p50 || 0, icon: TrendingUp, color: 'text-purple-600' },
              ].map((s, i) => (
                <Card key={i} className="border-steel-grey rounded-sm">
                  <CardContent className="p-5 text-center">
                    <s.icon className={`w-8 h-8 ${s.color} mx-auto mb-2`} />
                    <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Distribution Chart */}
            <Card className="border-steel-grey rounded-sm">
              <CardHeader>
                <CardTitle className="font-heading">Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(data.distribution).map(([range, count]) => (
                    <div key={range} className="flex items-center gap-4">
                      <span className="text-sm font-medium text-slate-600 w-16 text-right">{range}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-8 overflow-hidden">
                        <div
                          className={`h-full ${distributionColors[range]} rounded-full flex items-center justify-end pr-2 transition-all duration-500`}
                          style={{ width: `${Math.max((count / maxCount) * 100, count > 0 ? 8 : 0)}%` }}
                        >
                          {count > 0 && <span className="text-xs font-bold text-white">{count}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Percentiles */}
            {data.percentiles && Object.keys(data.percentiles).length > 0 && (
              <Card className="border-steel-grey rounded-sm">
                <CardHeader>
                  <CardTitle className="font-heading">Percentile Benchmarks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: '25th Percentile', key: 'p25' },
                      { label: '50th (Median)', key: 'p50' },
                      { label: '75th Percentile', key: 'p75' },
                      { label: '90th Percentile', key: 'p90' },
                    ].map((p) => (
                      <div key={p.key} className="bg-slate-50 rounded-sm p-4 text-center">
                        <p className="text-2xl font-bold text-blueprint-navy">{data.percentiles[p.key] || 0}</p>
                        <p className="text-xs text-slate-500 mt-1">{p.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Scores */}
            {data.top_scores?.length > 0 && (
              <Card className="border-steel-grey rounded-sm">
                <CardHeader>
                  <CardTitle className="font-heading">Top 10 Scores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {data.top_scores.map((score, i) => (
                      <div key={i} className={`px-4 py-2 rounded-sm font-bold text-white ${i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-700' : 'bg-blueprint-navy/70'}`}>
                        #{i + 1}: {score}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
