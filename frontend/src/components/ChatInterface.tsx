'use client';

// Task T018: ChatInterface component for Phase III AI Chatbot
// Provides conversational UI for task management

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  sendChatMessage,
  getConversations,
  getConversationMessages,
  createConversation,
  deleteConversation,
  type ChatMessage,
  type Conversation,
} from '@/lib/chat-api';

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [deletingConversationId, setDeletingConversationId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const convs = await getConversations();
      setConversations(convs);

      // Load the most recent conversation if exists
      if (convs.length > 0 && !currentConversationId) {
        await loadConversation(convs[0].id);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadConversation = async (conversationId: number) => {
    try {
      const msgs = await getConversationMessages(conversationId);
      setMessages(msgs);
      setCurrentConversationId(conversationId);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const handleNewConversation = async () => {
    try {
      const newConv = await createConversation();
      setConversations([newConv, ...conversations]);
      setCurrentConversationId(newConv.id);
      setMessages([]);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleDeleteConversation = async (conversationId: number) => {
    // Prevent duplicate delete requests
    if (deletingConversationId === conversationId) {
      return;
    }

    try {
      setDeletingConversationId(conversationId);
      await deleteConversation(conversationId);
      setConversations(conversations.filter(c => c.id !== conversationId));

      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    } finally {
      setDeletingConversationId(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Add user message to UI immediately
    const newUserMessage: ChatMessage = {
      role: 'user',
      content: userMessage,
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      const response = await sendChatMessage({
        message: userMessage,
        conversation_id: currentConversationId || undefined,
      });

      // Update conversation ID if this was a new conversation
      if (!currentConversationId) {
        setCurrentConversationId(response.conversation_id);
        await loadConversations(); // Refresh conversation list
      }

      // Add assistant response to UI
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.response,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);

      // Add error message with better context
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: '❌ Sorry, I encountered an error processing your request. Please check your connection and try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* Conversations sidebar */}
      <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4 hidden md:block">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Conversations</h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleNewConversation}
            title="New conversation"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {isLoadingConversations ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : conversations.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            No conversations yet
          </p>
        ) : (
          <div className="space-y-2">
            {conversations.map(conv => (
              <div
                key={conv.id}
                className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 ${
                  currentConversationId === conv.id
                    ? 'bg-slate-100 dark:bg-slate-800'
                    : ''
                }`}
                onClick={() => loadConversation(conv.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    Conversation {conv.id}
                  </p>
                  <p className="text-xs text-slate-500">
                    {conv.message_count} messages
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteConversation(conv.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <h3 className="text-xl font-semibold mb-2">Welcome to AI Task Assistant</h3>
              <p className="text-slate-600 dark:text-slate-400 max-w-md">
                I can help you manage your tasks through natural conversation. Try saying:
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>"Add buy groceries"</li>
                <li>"What are my tasks?"</li>
                <li>"Mark task 3 as complete"</li>
                <li>"Delete task 2"</li>
              </ul>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-2">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-slate-200 dark:border-slate-800 p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !inputMessage.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
