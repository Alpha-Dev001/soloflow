import React, { useState } from 'react';
import {
  Eye, EyeOff, Lock, Mail, ArrowRight, Sparkles, AlertCircle,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { AuthLayout } from '../components/auth/AuthLayout';
import type { User } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: User, token: string) => void;
  onNavigateRegister: () => void;
  onNavigateLanding: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onNavigateRegister,
  onNavigateLanding
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Invalid email or password.');
      }

      onLoginSuccess(data.user, data.token || 'demo-token');
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@soloflow.com', password: 'demo123' })
      });
      const data = await res.json();
      onLoginSuccess(data.user, data.token || 'demo-token');
    } catch (err) {
      // Fallback if API unavailable
      setErrorMessage('Could not reach the server. Make sure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout variant="login" onNavigateLanding={onNavigateLanding}>
      <div className="text-center mb-8">
        <h1 className="text-[26px] sm:text-3xl font-bold tracking-tight text-[#1A1918]">
          Welcome back
        </h1>
        <p className="text-sm text-[#7A6E63] mt-2">
          Sign in to manage your clients, projects, and proposals.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-3.5 rounded-xl bg-[#FEF1F1] border border-[#FECDCA] text-xs text-[#D92D20] flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#4A3E34] uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#9C9084] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@agency.com"
              className="w-full bg-[#FAF8F5] text-sm text-[#1A1918] pl-10 pr-4 py-2.5 rounded-xl border border-[#E5DFD7] focus:bg-white focus:outline-none focus:border-[#4A3B32] focus:ring-2 focus:ring-[#4A3B32]/10 transition-all"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-[#4A3E34] uppercase tracking-wider">
              Password
            </label>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#9C9084] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#FAF8F5] text-sm text-[#1A1918] pl-10 pr-10 py-2.5 rounded-xl border border-[#E5DFD7] focus:bg-white focus:outline-none focus:border-[#4A3B32] focus:ring-2 focus:ring-[#4A3B32]/10 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9C9084] hover:text-[#4A3B32] transition-colors p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          variant="primary"
          size="lg"
          className="w-full mt-2 font-semibold shadow-sm"
        >
          {isLoading ? (
            <span>Signing in...</span>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          )}
        </Button>
      </form>

      {/* Quick Demo Login Option */}
      <div className="mt-6 pt-6 border-t border-[#F2EDE6] text-center">
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-xl bg-[#F6F2EC] hover:bg-[#EFEBE4] text-[#4A3B32] text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#937A62]" />
          <span>Continue with Demo Studio Account</span>
        </button>

        <p className="text-xs text-[#7A6E63] mt-5">
          Don't have an account?{' '}
          <button
            onClick={onNavigateRegister}
            className="font-bold text-[#4A3B32] hover:underline cursor-pointer"
          >
            Create Account
          </button>
        </p>
      </div>
    </AuthLayout>
  );
};