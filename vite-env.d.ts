
// Removed failing triple-slash reference to vite/client to fix type resolution error
declare namespace NodeJS {
  interface ProcessEnv {
    readonly API_KEY: string;
  }
}

interface Window {
  webkitAudioContext: typeof AudioContext;
}
