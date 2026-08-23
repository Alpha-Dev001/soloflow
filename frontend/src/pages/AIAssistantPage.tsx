import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Send,
  Copy,
  Check,
  Trash2,
  FileText,
  ShieldAlert,
  Receipt,
  DollarSign
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Logo } from '../components/ui/Logo';
import { useToast } from '../components/ui/Toast';
import { api } from '../services/api';
import type { User, Client, Project, Proposal, Invoice, AnalyticsData } from '../types';
import type { NavPage } from '../components/layout/Sidebar';

interface AIAssistantPageProps {
  user: User | null;
  clients: Client[];
  projects: Project[];
  proposals: Proposal[];
  invoices: Invoice[];
  analytics?: AnalyticsData | null;
  onNavigate: (page: NavPage, param?: string) => void;
  onCreateProposal?: (proposal: Partial<Proposal>) => Promise<any>;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
}

/* ── Design tokens (matched to landing & auth pages) ── */
const T = {
  bg: '#F8F7F5',
  surface: '#FFFFFF',
  surfaceWarm: '#FAF8F5',
  border: '#EDE8E1',
  borderStrong: '#E0D9CF',
  ink: '#1A1918',
  body: '#6B6158',
  muted: '#8C8278',
  accent: '#937A62',
  accentSoft: '#B39C82',
  dark: '#2A2320'
};

