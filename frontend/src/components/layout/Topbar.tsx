import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Menu, Plus, UserPlus, FolderPlus, FilePlus, ReceiptText, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';
import type { User, Client, Project, Invoice, ActivityItem } from '../../types';
import type { NavPage } from './Sidebar';

export interface SearchData {
  clients: Client[];
  projects: Project[];
  invoices: Invoice[];
}

interface TopbarProps {
  user: User | null;
  onOpenMobileMenu: () => void;
  onNavigate: (page: NavPage, param?: string) => void;
  onOpenQuickCreate?: (type: 'client' | 'project' | 'invoice') => void;
  onResetSeed?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  searchData?: SearchData;
  activities?: ActivityItem[];
}

type SearchResult = {
  key: string;
  label: string;
  sub: string;
  type: 'Client' | 'Project' | 'Invoice';
  go: () => void;
};

export const Topbar: React.FC<TopbarProps> = ({
  user,
  onOpenMobileMenu,
  onNavigate,
  onOpenQuickCreate,
  onResetSeed,
  isSidebarCollapsed = false,
  onToggleSidebar,
  searchData,
  activities = []
}) => {
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  // Global search across clients, projects, proposals and invoices
  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q || !searchData) return [];
    const out: SearchResult[] = [];

    searchData.clients.forEach(c => {
      if (c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q)) {
        out.push({ key: `client-${c.id}`, label: c.name, sub: c.company, type: 'Client', go: () => onNavigate('client-detail', c.id) });
      }
    });
    searchData.projects.forEach(p => {
      if (p.title.toLowerCase().includes(q) || p.clientName.toLowerCase().includes(q)) {
        out.push({ key: `project-${p.id}`, label: p.title, sub: p.clientName, type: 'Project', go: () => onNavigate('projects') });
      }
    });
    searchData.invoices.forEach(inv => {
      if (inv.invoiceNumber.toLowerCase().includes(q) || inv.clientName.toLowerCase().includes(q)) {
        out.push({ key: `invoice-${inv.id}`, label: inv.invoiceNumber, sub: `${inv.clientName} · $${inv.total.toLocaleString()}`, type: 'Invoice', go: () => onNavigate('invoice-detail', inv.id) });
      }
    });

    return out.slice(0, 8);
  }, [query, searchData, onNavigate]);

  const clearSearch = () => {
    setQuery('');
    setSearchOpen(false);
  };

  // Close the dropdown when clicking outside
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  // ⌘K / Ctrl+K focuses the search field
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);


  return (
    <header className="h-14 bg-[#E9E4DC]/92 backdrop-blur-md border-b border-[#D8D0C4] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left section: logo (mobile), sidebar toggle (desktop), search bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        {/* Logo — mobile only */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="lg:hidden flex items-center gap-2 shrink-0 group cursor-pointer"
        >
          <Logo size={28} className="transition-transform duration-200 group-hover:scale-105" />
          <span className="font-semibold text-[14px] tracking-tight text-[#352B22]">
            SoloFlow<span style={{ color: '#82694E' }}>.</span>
          </span>
        </button>

        {/* Sidebar collapse toggle - desktop only */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg text-[#6B6158] hover:text-[#1A1918] hover:bg-[#EDE8E1]/60 transition-colors cursor-pointer"
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed
              ? <PanelLeftOpen className="w-4 h-4" />
              : <PanelLeftClose className="w-4 h-4" />}
          </button>
        )}

        {/* Global Search — live results across the workspace */}
        <div ref={searchWrapRef} className="relative w-full max-w-sm hidden sm:block">
          <Search className="w-3.5 h-3.5 text-[#6B6158] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={e => {
              if (e.key === 'Escape') { clearSearch(); searchInputRef.current?.blur(); }
              if (e.key === 'Enter' && results.length > 0) {
                results[0].go();
                clearSearch();
                searchInputRef.current?.blur();
              }
            }}
            placeholder="Search clients, projects…"
            className="w-full bg-[#FAF8F5] text-xs text-[#1A1918] placeholder-[#8C8278] pl-8.5 pr-10 py-1.5 rounded-lg border border-[#E0D9CF] focus:outline-none focus:border-[#82694E] focus:ring-2 focus:ring-[#82694E]/15 transition-all shadow-2xs"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-0.5 px-1 py-0.2 bg-[#EFECEA] border border-[#E0D9CF] rounded text-[9px] text-[#6B6158] font-medium font-mono">
            ⌘K
          </div>

          {/* Results dropdown */}
          {searchOpen && query.trim().length > 0 && (
            <div className="absolute left-0 right-0 mt-1.5 bg-[#FAF8F5] border border-[#E0D9CF] rounded-xl shadow-lg p-1 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-80 overflow-y-auto">
              {results.length === 0 ? (
                <div className="px-3 py-3 text-xs text-[#7A6D5C]">
                  No matches for "{query.trim()}"
                </div>
              ) : (
                <>
                  {results.map(r => (
                    <button
                      key={r.key}
                      onClick={() => { r.go(); clearSearch(); }}
                      className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-left hover:bg-[#F1EDE7] transition-colors cursor-pointer group"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-[#352B22] truncate">{r.label}</div>
                        <div className="text-[10px] text-[#7A6D5C] truncate mt-0.5">{r.sub}</div>
                      </div>
                      <span className="shrink-0 text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-[#F1EDE7] text-[#6B6158] group-hover:bg-[#E9E2D8] transition-colors">
                        {r.type}
                      </span>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right section: Quick Create, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5">


        {/* Quick Create Dropdown */}
        <div className="relative">
          <Button
            variant="primary"
            size="xs"
            onClick={() => setShowQuickMenu(!showQuickMenu)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            <span>New</span>
          </Button>

          {showQuickMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowQuickMenu(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-[#FAF8F5] border border-[#E0D9CF] rounded-xl shadow-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                style={{ top: '100%' }}
              >
                <button
                  onClick={() => {
                    setShowQuickMenu(false);
                    onOpenQuickCreate ? onOpenQuickCreate('invoice') : onNavigate('invoice-new');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-[#1A1918] hover:bg-[#F1EDE7] rounded-lg text-left transition-colors cursor-pointer"
                >
                  <ReceiptText className="w-3.5 h-3.5 text-[#6B6158]" />
                  <span>Create Invoice</span>
                </button>
                <button
                  onClick={() => {
                    setShowQuickMenu(false);
                    onOpenQuickCreate ? onOpenQuickCreate('project') : onNavigate('projects');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-[#1A1918] hover:bg-[#F1EDE7] rounded-lg text-left transition-colors cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-[#6B6158]" />
                  <span>Create Project</span>
                </button>
                <button
                  onClick={() => {
                    setShowQuickMenu(false);
                    onOpenQuickCreate ? onOpenQuickCreate('client') : onNavigate('clients');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-[#1A1918] hover:bg-[#F1EDE7] rounded-lg text-left transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#6B6158]" />
                  <span>Add Client</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* User Profile avatar */}
        <div
          onClick={() => onNavigate('settings')}
          className="flex items-center gap-2 pl-1 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <Avatar name={user?.name || 'Alpha'} size="sm" />
          <div className="hidden sm:block text-left">
            <p className="text-[11px] font-semibold text-[#352B22] leading-none">{user?.name || 'Alpha'}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
