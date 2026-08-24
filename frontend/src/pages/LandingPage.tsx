import React, { useEffect, useRef, useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Users,
  FolderKanban,
  Receipt,
  FileText,
  CheckCircle2,
  Play,
  X,
  Menu,
  Plus,
  Star,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/ui/Logo';
import { Footer } from '../components/layout/Footer';

interface LandingPageProps {
  onEnterApp: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

/* ── Design tokens (matched to auth pages) ── */
const T = {
  bg: '#F8F7F5',
  surface: '#FFFFFF',
  surfaceWarm: '#FAF8F5',
  border: '#EDE8E1',
  borderStrong: '#E0D9CF',
  /* Hairlines that sit directly on the page gradient need to be darker to stay visible */
  hairline: 'rgba(74,59,50,0.32)',
  ink: '#1A1918',
  body: '#4A4037',
  muted: '#6B6158',
  accent: '#82694E',
  accentSoft: '#B39C82',
  accentLight: '#C9B79E',
  dark: '#453B33',
  darkCard: '#51443A',
  darkBorder: 'rgba(255,255,255,0.10)',
};

const features = [
  {
    icon: <Sparkles className="w-[18px] h-[18px]" />,
    title: 'AI Proposal Generator',
    desc: 'Transform project briefs into persuasive proposals in seconds — scope, deliverables, and payment terms included.',
  },
  {
    icon: <Receipt className="w-[18px] h-[18px]" />,
    title: 'Instant Invoicing',
    desc: 'Create and send professional invoices with itemized rates, automatic tax, and live status from pending to paid.',
  },
  {
    icon: <Users className="w-[18px] h-[18px]" />,
    title: 'Client CRM',
    desc: 'One source of truth for every client — history, deliverables, lifetime value, and all communications.',
  },
  {
    icon: <FolderKanban className="w-[18px] h-[18px]" />,
    title: 'Kanban Boards',
    desc: 'Drag-and-drop project boards with milestones and calendar views that stay in sync with your invoices.',
  },
  {
    icon: <FileText className="w-[18px] h-[18px]" />,
    title: 'Smart Contracts',
    desc: 'Auto-generated contracts pulled directly from your proposal data. No copy-paste, no duplicated effort.',
  },
  {
    icon: <ShieldCheck className="w-[18px] h-[18px]" />,
    title: 'Financial Analytics',
    desc: 'Revenue trends, overdue invoices, and tax-ready reports — your entire business health at a glance.',
  },
];

const faqs = [
  {
    q: 'Is SoloFlow really free to start?',
    a: 'Yes. The Starter plan is free forever — up to 3 active clients, 5 invoices per month, and a basic Kanban board. No credit card required.',
  },
  {
    q: 'How does the AI proposal generator work?',
    a: 'Describe your project in a sentence or two, and SoloFlow drafts a complete proposal — scope, deliverables, timeline, and payment terms — tailored to your client in seconds.',
  },
  {
    q: 'Can I cancel my Pro plan anytime?',
    a: 'Absolutely. Pro is a simple monthly subscription with no lock-in. Cancel in one click and keep full access until the end of your billing period.',
  },
  {
    q: 'Is my business data secure?',
    a: 'Your data is encrypted in transit and at rest. Everything you create — clients, invoices, proposals, and contracts — stays yours, always.',
  },
  {
    q: 'Do I need any setup or training?',
    a: 'No. SoloFlow works out of the box. Most freelancers send their first AI-generated proposal within minutes of signing up.',
  },
];

/** Fades content up into view when scrolled into the viewport */
const Reveal: React.FC<{
  children: React.ReactNode;
  className?: string;
  stagger?: boolean;
}> = ({ children, className = '', stagger }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`${stagger ? 'reveal-stagger' : 'reveal'} ${className}`}>
      {children}
    </div>
  );
};

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterApp,
  onLogin,
  onRegister,
}) => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu whenever the viewport grows past the breakpoint
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div
      className="min-h-screen antialiased texture-linen relative"
      style={{
        backgroundColor: '#B7AFA4',
        backgroundImage: [
          'radial-gradient(ellipse 60% 45% at 50% 38%, rgba(250,248,245,0.92) 0%, rgba(250,248,245,0) 70%)',
          'radial-gradient(ellipse 55% 40% at 8% 12%, rgba(147,122,98,0.28) 0%, transparent 65%)',
          'radial-gradient(ellipse 50% 40% at 94% 18%, rgba(111,93,66,0.30) 0%, transparent 65%)',
          'radial-gradient(ellipse 55% 42% at 6% 88%, rgba(74,59,50,0.32) 0%, transparent 68%)',
          'radial-gradient(ellipse 55% 42% at 95% 90%, rgba(58,46,38,0.34) 0%, transparent 68%)',
          'linear-gradient(160deg, #A79D8F 0%, #C2B9AC 30%, #CDC5B8 50%, #BCB2A3 72%, #97897A 100%)',
        ].join(', '),
        backgroundAttachment: 'fixed',
        color: T.ink,
      }}
    >

      {/* ══ Navbar — borderless at top, floating glassmorphism on scroll ══ */}
      <header
        className="fixed top-0 inset-x-0 z-40 transition-[padding] duration-300 ease-out"
        style={{
          paddingTop: scrolled ? '10px' : '0',
          paddingBottom: scrolled ? '10px' : '0',
        }}
      >
        <div
          className="max-w-6xl mx-auto px-6 transition-all duration-300 ease-out"
          style={{
            borderRadius: scrolled ? '16px' : '16px',
            backgroundColor: scrolled ? 'rgba(230, 225, 218, 0.55)' : 'transparent',
            backdropFilter: scrolled ? 'blur(16px) saturate(160%)' : 'none',
            WebkitBackdropFilter: scrolled ? 'blur(16px) saturate(160%)' : 'none',
            border: `1px solid ${scrolled ? 'rgba(255,255,255,0.40)' : 'transparent'}`,
            boxShadow: scrolled ? '0 4px 24px -6px rgba(74,59,50,0.12), 0 1px 0 rgba(255,255,255,0.55) inset' : 'none',
            height: '64px',
          }}
        >
          <div className="flex items-center justify-between h-full">
            {/* Logo */}
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2.5 cursor-pointer group">
              <Logo size={32} className="transition-transform duration-200 group-hover:scale-105" />
              <span className="font-semibold text-[16px] tracking-tight">
                SoloFlow
                <span style={{ color: T.accent }}>.</span>
              </span>
            </button>

            {/* Nav links */}
            <nav className="hidden md:flex items-center gap-8 text-[13px] font-semibold" style={{ color: T.body }}>
              {[
                { label: 'Features', href: '#features' },
                { label: 'Pricing', href: '#pricing' },
                { label: 'FAQs', href: '#faqs' },
              ].map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  className="nav-link relative py-1 transition-colors duration-150 hover:text-[#1A1918]"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Auth */}
            <div className="hidden sm:flex items-center gap-2.5">
              <div className="hidden lg:block h-4 w-px mr-1" style={{ backgroundColor: T.borderStrong }} />
              <Button onClick={onLogin} variant="ghost" size="sm">Sign in</Button>
              <Button onClick={onRegister} variant="primary" size="sm" iconRight={<ArrowRight className="w-3.5 h-3.5" />}>
                Get started
              </Button>
            </div>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center border transition-colors duration-200"
              style={{
                borderColor: scrolled ? T.border : 'transparent',
                color: T.ink,
                backgroundColor: scrolled ? T.surfaceWarm : 'rgba(42,35,32,0.04)',
              }}
              onClick={() => setMobileMenuOpen(o => !o)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        <div
          className="md:hidden overflow-hidden transition-all duration-300 ease-out"
          style={{
            maxHeight: mobileMenuOpen ? 340 : 0,
            opacity: mobileMenuOpen ? 1 : 0,
            backgroundColor: `${T.bg}FA`,
            borderTop: `1px solid ${mobileMenuOpen ? T.border : 'transparent'}`,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          <nav className="px-6 py-4 flex flex-col gap-1">
            {[
              { label: 'Features', href: '#features' },
              { label: 'Pricing', href: '#pricing' },
              { label: 'FAQs', href: '#faqs' },
            ].map(link => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 rounded-lg text-[14px] font-semibold transition-colors duration-150 hover:bg-black/[0.04]"
                style={{ color: T.body }}
              >
                {link.label}
              </a>
            ))}
            <div className="h-px my-2" style={{ backgroundColor: T.border }} />
            <div className="flex items-center gap-2 pt-1 pb-2">
              <Button onClick={onLogin} variant="outline" size="sm" className="flex-1">Sign in</Button>
              <Button onClick={onRegister} variant="primary" size="sm" className="flex-1">Get started</Button>
            </div>
          </nav>
        </div>
      </header>

      {/* ══ Hero ══ */}
      <section className="relative overflow-hidden min-h-[100svh] flex flex-col items-center justify-center px-6 max-w-4xl mx-auto text-center">
        {/* Square grid backdrop softly fading around the hero words */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(42,35,32,0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(42,35,32,0.16) 1px, transparent 1px)',
            backgroundSize: '38px 38px',
            maskImage:
              'radial-gradient(circle 520px at 50% 46%, black 45%, rgba(0,0,0,0.6) 70%, transparent 95%), linear-gradient(to bottom, transparent 0%, black 22%, black 78%, transparent 100%)',
            WebkitMaskImage:
              'radial-gradient(circle 520px at 50% 46%, black 45%, rgba(0,0,0,0.6) 70%, transparent 95%), linear-gradient(to bottom, transparent 0%, black 22%, black 78%, transparent 100%)',
            maskComposite: 'intersect',
            WebkitMaskComposite: 'source-in',
          }}
        />

        <div className="relative w-full flex flex-col items-center pb-8 pt-24 sm:pt-0">
          <div className="relative inline-flex items-center gap-2 mb-7 auth-fade-item">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: T.accent }} />
            <p className="text-[12px] font-semibold tracking-widest uppercase" style={{ color: T.accent }}>
              The all-in-one workspace for independent professionals
            </p>
          </div>

          <h1
            className="relative text-[44px] sm:text-[60px] md:text-[72px] font-bold tracking-[-0.03em] leading-[1.05] mb-6 auth-fade-item"
            style={{
              animationDelay: '0.1s',
              textShadow: '0 2px 20px rgba(74,59,50,0.12), 0 1px 2px rgba(74,59,50,0.06)',
            }}
          >
            Run your freelance<br />
            <span style={{ fontWeight: 300, color: T.accent }}>
              business, effortlessly.
            </span>
          </h1>

          <p
            className="relative text-[17px] sm:text-[19px] max-w-lg mx-auto leading-relaxed mb-8 auth-fade-item"
            style={{ color: T.body, fontWeight: 400, animationDelay: '0.2s' }}
          >
            Clients, projects, invoices, and AI proposals — unified in one beautifully crafted workspace.
          </p>

          <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3 auth-fade-item" style={{ animationDelay: '0.3s' }}>
            <span
              className="relative inline-flex rounded-xl"
              style={{ boxShadow: '0 12px 32px -6px rgba(147,122,98,0.55), 0 4px 12px -2px rgba(147,122,98,0.35)' }}
            >
              <Button
                onClick={onRegister}
                variant="primary"
                size="lg"
                iconRight={<ArrowRight className="w-4 h-4" />}
              >
                Start for free
              </Button>
            </span>
            <Button
              onClick={() => navigate('/demo')}
              variant="secondary"
              size="lg"
              icon={<Play className="w-3.5 h-3.5 fill-current" />}
            >
              Watch demo
            </Button>
          </div>
        </div>
      </section>

      {/* ══ Features ══ */}
      <section id="features" className="py-28 px-6 max-w-6xl mx-auto scroll-mt-14">
        <Reveal className="text-center mb-16">
          <p className="text-[12px] font-semibold uppercase tracking-widest mb-4" style={{ color: T.accent }}>Features</p>
          <h2 className="text-[36px] sm:text-[46px] font-bold tracking-[-0.025em] leading-[1.1] max-w-xl mx-auto">
            Everything a solo<br />
            <span style={{ fontWeight: 300, color: T.accent }}>business needs</span>
          </h2>
        </Reveal>

        <Reveal stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div key={i} className="pt-6 border-t" style={{ borderColor: T.hairline }}>
              <div className="flex items-center gap-3 mb-3" style={{ color: T.accent }}>
                {f.icon}
                <h3 className="font-semibold text-[15px] tracking-tight" style={{ color: T.ink }}>{f.title}</h3>
              </div>
              <p className="text-[13px] leading-relaxed font-medium" style={{ color: T.body }}>{f.desc}</p>
            </div>
          ))}
        </Reveal>
      </section>

      {/* ══ Pricing ══ */}
      <section id="pricing" className="py-28 px-6 max-w-4xl mx-auto scroll-mt-14">
        <Reveal className="text-center mb-16">
          <p className="text-[12px] font-semibold uppercase tracking-widest mb-4" style={{ color: T.accent }}>Pricing</p>
          <h2 className="text-[36px] sm:text-[46px] font-bold tracking-[-0.025em] leading-[1.1]">
            Simple, honest pricing
          </h2>
          <p className="text-[15px] mt-4" style={{ color: T.body }}>No hidden fees. Cancel anytime.</p>
        </Reveal>

        <Reveal stagger className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Starter — card */}
          <div
            className="pricing-card-light rounded-2xl border p-8 flex flex-col relative overflow-hidden texture-light transition-colors duration-200"
            style={{ backgroundColor: T.surface, borderColor: T.border, boxShadow: '0 1px 2px rgba(74,59,50,0.03)' }}
          >
            <div className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: T.accent }}>Starter</div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-[48px] font-bold tracking-tight leading-none">$0</span>
              <span className="text-[13px] font-semibold" style={{ color: T.muted }}>/mo</span>
            </div>
            <p className="text-[13px] font-medium mb-8" style={{ color: T.body }}>Perfect for getting started.</p>
            <ul className="space-y-3 mb-10 flex-1">
              {['Up to 3 active clients', '5 invoices per month', 'Basic Kanban board'].map(item => (
                <li key={item} className="flex items-start gap-2.5 text-[13px] font-medium" style={{ color: T.ink }}>
                  <CheckCircle2 className="w-4 h-4 mt-[1px] shrink-0" style={{ color: T.accent }} />
                  {item}
                </li>
              ))}
              <li className="flex items-start gap-2.5 text-[13px]" style={{ color: T.muted }}>
                <span className="w-4 shrink-0 text-center">—</span>
                AI Proposals (Pro only)
              </li>
            </ul>
            <Button onClick={onRegister} variant="outline" className="w-full">
              Get started free
            </Button>
          </div>

          {/* Pro — dark card */}
          <div
            className="pricing-card-dark rounded-2xl border p-8 flex flex-col relative overflow-hidden texture-linen-dark transition-colors duration-200"
            style={{
              backgroundColor: T.dark,
              backgroundImage: [
                'radial-gradient(ellipse 80% 55% at 85% -10%, rgba(201,183,158,0.22) 0%, transparent 62%)',
                'linear-gradient(155deg, #544436 0%, #47392C 48%, #3A2E22 100%)',
              ].join(', '),
              borderColor: 'rgba(147,122,98,0.35)',
              boxShadow: '0 24px 56px -18px rgba(42,35,32,0.5)',
            }}
          >
            <div
              aria-hidden
              className="absolute -top-24 -right-24 w-[320px] h-[320px] rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(147,122,98,0.20) 0%, transparent 70%)' }}
            />
            <div className="relative z-10 flex flex-col flex-1">
              <div className="absolute top-0 right-0 text-[10px] font-bold uppercase tracking-widest text-white/55">
                Most popular
              </div>
              <div className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: T.accentSoft }}>Pro</div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-[48px] font-bold tracking-tight leading-none text-white">$24</span>
                <span className="text-[13px] font-semibold text-white/70">/mo</span>
              </div>
              <p className="text-[13px] font-medium text-white/85 mb-8">For serious freelancers and boutique studios.</p>
              <ul className="space-y-3 mb-10 flex-1">
                {[
                  'Unlimited clients & projects',
                  'Unlimited invoicing & reminders',
                  'Unlimited AI proposals',
                  'Custom branding & domain',
                  'Financial analytics & tax reports',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-[13px] font-medium text-white/90">
                    <CheckCircle2 className="w-4 h-4 mt-[1px] shrink-0" style={{ color: T.accentSoft }} />
                    {item}
                  </li>
                ))}
              </ul>
              <Button onClick={onRegister} variant="secondary" className="w-full">
                Start 14-day free trial
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ══ FAQs — minimal editorial accordion ══ */}
      <section id="faqs" className="py-28 px-6 max-w-3xl mx-auto scroll-mt-14">
        <Reveal className="text-center mb-14">
          <p className="text-[12px] font-semibold uppercase tracking-widest mb-4" style={{ color: T.accent }}>FAQs</p>
          <h2 className="text-[36px] sm:text-[46px] font-bold tracking-[-0.025em] leading-[1.1]">
            Questions,<br />
            <span style={{ fontWeight: 300, color: T.accent }}>answered.</span>
          </h2>
        </Reveal>

        <Reveal>
          <div>
            {faqs.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={i} className="border-b first:border-t" style={{ borderColor: T.hairline }}>
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="w-full flex items-center justify-between gap-6 py-5 text-left cursor-pointer group"
                    aria-expanded={open}
                  >
                    <span
                      className="font-semibold text-[15px] tracking-tight transition-colors duration-150 group-hover:text-[#82694E]"
                      style={{ color: T.ink }}
                    >
                      {f.q}
                    </span>
                    <span
                      className="shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition-transform duration-300"
                      style={{
                        borderColor: T.hairline,
                        color: T.accent,
                        transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
                      }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </span>
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-300 ease-out"
                    style={{ maxHeight: open ? 220 : 0, opacity: open ? 1 : 0 }}
                  >
                    <p className="pb-6 pr-12 text-[14px] leading-relaxed font-medium" style={{ color: T.body }}>
                      {f.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </section>

      {/* ══ CTA Banner — dark, matches auth panel ══ */}
      <section className="pb-28 px-6 max-w-6xl mx-auto">
        <Reveal>
          <div
            className="relative overflow-hidden rounded-3xl border px-10 py-16 text-center texture-linen-dark"
            style={{
              backgroundColor: T.dark,
              backgroundImage: [
                'radial-gradient(ellipse 85% 95% at 50% -25%, rgba(201,183,158,0.24) 0%, transparent 58%)',
                'radial-gradient(ellipse 50% 65% at 102% 105%, rgba(147,122,98,0.20) 0%, transparent 68%)',
                'radial-gradient(ellipse 42% 55% at -5% 108%, rgba(111,93,66,0.18) 0%, transparent 66%)',
                'linear-gradient(150deg, #57473A 0%, #4A3C2F 40%, #3C3025 72%, #32271D 100%)',
              ].join(', '),
              borderColor: 'rgba(147,122,98,0.35)',
            }}
          >
            <div
              aria-hidden
              className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[360px] rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(ellipse, rgba(201,183,158,0.22) 0%, transparent 70%)' }}
            />
            <div aria-hidden className="auth-grain absolute inset-0" />

            <div className="relative z-10">
              <h2 className="text-[34px] sm:text-[48px] font-bold tracking-[-0.03em] text-white leading-[1.08] mb-5">
                Ready to run your business<br />
                <span style={{ fontWeight: 300, color: T.accentLight }}>the smart way?</span>
              </h2>
              <p className="text-[15px] font-medium text-white/85 mb-10 max-w-md mx-auto">
                Join thousands of freelancers who replaced 5 disconnected tools with one workspace.
              </p>
              <Button
                onClick={onRegister}
                variant="secondary"
                size="lg"
                iconRight={<ArrowRight className="w-4 h-4" />}
              >
                Start for free
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ══ Footer ══ */}
      <Footer />

      <style>{`
        .w-4\\.5 { width: 18px; height: 18px; }
        .nav-link::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          bottom: -2px;
          height: 1.5px;
          background: ${T.accent};
          transform: scaleX(0);
          transform-origin: center;
          transition: transform 0.25s ease;
        }
        .nav-link:hover::after {
          transform: scaleX(1);
        }
        .pricing-card-light:hover {
          background-color: #F5F2EE !important;
          border-color: ${T.borderStrong} !important;
        }
        .pricing-card-dark:hover {
          background-color: #4E3F32 !important;
        }
      `}</style>
    </div>
  );
};