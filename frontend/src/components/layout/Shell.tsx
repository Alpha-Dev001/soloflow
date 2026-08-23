import React, { useState } from 'react';
import { Sidebar, type NavPage } from './Sidebar';
import { Topbar, type SearchData } from './Topbar';
import { MobileTabBar } from './MobileTabBar';
import type { User, ActivityItem } from '../../types';

interface ShellProps {
  children: React.ReactNode;
  currentPage: NavPage;
  onNavigate: (page: NavPage, param?: string) => void;
  user: User | null;
  onLogout?: () => void;
  onOpenQuickCreate?: (type: 'client' | 'project' | 'proposal' | 'invoice') => void;
  onResetSeed?: () => void;
  searchData?: SearchData;
  activities?: ActivityItem[];
}

export const Shell: React.FC<ShellProps> = ({
  children,
  currentPage,
  onNavigate,
  user,
  onLogout,
  onOpenQuickCreate,
  onResetSeed,
  searchData,
  activities
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex flex-col antialiased relative texture-linen" style={{ background: 'linear-gradient(180deg, #FDFCFA 0%, #F8F6F2 100%)' }}>
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        user={user}
        onLogout={onLogout}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        isCollapsed={isCollapsed}
      />

      {/* Main Content Area — lighter, brighter surface */}
      <div className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ease-out ${isCollapsed ? 'lg:pl-16' : 'lg:pl-60'}`}>
        <Topbar
          user={user}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          onNavigate={onNavigate}
          onOpenQuickCreate={onOpenQuickCreate}
          onResetSeed={onResetSeed}
          isSidebarCollapsed={isCollapsed}
          onToggleSidebar={() => setIsCollapsed(!isCollapsed)}
          searchData={searchData}
          activities={activities}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl w-full mx-auto" style={{ background: 'linear-gradient(180deg, #FDFCFA 0%, #F8F6F2 100%)' }}>
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar — replaces the drawer on small screens */}
      <MobileTabBar currentPage={currentPage} onNavigate={onNavigate} />
    </div>
  );
};
