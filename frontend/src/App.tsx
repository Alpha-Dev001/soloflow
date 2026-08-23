/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
    BrowserRouter,
    Navigate,
    Outlet,
    Route,
    Routes,
    useLocation,
    useNavigate
} from 'react-router-dom';
import { Shell } from './components/layout/Shell';
import type { NavPage } from './components/layout/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { DemoPage } from './pages/DemoPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { CookiePolicyPage } from './pages/CookiePolicyPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OnboardingPage, type OnboardingData } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClientsPage } from './pages/ClientsPage';
import { ClientDetailPage } from './pages/ClientDetailPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProposalsPage } from './pages/ProposalsPage';
import { ProposalEditorPage } from './pages/ProposalEditorPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { InvoiceDetailPage } from './pages/InvoiceDetailPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { CalendarPage } from './pages/CalendarPage';
import { SettingsPage } from './pages/SettingsPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { ToastProvider, useToast } from './components/ui/Toast';
import { api } from './services/api';
import type {
    User,
    DashboardMetrics,
    Client,
    Project,
    Proposal,
    Invoice,
    AnalyticsData,
    CalendarEvent
} from './types';

function getNavPage(pathname: string): NavPage {
    if (pathname === '/') return 'landing';
    if (pathname === '/login') return 'login';
    if (pathname === '/register') return 'register';
    if (pathname === '/dashboard') return 'dashboard';
    if (pathname === '/clients') return 'clients';
    if (pathname.startsWith('/clients/')) return 'client-detail';
    if (pathname === '/projects') return 'projects';
    if (pathname === '/proposals') return 'proposals';
    if (pathname.startsWith('/proposals/')) return 'proposal-editor';
    if (pathname === '/invoices') return 'invoices';
    if (pathname.startsWith('/invoices/')) return 'invoice-detail';
    if (pathname === '/calendar') return 'calendar';
    if (pathname === '/analytics') return 'analytics';
    if (pathname === '/ai-assistant') return 'ai-assistant';
    if (pathname === '/settings') return 'settings';
    return 'landing';
}

function getRouteId(pathname: string, prefix: string): string | null {
    if (!pathname.startsWith(prefix)) return null;
    const id = pathname.slice(prefix.length).split('/')[0];
    return id && id !== 'new' ? decodeURIComponent(id) : null;
}

function getProposalId(pathname: string): string | null {
    const match = pathname.match(/^\/proposals\/([^/]+)\/edit$/);
    return match ? decodeURIComponent(match[1]) : null;
}



/** Resets scroll position to the top whenever the route changes */
function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, [pathname]);
    return null;
}

const EMPTY_METRICS: import('./types').DashboardMetrics = {
    totalRevenue: 0,
    revenueGrowthPercent: 0,
    activeProjects: 0,
    activeProjectsGrowth: 0,
    pendingPayments: 0,
    pendingPaymentsGrowthPercent: 0,
    completedProjects: 0,
    completedProjectsGrowth: 0,
    revenueOverview: { period: '', total: 0, growthPercent: 0, timeline: [] },
    recentActivities: [],
    upcoming: [],
    topClients: [],
    projectStatusBreakdown: { active: 0, onHold: 0, completed: 0, cancelled: 0 }
};

const EMPTY_ANALYTICS: import('./types').AnalyticsData = {
    totalRevenue: 0,
    avgProjectValue: 0,
    proposalWinRate: 0,
    collectionRate: 0,
    monthlyRevenue: [],
    topClientsRevenue: []
};

