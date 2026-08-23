import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User as UserIcon,
  ChevronRight,
  TrendingUp,
  Receipt,
  FileText
} from 'lucide-react';
import { api } from '../../services/api';
import type { User } from '../../types';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  user
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: `Hello ${user?.name || 'John'}! I'm your SoloFlow AI business copilot. Ask me anything about your clients, active projects, unpaid invoices, or draft new proposals!`,
      time: 'Just now'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const q = textToSend || input;
    if (!q.trim() || isLoading) return;

    const userMsg: Message = {
      id: String(Date.now()),
      sender: 'user',
      text: q,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await api.askAI(q);
      const aiMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'ai',
        text: res.reply || "I've processed your request. Let me know if you need anything else!",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'ai',
        text: "I couldn't reach the AI server right now, but your business data is secure.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-[#ECE7E1] flex items-center justify-between bg-[#FAF8F5]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#4A3B32] text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#F3EFEA]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1A1918]">SoloFlow AI Copilot</h3>
              <div className="flex items-center gap-1.5 text-[11px] text-[#1E7D3F]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1E7D3F] animate-pulse" />
                <span>Connected & Active</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#8C8278] hover:text-[#1A1918] hover:bg-[#EFEBE5] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Prompts */}
        <div className="px-4 py-2.5 bg-[#FAF6F2] border-b border-[#ECE5DD] flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <button
            onClick={() => handleSend('How much revenue is pending from clients?')}
            className="px-2.5 py-1 rounded-full bg-white border border-[#E5DFD7] text-[#5E534A] hover:text-[#1A1918] hover:border-[#4A3B32] whitespace-nowrap cursor-pointer transition-colors"
          >
            Pending revenue?
          </button>
          <button
            onClick={() => handleSend('Who is my highest-paying client?')}
            className="px-2.5 py-1 rounded-full bg-white border border-[#E5DFD7] text-[#5E534A] hover:text-[#1A1918] hover:border-[#4A3B32] whitespace-nowrap cursor-pointer transition-colors"
          >
            Top client?
          </button>
          <button
            onClick={() => handleSend('Summarize overdue invoices')}
            className="px-2.5 py-1 rounded-full bg-white border border-[#E5DFD7] text-[#5E534A] hover:text-[#1A1918] hover:border-[#4A3B32] whitespace-nowrap cursor-pointer transition-colors"
          >
            Overdue invoices?
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${
                  msg.sender === 'user'
                    ? 'bg-[#EFEBE5] text-[#4A3B32]'
                    : 'bg-[#4A3B32] text-white'
                }`}
              >
                {msg.sender === 'user' ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#4A3B32] text-white rounded-tr-xs'
                    : 'bg-[#FAF8F5] text-[#1A1918] border border-[#ECE7E1] rounded-tl-xs'
                }`}
              >
                {msg.text}
                <div
                  className={`text-[9px] mt-1 ${
                    msg.sender === 'user' ? 'text-[#D3CBC1] text-right' : 'text-[#8C8278]'
                  }`}
                >
                  {msg.time}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-[#8C8278] bg-[#FAF8F5] p-3 rounded-2xl w-fit border border-[#ECE7E1]">
              <Sparkles className="w-3.5 h-3.5 text-[#4A3B32] animate-spin" />
              <span>Analyzing business context with Gemini...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <div className="p-3 border-t border-[#ECE7E1] bg-white">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask anything about your business..."
              className="flex-1 px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E5DFD7] rounded-xl focus:outline-none focus:border-[#4A3B32]"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2 rounded-xl bg-[#4A3B32] text-white hover:bg-[#382C24] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
