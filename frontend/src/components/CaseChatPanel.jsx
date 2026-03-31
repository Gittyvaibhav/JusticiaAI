import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { MessageSquare, Send, ShieldCheck } from 'lucide-react';
import api from '../api';
import { getSocket } from '../socket';
import './CaseChatPanel.css';

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

  const sendMessage = () => {
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
      <section className="case-chat case-chat--disabled">
        <div className="case-chat__disabled-banner">
          <div className="case-chat__disabled-inner">
            <div className="case-chat__disabled-icon-wrap">
              <MessageSquare className="case-chat__icon" />
            </div>
            <div>
              <h2 className="case-chat__title">Case Chat</h2>
              <p className="case-chat__disabled-copy">
                Real-time chat becomes available as soon as a lawyer accepts this case.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="case-chat">
      <div className="case-chat__hero">
        <div>
          <h2 className="case-chat__title">Case Chat</h2>
          <p className="case-chat__subtitle">
            Live conversation with {counterpart?.name || 'your case participant'}.
          </p>
        </div>
        <div className="case-chat__live-badge">
          <ShieldCheck className="case-chat__icon" />
          Real-time
        </div>
      </div>

      <div className="case-chat__body">
        <div className="case-chat__panel">
          <div className="case-chat__messages">
            {loading ? <p className="case-chat__loading">Loading messages...</p> : null}
            {!loading && messages.length === 0 ? (
              <div className="case-chat__empty">
                <div className="case-chat__empty-icon-wrap">
                  <MessageSquare className="case-chat__empty-icon" />
                </div>
                <p className="case-chat__empty-title">No messages yet</p>
                <p className="case-chat__empty-copy">
                  Use this space to coordinate next steps, share updates, and keep the case moving in real time.
                </p>
              </div>
            ) : null}
            {messages.map((item) => {
              const isOwnMessage = item.senderId === currentUser?.id;

              return (
                <div key={item._id} className={`case-chat__message-row ${isOwnMessage ? 'case-chat__message-row--own' : 'case-chat__message-row--other'}`}>
                  <div className={`case-chat__bubble ${isOwnMessage ? 'case-chat__bubble--own' : 'case-chat__bubble--other'}`}>
                    <p className={`case-chat__bubble-author ${isOwnMessage ? 'case-chat__bubble-author--own' : 'case-chat__bubble-author--other'}`}>
                      {isOwnMessage ? 'You' : item.senderName}
                    </p>
                    <p className="case-chat__bubble-text">{item.message}</p>
                    <p className={`case-chat__bubble-time ${isOwnMessage ? 'case-chat__bubble-time--own' : 'case-chat__bubble-time--other'}`}>
                      {formatTimestamp(item.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <div className="case-chat__composer">
            <div className="case-chat__composer-row">
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
                className="case-chat__textarea"
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={sending || !draft.trim()}
                className="case-chat__send"
              >
                <Send className="case-chat__icon" />
                {sending ? 'Sending' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
