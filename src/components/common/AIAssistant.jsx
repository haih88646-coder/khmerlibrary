import { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, X, Send, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { sendAssistantMessage } from '../../utils/aiAssistant';
import LoginPrompt from './LoginPrompt';

const GUEST_QUOTA_KEY = 'ai_guest_question_used';

const renderContent = (text) => {
  const nodes = [];
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let match;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const [, label, href] = match;
    if (href.startsWith('/')) {
      nodes.push(
        <Link key={key++} to={href} className="text-primary-600 dark:text-primary-400 font-medium underline underline-offset-2">
          {label}
        </Link>
      );
    } else {
      nodes.push(
        <a key={key++} href={href} target="_blank" rel="noreferrer" className="text-primary-600 dark:text-primary-400 font-medium underline underline-offset-2">
          {label}
        </a>
      );
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
};

export default function AIAssistant() {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'assistant', content: t('ai.greeting') }]);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const guestQuotaUsed = !user && localStorage.getItem(GUEST_QUOTA_KEY) === '1';

  const send = useCallback(async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    // Guests get exactly one question; after that, ask them to register.
    if (!user && localStorage.getItem(GUEST_QUOTA_KEY) === '1') {
      setInput('');
      setMessages((prev) => [...prev, { role: 'assistant', content: t('ai.guestLimit') }]);
      setLoginPrompt(true);
      return;
    }
    setInput('');
    const nextMessages = [...messages, { role: 'user', content }];
    setMessages(nextMessages);
    setLoading(true);
    try {
      const reply = await sendAssistantMessage(nextMessages);
      if (!user) localStorage.setItem(GUEST_QUOTA_KEY, '1');
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      const msg = err?.code === 'missing-key' ? t('ai.notConfigured') : t('ai.error');
      setMessages((prev) => [...prev, { role: 'assistant', content: msg }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, t, user]);

  const chips = [t('ai.chip1'), t('ai.chip2'), t('ai.chip3'), t('ai.chip4')];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label={t('ai.openChat')}
        className={`fixed bottom-5 right-5 z-[80] w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-xl shadow-primary-600/30 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 ${open ? 'rotate-0' : ''}`}
      >
        {open ? <X className="w-6 h-6" /> : <Bot className="w-7 h-7" />}
        {!open && <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-accent-500 rounded-full border-2 border-white dark:border-surface-900" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-4 sm:right-5 z-[80] w-[calc(100vw-2rem)] sm:w-96 h-[min(600px,75vh)] bg-white dark:bg-surface-800 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-700 flex flex-col overflow-hidden fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-4 py-3.5 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-bold text-white ${lang === 'km' ? 'font-khmer' : ''}`}>{t('ai.title')}</p>
              <p className={`text-xs text-white/80 truncate ${lang === 'km' ? 'font-khmer' : ''}`}>{t('ai.subtitle')}</p>
            </div>
            <Sparkles className="w-5 h-5 text-white/70 shrink-0" />
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface-50 dark:bg-surface-900">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                    m.role === 'user'
                      ? 'bg-primary-600 text-white rounded-2xl rounded-br-md'
                      : `bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-800 dark:text-surface-100 rounded-2xl rounded-tl-md ${lang === 'km' ? 'font-khmer' : ''}`
                  }`}
                >
                  {m.role === 'assistant' ? renderContent(m.content) : m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl rounded-tl-md px-4 py-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* Quick chips */}
          {messages.length <= 1 && !loading && (
            <div className="px-3 pt-2 pb-1 flex flex-wrap gap-1.5 shrink-0">
              {chips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => send(chip)}
                  className={`px-2.5 py-1.5 text-xs bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors ${lang === 'km' ? 'font-khmer' : ''}`}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Guest free-question notice */}
          {user === null && !guestQuotaUsed && (
            <div className={`px-3 pb-1 text-[11px] text-center text-surface-500 dark:text-surface-400 shrink-0 ${lang === 'km' ? 'font-khmer' : ''}`}>
              {renderContent(t('ai.guestNotice'))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="p-3 border-t border-surface-200 dark:border-surface-700 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('ai.placeholder')}
              className={`flex-1 px-4 py-2.5 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-surface-900 dark:text-white ${lang === 'km' ? 'font-khmer' : ''}`}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              aria-label={t('ai.send')}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      <LoginPrompt
        isOpen={loginPrompt}
        onClose={() => setLoginPrompt(false)}
        message={t('ai.guestModal')}
      />
    </>
  );
}
