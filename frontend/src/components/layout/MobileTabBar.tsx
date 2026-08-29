import React from 'react';
import {
  LayoutGrid,
  Users,
  BarChart3,
  CalendarDays,
  Settings,
} from 'lucide-react';
import type { NavPage } from './Sidebar';

interface MobileTabBarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
}

/** Bottom bar tabs — direct icons, no More tray needed */
const TABS: { id: NavPage; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Home', icon: <LayoutGrid className="w-5 h-5" /> },
  { id: 'clients', label: 'Clients', icon: <Users className="w-5 h-5" /> },
  { id: 'calendar', label: 'Calendar', icon: <CalendarDays className="w-5 h-5" /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
];

const isCurrent = (id: NavPage, currentPage: NavPage) => {
  if (currentPage === id) return true;
  if (id === 'clients' && (currentPage === 'client-detail' || currentPage === 'projects' || currentPage === 'invoices' || currentPage === 'invoice-detail')) return true;
  return false;
};

export const MobileTabBar: React.FC<MobileTabBarProps> = ({ currentPage, onNavigate }) => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
      aria-label="Mobile navigation"
      style={{
        background: 'linear-gradient(180deg, #4A3E33 0%, #3C3126 100%)',
        borderTop: '1px solid rgba(255,255,255,0.10)',
        boxShadow: '0 -4px 24px rgba(40,30,20,0.22)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-stretch h-16">
        {TABS.map(tab => {
          const active = isCurrent(tab.id, currentPage);
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              aria-current={active ? 'page' : undefined}
              aria-label={tab.label}
              className="flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-150 cursor-pointer relative"
            >
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ background: 'linear-gradient(to right, #D9C4A5, #B39C82)' }}
                />
              )}
              <span style={{ color: active ? '#FFF7EA' : 'rgba(250,245,236,0.50)' }}>
                {tab.icon}
              </span>
              <span
                className="text-[10px] font-medium leading-none"
                style={{ color: active ? '#FFF7EA' : 'rgba(250,245,236,0.50)' }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
