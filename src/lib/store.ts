import { create } from 'zustand'

// Types
export interface ActionItem {
  id: string
  initiativeId: string
  title: string
  description?: string
  order: number
  completed: boolean
  completedAt?: string
  assignee?: string
  dueDate?: string
}

export interface Comment {
  id: string
  initiativeId: string
  author: string
  content: string
  createdAt: string
}

export interface StatusUpdate {
  id: string
  initiativeId: string
  fromStatus: string
  toStatus: string
  changedBy?: string
  note?: string
  createdAt: string
}

export interface Initiative {
  id: string
  painPointId: number
  status: 'not_started' | 'planning' | 'in_progress' | 'completed'
  progress: number
  owner?: string
  ownerEmail?: string
  startDate?: string
  targetDate?: string
  completedDate?: string
  priorityOrder: number
  notes?: string
  blockers?: string
  actionItems: ActionItem[]
  comments: Comment[]
  updates: StatusUpdate[]
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  referencedPainPoints?: string
  createdAt: string
}

export interface Conversation {
  id: string
  title?: string
  messages: Message[]
  createdAt: string
  updatedAt: string
}

// Initiative Store
interface InitiativeState {
  initiatives: Initiative[]
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchInitiatives: () => Promise<void>
  updateInitiative: (painPointId: number, data: Partial<Initiative>) => Promise<void>
  toggleActionItem: (painPointId: number, actionItemId: string, completed: boolean) => Promise<void>
  addComment: (painPointId: number, author: string, content: string) => Promise<void>
}

