import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  sendChatMessage,
  getConversations,
  getConversationMessages,
  createConversation,
  deleteConversation,
} from './chat-api'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('chat-api', () => {
  const mockToken = 'test-token-123'
  const API_BASE_URL = 'http://localhost:8000'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('sendChatMessage', () => {
    it('sends a chat message successfully', async () => {
      const mockResponse = {
        response: 'AI response',
        conversation_id: 1,
        message_id: 123,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await sendChatMessage(
        { message: 'Hello', conversation_id: 1 },
        mockToken
      )

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/chat/send`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`,
          },
          body: JSON.stringify({ message: 'Hello', conversation_id: 1 }),
        })
      )

      expect(result).toEqual(mockResponse)
    })

    it('sends a message without conversation_id', async () => {
      const mockResponse = {
        response: 'AI response',
        conversation_id: 2,
        message_id: 124,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await sendChatMessage({ message: 'Hello' }, mockToken)

      expect(result.conversation_id).toBe(2)
    })

    it('throws error when request fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Unauthorized' }),
      })

      await expect(
        sendChatMessage({ message: 'Hello' }, mockToken)
      ).rejects.toThrow('Unauthorized')
    })

    it('throws generic error when response has no detail', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => { throw new Error('Invalid JSON') },
      })

      await expect(
        sendChatMessage({ message: 'Hello' }, mockToken)
      ).rejects.toThrow('Failed to send message')
    })
  })

  describe('getConversations', () => {
    it('fetches conversations successfully', async () => {
      const mockConversations = [
        {
          id: 1,
          created_at: '2026-01-16T00:00:00Z',
          updated_at: '2026-01-16T00:00:00Z',
          message_count: 5,
        },
        {
          id: 2,
          created_at: '2026-01-15T00:00:00Z',
          updated_at: '2026-01-15T00:00:00Z',
          message_count: 3,
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConversations,
      })

      const result = await getConversations(mockToken)

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/chat/conversations`,
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${mockToken}`,
          },
        })
      )

      expect(result).toEqual(mockConversations)
      expect(result).toHaveLength(2)
    })

    it('throws error when fetching conversations fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Not found' }),
      })

      await expect(getConversations(mockToken)).rejects.toThrow('Not found')
    })
  })

  describe('getConversationMessages', () => {
    it('fetches conversation messages successfully', async () => {
      const mockMessages = [
        { role: 'user', content: 'Hello', created_at: '2026-01-16T00:00:00Z' },
        { role: 'assistant', content: 'Hi!', created_at: '2026-01-16T00:01:00Z' },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMessages,
      })

      const result = await getConversationMessages(1, mockToken)

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/chat/conversations/1/messages`,
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${mockToken}`,
          },
        })
      )

      expect(result).toEqual(mockMessages)
      expect(result).toHaveLength(2)
    })

    it('throws error when fetching messages fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Conversation not found' }),
      })

      await expect(getConversationMessages(999, mockToken)).rejects.toThrow(
        'Conversation not found'
      )
    })
  })

  describe('createConversation', () => {
    it('creates a new conversation successfully', async () => {
      const mockConversation = {
        id: 3,
        created_at: '2026-01-16T00:00:00Z',
        updated_at: '2026-01-16T00:00:00Z',
        message_count: 0,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConversation,
      })

      const result = await createConversation(mockToken)

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/chat/conversations`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${mockToken}`,
          },
        })
      )

      expect(result).toEqual(mockConversation)
      expect(result.message_count).toBe(0)
    })

    it('throws error when creating conversation fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Server error' }),
      })

      await expect(createConversation(mockToken)).rejects.toThrow('Server error')
    })
  })

  describe('deleteConversation', () => {
    it('deletes a conversation successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'success' }),
      })

      await deleteConversation(1, mockToken)

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/chat/conversations/1`,
        expect.objectContaining({
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${mockToken}`,
          },
        })
      )
    })

    it('throws error when deleting conversation fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Forbidden' }),
      })

      await expect(deleteConversation(1, mockToken)).rejects.toThrow('Forbidden')
    })

    it('handles network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(deleteConversation(1, mockToken)).rejects.toThrow('Network error')
    })
  })

  describe('API error handling', () => {
    it('handles malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => { throw new Error('Invalid JSON') },
      })

      await expect(
        sendChatMessage({ message: 'Test' }, mockToken)
      ).rejects.toThrow('Failed to send message')
    })

    it('includes authorization header in all requests', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      })

      await sendChatMessage({ message: 'Test' }, mockToken)
      await getConversations(mockToken)
      await getConversationMessages(1, mockToken)
      await createConversation(mockToken)
      await deleteConversation(1, mockToken)

      // All 5 calls should include the Authorization header
      expect(mockFetch).toHaveBeenCalledTimes(5)
      mockFetch.mock.calls.forEach((call) => {
        expect(call[1].headers.Authorization).toBe(`Bearer ${mockToken}`)
      })
    })
  })
})
