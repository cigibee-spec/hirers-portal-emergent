import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { API } from '../App';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import {
  HardHat, Shield, Users, Briefcase, FileText, DollarSign, MessageSquare,
  Calendar, Search, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight, BarChart3
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (tab === 'users') fetchUsers();
  }, [tab, usersPage, filterType]);

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${API}/admin/dashboard`, {
        credentials: 'include', headers: getAuthHeaders()
      });
      if (res.ok) setStats(await res.json());
      else if (res.status === 403) navigate('/');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    const params = new URLSearchParams({ page: usersPage, limit: 20 });
    if (filterType) params.set('user_type', filterType);
    if (searchQuery) params.set('search', searchQuery);
    try {
      const res = await fetch(`${API}/admin/users?${params}`, {
        credentials: 'include', headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setUsersTotal(data.total);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleUserStatus = async (userId, currentActive) => {
    try {
      const res = await fetch(`${API}/admin/users/${userId}/status?is_active=${!currentActive}`, {
        method: 'PUT', credentials: 'include', headers: getAuthHeaders()
      });
      if (res.ok) {
        toast.success(`User ${!currentActive ? 'activated' : 'deactivated'}`);
        fetchUsers();
        fetchDashboard();
      }
    } catch (err) {
      toast.error('Failed to update user');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-concrete-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-safety-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-concrete-white">
      <nav className="bg-blueprint-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-safety-orange rounded-sm flex items-center justify-center">
                <HardHat className="w-6 h-6 text-white" />
              </div>
              <span className="font-heading font-bold text-xl text-white">BuildForce</span>
            </Link>
            <Badge className="bg-red-500 text-white">Admin</Badge>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setTab('overview')} className={`text-sm font-medium ${tab === 'overview' ? 'text-safety-orange' : 'text-white/70 hover:text-white'}`}>Overview</button>
            <button onClick={() => setTab('users')} className={`text-sm font-medium ${tab === 'users' ? 'text-safety-orange' : 'text-white/70 hover:text-white'}`}>Users</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="admin-dashboard">
        {tab === 'overview' && stats && (
          <div className="space-y-6">
            <h1 className="font-heading text-2xl font-bold text-blueprint-navy flex items-center gap-2">
              <Shield className="w-6 h-6" /> Platform Overview
            </h1>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Users', value: stats.users.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Talents', value: stats.users.talents, icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Hirers', value: stats.users.hirers, icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'Active Jobs', value: stats.jobs.active, icon: Briefcase, color: 'text-safety-orange', bg: 'bg-orange-50' },
              ].map((s, i) => (
                <Card key={i} className="border-steel-grey rounded-sm">
                  <CardContent className={`p-5 text-center ${s.bg}`}>
                    <s.icon className={`w-8 h-8 ${s.color} mx-auto mb-2`} />
                    <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {[
                { label: 'Applications', value: stats.applications, icon: FileText },
                { label: 'Resumes Built', value: stats.resumes.built, icon: FileText },
                { label: 'Resumes Uploaded', value: stats.resumes.uploaded, icon: FileText },
                { label: 'Messages', value: stats.messages, icon: MessageSquare },
                { label: 'Interviews', value: stats.interviews, icon: Calendar },
                { label: 'Total Jobs', value: stats.jobs.total, icon: Briefcase },
              ].map((s, i) => (
                <div key={i} className="bg-white border border-steel-grey rounded-sm p-4 flex items-center gap-3">
                  <s.icon className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-xl font-bold text-blueprint-navy">{s.value}</p>
                    <p className="text-xs text-slate-500">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Revenue */}
            <Card className="border-steel-grey rounded-sm">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <DollarSign className="w-5 h-5" /> Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-sm p-4 text-center">
                    <p className="text-3xl font-bold text-green-600">${stats.payments.revenue.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">Total Revenue</p>
                  </div>
                  <div className="bg-blue-50 rounded-sm p-4 text-center">
                    <p className="text-3xl font-bold text-blue-600">{stats.payments.paid}</p>
                    <p className="text-xs text-slate-500">Paid Transactions</p>
                  </div>
                  <div className="bg-slate-50 rounded-sm p-4 text-center">
                    <p className="text-3xl font-bold text-slate-600">{stats.payments.total_transactions}</p>
                    <p className="text-xs text-slate-500">Total Transactions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Users */}
            <Card className="border-steel-grey rounded-sm">
              <CardHeader>
                <CardTitle className="font-heading">Recent Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-steel-grey">
                        <th className="text-left py-2 text-slate-500 font-medium">Name</th>
                        <th className="text-left py-2 text-slate-500 font-medium">Email</th>
                        <th className="text-left py-2 text-slate-500 font-medium">Type</th>
                        <th className="text-left py-2 text-slate-500 font-medium">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recent_users.map((u, i) => (
                        <tr key={i} className="border-b border-steel-grey/50">
                          <td className="py-2 font-medium text-blueprint-navy">{u.name}</td>
                          <td className="py-2 text-slate-600">{u.email}</td>
                          <td className="py-2"><Badge variant="outline" className="text-xs capitalize">{u.user_type}</Badge></td>
                          <td className="py-2 text-slate-500">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {tab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h1 className="font-heading text-2xl font-bold text-blueprint-navy">User Management</h1>
              <div className="flex gap-2">
                {['', 'talent', 'hirer'].map((t) => (
                  <button
                    key={t}
                    onClick={() => { setFilterType(t); setUsersPage(1); }}
                    className={`px-3 py-1 text-sm rounded-sm border ${filterType === t ? 'bg-safety-orange text-white border-safety-orange' : 'border-steel-grey text-slate-600'}`}
                  >
                    {t === '' ? 'All' : t === 'talent' ? 'Talents' : 'Hirers'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="pl-10"
                  onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                  data-testid="admin-user-search"
                />
              </div>
              <Button onClick={fetchUsers} className="bg-safety-orange text-white rounded-sm">Search</Button>
            </div>

            <Card className="border-steel-grey rounded-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-steel-grey bg-slate-50">
                        <th className="text-left p-3 text-slate-500 font-medium">Name</th>
                        <th className="text-left p-3 text-slate-500 font-medium">Email</th>
                        <th className="text-left p-3 text-slate-500 font-medium">Type</th>
                        <th className="text-left p-3 text-slate-500 font-medium">Plan</th>
                        <th className="text-left p-3 text-slate-500 font-medium">Status</th>
                        <th className="text-left p-3 text-slate-500 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.user_id} className="border-b border-steel-grey/50 hover:bg-slate-50" data-testid={`admin-user-${u.user_id}`}>
                          <td className="p-3 font-medium text-blueprint-navy">{u.name}</td>
                          <td className="p-3 text-slate-600">{u.email}</td>
                          <td className="p-3"><Badge variant="outline" className="text-xs capitalize">{u.user_type}</Badge></td>
                          <td className="p-3 text-xs capitalize">{u.subscription?.plan || '-'}</td>
                          <td className="p-3">
                            <Badge className={u.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {u.is_active !== false ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => toggleUserStatus(u.user_id, u.is_active !== false)}
                              className="text-slate-500 hover:text-safety-orange"
                              data-testid={`toggle-user-${u.user_id}`}
                            >
                              {u.is_active !== false ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5 text-red-500" />}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Showing {users.length} of {usersTotal} users</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={usersPage <= 1} onClick={() => setUsersPage(p => p - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-slate-600 py-1">Page {usersPage}</span>
                <Button variant="outline" size="sm" disabled={usersPage * 20 >= usersTotal} onClick={() => setUsersPage(p => p + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
