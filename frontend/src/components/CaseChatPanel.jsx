import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { MessageSquare, Send, ShieldCheck } from 'lucide-react';
import api from '../api';
import { getSocket } from '../socket';

function formatTimestamp(value) {
  return new Date(value).toLocaleString();
}

export default function CaseChatPanel({ caseId, currentUser, counterpart, chatEnabled, onCaseUpdated }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const caseUpdatedRef = useRef(onCaseUpdated);

  useEffect(() => {
    caseUpdatedRef.current = onCaseUpdated;
  }, [onCaseUpdated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    const loadMessages = async () => {
      try {
        const { data } = await api.get(`/chat/cases/${caseId}/messages`);

        if (active) {
          setMessages(data.messages || []);
        }
      } catch (error) {
        if (active) {
          toast.error(error.response?.data?.message || 'Failed to load chat history');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadMessages();

    const socket = getSocket();

    if (!socket) {
      return () => {
        active = false;
      };
    }

    const handleMessage = (incomingMessage) => {
      if (incomingMessage.caseId !== caseId) {
        return;
      }

      setMessages((current) => (
        current.some((item) => item._id === incomingMessage._id)
          ? current
          : [...current, incomingMessage]
      ));
    };

    const handleCaseUpdated = (payload) => {
      if (payload.caseId === caseId && caseUpdatedRef.current) {
        caseUpdatedRef.current(payload);
      }
    };

    socket.emit('chat:join', { caseId });
    socket.on('chat:message', handleMessage);
    socket.on('case:updated', handleCaseUpdated);

    return () => {
      active = false;
      socket.emit('chat:leave', { caseId });
      socket.off('chat:message', handleMessage);
      socket.off('case:updated', handleCaseUpdated);
    };
  }, [caseId]);

  const sendMessage = async () => {
    const trimmedDraft = draft.trim();

    if (!trimmedDraft || sending || !chatEnabled) {
      return;
    }

    const socket = getSocket();

    if (!socket) {
      toast.error('You need to be logged in to use chat');
      return;
    }

    setSending(true);

    socket.emit('chat:send', { caseId, message: trimmedDraft }, (response) => {
      setSending(false);

      if (!response?.ok) {
        toast.error(response?.message || 'Failed to send message');
        return;
      }

      setDraft('');
    });
  };

  if (!chatEnabled) {
    return (
      <section className="overflow-hidden rounded-[36px] border border-white/80 bg-white/85 shadow-xl shadow-slate-200/70 backdrop-blur">
        <div className="bg-[linear-gradient(135deg,#f8fafc,#eef6ff_52%,#ecfeff)] p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-white p-3 text-slate-700 shadow-sm shadow-slate-200/60">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Case Chat</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">Real-time chat becomes available as soon as a lawyer accepts this case.</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[36px] border border-white/80 bg-white/90 shadow-xl shadow-slate-200/70 backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-4 bg-[linear-gradient(135deg,#0f172a,#1e293b_60%,#0f766e)] px-8 py-6 text-white">
        <div>
          <h2 className="text-2xl font-semibold">Case Chat</h2>
          <p className="mt-2 text-sm text-slate-300">
            Live conversation with {counterpart?.name || 'your case participant'}.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
          <ShieldCheck className="h-4 w-4" />
          Real-time
        </div>
      </div>

      <div className="h-[440px] bg-[linear-gradient(180deg,#f8fafc,#eef2ff)] p-4 sm:p-6">
        <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-inner shadow-slate-100">
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
            {loading ? <p className="text-sm text-slate-500">Loading messages...</p> : null}
            {!loading && messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="rounded-full bg-blue-50 p-4 text-blue-700">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <p className="mt-4 text-base font-semibold text-slate-900">No messages yet</p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Use this space to coordinate next steps, share updates, and keep the case moving in real time.</p>
              </div>
            ) : null}
            {messages.map((item) => {
              const isOwnMessage = item.senderId === currentUser?.id;

              return (
                <div key={item._id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-[26px] px-4 py-3 shadow-sm ${isOwnMessage ? 'bg-[linear-gradient(135deg,#2563eb,#1d4ed8)] text-white shadow-blue-200/60' : 'border border-slate-200 bg-slate-50 text-slate-800'}`}>
                    <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${isOwnMessage ? 'text-blue-100' : 'text-slate-500'}`}>
                      {isOwnMessage ? 'You' : item.senderName}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{item.message}</p>
                    <p className={`mt-2 text-xs ${isOwnMessage ? 'text-blue-100' : 'text-slate-400'}`}>{formatTimestamp(item.createdAt)}</p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-slate-200 bg-white/90 p-4">
            <div className="flex gap-3">
              <textarea
                rows="2"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type your message..."
                className="w-full rounded-3xl border-slate-200 bg-slate-50 px-4 py-3 text-sm shadow-inner shadow-slate-100"
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={sending || !draft.trim()}
                className="inline-flex h-fit items-center gap-2 rounded-full bg-[linear-gradient(135deg,#0f172a,#1d4ed8)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200/60 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Send className="h-4 w-4" />
                {sending ? 'Sending' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
