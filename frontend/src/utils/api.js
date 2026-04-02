/**
 * API utilities for SustainaPath frontend.
 * Communicates with the FastAPI backend via the Vite proxy.
 */

const API_BASE = '/api'

/**
 * Send a chat message to the backend and get a response.
 * @param {Array} messages - Full conversation history [{role, content}]
 * @param {string} goal - "sustainability" | "cost" | "time" | "balanced"
 * @returns {Promise<object>} - { type: "clarifying"|"analysis", ... }
 */
export async function sendChat(messages, goal = 'balanced') {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, goal }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || `Server error ${response.status}`)
  }

  return response.json()
}
