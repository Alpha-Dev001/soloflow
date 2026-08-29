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
    useNavigate,
    useParams
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
import { ClientWorkspacePage } from './pages/ClientWorkspacePage';
import { ClientProjectNewPage } from './pages/ClientProjectNewPage';
import { ClientInvoiceNewPage } from './pages/ClientInvoiceNewPage';
import { InvoiceDetailPage } from './pages/InvoiceDetailPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { CalendarPage } from './pages/CalendarPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';
import { ToastProvider, useToast } from './components/ui/Toast';
import { api } from './services/api';
import type {
    User,
    DashboardMetrics,
    Client,
    Project,
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
    if (pathname === '/calendar') return 'calendar';
    if (pathname === '/analytics') return 'analytics';
    if (pathname === '/settings') return 'settings';
    if (pathname === '/admin') return 'admin';
    return 'landing';
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
    collectionRate: 0,
    monthlyRevenue: [],
    topClientsRevenue: []
};

/** Resets scroll position to the top whenever the route changes */
function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, [pathname]);
    return null;
}

function AppContent() {
    const { showToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const currentPage = getNavPage(location.pathname);

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
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [onboarded, setOnboarded] = useState<boolean>(() => {
        try {
            return localStorage.getItem('soloflow_onboarded') === 'true';
        } catch {
            return true;
        }
    });

    const persistUser = useCallback((authUser: User) => {
        setUser(authUser);
        try {
            localStorage.setItem('soloflow_user', JSON.stringify(authUser));
        } catch {
            // ignore
        }
    }, []);

    const refreshAllData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [dashRes, clientsRes, projectsRes, invoicesRes, analyticsRes, calendarRes] = await Promise.all([
                api.getDashboard(),
                api.getClients(),
                api.getProjects(),
                api.getInvoices(),
                api.getAnalytics(),
                api.getCalendar()
            ]);
            setMetrics(dashRes.metrics);
            setClients(clientsRes.clients);
            setProjects(projectsRes.projects);
            setInvoices(invoicesRes.invoices);
            setAnalytics(analyticsRes.analytics);
            setEvents(calendarRes.events);
        } catch (err) {
            console.error('Error loading data from backend:', err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Re-hydrate user from backend
    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        (async () => {
            try {
                const me = await api.getMe();
                if (!cancelled && me.user) persistUser(me.user);
            } catch {
                // keep cached user; 401 handler will redirect if needed
            }
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (user) refreshAllData();
    }, [user?.id, refreshAllData]);

    const handleLoginSuccess = (authUser: User, token: string) => {
        persistUser(authUser);
        try {
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
            showToast('Demo login failed. Make sure the backend is running and run: npm run seed', 'error');
        }
    };

    const handleRegisterSuccess = (authUser: User, token: string) => {
        persistUser(authUser);
        try {
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
            persistUser(res.user);
        } catch (e) {
            console.error('Failed to save onboarding profile:', e);
        }
        try {
            localStorage.setItem('soloflow_onboarding', JSON.stringify(data));
            localStorage.setItem('soloflow_onboarded', 'true');
        } catch {
            // ignore
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
            // ignore
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
            calendar: '/calendar',
            analytics: '/analytics',
            settings: '/settings',
            admin: '/admin'
        };
        let path = paths[page];
        if (page === 'client-detail' && param) path = `/clients/${encodeURIComponent(param)}`;
        if (page === 'projects' && param) path = `/clients/${encodeURIComponent(param)}/projects`;
        if (page === 'invoices' && param) path = `/clients/${encodeURIComponent(param)}/invoices`;
        if (page === 'invoice-new' && param) path = `/clients/${encodeURIComponent(param)}/invoices/new`;
        if (page === 'invoice-detail' && param) path = `/invoices/${encodeURIComponent(param)}`;
        navigate(path || '/dashboard');
    };

    const handleQuickCreate = (type: 'client' | 'project' | 'invoice') => {
        if (type === 'client') {
            handleNavigate('clients');
        }
    };

    // ── Client CRUD ──
    const handleCreateClient = async (data: Partial<Client>) => {
        try {
            const { client: newClient } = await api.createClient(data);
            setClients(prev => [{ ...newClient, totalSpent: newClient.totalSpent ?? 0, projectsCount: newClient.projectsCount ?? 0 }, ...prev]);
            showToast('Client added successfully!', 'success');
            refreshAllData().catch(console.error);
        } catch (e: any) {
            showToast(e.message || 'Failed to add client', 'error');
            throw e;
        }
    };

    const handleUpdateClient = async (id: string, data: Partial<Client>) => {
        try {
            const { client: updated } = await api.updateClient(id, data);
            setClients(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
            showToast('Client details updated!', 'success');
            refreshAllData().catch(console.error);
        } catch (e) { showToast('Failed to update client', 'error'); throw e; }
    };

    const handleDeleteClient = async (id: string) => {
        try {
            await api.deleteClient(id);
            setClients(prev => prev.filter(c => c.id !== id));
            showToast('Client removed', 'info');
            navigate('/clients', { replace: true });
            refreshAllData().catch(console.error);
        } catch (e) { showToast('Failed to delete client', 'error'); throw e; }
    };

    // ── Project CRUD (client-scoped) ──
    const handleCreateProject = async (data: Partial<Project>) => {
        try {
            await api.createProject(data);
            await refreshAllData();
            showToast('Project created successfully!', 'success');
        } catch (e: any) {
            showToast(e.message || 'Failed to create project', 'error');
        }
    };

    const handleUpdateProject = async (id: string, data: Partial<Project>) => {
        try { await api.updateProject(id, data); await refreshAllData(); showToast('Project updated!', 'success'); }
        catch (e) { showToast('Failed to update project', 'error'); }
    };

    const handleUpdateProjectStatus = async (id: string, status: string) => {
        try { await api.updateProjectStatus(id, status); await refreshAllData(); showToast(`Project moved to ${status}!`, 'success'); }
        catch (e) { showToast('Failed to update status', 'error'); }
    };

    const handleDeleteProject = async (id: string) => {
        try { await api.deleteProject(id); await refreshAllData(); showToast('Project deleted', 'info'); }
        catch (e) { showToast('Failed to delete project', 'error'); }
    };

    // ── Invoice CRUD (client-scoped) ──
    const handleCreateInvoice = async (data: Partial<Invoice>) => {
        try { await api.createInvoice(data); await refreshAllData(); showToast('Invoice created!', 'success'); }
        catch (e: any) {
            showToast(e.message || 'Failed to create invoice', 'error');
        }
    };

    const handleUpdateInvoiceStatus = async (id: string, status: string) => {
        try { await api.updateInvoiceStatus(id, status); await refreshAllData(); showToast(`Invoice status updated to ${status}`, 'success'); }
        catch (e) { showToast('Failed to update invoice status', 'error'); }
    };

    const handleDeleteInvoice = async (id: string) => {
        try {
            await api.deleteInvoice(id); await refreshAllData(); showToast('Invoice deleted', 'info');
            navigate(-1);
        } catch (e) { showToast('Failed to delete invoice', 'error'); }
    };

    // ── Calendar ──
    const handleCreateEvent = async (data: Partial<CalendarEvent>) => {
        try { await api.createCalendarEvent(data); await refreshAllData(); showToast('Event added to calendar!', 'success'); }
        catch (e) { showToast('Failed to schedule event', 'error'); }
    };

    const handleDeleteEvent = async (id: string) => {
        try { await api.deleteCalendarEvent(id); await refreshAllData(); showToast('Event removed', 'info'); }
        catch (e) { showToast('Failed to delete event', 'error'); }
    };

    // ── Profile & Settings ──
    const handleUpdateProfile = async (data: Partial<User>) => {
        try {
            const res = await api.updateProfile(data);
            persistUser(res.user);
            await refreshAllData();
            showToast('Profile settings saved!', 'success');
        } catch (e) { showToast('Failed to update profile', 'error'); }
    };

    const handleResetDemo = async () => {
        try { await api.resetDemo(); await refreshAllData(); showToast('Workspace reset to demo data', 'success'); }
        catch (e) { showToast('Failed to reset demo data', 'error'); }
    };

    return (
        <>
            <ScrollToTop />
            <Routes>
                {/* ── Public routes ── */}
                <Route path="/" element={<LandingPage onEnterApp={handleLaunchDemo} onLogin={() => navigate('/login')} onRegister={() => navigate('/register')} />} />
                <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} onNavigateRegister={() => navigate('/register')} onNavigateLanding={() => navigate('/')} />} />
                <Route path="/register" element={<RegisterPage onRegisterSuccess={handleRegisterSuccess} onNavigateLogin={() => navigate('/login')} onNavigateLanding={() => navigate('/')} />} />
                <Route path="/onboarding" element={user ? <OnboardingPage user={user} onComplete={handleOnboardingComplete} onNavigateLanding={() => navigate('/')} /> : <Navigate to="/login" replace />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/cookies" element={<CookiePolicyPage />} />
                <Route path="/demo" element={<DemoPage />} />

                {/* ── Authenticated routes ── */}
                <Route element={user ? <Shell currentPage={currentPage} onNavigate={handleNavigate} user={user} onLogout={handleLogout} onOpenQuickCreate={handleQuickCreate} onResetSeed={handleResetDemo} searchData={{ clients, projects, invoices }} activities={metrics?.recentActivities || []}><Outlet /></Shell> : <Navigate to="/login" replace />}>
                    <Route path="/dashboard" element={!onboarded ? <Navigate to="/onboarding" replace /> : <DashboardPage metrics={metrics ?? EMPTY_METRICS} user={user} invoices={invoices} projects={projects} onNavigate={handleNavigate} onOpenQuickCreate={handleQuickCreate} isLoading={isLoading && metrics === null} />} />

                    {/* ── Client routes ── */}
                    <Route path="/clients" element={<ClientsPage clients={clients} isLoading={isLoading} onSelectClient={id => navigate(`/clients/${id}`)} onCreateClient={handleCreateClient} onUpdateClient={handleUpdateClient} onDeleteClient={handleDeleteClient} />} />

                    {/* Client workspace (overview, tabs) */}
                    <Route path="/clients/:clientId" element={
                        <ClientWorkspacePage
                            onNavigate={handleNavigate}
                            onUpdateClient={handleUpdateClient}
                            onDeleteClient={handleDeleteClient}
                            onRefresh={refreshAllData}
                        />
                    } />

                    {/* Client-scoped: new project */}
                    <Route path="/clients/:clientId/projects/new" element={
                        <ClientProjectNewPage
                            onBack={(clientId: string) => navigate(`/clients/${clientId}`)}
                            onCreated={async (clientId: string) => {
                                await refreshAllData();
                                navigate(`/clients/${clientId}`);
                            }}
                        />
                    } />

                    {/* Client-scoped: new invoice */}
                    <Route path="/clients/:clientId/invoices/new" element={
                        <ClientInvoiceNewPage
                            onBack={(clientId: string) => navigate(`/clients/${clientId}`)}
                            onCreated={async (clientId: string) => {
                                await refreshAllData();
                                navigate(`/clients/${clientId}`);
                            }}
                        />
                    } />

                    {/* ── Calendar, Analytics, Settings ── */}
                    <Route path="/calendar" element={<CalendarPage events={events} clients={clients} onCreateEvent={handleCreateEvent} onDeleteEvent={handleDeleteEvent} />} />
                    <Route path="/analytics" element={<AnalyticsPage analytics={analytics ?? EMPTY_ANALYTICS} clients={clients} projects={projects} invoices={invoices} isLoading={isLoading && analytics === null} />} />
                    <Route path="/settings" element={<SettingsPage user={user} onUpdateProfile={handleUpdateProfile} onResetDemo={handleResetDemo} />} />

                    {/* ── Invoice detail (cross-route) ── */}
                    <Route path="/invoices/:invoiceId" element={<InvoiceDetailPageWrapper
                        clients={clients}
                        onBack={() => navigate(-1)}
                        onUpdateStatus={handleUpdateInvoiceStatus}
                    />} />

                    {/* ── Admin ── */}
                    <Route path="/admin" element={<AdminPage user={user} />} />
                </Route>

                {/* ── Legacy redirects ── */}
                <Route path="/projects" element={<Navigate to="/clients" replace />} />
                <Route path="/proposals" element={<Navigate to="/clients" replace />} />
                <Route path="/proposals/new" element={<Navigate to="/clients" replace />} />
                <Route path="/invoices" element={<Navigate to="/clients" replace />} />

                {/* ── Catch-all ── */}
                <Route path="*" element={<Navigate to={user ? '/dashboard' : '/'} replace />} />
            </Routes>
        </>
    );
}

/** Wrapper to extract invoiceId from URL params for InvoiceDetailPage */
function InvoiceDetailPageWrapper({ clients, onBack, onUpdateStatus }: any) {
    const { invoiceId } = useParams<{ invoiceId: string }>();
    if (!invoiceId) return <Navigate to="/clients" replace />;
    return <InvoiceDetailPage
        invoiceId={invoiceId}
        clients={clients}
        onBack={onBack}
        onUpdateStatus={onUpdateStatus}
    />;
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
