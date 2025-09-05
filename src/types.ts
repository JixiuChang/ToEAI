export type Role = 'user' | 'assistant' | 'system'

export interface Message {
  id: string
  role: Role
  content: string
  imageUrls?: string[]
  createdAt: string
}

export interface ChatSession {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: Message[]
}

export interface RootState {
  currentUser: string
  sessionsByUser: Record<string, ChatSession[]>
  activeSessionId?: string
}