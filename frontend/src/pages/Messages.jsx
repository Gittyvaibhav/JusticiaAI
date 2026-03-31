import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MessageSquare, Search, Send, ShieldCheck } from 'lucide-react';
import api from '../api';
import Navbar from '../components/Navbar';
import { getSocket } from '../socket';
import { useAuth } from '../context/AuthContext';
import './Messages.css';

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

function buildPreview(conversation, currentUserId) {
  if (conversation.lastMessage?.message) {
    return conversation.lastMessage.senderId === currentUserId ? `You: ${conversation.lastMessage.message}` : conversation.lastMessage.message;
  }

  if (conversation.aiCaseSummary) {
    return conversation.aiCaseSummary;
  }

  return 'No messages yet. Start the conversation here.';
}

export default function Messages() {
  const { user, role } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryCaseId = searchParams.get('caseId') || '';
  const unreadStorageKey = user?.id ? `messages-unread:${user.id}` : 'messages-unread:guest';
  const [conversations, setConversations] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(queryCaseId);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [unreadMap, setUnreadMap] = useState({});
  const bottomRef = useRef(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(unreadStorageKey);
      setUnreadMap(stored ? JSON.parse(stored) : {});
    } catch {
      setUnreadMap({});
    }
  }, [unreadStorageKey]);

  useEffect(() => {
    window.localStorage.setItem(unreadStorageKey, JSON.stringify(unreadMap));
  }, [unreadMap, unreadStorageKey]);

  const markConversationRead = (caseId) => {
    if (!caseId) {
      return;
    }

    setUnreadMap((current) => ({
      ...current,
      [caseId]: 0,
    }));
  };

  const selectedConversation = useMemo(
    () => conversations.find((item) => item.caseId === selectedCaseId) || null,
    [conversations, selectedCaseId]
  );

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    const nextItems = conversations.filter((item) => {
      if (!query) {
        return true;
      }

      return [
        item.counterpart?.name,
        item.title,
        item.aiCaseSummary,
        item.aiLawyerTypeNeeded,
      ].some((value) => String(value || '').toLowerCase().includes(query));
    });

    nextItems.sort((a, b) => {
      if (sortBy === 'unread') {
        return (unreadMap[b.caseId] || 0) - (unreadMap[a.caseId] || 0) || new Date(b.updatedAt) - new Date(a.updatedAt);
      }

      if (sortBy === 'name') {
        return String(a.counterpart?.name || '').localeCompare(String(b.counterpart?.name || ''));
      }

      return new Date(b.lastMessage?.createdAt || b.updatedAt) - new Date(a.lastMessage?.createdAt || a.updatedAt);
    });

    return nextItems;
  }, [conversations, search, sortBy, unreadMap]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    setLoadingConversations(true);

    try {
      const { data } = await api.get('/chat/conversations');
      const nextConversations = data.conversations || [];
      setConversations(nextConversations);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load conversations');
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    loadConversations();
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
          markConversationRead(selectedCaseId);
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

    const handleIncoming = (payload) => {
      setConversations((current) => {
        const existingConversation = current.find((item) => item.caseId === payload.caseId);

        if (!existingConversation) {
          loadConversations();
          return current;
        }

        const nextLastMessage = payload.message ? payload : {
          _id: `preview:${payload.caseId}:${payload.createdAt}`,
          caseId: payload.caseId,
          senderId: payload.senderId,
          senderRole: payload.senderRole,
          senderName: payload.senderName,
          message: payload.message,
          createdAt: payload.createdAt,
        };

        const updatedConversation = {
          ...existingConversation,
          lastMessage: nextLastMessage,
          updatedAt: payload.createdAt,
        };

        return [
          updatedConversation,
          ...current.filter((item) => item.caseId !== payload.caseId),
        ];
      });

      if (payload.caseId === selectedCaseId) {
        if (payload._id) {
          setMessages((current) => (
            current.some((item) => item._id === payload._id)
              ? current
              : [...current, payload]
          ));
        }
        markConversationRead(payload.caseId);
        return;
      }

      if (payload.senderId !== user?.id) {
        setUnreadMap((current) => ({
          ...current,
          [payload.caseId]: (current[payload.caseId] || 0) + 1,
        }));
      }
    };

    socket.emit('chat:join', { caseId: selectedCaseId });
    socket.on('chat:message', handleIncoming);
    socket.on('chat:notification', handleIncoming);

    return () => {
      socket.emit('chat:leave', { caseId: selectedCaseId });
      socket.off('chat:message', handleIncoming);
      socket.off('chat:notification', handleIncoming);
    };
  }, [selectedCaseId, user?.id]);

  const selectConversation = (caseId) => {
    setSelectedCaseId(caseId);
    markConversationRead(caseId);

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

  const unreadTotal = Object.values(unreadMap).reduce((sum, count) => sum + Number(count || 0), 0);

  return (
    <div className="messages-page">
      <Navbar />
      <main className="messages-page__main">
        <section className="messages-page__shell">
          <div className="messages-page__hero">
            <div>
              <p className="messages-page__eyebrow">Messages</p>
              <h1 className="messages-page__title">All conversations in one inbox</h1>
              <p className="messages-page__subtitle">
                Follow every assigned case discussion here, with unread indicators, quick search, and case context that helps you respond faster.
              </p>
            </div>
            <div className="messages-page__hero-badges">
              <span className="messages-page__hero-chip">
                <ShieldCheck className="messages-page__hero-chip-icon" />
                Real-time inbox
              </span>
              <span className="messages-page__hero-chip">Unread {unreadTotal}</span>
            </div>
          </div>

          <div className="messages-page__layout">
            <aside className="messages-page__sidebar">
              <div className="messages-page__sidebar-header">
                <p className="messages-page__sidebar-title">{role === 'lawyer' ? 'Client conversations' : 'Lawyer conversations'}</p>
                <p className="messages-page__sidebar-copy">Search threads, sort by recency or unread state, and jump right back into the right case.</p>
              </div>

              <div className="messages-page__sidebar-controls">
                <label className="messages-page__search">
                  <Search className="messages-page__search-icon" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, case, or summary" className="messages-page__search-input" />
                </label>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="messages-page__select">
                  <option value="recent">Sort by recent</option>
                  <option value="unread">Sort by unread</option>
                  <option value="name">Sort by name</option>
                </select>
              </div>

              <div className="messages-page__thread-list">
                {loadingConversations ? <div className="messages-page__empty">Loading conversations...</div> : null}

                {!loadingConversations && filteredConversations.length === 0 ? (
                  <div className="messages-page__empty">
                    {conversations.length === 0
                      ? 'No conversations yet. Once a case is assigned and someone starts chatting, it will appear here.'
                      : 'No conversations match your current search.'}
                  </div>
                ) : null}

                {filteredConversations.map((conversation) => {
                  const isActive = conversation.caseId === selectedCaseId;
                  const unreadCount = unreadMap[conversation.caseId] || 0;

                  return (
                    <button
                      key={conversation.caseId}
                      type="button"
                      onClick={() => selectConversation(conversation.caseId)}
                      className={`messages-page__thread ${isActive ? 'messages-page__thread--active' : ''}`}
                    >
                      <div className="messages-page__thread-row">
                        <div className="messages-page__thread-copy">
                          <p className="messages-page__thread-name">{conversation.counterpart?.name || 'Conversation'}</p>
                          <p className="messages-page__thread-case">{conversation.title}</p>
                        </div>
                        <div className="messages-page__thread-side">
                          <span className="messages-page__thread-time">{formatConversationTime(conversation.lastMessage?.createdAt || conversation.updatedAt)}</span>
                          {unreadCount ? <span className="messages-page__thread-badge">{unreadCount}</span> : null}
                        </div>
                      </div>
                      <p className="messages-page__thread-preview">{buildPreview(conversation, user?.id)}</p>
                      <div className="messages-page__thread-meta">
                        <span className="messages-page__thread-meta-chip">{conversation.status}</span>
                        {conversation.aiCaseStrength ? <span className="messages-page__thread-meta-chip">{conversation.aiCaseStrength}</span> : null}
                        {conversation.urgency ? <span className="messages-page__thread-meta-chip">{conversation.urgency} urgency</span> : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className="messages-page__panel">
              {selectedConversation ? (
                <>
                  <div className="messages-page__panel-header">
                    <div>
                      <p className="messages-page__panel-name">{selectedConversation.counterpart?.name || 'Conversation'}</p>
                      <p className="messages-page__panel-case">{selectedConversation.title} | {selectedConversation.status}</p>
                    </div>
                    <div className="messages-page__panel-tags">
                      {selectedConversation.aiCaseStrength ? <span className="messages-page__panel-tag">{selectedConversation.aiCaseStrength}</span> : null}
                      {selectedConversation.aiLawyerTypeNeeded ? <span className="messages-page__panel-tag">{selectedConversation.aiLawyerTypeNeeded}</span> : null}
                    </div>
                  </div>

                  {selectedConversation.aiCaseSummary ? (
                    <div className="messages-page__case-note">
                      <p className="messages-page__case-note-label">Case context</p>
                      <p className="messages-page__case-note-copy">{selectedConversation.aiCaseSummary}</p>
                    </div>
                  ) : null}

                  <div className="messages-page__messages">
                    {loadingMessages ? <p className="messages-page__loading">Loading messages...</p> : null}

                    {!loadingMessages && messages.length === 0 ? (
                      <div className="messages-page__blank-state">
                        <div className="messages-page__blank-icon-wrap">
                          <MessageSquare className="messages-page__blank-icon" />
                        </div>
                        <p className="messages-page__blank-title">No messages yet</p>
                        <p className="messages-page__blank-copy">Start this conversation and all future replies will stay organized in this inbox.</p>
                      </div>
                    ) : null}

                    <div className="messages-page__message-list">
                      {messages.map((item) => {
                        const isOwnMessage = item.senderId === user?.id;

                        return (
                          <div key={item._id} className={`messages-page__message-row ${isOwnMessage ? 'messages-page__message-row--own' : ''}`}>
                            <div className={`messages-page__message ${isOwnMessage ? 'messages-page__message--own' : 'messages-page__message--other'}`}>
                              <p className="messages-page__message-author">{isOwnMessage ? 'You' : item.senderName}</p>
                              <p className="messages-page__message-body">{item.message}</p>
                              <p className="messages-page__message-time">{formatTimestamp(item.createdAt)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div ref={bottomRef} />
                  </div>

                  <div className="messages-page__composer">
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
                      className="messages-page__composer-input"
                    />
                    <button
                      type="button"
                      onClick={sendMessage}
                      disabled={sending || !draft.trim()}
                      className="messages-page__composer-button"
                    >
                      <Send className="messages-page__composer-button-icon" />
                      {sending ? 'Sending' : 'Send'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="messages-page__blank-state messages-page__blank-state--panel">
                  <div className="messages-page__blank-icon-wrap">
                    <MessageSquare className="messages-page__blank-icon" />
                  </div>
                  <p className="messages-page__blank-title">Select a conversation</p>
                  <p className="messages-page__blank-copy">Your assigned case chats will show here in one place, with unread state and searchable thread history.</p>
                </div>
              )}
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
