// src/api.ts
import type { StreamOptions } from './types'

const API_URL = import.meta.env.VITE_API_URL || '/api';

export async function generateOnce(
  prompt: string
): Promise<{ text: string; audioUrl?: string | null }> {
  const res = await fetch(`${API_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  // IMPORTANT: this is a plain object literal (no backticks)
  return {
    text: data.output ?? '',
    audioUrl: data.audio_url ?? data.audioUrl ?? null,
  };
}

export async function generateStream(
  prompt: string,
  opts: StreamOptions
): Promise<void> {
  const res = await fetch(`${API_URL}/generate_stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
    signal: opts.signal,
  });
  if (!res.ok) throw new Error(`Stream error: ${res.status}`);

  const reader = res.body?.getReader();
  if (!reader) throw new Error('ReadableStream not supported');

  const decoder = new TextDecoder();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    opts.onToken?.(chunk);
  }
}
