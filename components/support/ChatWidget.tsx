'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SignedIn } from '@clerk/nextjs';
import { MessageCircle, X, Send, Loader2, ArrowLeft, Ticket, Crown, HelpCircle } from 'lucide-react';
import { useAuthEnabled } from '@/components/providers/Providers';
import { OPEN_CHAT_EVENT, type OpenChatDetail } from '@/components/support/openChat';

interface ChatAction { id: string; label: string; style?: 'primary' | 'danger' | 'quiet' }
interface Message {
  id: string; sender: 'member' | 'team' | 'bot'; body: string;
  actions: ChatAction[] | null; created_at: string;
}
interface ThreadInfo { id: string; topic: string; status: string; stage: string }

/** Floating concierge chat. Only rendered for signed-in members (and never on /admin). */
export function ChatWidget() {
  const enabled  = useAuthEnabled();
  const pathname = usePathname();
  if (!enabled || pathname.startsWith('/admin')) return null;
  return (
    <SignedIn>
      <ChatInner />
    </SignedIn>
  );
}

export function ChatInner() {
  const router = useRouter();
  const [open, setOpen]         = useState(false);
  const [thread, setThread]     = useState<ThreadInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unread, setUnread]     = useState(0);
  const [text, setText]         = useState('');
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const lastAt  = useRef<string | null>(null);

  const scrollDown = () => requestAnimationFrame(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  });

  const loadThread = useCallback(async (id: string, full = false) => {
    const after = full ? '' : lastAt.current ? `?after=${encodeURIComponent(lastAt.current)}` : '';
    const res = await fetch(`/api/support/threads/${id}${after}`, { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    setThread(data.thread);
    if (data.messages.length) {
      setMessages(prev => {
        const base = full ? [] : prev;
        const seen = new Set(base.map(m => m.id));
        return [...base, ...data.messages.filter((m: Message) => !seen.has(m.id))];
      });
      lastAt.current = data.messages[data.messages.length - 1].created_at;
      scrollDown();
    }
  }, []);

  const start = useCallback(async (detail: OpenChatDetail) => {
    setOpen(true);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/support/threads', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(detail),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Could not open chat'); return; }
      lastAt.current = null;
      setMessages([]);
      setThread(data.thread);
      await loadThread(data.thread.id, true);
    } finally {
      setBusy(false);
    }
  }, [loadThread]);

  // Open from anywhere on the site
  useEffect(() => {
    const onOpen = (e: Event) => start((e as CustomEvent<OpenChatDetail>).detail);
    window.addEventListener(OPEN_CHAT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, onOpen);
  }, [start]);

  // Unread badge while closed
  useEffect(() => {
    if (open) return;
    const check = () => fetch('/api/support/threads', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => d && setUnread(d.unread ?? 0))
      .catch(() => {});
    check();
    const t = setInterval(check, 30_000);
    return () => clearInterval(t);
  }, [open]);

  // Live updates while open
  useEffect(() => {
    if (!open || !thread) return;
    const t = setInterval(() => loadThread(thread.id), 4_000);
    return () => clearInterval(t);
  }, [open, thread, loadThread]);

  // Opening the bubble resumes the latest unresolved conversation
  async function openPanel() {
    setOpen(true);
    setUnread(0);
    if (thread) return;
    const res = await fetch('/api/support/threads', { cache: 'no-store' });
    if (!res.ok) return;
    const { threads } = await res.json();
    const latest = threads.find((t: { status: string }) => t.status !== 'resolved') ?? null;
    if (latest) { lastAt.current = null; await loadThread(latest.id, true); }
  }

  async function tap(action: ChatAction) {
    if (!thread || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/support/threads/${thread.id}/actions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actionId: action.id }),
      });
      if (!res.ok) setError((await res.json().catch(() => ({}))).error ?? 'Something went wrong');
      await loadThread(thread.id);
    } finally {
      setBusy(false);
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!thread || !body || busy) return;
    setBusy(true);
    setText('');
    setError(null);
    try {
      const res = await fetch(`/api/support/threads/${thread.id}/messages`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body }),
      });
      if (!res.ok) setError((await res.json().catch(() => ({}))).error ?? 'Message not sent');
      await loadThread(thread.id);
    } finally {
      setBusy(false);
    }
  }

  // Buttons are live only on the newest prompt
  const lastWithActions = [...messages].reverse().find(m => m.actions?.length);
  const liveActionsId   = lastWithActions && messages[messages.length - 1]?.sender !== 'member' ? lastWithActions.id : null;

  return (
    <>
      {!open && (
        <button
          onClick={openPanel}
          className="fixed bottom-5 right-5 z-[90] w-14 h-14 rounded-full bg-ic-gold text-black shadow-lg shadow-black/50 flex items-center justify-center hover:scale-105 transition-transform"
          aria-label="Chat with the team"
        >
          <MessageCircle size={22} />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-ic-red text-white font-mono text-[10px] min-w-5 h-5 px-1 rounded-full flex items-center justify-center">
              {unread}
            </span>
          )}
        </button>
      )}

      {open && (
        <div
          className="fixed z-[95] bottom-0 right-0 sm:bottom-5 sm:right-5 w-full sm:w-[380px] h-[85vh] sm:h-[600px] bg-ic-dark border border-ic-border flex flex-col shadow-2xl shadow-black"
          role="dialog"
          aria-label="Inner Circle concierge"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-ic-border">
            {thread && (
              <button onClick={() => { setThread(null); setMessages([]); }} className="text-ic-muted hover:text-white" aria-label="Back">
                <ArrowLeft size={16} />
              </button>
            )}
            <div className="w-8 h-8 border border-ic-gold flex items-center justify-center">
              <span className="font-bebas text-ic-gold leading-none">IC</span>
            </div>
            <div className="flex-1">
              <p className="font-bebas tracking-widest text-white leading-none">THE CONCIERGE</p>
              <p className="font-mono text-[9px] tracking-widest text-ic-muted mt-1">
                {thread?.status === 'waiting_team' || thread?.status === 'open' ? 'THE TEAM IS ON THIS CHAT' : 'MEMBERS ONLY · PRIVATE'}
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="text-ic-muted hover:text-white" aria-label="Close chat">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          {!thread ? (
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <p className="font-bebas text-3xl text-white leading-none">HOW CAN WE HELP?</p>
              <p className="text-ic-muted text-sm mb-4">A real member of the team is behind this chat.</p>
              <MenuButton icon={<Crown size={16} />} title="My membership" note="Change, pause, upgrade or cancel" onClick={() => start({ topic: 'membership' })} />
              <MenuButton icon={<Ticket size={16} />} title="A ticket" note="Can't make it? Pick the ticket on your account page"
                onClick={() => { setOpen(false); router.push('/account'); }} />
              <MenuButton icon={<HelpCircle size={16} />} title="Something else" note="Talk to the team" onClick={() => start({ topic: 'general' })} />
              {busy && <Loader2 className="animate-spin text-ic-gold mx-auto" size={18} />}
              {error && <p className="font-mono text-[10px] text-ic-red tracking-widest">{error}</p>}
            </div>
          ) : (
            <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(m => (
                <div key={m.id}>
                  <Bubble message={m} />
                  {m.id === liveActionsId && m.actions && (
                    <div className="mt-2 space-y-1.5">
                      {m.actions.map(a => (
                        <button
                          key={a.id}
                          onClick={() => tap(a)}
                          disabled={busy}
                          className={`w-full text-left px-3 py-2.5 text-sm border transition-colors disabled:opacity-50 ${
                            a.style === 'primary' ? 'border-ic-gold text-ic-gold hover:bg-ic-gold/10'
                            : a.style === 'danger' ? 'border-ic-border text-ic-muted hover:text-ic-red hover:border-ic-red/40'
                            : 'border-ic-border text-ic-silver hover:border-ic-muted hover:text-white'
                          }`}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {busy && <Loader2 className="animate-spin text-ic-gold" size={16} />}
              {error && <p className="font-mono text-[10px] text-ic-red tracking-widest">{error}</p>}
            </div>
          )}

          {/* Composer */}
          {thread && (
            <form onSubmit={send} className="border-t border-ic-border p-3 flex gap-2">
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                maxLength={2000}
                placeholder={thread.stage === 'await_transfer_email' ? "Your friend's email" : thread.stage === 'await_crypto_address' ? 'Wallet address + network' : 'Type a message…'}
                className="flex-1 bg-ic-black border border-ic-border text-white text-sm px-3 py-2 focus:outline-none focus:border-ic-gold placeholder:text-ic-muted"
              />
              <button type="submit" disabled={busy || !text.trim()} className="px-3 border border-ic-gold text-ic-gold disabled:opacity-40" aria-label="Send">
                <Send size={16} />
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}

function Bubble({ message }: { message: Message }) {
  const mine = message.sender === 'member';
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${
        mine ? 'bg-ic-gold/15 border border-ic-gold/30 text-white'
        : message.sender === 'team' ? 'bg-ic-gray border border-ic-silver/30 text-white'
        : 'bg-ic-gray border border-ic-border text-ic-silver'
      }`}>
        {!mine && (
          <p className="font-mono text-[9px] tracking-widest mb-1 text-ic-gold">
            {message.sender === 'team' ? 'THE TEAM' : 'CONCIERGE'}
          </p>
        )}
        {message.body}
      </div>
    </div>
  );
}

function MenuButton(props: { icon: React.ReactNode; title: string; note: string; onClick?: () => void }) {
  return (
    <button onClick={props.onClick} className="w-full text-left border border-ic-border hover:border-ic-gold/60 p-4 transition-colors group">
      <span className="flex items-center gap-2 text-ic-gold">
        {props.icon}
        <span className="font-bebas tracking-widest text-lg text-white group-hover:text-ic-gold">{props.title}</span>
      </span>
      <span className="block font-mono text-[9px] tracking-widest text-ic-muted mt-1">{props.note}</span>
    </button>
  );
}
