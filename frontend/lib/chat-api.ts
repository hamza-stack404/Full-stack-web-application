// Task T017: Chat API client for Phase III AI Chatbot
// Handles communication with the backend chat endpoint

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export interface ChatRequest {
  message: string;
  conversation_id?: number;
}

export interface ChatResponse {
  message: string;
  conversation_id: number;
}

export interface Conversation {
  id: number;
  created_at: string;
  updated_at: string;
}

/**
 * Send a chat message to the AI assistant
 * @param message - The user's message
 * @param conversationId - Optional conversation ID to continue existing conversation
 * @param token - JWT authentication token
 * @returns Promise with assistant's response and conversation ID
 */
export async function sendChatMessage(
  message: string,
  token: string,
  conversationId?: number
): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      message,
      conversation_id: conversationId,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP error ${response.status}`);
  }

  return response.json();
}

/**
 * Get all conversations for the current user
 * @param token - JWT authentication token
 * @returns Promise with list of conversations
 */
export async function getConversations(token: string): Promise<Conversation[]> {
  const response = await fetch(`${API_BASE_URL}/api/conversations`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP error ${response.status}`);
  }

  const data = await response.json();
  return data.conversations;
}

/**
 * Get all messages for a specific conversation
 * @param conversationId - The conversation ID
 * @param token - JWT authentication token
 * @returns Promise with list of messages
 */
export async function getConversationMessages(
  conversationId: number,
  token: string
): Promise<ChatMessage[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/conversations/${conversationId}/messages`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP error ${response.status}`);
  }

  const data = await response.json();
  return data.messages;
}
