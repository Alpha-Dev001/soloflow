import React from 'react';
import {
  LayoutGrid,
  Users,
  FolderKanban,
  Receipt,
  MoreHorizontal,
  FileText,
  BarChart3,
  Sparkles,
  CalendarDays,
  Settings,
  X,
} from 'lucide-react';
import type { NavPage } from './Sidebar';

interface MobileTabBarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
}

/** Primary tabs — always visible in the bottom bar */
const PRIMARY_TABS: { id: NavPage; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Home', icon: <LayoutGrid className="w-5 h-5" /> },
  { id: 'clients', label: 'Clients', icon: <Users className="w-5 h-5" /> },
  { id: 'projects', label: 'Projects', icon: <FolderKanban className="w-5 h-5" /> },
  { id: 'invoices', label: 'Invoices', icon: <Receipt className="w-5 h-5" /> },
];

/** Secondary pages accessible via the "More" tray */
const MORE_ITEMS: { id: NavPage; label: string; icon: React.ReactNode }[] = [
  { id: 'proposals', label: 'Proposals', icon: <FileText className="w-5 h-5" /> },
  { id: 'calendar', label: 'Calendar', icon: <CalendarDays className="w-5 h-5" /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'ai-assistant', label: 'AI Assistant', icon: <Sparkles className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
];

const isCurrent = (id: NavPage, currentPage: NavPage) => {
  if (currentPage === id) return true;
  if (id === 'clients' && currentPage === 'client-detail') return true;
  if (id === 'proposals' && (currentPage === 'proposal-new' || currentPage === 'proposal-detail' || currentPage === 'proposal-editor')) return true;
  if (id === 'invoices' && (currentPage === 'invoice-new' || currentPage === 'invoice-detail')) return true;
  return false;
};

export const MobileTabBar: React.FC<MobileTabBarProps> = ({ currentPage, onNavigate }) => {
  const [morOpen, setMoreOpen] = React.useState(false);

  const moreIsActive = MORE_ITEMS.some(item => isCurrent(item.id, currentPage));

  const handleNavigate = (page: NavPage) => {
    setMoreOpen(false);
    onNavigate(page);
  };

  return (
    <>
      {/* More tray overlay */}
      {morOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More tray — slides up from bottom */}
      <div
        className={`fixed left-0 right-0 z-50 lg:hidden transition-all duration-300 ease-out ${
          morOpen ? 'bottom-[65px] opacity-100' : 'bottom-[65px] opacity-0 pointer-events-none translate-y-4'
        }`}
        style={{ transform: morOpen ? 'translateY(0)' : 'translateY(16px)' }}
      >
        <div
          className="mx-3 rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #4A3E33 0%, #3A3026 100%)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 -4px 32px rgba(40,30,20,0.32)',
          }}
        >
          {/* Tray header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
          >
            <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(250,245,236,0.5)' }}>
              More
            </span>
            <button
              onClick={() => setMoreOpen(false)}
              className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
              aria-label="Close menu"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Grid of items */}
          <div className="grid grid-cols-4 gap-0 p-3">
            {MORE_ITEMS.map(item => {
              const active = isCurrent(item.id, currentPage);
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all duration-150 cursor-pointer"
                  style={{
                    background: active
                      ? 'linear-gradient(135deg, rgba(255,252,246,0.22) 0%, rgba(233,220,200,0.14) 100%)'
                      : 'transparent',
                    color: active ? '#FFF7EA' : 'rgba(250,245,236,0.65)',
                  }}
                  aria-current={active ? 'page' : undefined}
                >
                  <span style={{ color: active ? '#FFF7EA' : 'rgba(250,245,236,0.55)' }}>
                    {item.icon}
                  </span>
                  <span className="text-[10px] font-medium leading-none text-center">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Tab Bar */}
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
          {PRIMARY_TABS.map(tab => {
            const active = isCurrent(tab.id, currentPage);
            return (
              <button
                key={tab.id}
                onClick={() => handleNavigate(tab.id)}
                aria-current={active ? 'page' : undefined}
                aria-label={tab.label}
                className="flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-150 cursor-pointer relative"
              >
                {/* Active indicator pill */}
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

          {/* More button */}
          <button
            onClick={() => setMoreOpen(o => !o)}
            aria-label="More pages"
            aria-expanded={morOpen}
            className="flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-150 cursor-pointer relative"
          >
            {moreIsActive && !morOpen && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                style={{ background: 'linear-gradient(to right, #D9C4A5, #B39C82)' }}
              />
            )}
            <span style={{ color: morOpen || moreIsActive ? '#FFF7EA' : 'rgba(250,245,236,0.50)' }}>
              {morOpen ? <X className="w-5 h-5" /> : <MoreHorizontal className="w-5 h-5" />}
            </span>
            <span
              className="text-[10px] font-medium leading-none"
              style={{ color: morOpen || moreIsActive ? '#FFF7EA' : 'rgba(250,245,236,0.50)' }}
            >
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
