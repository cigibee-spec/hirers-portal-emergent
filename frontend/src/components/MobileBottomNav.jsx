import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Search, MessageSquare, User, Briefcase } from 'lucide-react';

const TALENT_TABS = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/jobs', icon: Search, label: 'Jobs' },
  { path: '/messages', icon: MessageSquare, label: 'Messages' },
  { path: '/talent/dashboard', icon: User, label: 'Profile' },
];

const HIRER_TABS = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/hirer/dashboard', icon: Briefcase, label: 'Jobs' },
  { path: '/messages', icon: MessageSquare, label: 'Messages' },
  { path: '/hirer/dashboard', icon: User, label: 'Profile' },
];

const PUBLIC_TABS = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/jobs', icon: Search, label: 'Jobs' },
  { path: '/companies', icon: Briefcase, label: 'Companies' },
  { path: '/login', icon: User, label: 'Sign In' },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Don't show on certain pages
  const hiddenPaths = ['/login', '/register', '/auth/callback'];
  if (hiddenPaths.some(p => location.pathname.startsWith(p))) return null;

  const tabs = !isAuthenticated 
    ? PUBLIC_TABS 
    : user?.user_type === 'talent' 
      ? TALENT_TABS 
      : HIRER_TABS;

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-steel-grey safe-area-bottom" data-testid="mobile-bottom-nav">
      <div className="flex items-center justify-around h-14 px-2">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <button
              key={tab.label}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${active ? 'text-safety-orange' : 'text-slate-400'}`}
              data-testid={`mobile-nav-${tab.label.toLowerCase().replace(' ', '-')}`}
            >
              <tab.icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] mt-0.5 font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
