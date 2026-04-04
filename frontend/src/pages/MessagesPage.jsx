import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { API } from '../App';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import {
  HardHat, MessageSquare, Send, ArrowLeft, User, ChevronLeft
} from 'lucide-react';

export default function MessagesPage() {
  const { user, getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API}/messages/conversations`, {
        credentials: 'include', headers: getAuthHeaders()
      });
      if (res.ok) setConversations(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openThread = async (partnerId) => {
    setActiveThread(partnerId);
    try {
      const res = await fetch(`${API}/messages/thread/${partnerId}`, {
        credentials: 'include', headers: getAuthHeaders()
      });
      if (res.ok) {
        setMessages(await res.json());
        fetchConversations(); // refresh unread counts
      }
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeThread) return;
    setSending(true);
    try {
      const res = await fetch(`${API}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        credentials: 'include',
        body: JSON.stringify({ recipient_id: activeThread, content: newMessage.trim() })
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages(prev => [...prev, msg]);
        setNewMessage('');
      } else {
        toast.error('Failed to send message');
      }
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const activeConvo = conversations.find(c => c.partner_id === activeThread);

  return (
    <div className="min-h-screen bg-concrete-white flex flex-col">
      <nav className="bg-white border-b border-steel-grey">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-safety-orange rounded-sm flex items-center justify-center">
              <HardHat className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-bold text-xl text-blueprint-navy">BuildForce</span>
          </Link>
          <Button variant="ghost" onClick={() => navigate(user?.user_type === 'talent' ? '/talent/dashboard' : '/hirer/dashboard')} data-testid="back-to-dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" /> Dashboard
          </Button>
        </div>
      </nav>

      <div className="flex-1 flex max-w-6xl mx-auto w-full" data-testid="messages-page">
        {/* Conversations List */}
        <div className={`w-full md:w-80 border-r border-steel-grey bg-white flex-shrink-0 ${activeThread ? 'hidden md:block' : ''}`}>
          <div className="p-4 border-b border-steel-grey">
            <h2 className="font-heading font-bold text-blueprint-navy flex items-center gap-2">
              <MessageSquare className="w-5 h-5" /> Messages
            </h2>
          </div>
          <div className="overflow-y-auto" style={{ height: 'calc(100vh - 130px)' }}>
            {loading ? (
              <div className="p-4 text-center text-slate-500">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No conversations yet</p>
              </div>
            ) : (
              conversations.map((c) => (
                <div
                  key={c.partner_id}
                  onClick={() => openThread(c.partner_id)}
                  className={`p-4 border-b border-steel-grey cursor-pointer hover:bg-slate-50 transition-colors ${activeThread === c.partner_id ? 'bg-safety-orange/5 border-l-2 border-l-safety-orange' : ''}`}
                  data-testid={`conversation-${c.partner_id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blueprint-navy/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-blueprint-navy" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-blueprint-navy truncate">{c.partner_name}</p>
                        {c.unread_count > 0 && (
                          <span className="bg-safety-orange text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {c.unread_count}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 capitalize">{c.partner_type}</p>
                      {c.last_message && (
                        <p className="text-sm text-slate-500 truncate mt-1">{c.last_message.content}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Thread */}
        <div className={`flex-1 flex flex-col ${!activeThread ? 'hidden md:flex' : ''}`}>
          {activeThread ? (
            <>
              <div className="p-4 border-b border-steel-grey bg-white flex items-center gap-3">
                <button onClick={() => setActiveThread(null)} className="md:hidden p-1">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="w-8 h-8 bg-blueprint-navy/10 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blueprint-navy" />
                </div>
                <div>
                  <p className="font-medium text-blueprint-navy">{activeConvo?.partner_name || 'Unknown'}</p>
                  <p className="text-xs text-slate-500 capitalize">{activeConvo?.partner_type}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ height: 'calc(100vh - 250px)' }}>
                {messages.map((msg) => (
                  <div
                    key={msg.message_id}
                    className={`flex ${msg.sender_id === user?.user_id ? 'justify-end' : 'justify-start'}`}
                    data-testid={`message-${msg.message_id}`}
                  >
                    <div className={`max-w-[75%] p-3 rounded-lg ${msg.sender_id === user?.user_id ? 'bg-safety-orange text-white' : 'bg-white border border-steel-grey text-slate-700'}`}>
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.sender_id === user?.user_id ? 'text-white/70' : 'text-slate-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={sendMessage} className="p-4 border-t border-steel-grey bg-white flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                  data-testid="message-input"
                />
                <Button type="submit" disabled={sending || !newMessage.trim()} className="bg-safety-orange text-white rounded-sm" data-testid="send-message-btn">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
