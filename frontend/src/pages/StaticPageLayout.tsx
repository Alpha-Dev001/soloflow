/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Footer } from '../components/layout/Footer';
import { Logo } from '../components/ui/Logo';

const T = {
  bg: '#F8F7F5',
  surface: '#FFFFFF',
  border: '#EDE8E1',
  ink: '#1A1918',
  body: '#4A4037',
  muted: '#6B6158',
  accent: '#82694E',
  accentSoft: '#B39C82',
  dark: '#453B33',
  hairline: 'rgba(74,59,50,0.32)',
};

interface StaticPageLayoutProps {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
}

export const StaticPageLayout: React.FC<StaticPageLayoutProps> = ({ eyebrow, title, subtitle, children }) => {
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
          'radial-gradient(ellipse 55% 42% at 6% 88%, rgba(74,59,50,0.32) 0%, transparent 68%)',
          'radial-gradient(ellipse 55% 42% at 95% 90%, rgba(58,46,38,0.34) 0%, transparent 68%)',
          'linear-gradient(160deg, #A79D8F 0%, #C2B9AC 30%, #CDC5B8 50%, #BCB2A3 72%, #97897A 100%)',
        ].join(', '),
        backgroundAttachment: 'fixed',
        color: T.ink,
      }}
    >
      {/* Header — transparent at top, glassmorphic pill on scroll */}
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
            backgroundColor: scrolled ? 'rgba(255,255,255,0.82)' : 'transparent',
            backdropFilter: scrolled ? 'blur(18px) saturate(170%)' : 'none',
            WebkitBackdropFilter: scrolled ? 'blur(18px) saturate(170%)' : 'none',
            border: `1px solid ${scrolled ? T.border : 'transparent'}`,
            boxShadow: scrolled
              ? '0 6px 24px -8px rgba(74,59,50,0.14), 0 1px 4px rgba(74,59,50,0.05)'
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

      {/* Content — pt-24 clears the fixed header */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 pt-24 pb-16">
        {eyebrow && (
          <p className="text-[12px] font-semibold uppercase tracking-widest mb-4" style={{ color: T.accent }}>
            {eyebrow}
          </p>
        )}
        <h1 className="text-[36px] sm:text-[44px] font-bold tracking-[-0.025em] leading-[1.1] mb-4">{title}</h1>
        {subtitle && (
          <p
            className="text-[15px] leading-relaxed mb-12 pb-8 border-b"
            style={{ color: T.body, borderColor: T.hairline }}
          >
            {subtitle}
          </p>
        )}
        <div className="static-page-content">{children}</div>
      </main>

      <Footer />
    </div>
  );
};
