import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { useAuth } from '../App';
import apiService from '../services/api';
import { MessageSquare, Send, Users as UsersIcon } from 'lucide-react';

const formatTimestamp = (value) => {
  if (!value) return '';
  try {
    const date = new Date(value);
    return date.toLocaleString();
  } catch (err) {
    return '';
  }
};

export function Inbox() {
  const { user, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [messageError, setMessageError] = useState('');
  const [body, setBody] = useState('');

  const currentUserId = user?._id?.toString();

  const fetchConversations = async () => {
    try {
      setLoadingConversations(true);
      const res = await apiService.getConversations();
      if (!res.success) {
        throw new Error(res.message || 'Unable to load conversations');
      }
      setConversations(Array.isArray(res.data) ? res.data : []);
      return res.data;
    } catch (err) {
      setError(err.message || 'Unable to load inbox');
      setConversations([]);
      return [];
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    if (!conversationId) return;
    try {
      setLoadingMessages(true);
      const res = await apiService.getConversationMessages(conversationId);
      if (!res.success) {
        throw new Error(res.message || 'Unable to load messages');
      }
      setMessages(Array.isArray(res.data) ? res.data : []);
      await apiService.markConversationRead(conversationId);
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation._id === conversationId
            ? { ...conversation, unreadFor: (conversation.unreadFor || []).filter((id) => id !== currentUserId) }
            : conversation,
        ),
      );
    } catch (err) {
      setMessageError(err.message || 'Unable to load messages');
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const selectConversation = async (conversationId) => {
    setMessageError('');
    setSelectedId(conversationId);
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (conversationId) {
        params.set('conversation', conversationId);
      } else {
        params.delete('conversation');
      }
      return params;
    });
    await fetchMessages(conversationId);
  };

  const handleSend = async (event) => {
    event.preventDefault();
    if (!selectedId || !body.trim()) {
      return;
    }
    setSending(true);
    setMessageError('');
    try {
      const res = await apiService.sendConversationMessage(selectedId, body.trim());
      if (!res.success) {
        throw new Error(res.message || 'Unable to send message');
      }
      const message = res.data;
      setMessages((prev) => [...prev, message]);
      setBody('');
      setConversations((prev) => {
        const updated = prev.map((conversation) =>
          conversation._id === selectedId ? { ...res.conversation } : conversation,
        );
        return updated.sort((a, b) => new Date(b.lastActivityAt || 0) - new Date(a.lastActivityAt || 0));
      });
    } catch (err) {
      setMessageError(err.message || 'Unable to send message');
    } finally {
      setSending(false);
    }
  };

  const inferredSelection = useMemo(() => {
    if (selectedId) {
      return selectedId;
    }
    if (conversations.length > 0) {
      return conversations[0]._id;
    }
    return null;
  }, [selectedId, conversations]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    (async () => {
      const data = await fetchConversations();
      const requested = searchParams.get('conversation');
      const nextSelection = requested || (Array.isArray(data) && data[0]?._id);
      if (nextSelection) {
        await selectConversation(nextSelection);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeConversation = conversations.find((conversation) => conversation._id === inferredSelection);

  const otherParticipant = activeConversation?.participants?.find(
    (participant) => participant._id !== currentUserId,
  );

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-3xl font-medium text-foreground">Inbox</h1>
            <p className="text-muted-foreground text-sm">Chat with hosts, guests, and potential roommates in real time.</p>
          </div>
        </div>

        {error && (
          <Card>
            <CardContent className="py-6 text-destructive">{error}</CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[480px]">
                {loadingConversations ? (
                  <div className="p-4 text-sm text-muted-foreground">Loading conversations…</div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground flex flex-col items-center gap-2">
                    <UsersIcon className="h-6 w-6" />
                    <span>No conversations yet. Start one from a listing or roommate match.</span>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {conversations.map((conversation) => {
                      const isActive = conversation._id === inferredSelection;
                      const counterpart = conversation.participants?.find(
                        (participant) => participant._id !== currentUserId,
                      );
                      const unread = (conversation.unreadFor || []).includes(currentUserId);
                      const isRoommateConversation = Boolean(conversation.roommateRequest);
                      const title = conversation.listing?.title || conversation.roommateRequest?.title || 'Conversation';
                      const subtitleParts = [];
                      if (counterpart?.name) {
                        subtitleParts.push(counterpart.name);
                      }
                      const location = conversation.listing?.location || conversation.roommateRequest?.location;
                      if (location) {
                        subtitleParts.push(location);
                      }
                      const subtitle = subtitleParts.join(' • ');
                      const counter = !isRoommateConversation ? conversation.listing?.roommates?.current : undefined;
                      const capacity = !isRoommateConversation ? conversation.listing?.roommates?.max : undefined;

                      return (
                        <button
                          key={conversation._id}
                          type="button"
                          onClick={() => selectConversation(conversation._id)}
                          className={`w-full text-left px-4 py-3 border-b border-border transition-colors ${
                            isActive ? 'bg-accent' : 'hover:bg-accent/60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-foreground line-clamp-1">{title}</p>
                                <Badge variant="secondary" className="uppercase text-[10px] tracking-wide">
                                  {isRoommateConversation ? 'Roommate' : 'Listing'}
                                </Badge>
                              </div>
                              {subtitle && (
                                <p className="text-xs text-muted-foreground line-clamp-1">{subtitle}</p>
                              )}
                            </div>
                            {unread && <Badge variant="default">New</Badge>}
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground space-y-1">
                            {conversation.lastMessage?.body && (
                              <p className="line-clamp-1">{conversation.lastMessage.body}</p>
                            )}
                            <div className="flex items-center justify-between">
                              <span>{formatTimestamp(conversation.lastActivityAt)}</span>
                              {!isRoommateConversation &&
                                Number.isFinite(counter) &&
                                Number.isFinite(capacity) && (
                                  <span>
                                    {counter}/{capacity}
                                  </span>
                                )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                {otherParticipant?.name || activeConversation?.roommateRequest?.title || 'Select a conversation'}
                {(activeConversation?.listing?.title || activeConversation?.roommateRequest?.location) && (
                  <span className="block text-sm font-normal text-muted-foreground">
                    {activeConversation?.listing?.title || activeConversation?.roommateRequest?.location}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-[540px]">
              <ScrollArea className="flex-1">
                {loadingMessages ? (
                  <div className="p-4 text-sm text-muted-foreground">Loading messages…</div>
                ) : messages.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">
                    {activeConversation ? 'No messages yet. Say hello!' : 'Pick a conversation to view messages.'}
                  </div>
                ) : (
                  <div className="space-y-4 p-4">
                    {messages.map((message) => {
                      const mine = message.sender?._id === currentUserId;
                      return (
                        <div key={message._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[75%] rounded-lg px-4 py-3 text-sm ${
                              mine ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{message.body}</p>
                            <span className="block text-[11px] mt-2 opacity-75">
                              {formatTimestamp(message.createdAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
              {activeConversation && (
                <form onSubmit={handleSend} className="border-t border-border mt-4 pt-4 space-y-3">
                  <Textarea
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder="Write a message..."
                    rows={3}
                    disabled={sending}
                  />
                  {messageError && <p className="text-xs text-destructive">{messageError}</p>}
                  <div className="flex justify-end">
                    <Button type="submit" disabled={sending || !body.trim()} className="inline-flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      {sending ? 'Sending…' : 'Send message'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