export const useInitiativeStore = create<InitiativeState>((set, get) => ({
  initiatives: [],
  isLoading: false,
  error: null,

  fetchInitiatives: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/initiatives')
      if (!response.ok) throw new Error('Failed to fetch initiatives')
      const data = await response.json()
      set({ initiatives: data, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  updateInitiative: async (painPointId, data) => {
    try {
      const response = await fetch(`/api/initiatives/${painPointId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to update initiative')
      const updated = await response.json()
      
      set(state => ({
        initiatives: state.initiatives.map(i => 
          i.painPointId === painPointId ? updated : i
        ),
      }))
    } catch (error) {
      set({ error: (error as Error).message })
    }
  },

  toggleActionItem: async (painPointId, actionItemId, completed) => {
    try {
      const response = await fetch(`/api/initiatives/${painPointId}/actions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionItemId, completed }),
      })
      if (!response.ok) throw new Error('Failed to update action item')
      const updated = await response.json()
      
      set(state => ({
        initiatives: state.initiatives.map(i => 
          i.painPointId === painPointId ? updated : i
        ),
      }))
    } catch (error) {
      set({ error: (error as Error).message })
    }
  },

  addComment: async (painPointId, author, content) => {
    try {
      const response = await fetch(`/api/initiatives/${painPointId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, content }),
      })
      if (!response.ok) throw new Error('Failed to add comment')
      
      // Refetch to get updated data
      await get().fetchInitiatives()
    } catch (error) {
      set({ error: (error as Error).message })
    }
  },
}))

// AI Chat Store (no persist to avoid hydration issues)
interface ChatState {
  conversations: Conversation[]
  currentConversationId: string | null
  messages: Message[]
  isLoading: boolean
  error: string | null
  webSearchEnabled: boolean

  // Actions
  sendMessage: (content: string) => Promise<void>
  startNewConversation: () => void
  loadConversation: (conversationId: string) => Promise<void>
  toggleWebSearch: () => void
}

export const useChatStore = create<ChatState>()((set, get) => ({
  conversations: [],
  currentConversationId: null,
  messages: [],
  isLoading: false,
  error: null,
  webSearchEnabled: false,

  sendMessage: async (content) => {
    const { webSearchEnabled } = get()
    set({ isLoading: true, error: null })
    
    // Optimistically add user message
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }
    set(state => ({ messages: [...state.messages, tempUserMessage] }))

    // Add temporary assistant message for streaming
    const tempAssistantId = `assistant-temp-${Date.now()}`
    const tempAssistantMessage: Message = {
      id: tempAssistantId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    }
    set(state => ({ messages: [...state.messages, tempAssistantMessage] }))

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationId: get().currentConversationId,
          useWebSearch: webSearchEnabled,
          stream: true,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        if (data.error && data.setup) {
          const setupMessage: Message = {
            id: `setup-${Date.now()}`,
            role: 'assistant',
            content: `## ⚠️ AI Not Configured\n\n${data.error}\n\n**To enable AI:**\n\n1. **Primary (DeepSeek V3.2):**\n   - Get API key: ${data.setup.primary.split(' - ')[1]}\n   - Add to \`.env\`: \`DEEPSEEK_API_KEY=your_key\`\n\n2. **Fallback (Llama 3.3 70B):**\n   - Get API key: ${data.setup.fallback.split(' - ')[1]}\n   - Add to \`.env\`: \`TOGETHER_API_KEY=your_key\`\n\nRestart the dev server after adding keys.`,
            createdAt: new Date().toISOString(),
          }
          set(state => ({
            messages: [
              ...state.messages.filter(m => m.id !== tempUserMessage.id && m.id !== tempAssistantId),
              { ...tempUserMessage, id: `user-${Date.now()}` },
              setupMessage,
            ],
            isLoading: false,
          }))
          return
        }
        throw new Error(data.error || 'Failed to send message')
      }
      
      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let accumulatedContent = ''
      let conversationId = get().currentConversationId
      let hasError = false
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim()
              if (data === '[DONE]') continue
              if (!data) continue
              
              try {
                const parsed = JSON.parse(data)
                
                // Handle errors in stream
                if (parsed.error) {
                  hasError = true
                  accumulatedContent = `⚠️ ${parsed.error}`
                  set(state => ({
                    messages: state.messages.map(m =>
                      m.id === tempAssistantId
                        ? { ...m, content: accumulatedContent }
                        : m
                    ),
                  }))
                  break
                }
                
                // Handle content streaming
                if (parsed.content) {
                  accumulatedContent += parsed.content
                  // Update streaming message in real-time
                  set(state => ({
                    messages: state.messages.map(m =>
                      m.id === tempAssistantId
                        ? { ...m, content: accumulatedContent }
                        : m
                    ),
                  }))
                }
                
                // Capture conversation ID
                if (parsed.conversationId) {
                  conversationId = parsed.conversationId
                }
              } catch (e) {
                console.warn('Failed to parse streaming chunk:', data)
              }
            }
          }
        }
      }
      
      // Finalize messages
      set(state => ({
        currentConversationId: conversationId,
        messages: state.messages.map(m => {
          if (m.id === tempUserMessage.id) return { ...m, id: `user-${Date.now()}` }
          if (m.id === tempAssistantId) return { ...m, id: `assistant-${Date.now()}` }
          return m
        }),
        isLoading: false,
        error: hasError ? 'An error occurred during streaming' : null,
      }))
    } catch (error) {
      console.error('Chat error:', error)
      set({ 
        error: (error as Error).message, 
        isLoading: false,
        messages: get().messages.filter(m => m.id !== tempUserMessage.id && m.id !== tempAssistantId),
      })
    }
  },

  startNewConversation: () => {
    set({
      currentConversationId: null,
      messages: [],
      error: null,
    })
  },

  loadConversation: async (conversationId) => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch(`/api/ai/chat?conversationId=${conversationId}`)
      if (!response.ok) throw new Error('Failed to load conversation')
      const data = await response.json()
      
      set({
        currentConversationId: conversationId,
        messages: data.messages || [],
        isLoading: false,
      })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  toggleWebSearch: () => {
    set(state => ({ webSearchEnabled: !state.webSearchEnabled }))
  },
}))

// UI State Store
interface UIState {
  sidebarOpen: boolean
  aiPanelOpen: boolean
  expandedCards: Set<number>
  activeView: 'dashboard' | 'tracker' | 'analytics'
  
  toggleSidebar: () => void
  toggleAIPanel: () => void
  toggleCard: (id: number) => void
  setActiveView: (view: UIState['activeView']) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  aiPanelOpen: false,
  expandedCards: new Set(),
  activeView: 'dashboard',

  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
  toggleAIPanel: () => set(state => ({ aiPanelOpen: !state.aiPanelOpen })),
  toggleCard: (id) => set(state => {
    const newSet = new Set(state.expandedCards)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      if (newSet.size >= 3) newSet.clear()
      newSet.add(id)
    }
    return { expandedCards: newSet }
  }),
  setActiveView: (view) => set({ activeView: view }),
}))
