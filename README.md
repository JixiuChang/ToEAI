# ToEAI Frontend

This repository contains a minimal Vue 3 + Vite frontend for the Tales of Echo AI image generator.  The application is intentionally pure‑frontend; calls to the backend are stubbed out with placeholder implementations so you can wire your own API later.

## Features

- **Chat‑style interface** inspired by ChatGPT
- **Conversation history** stored in localStorage and grouped by user
- **Login/Logout** via a modal dialog (no real validation; sets a username in localStorage)
- **Dark, soothing colour theme** with soft purple and pink accents
- **New Chat** button and a **“Surprise me with a random song”** helper on empty conversations
- **Placeholder API calls** that simulate an image generation endpoint and a random song suggestion

## Development

Install dependencies and start the dev server:

```bash
pnpm install
pnpm dev
```

Build for production:

```bash
pnpm build
pnpm preview
```

The app will be served on <http://localhost:5173> by default.
