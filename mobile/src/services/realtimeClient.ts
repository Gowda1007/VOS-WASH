// Simple singleton WebSocket client with subscribe/broadcast and backoff reconnect

type Listener = (event: string, payload: any) => void;

class RealtimeClient {
  private ws: WebSocket | null = null;
  private es: EventSource | null = null;
  private baseUrl: string | null = null; // base (no trailing slash, no /api)
  private listeners: Array<{ prefix: string; handler: Listener }> = [];
  private reconnectAttempts = 0;
  private reconnectTimer: any = null;
  private usingSSE = false;

  connect(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    if (this.usingSSE) {
      // If already on SSE, keep it; WS will be attempted only if not active
      if (this.es) return;
      return this.setupSSE();
    }
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;
    const wsUrl = this.baseUrl + '/ws';
    try {
      this.ws = new WebSocket(wsUrl);
      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.usingSSE = false;
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      };
      this.ws.onmessage = (evt) => this.handleMessage(evt.data);
      this.ws.onclose = () => {
        this.ws = null;
        this.scheduleReconnect();
      };
      this.ws.onerror = () => { try { this.ws?.close(); } catch {}; };
    } catch {
      this.scheduleReconnect();
    }
  }

  private setupSSE() {
    if (!this.baseUrl) return;
    if (typeof EventSource === 'undefined') return; // RN may not support EventSource
    const sseUrl = this.baseUrl + '/events';
    try {
      this.es = new EventSource(sseUrl);
      this.es.onopen = () => {
        this.reconnectAttempts = 0;
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      };
      this.es.onmessage = (evt) => this.handleMessage(evt.data);
      this.es.onerror = () => {
        try { this.es?.close(); } catch {}
        this.es = null;
        // Attempt WS again after SSE error
        this.usingSSE = false;
        this.scheduleReconnect();
      };
    } catch {
      this.es = null;
    }
  }

  private handleMessage(raw: string) {
    try {
      const msg = JSON.parse(raw);
      if (msg && typeof msg.type === 'string') {
        this.listeners.forEach(l => { if (msg.type.startsWith(l.prefix)) l.handler(msg.type, msg.payload); });
      }
    } catch {/* ignore malformed */}
  }

  private scheduleReconnect() {
    if (!this.baseUrl) return;
    const delay = Math.min(30000, 1000 * Math.pow(2, this.reconnectAttempts || 0));
    this.reconnectAttempts++;
    if (this.reconnectAttempts >= 5 && !this.usingSSE) {
      // After several failed WS attempts, fall back to SSE
      this.usingSSE = true;
      this.setupSSE();
      return;
    }
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => this.connect(this.baseUrl!), delay);
  }

  subscribe(prefix: string, handler: Listener): () => void {
    const item = { prefix, handler };
    this.listeners.push(item);
    return () => { this.listeners = this.listeners.filter(l => l !== item); };
  }

  isConnected(): boolean {
    return (this.ws && this.ws.readyState === WebSocket.OPEN) || !!(this.es);
  }
}

export const realtimeClient = new RealtimeClient();
