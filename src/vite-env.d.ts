/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  // add more VITE_* vars here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
import type { DefineComponent } from 'vue'
const component: DefineComponent<{}, {}, any>
export default component
}