export const AIAssistantPage: React.FC<AIAssistantPageProps> = ({
  user,
  clients,
  projects,
  proposals,
  invoices,
  analytics
}) => {
  const { showToast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello ${user?.name || 'there'}! I'm your SoloFlow AI copilot.

Live context connected:
• ${clients.length} active client accounts
• ${projects.length} deliverables in flight
• ${invoices.filter(i => i.status !== 'Paid').length} pending invoices

How can I help with client proposals, invoices, or pricing strategy?`,
      time: 'Just now'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const unpaidTotal = useMemo(() => {
    return invoices
      .filter(i => i.status !== 'Paid')
      .reduce((sum, inv) => sum + inv.total, 0);
  }, [invoices]);

  const activeProjectsCount = projects.filter(p => p.status === 'In Progress').length;

  const winRate = useMemo(() => {
    const total = proposals.length;
    const accepted = proposals.filter(p => p.status === 'Accepted').length;
    return total > 0 ? Math.round((accepted / total) * 100) : 0;
  }, [proposals]);

  const quickPrompts = [
    {
      label: 'Draft Scope',
      prompt: 'Help me draft a 3-phase proposal scope for a new web project with a $6,000 budget.',
      icon: FileText
    },
    {
      label: 'Overdue Reminder',
      prompt: 'Write a polite, professional overdue reminder email for an outstanding invoice.',
      icon: Receipt
    },
    {
      label: 'Scope Creep',
      prompt: 'A client asked for extra unplanned features. How can I respond politely to protect scope while offering an add-on quote?',
      icon: ShieldAlert
    },
    {
      label: 'Pricing Tier',
      prompt: 'What are recommended retainer and project sprint pricing structures for senior freelance design/dev?',
      icon: DollarSign
    }
  ];

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setIsLoading(true);

    try {
      const response = await api.askAI(
        textToSend,
        `Current Freelancer Context:
- User: ${user?.name || 'Freelancer'}
- Total Active Clients: ${clients.length} (${clients.map(c => c.name).join(', ')})
- Active Projects: ${projects.length} (${projects.map(p => `${p.title} - ${p.status}`).join(', ')})
- Pending Invoices: ${invoices.filter(i => i.status !== 'Paid').length} totaling $${unpaidTotal}
- Total Lifetime Revenue: $${analytics?.totalRevenue ?? 0}`
      );

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: response.reply || 'I am ready to assist with your freelance operations.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      const fallbackMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: `Based on your live business data:

1. **Strategic Assessment**: With ${clients.length} active clients and $${unpaidTotal.toLocaleString()} pending, focus on billing milestones promptly before starting unscheduled revisions.
2. **Next Steps**: Present an add-on milestone with 50% upfront deposit to keep project cash flow healthy.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied to clipboard', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'ai',
        text: 'Chat cleared. How can I assist you with your business today?',
        time: 'Just now'
      }
    ]);
    showToast('Chat history cleared', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: T.ink }}>
              AI Copilot
            </h1>
            <span
              className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
              style={{ backgroundColor: T.surfaceWarm, color: T.accent, border: `1px solid ${T.border}` }}
            >
              <Sparkles className="w-3 h-3" />
              <span>Gemini</span>
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: T.muted }}>
            Real-time assistant for proposal writing, client communications, and contracts.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleClearChat}
          icon={<Trash2 className="w-3.5 h-3.5" />}
        >
          Clear
        </Button>
      </div>

      {/* Main Grid — chat fills the remaining viewport height and adapts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        {/* Chat Area (2 cols) */}
        <div
          className="lg:col-span-2 flex flex-col rounded-xl border overflow-hidden min-h-[480px]"
          style={{
            height: 'calc(100vh - 230px)',
            maxHeight: 720,
            minHeight: 480,
            backgroundColor: T.surface,
            borderColor: T.border
          }}
        >
          {/* Message Stream */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && <Logo size={24} rounded="rounded-md" className="shrink-0 mt-0.5" />}

                <div
                  className={`max-w-[80%] rounded-xl p-3 text-[13px] leading-relaxed ${msg.sender === 'user'
                    ? 'text-white'
                    : ''
                    }`}
                  style={
                    msg.sender === 'user'
                      ? { backgroundColor: T.accent }
                      : { backgroundColor: T.surfaceWarm, color: T.ink, border: `1px solid ${T.border}` }
                  }
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  <div
                    className={`flex items-center justify-between mt-1.5 pt-1 text-[10px] ${msg.sender === 'user' ? 'text-white/75' : ''
                      }`}
                    style={msg.sender === 'ai' ? { color: T.muted } : undefined}
                  >
                    <span>{msg.time}</span>
                    {msg.sender === 'ai' && (
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="flex items-center gap-1 hover:underline cursor-pointer ml-2 transition-colors"
                        style={{ color: T.muted }}
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3" style={{ color: '#248A3D' }} />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <Avatar name={user?.name || 'You'} size="sm" className="shrink-0 mt-0.5" />
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 justify-start items-center">
                <Logo size={24} rounded="rounded-md" className="shrink-0" />
                <div
                  className="rounded-xl px-3 py-2 text-xs flex items-center gap-2 border"
                  style={{ backgroundColor: T.surfaceWarm, borderColor: T.border, color: T.muted }}
                >
                  <div className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: T.accent }} />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div
            className="px-3 py-2 border-t flex items-center gap-1.5 overflow-x-auto"
            style={{ backgroundColor: T.surfaceWarm, borderColor: T.border }}
          >
            {quickPrompts.map(qp => {
              const Icon = qp.icon;
              return (
                <button
                  key={qp.label}
                  onClick={() => handleSendMessage(qp.prompt)}
                  disabled={isLoading}
                  className="px-2 py-1 rounded-md bg-white border text-[11px] font-medium flex items-center gap-1 shrink-0 transition-colors cursor-pointer disabled:opacity-50 hover:bg-[#F1EDE7]"
                  style={{ borderColor: T.border, color: T.body }}
                >
                  <Icon className="w-3 h-3" style={{ color: T.muted }} />
                  <span>{qp.label}</span>
                </button>
              );
            })}
          </div>

          {/* Input Box */}
          <div className="p-3 border-t" style={{ backgroundColor: T.surface, borderColor: T.border }}>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                placeholder="Ask about proposals, invoices, or client communication..."
                className="flex-1 px-3 py-2 text-[13px] rounded-lg border transition-all focus:outline-none"
                style={{ backgroundColor: T.surfaceWarm, borderColor: T.border, color: T.ink }}
                onFocus={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(147,122,98,0.15)'; e.currentTarget.style.backgroundColor = T.surface; }}
                onBlur={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.backgroundColor = T.surfaceWarm; }}
                disabled={isLoading}
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!inputMessage.trim() || isLoading}
                isLoading={isLoading}
                icon={<Send className="w-3 h-3" />}
              >
                Send
              </Button>
            </form>
          </div>
        </div>

        {/* Business Context Panel (1 col) */}
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: T.muted }}>
              Live context
            </h2>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: T.bg }}>
                <span style={{ color: T.muted }}>Active clients</span>
                <span className="font-semibold" style={{ color: T.ink }}>{clients.length}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: T.bg }}>
                <span style={{ color: T.muted }}>In-flight projects</span>
                <span className="font-semibold" style={{ color: T.ink }}>{activeProjectsCount}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: T.bg }}>
                <span style={{ color: T.muted }}>Unpaid invoices</span>
                <span className="font-semibold" style={{ color: T.ink }}>${unpaidTotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: T.muted }}>Win rate</span>
                <span className="font-semibold" style={{ color: '#248A3D' }}>{winRate}%</span>
              </div>
            </div>
          </Card>

          <Card className="p-5" style={{ backgroundColor: T.surfaceWarm }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5" style={{ color: T.accent }} />
              <h2 className="text-xs font-semibold" style={{ color: T.ink }}>Capabilities</h2>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: T.muted }}>
              Draft bespoke proposals, handle unbudgeted revisions, formulate overdue reminders, and calculate project sprint rates.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};