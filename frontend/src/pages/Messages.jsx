import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MessageSquare, Send, ShieldCheck } from 'lucide-react';
import api from '../api';
import Navbar from '../components/Navbar';
import { getSocket } from '../socket';
import { useAuth } from '../context/AuthContext';

function formatTimestamp(value) {
  if (!value) {
    return '';
  }

  return new Date(value).toLocaleString();
}

function formatConversationTime(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  const now = new Date();
  const isSameDay = date.toDateString() === now.toDateString();
  return isSameDay ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : date.toLocaleDateString();
}

function buildPreview(conversation) {
  if (conversation.lastMessage?.message) {
    return conversation.lastMessage.message;
  }

  return 'No messages yet. Start the conversation here.';
}

export default function Messages() {
  const { user, role } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryCaseId = searchParams.get('caseId') || '';
  const [conversations, setConversations] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(queryCaseId);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const selectedConversation = useMemo(
    () => conversations.find((item) => item.caseId === selectedCaseId) || null,
    [conversations, selectedCaseId]
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let active = true;

    const loadConversations = async () => {
      setLoadingConversations(true);

      try {
        const { data } = await api.get('/chat/conversations');

        if (!active) {
          return;
        }

        const nextConversations = data.conversations || [];
        setConversations(nextConversations);
      } catch (error) {
        if (active) {
          toast.error(error.response?.data?.message || 'Failed to load conversations');
        }
      } finally {
        if (active) {
          setLoadingConversations(false);
        }
      }
    };

    loadConversations();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const nextSelectedCaseId =
      (queryCaseId && conversations.some((item) => item.caseId === queryCaseId) && queryCaseId) ||
      (selectedCaseId && conversations.some((item) => item.caseId === selectedCaseId) && selectedCaseId) ||
      conversations[0]?.caseId ||
      '';

    if (nextSelectedCaseId !== selectedCaseId) {
      setSelectedCaseId(nextSelectedCaseId);
    }
  }, [conversations, queryCaseId, selectedCaseId]);

  useEffect(() => {
    if (!selectedCaseId) {
      setMessages([]);
      return;
    }

    let active = true;
    setLoadingMessages(true);

    const loadMessages = async () => {
      try {
        const { data } = await api.get(`/chat/cases/${selectedCaseId}/messages`);

        if (active) {
          setMessages(data.messages || []);
        }
      } catch (error) {
        if (active) {
          toast.error(error.response?.data?.message || 'Failed to load messages');
        }
      } finally {
        if (active) {
          setLoadingMessages(false);
        }
      }
    };

    loadMessages();

    return () => {
      active = false;
    };
  }, [selectedCaseId]);

  useEffect(() => {
    const socket = getSocket();

    if (!socket || !selectedCaseId) {
      return undefined;
    }

    const handleMessage = (incomingMessage) => {
      setConversations((current) => {
        const existingConversation = current.find((item) => item.caseId === incomingMessage.caseId);

        if (!existingConversation) {
          return current;
        }

        const updatedConversation = {
          ...existingConversation,
          lastMessage: incomingMessage,
          updatedAt: incomingMessage.createdAt,
        };

        return [
          updatedConversation,
          ...current.filter((item) => item.caseId !== incomingMessage.caseId),
        ];
      });

      if (incomingMessage.caseId !== selectedCaseId) {
        return;
      }

      setMessages((current) => (
        current.some((item) => item._id === incomingMessage._id)
          ? current
          : [...current, incomingMessage]
      ));
    };

    const handleChatNotification = (payload) => {
      setConversations((current) => {
        const existingConversation = current.find((item) => item.caseId === payload.caseId);

        if (!existingConversation) {
          return current;
        }

        const updatedConversation = {
          ...existingConversation,
          lastMessage: {
            _id: `preview:${payload.caseId}:${payload.createdAt}`,
            caseId: payload.caseId,
            senderId: payload.senderId,
            senderRole: payload.senderRole,
            senderName: payload.senderName,
            message: payload.message,
            createdAt: payload.createdAt,
          },
          updatedAt: payload.createdAt,
        };

        return [
          updatedConversation,
          ...current.filter((item) => item.caseId !== payload.caseId),
        ];
      });
    };

    socket.emit('chat:join', { caseId: selectedCaseId });
    socket.on('chat:message', handleMessage);
    socket.on('chat:notification', handleChatNotification);

    return () => {
      socket.emit('chat:leave', { caseId: selectedCaseId });
      socket.off('chat:message', handleMessage);
      socket.off('chat:notification', handleChatNotification);
    };
  }, [selectedCaseId]);

  const selectConversation = (caseId) => {
    setSelectedCaseId(caseId);

    if (caseId) {
      setSearchParams({ caseId });
    }
  };

  const sendMessage = () => {
    const trimmedDraft = draft.trim();

    if (!trimmedDraft || !selectedCaseId || sending) {
      return;
    }

    const socket = getSocket();

    if (!socket) {
      toast.error('You need to be logged in to use messages');
      return;
    }

    setSending(true);

    socket.emit('chat:send', { caseId: selectedCaseId, message: trimmedDraft }, (response) => {
      setSending(false);

      if (!response?.ok) {
        toast.error(response?.message || 'Failed to send message');
        return;
      }

      setDraft('');
    });
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc,#eef2ff)]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[38px] border border-white/80 bg-white/90 shadow-xl shadow-slate-200/70 backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4 bg-[linear-gradient(135deg,#0f172a,#1e293b_55%,#0f766e)] px-8 py-8 text-white">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-100">Messages</p>
              <h1 className="mt-3 text-3xl font-semibold">All conversations in one inbox</h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
                Check every case conversation here, switch between threads quickly, and reply without opening each case separately.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
              <ShieldCheck className="h-4 w-4" />
              Real-time inbox
            </div>
          </div>

          <div className="grid min-h-[720px] lg:grid-cols-[340px_1fr]">
            <aside className="border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
              <div className="border-b border-slate-100 px-5 py-4">
                <p className="text-sm font-semibold text-slate-900">{role === 'lawyer' ? 'Client conversations' : 'Lawyer conversations'}</p>
                <p className="mt-1 text-sm text-slate-500">Tap a thread to open the full chat.</p>
              </div>

              <div className="max-h-[720px] overflow-y-auto">
                {loadingConversations ? (
                  <div className="p-5 text-sm text-slate-500">Loading conversations...</div>
                ) : null}

                {!loadingConversations && conversations.length === 0 ? (
                  <div className="p-5">
                    <div className="rounded-[28px] bg-slate-50 p-5 text-sm text-slate-500">
                      No conversations yet. Once a case is assigned and someone starts chatting, it will appear here.
                    </div>
                  </div>
                ) : null}

                {conversations.map((conversation) => {
                  const isActive = conversation.caseId === selectedCaseId;

                  return (
                    <button
                      key={conversation.caseId}
                      type="button"
                      onClick={() => selectConversation(conversation.caseId)}
                      className={`w-full border-b border-slate-100 px-5 py-4 text-left transition ${isActive ? 'bg-[linear-gradient(135deg,#eff6ff,#ecfeff)]' : 'bg-white hover:bg-slate-50'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{conversation.counterpart?.name || 'Conversation'}</p>
                          <p className="mt-1 truncate text-xs uppercase tracking-[0.18em] text-slate-400">{conversation.title}</p>
                        </div>
                        <span className="shrink-0 text-xs text-slate-400">{formatConversationTime(conversation.lastMessage?.createdAt || conversation.updatedAt)}</span>
                      </div>
                      <p className="mt-2 truncate text-sm text-slate-500">{buildPreview(conversation)}</p>
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className="flex min-h-[720px] flex-col bg-[linear-gradient(180deg,#ffffff,#f8fafc)]">
              {selectedConversation ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-6 py-5">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{selectedConversation.counterpart?.name || 'Conversation'}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {selectedConversation.title} • {selectedConversation.status}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
                    {loadingMessages ? <p className="text-sm text-slate-500">Loading messages...</p> : null}

                    {!loadingMessages && messages.length === 0 ? (
                      <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center">
                        <div className="rounded-full bg-blue-50 p-4 text-blue-700">
                          <MessageSquare className="h-6 w-6" />
                        </div>
                        <p className="mt-4 text-base font-semibold text-slate-900">No messages yet</p>
                        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Start this conversation and all future replies will stay organized in this inbox.</p>
                      </div>
                    ) : null}

                    <div className="space-y-4">
                      {messages.map((item) => {
                        const isOwnMessage = item.senderId === user?.id;

                        return (
                          <div key={item._id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-[26px] px-4 py-3 shadow-sm ${isOwnMessage ? 'bg-[linear-gradient(135deg,#2563eb,#1d4ed8)] text-white shadow-blue-200/60' : 'border border-slate-200 bg-white text-slate-800'}`}>
                              <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${isOwnMessage ? 'text-blue-100' : 'text-slate-500'}`}>
                                {isOwnMessage ? 'You' : item.senderName}
                              </p>
                              <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{item.message}</p>
                              <p className={`mt-2 text-xs ${isOwnMessage ? 'text-blue-100' : 'text-slate-400'}`}>{formatTimestamp(item.createdAt)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div ref={bottomRef} />
                  </div>

                  <div className="border-t border-slate-200 bg-white/90 p-4 sm:p-6">
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
                        placeholder="Write a message..."
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
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                  <div className="rounded-full bg-blue-50 p-4 text-blue-700">
                    <MessageSquare className="h-7 w-7" />
                  </div>
                  <p className="mt-4 text-lg font-semibold text-slate-900">Select a conversation</p>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Your assigned case chats will show here in one place, similar to a social inbox.
                  </p>
                </div>
              )}
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
