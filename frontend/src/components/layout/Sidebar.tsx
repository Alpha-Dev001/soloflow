import { useState, useRef, useEffect } from 'react';
import type { ReactNode, FC, KeyboardEvent } from 'react';
import {
  LayoutGrid,
  Users,
  Calendar as CalendarIcon,
  BarChart3,
  LogOut,
  Globe,
  Shield,
  Crown,
  Settings
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Logo } from '../ui/Logo';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import type { User } from '../../types';

export type NavPage =
  | 'landing'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'clients'
  | 'client-detail'
  | 'projects'
  | 'invoices'
  | 'invoice-new'
  | 'invoice-detail'
  | 'calendar'
  | 'analytics'
  | 'settings'
  | 'admin';

interface NavItem {
  id: NavPage;
  label: string;
  icon: ReactNode;
}

interface SidebarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage, param?: string) => void;
  user: User | null;
  onLogout?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
}

export const Sidebar: FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  user,
  onLogout,
  isMobileOpen,
  onCloseMobile,
  isCollapsed = false
}) => {
  // Reduced navigation — primary sidebar only shows top-level items
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'clients', label: 'Clients', icon: <Users className="w-4 h-4" /> },
    { id: 'calendar', label: 'Calendar', icon: <CalendarIcon className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const isAdmin = user?.role === 'ADMIN';
  const isCurrent = (id: NavPage) => {
    if (currentPage === id) return true;
    // Keep Clients highlighted when in client workspace or sub-pages
    if (id === 'clients' && (currentPage === 'client-detail' || currentPage === 'projects' || currentPage === 'invoices' || currentPage === 'invoice-detail')) return true;
    return false;
  };

  // Roving tabindex for keyboard navigation (ArrowUp/ArrowDown/Home/End)
  const activeIndex = Math.max(0, navItems.findIndex(item => isCurrent(item.id)));
  const [focusedIndex, setFocusedIndex] = useState(activeIndex);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const navRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    setFocusedIndex(activeIndex);
  }, [activeIndex]);

  const handleNavKeyDown = (e: KeyboardEvent, index: number) => {
    let nextIndex: number | null = null;
    if (e.key === 'ArrowDown') nextIndex = Math.min(index + 1, navItems.length - 1);
    else if (e.key === 'ArrowUp') nextIndex = Math.max(index - 1, 0);
    else if (e.key === 'Home') nextIndex = 0;
    else if (e.key === 'End') nextIndex = navItems.length - 1;

    if (nextIndex !== null) {
      e.preventDefault();
      setFocusedIndex(nextIndex);
      navRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      {/* Premium dark sidebar — rich warm charcoal with layered ambient gradients */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col justify-between transition-all duration-300 ease-out lg:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          } ${isCollapsed ? 'w-16' : 'w-60'}`}
        style={{
          background: [
            'radial-gradient(ellipse 100% 45% at 0% 110%, rgba(180,156,130,0.18) 0%, transparent 60%)',
            'radial-gradient(ellipse 80% 40% at 100% 50%, rgba(255,255,255,0.08) 0%, transparent 55%)',
            'linear-gradient(180deg, #4A3E33 0%, #463A2F 25%, #443829 50%, #3C3126 75%, #342A20 100%)'
          ].join(', '),
          borderRight: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '10px 0 36px rgba(74, 59, 50, 0.22), 3px 0 10px rgba(74, 59, 50, 0.12)'
        }}
      >
        {/* Soft ambient warmth in the lower half */}
        <div
          aria-hidden
          className="absolute -bottom-32 -left-20 w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(210, 186, 158, 0.14) 0%, transparent 68%)' }}
        />
        {/* Subtle top highlight line */}
        <div
          aria-hidden
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.05) 100%)' }}
        />
        {/* Fine dotted texture */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(255, 245, 230, 0.07) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            opacity: 0.6
          }}
        />

        {/* Top Section */}
        <div>
          {/* Logo Bar */}
          <div
            className="h-16 flex items-center px-4 relative z-10"
            style={{ justifyContent: isCollapsed ? 'center' : 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.07)' }}
          >
            <button
              onClick={() => {
                onNavigate('dashboard');
                onCloseMobile?.();
              }}
              className="flex items-center gap-2.5 text-left group cursor-pointer min-w-0"
            >
              <Logo size={32} className="transition-transform duration-200 group-hover:scale-105" />
              {!isCollapsed && (
                <span className="font-semibold text-[16px] tracking-tight text-white">
                  SoloFlow<span style={{ color: '#FBEED9' }}>.</span>
                </span>
              )}
            </button>

            {!isCollapsed && (
              <div className="flex items-center gap-0.5">
                {/* Landing page link */}
                <button
                  onClick={() => onNavigate('landing')}
                  title="View Public Landing Page"
                  aria-label="View Public Landing Page"
                  className="hidden lg:flex text-white/65 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
                  style={{ transitionProperty: 'color, background-color' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <Globe className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav aria-label="Main navigation" className="p-3 overflow-y-auto relative z-10">
            {!isCollapsed && (
              <div
                className="text-[10px] font-semibold uppercase px-3 pb-2 pt-1"
                style={{ color: 'rgba(250, 245, 236, 0.55)', letterSpacing: '0.08em' }}
              >
                Workspace
              </div>
            )}
            <div className="space-y-0.5">
              {navItems.map((item, index) => {
                const active = isCurrent(item.id);
                return (
                  <div key={item.id} className="relative group/nav-item">
                    <button
                      ref={el => { navRefs.current[index] = el; }}
                      onClick={() => {
                        onNavigate(item.id);
                        onCloseMobile?.();
                      }}
                      onKeyDown={e => handleNavKeyDown(e, index)}
                      onFocus={() => setFocusedIndex(index)}
                      tabIndex={focusedIndex === index ? 0 : -1}
                      aria-current={active ? 'page' : undefined}
                      aria-label={item.label}
                      className={`relative w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-all duration-200 ease-out cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-[#C9B79E]/40 ${isCollapsed ? 'justify-center' : ''
                        } ${active
                          ? 'font-semibold text-white'
                          : 'font-medium text-white/75'
                        }`}
                      style={
                        active
                          ? {
                            background: 'linear-gradient(135deg, rgba(255,252,246,0.28) 0%, rgba(233,220,200,0.18) 100%)',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22), 0 2px 8px rgba(40,30,20,0.18)'
                          }
                          : undefined
                      }
                      onMouseEnter={e => {
                        if (!active) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                          e.currentTarget.style.color = '#FFFFFF';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!active) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '';
                        }
                      }}
                    >
                      {/* Warm accent bar */}
                      <span
                        className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-300 ease-out ${active ? 'h-5 opacity-100' : 'h-0 opacity-0'
                          }`}
                        style={{ background: 'linear-gradient(to bottom, #D9C4A5 0%, #B39C82 100%)' }}
                      />

                      <span
                        className="shrink-0 transition-colors"
                        style={{ color: active ? '#FFF7EA' : 'rgba(250, 245, 236, 0.62)' }}
                      >
                        {item.icon}
                      </span>

                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </button>

                    {/* Tooltip when collapsed */}
                    {isCollapsed && (
                      <span
                        role="tooltip"
                        className="pointer-events-none absolute left-full top-1/2 z-50 ml-2.5 -translate-y-1/2 whitespace-nowrap rounded-lg py-1.5 px-2.5 text-[11px] font-medium text-white opacity-0 translate-x-1 scale-95 transition-all duration-150 ease-out group-hover/nav-item:opacity-100 group-hover/nav-item:translate-x-0 group-hover/nav-item:scale-100"
                        style={{
                          backgroundColor: '#3E342B',
                          boxShadow: '0 6px 18px rgba(40, 30, 22, 0.32), 0 2px 5px rgba(40, 30, 22, 0.2)'
                        }}
                      >
                        {item.label}
                        <span
                          className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent"
                          style={{ borderRightColor: '#3E342B' }}
                        />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="p-3 relative z-10 space-y-2">


          {isAdmin && (
            <button
              onClick={() => {
                onNavigate('admin');
                onCloseMobile?.();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium cursor-pointer ${currentPage === 'admin' ? 'text-white bg-white/15' : 'text-white/75 hover:bg-white/10'
              } ${isCollapsed ? 'justify-center' : ''}`}
            >
              <Shield className="w-4 h-4" />
              {!isCollapsed && <span>Admin</span>}
            </button>
          )}

          {/* User Profile */}
          <div
            className="pt-3 flex items-center justify-between px-1"
            style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}
          >
            <button
              onClick={() => onNavigate('settings')}
              className="flex items-center gap-2.5 text-left group flex-1 cursor-pointer min-w-0"
            >
              <Avatar
                name={user?.name || 'Alpha'}
                src={user?.avatarUrl}
                size="sm"
              />
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-semibold text-white truncate group-hover:text-[#FBEED9] transition-colors">
                    {user?.name || 'Alpha'}
                  </div>
                  <div className="text-[10px] text-white/60 truncate">
                    {user?.email || 'alpha@example.com'}
                  </div>
                </div>
              )}
            </button>

            {onLogout && !isCollapsed && (
              <button
                onClick={() => setConfirmLogout(true)}
                className="p-1.5 text-white/65 rounded-md transition-colors cursor-pointer shrink-0"
                title="Sign Out"
                aria-label="Sign Out"
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#E8896B';
                  e.currentTarget.style.backgroundColor = 'rgba(180, 85, 47, 0.18)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = '';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Sign Out Confirmation */}
      <ConfirmDialog
        isOpen={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={() => {
          setConfirmLogout(false);
          onLogout?.();
        }}
        tone="neutral"
        title="Sign out of SoloFlow?"
        description="You will be returned to the landing page and will need to sign in again to access your workspace. Your data stays safely saved."
        confirmLabel="Sign out"
        cancelLabel="Stay signed in"
        details={user ? [
          { label: 'Account', value: user.name },
          { label: 'Email', value: user.email || '—' }
        ] : []}
      />
    </>
  );
};
