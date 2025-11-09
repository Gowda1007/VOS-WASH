declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_MONGODB_CONNECTION_STRING: string;
  readonly VITE_SERVER_URL: string;
  // Add other environment variables here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
interface Window {
  AndroidBridge?: import('./types').AndroidBridge;
}