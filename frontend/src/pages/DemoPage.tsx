import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Volume2, VolumeX, ArrowRight } from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';
import { Footer } from '../components/layout/Footer';

const VIDEO_ID = 'qRyfPNTYx14';
const VIDEO_BASE = `https://www.youtube.com/embed/${VIDEO_ID}?rel=0&modestbranding=1&loop=1&playlist=${VIDEO_ID}&playsinline=1&showinfo=0&iv_load_policy=3&disablekb=1&cc_load_policy=0&autoplay=1`;

const T = {
  bg: '#F8F7F5',
  surface: '#FFFFFF',
  border: '#EDE8E1',
  ink: '#1A1918',
  body: '#4A4037',
  muted: '#6B6158',
  accent: '#82694E',
  accentSoft: '#B39C82',
  accentLight: '#C9B79E',
  dark: '#453B33',
  hairline: 'rgba(74,59,50,0.32)',
};

export const DemoPage: React.FC = () => {
  const [isMuted, setIsMuted] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className="min-h-screen antialiased texture-linen flex flex-col"
      style={{
        backgroundColor: '#B7AFA4',
        backgroundImage: [
          'radial-gradient(ellipse 60% 45% at 50% 38%, rgba(250,248,245,0.92) 0%, rgba(250,248,245,0) 70%)',
          'radial-gradient(ellipse 55% 40% at 8% 12%, rgba(147,122,98,0.28) 0%, transparent 65%)',
          'radial-gradient(ellipse 50% 40% at 94% 18%, rgba(111,93,66,0.30) 0%, transparent 65%)',
          'linear-gradient(160deg, #A79D8F 0%, #C2B9AC 30%, #CDC5B8 50%, #BCB2A3 72%, #97897A 100%)',
        ].join(', '),
        backgroundAttachment: 'fixed',
        color: T.ink,
      }}
    >
      {/* Navbar — transparent at top, glassmorphic pill on scroll */}
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
            borderRadius: '16px',
            backgroundColor: scrolled ? 'rgba(230, 225, 218, 0.55)' : 'transparent',
            backdropFilter: scrolled ? 'blur(16px) saturate(160%)' : 'none',
            WebkitBackdropFilter: scrolled ? 'blur(16px) saturate(160%)' : 'none',
            border: `1px solid ${scrolled ? 'rgba(255,255,255,0.40)' : 'transparent'}`,
            boxShadow: scrolled
              ? '0 4px 24px -6px rgba(74,59,50,0.12), 0 1px 0 rgba(255,255,255,0.55) inset'
              : 'none',
            height: '64px',
          }}
        >
          <div className="flex items-center justify-between h-full">
            <Link to="/" className="flex items-center gap-2.5 group">
              <Logo size={30} className="transition-transform duration-200 group-hover:scale-105" />
              <span className="font-semibold text-[15px] tracking-tight">
                SoloFlow<span style={{ color: T.accent }}>.</span>
              </span>
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold transition-opacity duration-150 hover:opacity-70"
              style={{ color: T.muted }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to home
            </Link>
          </div>
        </div>
      </header>

      {/* Main content — pt-24 to clear the fixed header */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-8 pt-24 pb-16">
        {/* Heading */}
        <div className="text-center mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: T.accent }}>
            Product Tour
          </p>
          <h1 className="text-[34px] sm:text-[46px] font-bold tracking-[-0.025em] leading-[1.1] mb-4">
            See SoloFlow<br />
            <span style={{ fontWeight: 300, color: T.accent }}>in action</span>
          </h1>
          <p className="text-[15px] max-w-md mx-auto leading-relaxed" style={{ color: T.body }}>
            Watch how freelancers manage clients, generate proposals, and send invoices — all from one workspace.
          </p>
        </div>

        {/* Video player */}
        <div
          className="rounded-2xl overflow-hidden border relative texture-linen-dark"
          style={{ borderColor: T.hairline, boxShadow: '0 24px 64px rgba(74,59,50,0.18)' }}
        >
          <div className="relative w-full" style={{ backgroundColor: T.dark, paddingBottom: '56.25%' }}>
            <iframe
              key={isMuted ? 'muted' : 'unmuted'}
              className="absolute inset-0 w-full h-full"
              src={`${VIDEO_BASE}&mute=${isMuted ? 1 : 0}&controls=1`}
              title="SoloFlow Product Demo"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
            {/* Mute toggle */}
            <div className="absolute bottom-3.5 right-3.5 z-20">
              <Button
                onClick={() => setIsMuted(m => !m)}
                variant="secondary"
                size="xs"
                icon={isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              >
                {isMuted ? 'Unmute' : 'Mute'}
              </Button>
            </div>
          </div>
        </div>

        {/* CTA below video */}
        <div className="mt-12 text-center flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/register">
            <Button variant="primary" size="lg" iconRight={<ArrowRight className="w-4 h-4" />}>
              Start for free
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary" size="lg">
              Sign in
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};