function AppContent() {
    const { showToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const currentPage = getNavPage(location.pathname);
    const selectedClientId = getRouteId(location.pathname, '/clients/');
    const selectedProposalId = getProposalId(location.pathname);
    const selectedInvoiceId = getRouteId(location.pathname, '/invoices/');

    const [user, setUser] = useState<User | null>(() => {
        try {
            const saved = localStorage.getItem('soloflow_user');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [, setIsLoading] = useState(false);

    // New accounts go through onboarding before reaching the dashboard
    const [onboarded, setOnboarded] = useState<boolean>(() => {
        try {
            return localStorage.getItem('soloflow_onboarded') === 'true';
        } catch {
            return true;
        }
    });

    const refreshAllData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [dashRes, clientsRes, projectsRes, proposalsRes, invoicesRes, analyticsRes, calendarRes] = await Promise.all([
                api.getDashboard(),
                api.getClients(),
                api.getProjects(),
                api.getProposals(),
                api.getInvoices(),
                api.getAnalytics(),
                api.getCalendar()
            ]);
            setMetrics(dashRes.metrics);
            setClients(clientsRes.clients);
            setProjects(projectsRes.projects);
            setProposals(proposalsRes.proposals);
            setInvoices(invoicesRes.invoices);
            setAnalytics(analyticsRes.analytics);
            setEvents(calendarRes.events);
        } catch (err) {
            console.error('Error loading data from backend:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) refreshAllData();
    }, [user, refreshAllData]);

    const handleLoginSuccess = (authUser: User, token: string) => {
        setUser(authUser);
        try {
            localStorage.setItem('soloflow_user', JSON.stringify(authUser));
            localStorage.setItem('soloflow_token', token);
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
        }
        navigate('/dashboard', { replace: true });
        showToast(`Welcome back, ${authUser.name}!`, 'success');
    };

    const handleLaunchDemo = async () => {
        try {
            const res = await api.login('demo@soloflow.com', 'demo123');
            handleLoginSuccess(res.user, res.token || '');
        } catch (err) {
            // If the server is unavailable show a helpful message via toast
            showToast('Demo login failed. Make sure the backend is running and run: npm run seed', 'error');
        }
    };

    /** Registration routes through onboarding to shape the dashboard */
    const handleRegisterSuccess = (authUser: User, token: string) => {
        setUser(authUser);
        try {
            localStorage.setItem('soloflow_user', JSON.stringify(authUser));
            localStorage.setItem('soloflow_token', token);
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
        }
        navigate('/onboarding', { replace: true });
    };

    const handleOnboardingComplete = async (data: OnboardingData) => {
        try {
            const res = await api.updateProfile({
                businessName: data.businessName,
                currency: data.currency
            });
            setUser(res.user);
            localStorage.setItem('soloflow_user', JSON.stringify(res.user));
        } catch (e) {
            console.error('Failed to save onboarding profile:', e);
        }
        try {
            // Persist onboarding answers so the dashboard can adapt to them
            localStorage.setItem('soloflow_onboarding', JSON.stringify(data));
            localStorage.setItem('soloflow_onboarded', 'true');
        } catch {
            // Storage can be unavailable in privacy-restricted browsers.
        }
        setOnboarded(true);
        await refreshAllData();
        showToast('Your workspace is ready!', 'success');
        navigate('/dashboard', { replace: true });
    };

    const handleLogout = () => {
        setUser(null);
        try {
            localStorage.removeItem('soloflow_user');
            localStorage.removeItem('soloflow_token');
        } catch (e) {
            // Storage can be unavailable in privacy-restricted browsers.
        }
        navigate('/', { replace: true });
        showToast('Signed out successfully.', 'info');
    };

    const handleNavigate = (page: NavPage, param?: string) => {
        const paths: Partial<Record<NavPage, string>> = {
            landing: '/',
            login: '/login',
            register: '/register',
            dashboard: '/dashboard',
            clients: '/clients',
            projects: '/projects',
            proposals: '/proposals',
            'proposal-new': '/proposals/new',
            'proposal-editor': param ? `/proposals/${encodeURIComponent(param)}/edit` : '/proposals/new',
            invoices: '/invoices',
            'invoice-new': '/invoices',
            calendar: '/calendar',
            analytics: '/analytics',
            'ai-assistant': '/ai-assistant',
            settings: '/settings'
        };
        let path = paths[page];
        if (page === 'client-detail' && param) path = `/clients/${encodeURIComponent(param)}`;
        if (page === 'invoice-detail' && param) path = `/invoices/${encodeURIComponent(param)}`;
        if (page === 'proposal-detail' && param) path = `/proposals/${encodeURIComponent(param)}/edit`;
        navigate(path || '/dashboard');
    };

    const handleQuickCreate = (type: 'client' | 'project' | 'proposal' | 'invoice') => {
        const page: NavPage = type === 'client'
            ? 'clients'
            : type === 'project'
                ? 'projects'
                : type === 'proposal'
                    ? 'proposal-editor'
                    : 'invoices';
        handleNavigate(page);
    };

    const handleCreateClient = async (data: Partial<Client>) => {
        try { await api.createClient(data); await refreshAllData(); showToast('Client added successfully!', 'success'); }
        catch (e) { showToast('Failed to add client', 'error'); }
    };

    const handleUpdateClient = async (id: string, data: Partial<Client>) => {
        try { await api.updateClient(id, data); await refreshAllData(); showToast('Client details updated!', 'success'); }
        catch (e) { showToast('Failed to update client', 'error'); }
    };

    const handleDeleteClient = async (id: string) => {
        try {
            await api.deleteClient(id); await refreshAllData(); showToast('Client removed', 'info');
            if (currentPage === 'client-detail') handleNavigate('clients');
        } catch (e) { showToast('Failed to delete client', 'error'); }
    };

    const handleCreateProject = async (data: Partial<Project>) => {
        try { await api.createProject(data); await refreshAllData(); showToast('Project created successfully!', 'success'); }
        catch (e) { showToast('Failed to create project', 'error'); }
    };

    const handleUpdateProject = async (id: string, data: Partial<Project>) => {
        try { await api.updateProject(id, data); await refreshAllData(); showToast('Project updated!', 'success'); }
        catch (e) { showToast('Failed to update project', 'error'); }
    };

    const handleUpdateProjectStatus = async (id: string, status: string) => {
        try { await api.updateProject(id, { status: status as any }); await refreshAllData(); showToast(`Project moved to ${status}!`, 'success'); }
        catch (e) { showToast('Failed to update status', 'error'); }
    };

    const handleDeleteProject = async (id: string) => {
        try { await api.deleteProject(id); await refreshAllData(); showToast('Project deleted', 'info'); }
        catch (e) { showToast('Failed to delete project', 'error'); }
    };

    const handleCreateProposal = async (data: Partial<Proposal>) => {
        try {
            const res = await api.createProposal(data); await refreshAllData(); showToast('Proposal generated & saved!', 'success'); return res.proposal;
        } catch (e) { showToast('Failed to save proposal', 'error'); throw e; }
    };

    const handleUpdateProposalStatus = async (id: string, status: string) => {
        try { await api.updateProposal(id, { status: status as any }); await refreshAllData(); showToast(`Proposal marked as ${status}!`, 'success'); }
        catch (e) { showToast('Failed to update proposal status', 'error'); }
    };

    const handleDeleteProposal = async (id: string) => {
        try { await api.deleteProposal(id); await refreshAllData(); showToast('Proposal deleted', 'info'); }
        catch (e) { showToast('Failed to delete proposal', 'error'); }
    };

    const handleCreateInvoice = async (data: Partial<Invoice>) => {
        try { await api.createInvoice(data); await refreshAllData(); showToast('Invoice created and registered!', 'success'); }
        catch (e) { showToast('Failed to create invoice', 'error'); }
    };

    const handleUpdateInvoiceStatus = async (id: string, status: string) => {
        try { await api.updateInvoice(id, { status: status as any }); await refreshAllData(); showToast(`Invoice status updated to ${status}`, 'success'); }
        catch (e) { showToast('Failed to update invoice status', 'error'); }
    };

    const handleDeleteInvoice = async (id: string) => {
        try {
            await api.deleteInvoice(id); await refreshAllData(); showToast('Invoice deleted', 'info');
            if (currentPage === 'invoice-detail') handleNavigate('invoices');
        } catch (e) { showToast('Failed to delete invoice', 'error'); }
    };

    const handleCreateEvent = async (data: Partial<CalendarEvent>) => {
        try { await api.createCalendarEvent(data); await refreshAllData(); showToast('Event added to calendar!', 'success'); }
        catch (e) { showToast('Failed to schedule event', 'error'); }
    };

    const handleDeleteEvent = async (id: string) => {
        try { await api.deleteCalendarEvent(id); await refreshAllData(); showToast('Event removed', 'info'); }
        catch (e) { showToast('Failed to delete event', 'error'); }
    };

    const handleUpdateProfile = async (data: Partial<User>) => {
        try {
            const res = await api.updateProfile(data); setUser(res.user); localStorage.setItem('soloflow_user', JSON.stringify(res.user));
            await refreshAllData(); showToast('Profile settings saved!', 'success');
        } catch (e) { showToast('Failed to update profile', 'error'); }
    };

    const handleResetDemo = async () => {
        try { await api.resetDemo(); await refreshAllData(); showToast('Workspace reset to screenshot demo data', 'success'); }
        catch (e) { showToast('Failed to reset demo data', 'error'); }
    };

    const editorProps = {
        clients,
        projects,
        onBack: () => handleNavigate('proposals'),
        onSaved: async () => { await refreshAllData(); handleNavigate('proposals'); }
    };

    return (
        <>
            <ScrollToTop />
            <Routes>
                <Route path="/" element={<LandingPage onEnterApp={handleLaunchDemo} onLogin={() => navigate('/login')} onRegister={() => navigate('/register')} />} />
                <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} onNavigateRegister={() => navigate('/register')} onNavigateLanding={() => navigate('/')} />} />
                <Route path="/register" element={<RegisterPage onRegisterSuccess={handleRegisterSuccess} onNavigateLogin={() => navigate('/login')} onNavigateLanding={() => navigate('/')} />} />
                <Route path="/onboarding" element={user ? <OnboardingPage user={user} onComplete={handleOnboardingComplete} onNavigateLanding={() => navigate('/')} /> : <Navigate to="/login" replace />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/cookies" element={<CookiePolicyPage />} />
                <Route path="/demo" element={<DemoPage />} />
                <Route element={user ? <Shell currentPage={currentPage} onNavigate={handleNavigate} user={user} onLogout={handleLogout} onOpenQuickCreate={handleQuickCreate} onResetSeed={handleResetDemo} searchData={{ clients, projects, proposals, invoices }} activities={metrics?.recentActivities || []}><Outlet /></Shell> : <Navigate to="/login" replace />}>
                    <Route path="/dashboard" element={!onboarded ? <Navigate to="/onboarding" replace /> : <DashboardPage metrics={metrics ?? EMPTY_METRICS} user={user} invoices={invoices} projects={projects} proposals={proposals} onNavigate={handleNavigate} onOpenQuickCreate={handleQuickCreate} />} />
                    <Route path="/clients" element={<ClientsPage clients={clients} onSelectClient={id => handleNavigate('client-detail', id)} onCreateClient={handleCreateClient} onUpdateClient={handleUpdateClient} onDeleteClient={handleDeleteClient} />} />
                    <Route path="/clients/:clientId" element={selectedClientId ? <ClientDetailPage clientId={selectedClientId} onBack={() => handleNavigate('clients')} onNavigate={handleNavigate} onUpdateClient={handleUpdateClient} /> : <Navigate to="/clients" replace />} />
                    <Route path="/projects" element={<ProjectsPage projects={projects} clients={clients} onCreateProject={handleCreateProject} onUpdateProject={handleUpdateProject} onUpdateStatus={handleUpdateProjectStatus} onDeleteProject={handleDeleteProject} />} />
                    <Route path="/proposals" element={<ProposalsPage proposals={proposals} clients={clients} onNewProposal={() => handleNavigate('proposal-editor')} onOpenProposal={id => handleNavigate('proposal-editor', id)} onUpdateStatus={handleUpdateProposalStatus} onDeleteProposal={handleDeleteProposal} />} />
                    <Route path="/proposals/new" element={<ProposalEditorPage proposalId={null} {...editorProps} />} />
                    <Route path="/proposals/:proposalId/edit" element={<ProposalEditorPage proposalId={selectedProposalId} {...editorProps} />} />
                    <Route path="/invoices" element={<InvoicesPage invoices={invoices} clients={clients} projects={projects} onSelectInvoice={id => handleNavigate('invoice-detail', id)} onCreateInvoice={handleCreateInvoice} onUpdateStatus={handleUpdateInvoiceStatus} onDeleteInvoice={handleDeleteInvoice} />} />
                    <Route path="/invoices/:invoiceId" element={selectedInvoiceId ? <InvoiceDetailPage invoiceId={selectedInvoiceId} clients={clients} onBack={() => handleNavigate('invoices')} onUpdateStatus={handleUpdateInvoiceStatus} /> : <Navigate to="/invoices" replace />} />
                    <Route path="/analytics" element={<AnalyticsPage analytics={analytics ?? EMPTY_ANALYTICS} clients={clients} projects={projects} invoices={invoices} proposals={proposals} />} />
                    <Route path="/calendar" element={<CalendarPage events={events} clients={clients} onCreateEvent={handleCreateEvent} onDeleteEvent={handleDeleteEvent} />} />
                    <Route path="/settings" element={<SettingsPage user={user} onUpdateProfile={handleUpdateProfile} onResetDemo={handleResetDemo} />} />
                    <Route path="/ai-assistant" element={<AIAssistantPage user={user} clients={clients} projects={projects} proposals={proposals} invoices={invoices} analytics={analytics} onNavigate={handleNavigate} onCreateProposal={handleCreateProposal} />} />
                </Route>
                <Route path="*" element={<Navigate to={user ? '/dashboard' : '/'} replace />} />
            </Routes>
        </>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <ToastProvider>
                <AppContent />
            </ToastProvider>
        </BrowserRouter>
    );
}
