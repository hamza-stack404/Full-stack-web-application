// Task T017: Chat API client for Phase III AI Chatbot
// Handles communication with chat endpoints

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export interface Conversation {
  id: number;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface SendMessageRequest {
  message: string;
  conversation_id?: number;
}

export interface SendMessageResponse {
  response: string;
  conversation_id: number;
  message_id: number;
}

/**
 * Send a chat message and get AI response
 */
export async function sendChatMessage(
  request: SendMessageRequest,
  token: string
): Promise<SendMessageResponse> {
  const response = await fetch(`${API_BASE_URL}/api/chat/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to send message' }));
    throw new Error(error.detail || 'Failed to send message');
  }

  return response.json();
}

/**
 * Get all conversations for the current user
 */
export async function getConversations(token: string): Promise<Conversation[]> {
  const response = await fetch(`${API_BASE_URL}/api/chat/conversations`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to fetch conversations' }));
    throw new Error(error.detail || 'Failed to fetch conversations');
  }

  return response.json();
}

/**
 * Get all messages for a specific conversation
 */
export async function getConversationMessages(
  conversationId: number,
  token: string
): Promise<ChatMessage[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/chat/conversations/${conversationId}/messages`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to fetch messages' }));
    throw new Error(error.detail || 'Failed to fetch messages');
  }

  return response.json();
}

/**
 * Create a new conversation
 */
export async function createConversation(token: string): Promise<Conversation> {
  const response = await fetch(`${API_BASE_URL}/api/chat/conversations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to create conversation' }));
    throw new Error(error.detail || 'Failed to create conversation');
  }

  return response.json();
}

/**
 * Delete a conversation
 */
export async function deleteConversation(
  conversationId: number,
  token: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/chat/conversations/${conversationId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to delete conversation' }));
    throw new Error(error.detail || 'Failed to delete conversation');
  }
}
