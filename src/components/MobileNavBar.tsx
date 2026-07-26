import { useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare, Users, Calendar, Heart, UserCircle } from 'lucide-react';

const TABS = [
  { icon: MessageSquare, path: '/feed', label: 'Feed' },
  { icon: Users, path: '/directory', label: 'Directory' },
  { icon: Calendar, path: '/events', label: 'Events' },
  { icon: Heart, path: '/prayer-requests', label: 'Prayers' },
  { icon: UserCircle, path: '/user/profile', label: 'Profile' },
];

// Fixed bottom tab bar for small screens — hidden on md+ where the top
// header navigation already covers these destinations comfortably.
export default function MobileNavBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t border-border safe-area-bottom">
      <div className="flex items-stretch justify-around">
        {TABS.map(({ icon: Icon, path, label }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors"
            >
              <Icon className={`w-5 h-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-[10px] font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
