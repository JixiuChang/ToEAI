export type Role = 'user' | 'assistant' | 'system'

export interface Message {
  id: string
  role: Role
  content: string
  timestamp: number
}

export type StreamOptions = {
  signal?: AbortSignal | null;
  onToken?: (chunk: string) => void;
};