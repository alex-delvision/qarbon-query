/**
 * Browser-Agnostic AI Carbon Tracker
 * Works without extension APIs - pure JavaScript
 */

export class BrowserAgnosticTracker {
  private apiPatterns = [
    // OpenAI
    /api\.openai\.com\/v1\/chat\/completions/,
    /chat\.openai\.com\/backend-api\/conversation/,

    // Anthropic/Claude
    /api\.anthropic\.com\/v1\/messages/,
    /claude\.ai\/api\/organizations\/.*\/chat_conversations\/.*\/completion/,

    // Google
    /generativelanguage\.googleapis\.com\/v1.*\/models\/.*:generateContent/,
    /bard\.google\.com\/_\/BardChatUi\/data/,
    /gemini\.google\.com\/_\/BardChatUi\/data/,

    // Others
    /bedrock.*\.amazonaws\.com\/model\/.*\/invoke/,
  ];

  private captures: any[] = [];
  private storageKey = 'qarbon_agnostic_captures';

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    // Intercept fetch
    this.interceptFetch();

    // Intercept XHR
    this.interceptXHR();

    // Load existing captures
    this.loadCaptures();

    // Set up periodic sync
    setInterval(() => this.syncCaptures(), 30000);
  }

  private interceptFetch(): void {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      try {
        const url = typeof args[0] === 'string' ? args[0] : args[0].url;

        if (this.shouldCapture(url)) {
          const clonedResponse = response.clone();

          clonedResponse
            .text()
            .then(body => {
              this.captureAPICall({
                url,
                method: args[1]?.method || 'GET',
                timestamp: Date.now(),
                responseSize: body.length,
                responseBody: this.sanitizeResponse(body),
              });
            })
            .catch(err => {
              console.warn('Failed to capture response:', err);
            });
        }
      } catch (error) {
        console.warn('Fetch intercept error:', error);
      }

      return response;
    };
  }

  private interceptXHR(): void {
    const XHR = XMLHttpRequest.prototype;
    const originalOpen = XHR.open;
    const originalSend = XHR.send;

    XHR.open = function (method: string, url: string, ...rest: any[]) {
      (this as any)._qarbonUrl = url;
      (this as any)._qarbonMethod = method;
      return originalOpen.apply(this, [method, url, ...rest]);
    };

    XHR.send = function (body?: any) {
      const url = (this as any)._qarbonUrl;
      const method = (this as any)._qarbonMethod;
      const tracker = (window as any).qarbonTracker;

      if (url && tracker && tracker.shouldCapture(url)) {
        this.addEventListener('load', function () {
          if (this.status >= 200 && this.status < 300) {
            tracker.captureAPICall({
              url,
              method,
              timestamp: Date.now(),
              responseSize: this.responseText.length,
              responseBody: tracker.sanitizeResponse(this.responseText),
            });
          }
        });
      }

      return originalSend.apply(this, [body]);
    };
  }

  private shouldCapture(url: string): boolean {
    return this.apiPatterns.some(pattern => pattern.test(url));
  }

  private captureAPICall(data: any): void {
    const capture = {
      ...data,
      emissions: this.calculateEmissions(data),
    };

    this.captures.push(capture);
    this.saveCaptures();

    // Emit event for real-time updates
    window.dispatchEvent(
      new CustomEvent('qarbon-capture', {
        detail: capture,
      })
    );
  }

  private calculateEmissions(data: any): number {
    // Simple estimation based on response size
    const tokens = Math.ceil(data.responseSize / 4);
    const co2PerThousandTokens = 0.002; // grams
    return (tokens / 1000) * co2PerThousandTokens;
  }

  private sanitizeResponse(body: string): any {
    try {
      const parsed = JSON.parse(body);
      // Extract only essential data for emissions calculation
      return {
        model: parsed.model,
        usage: parsed.usage,
        tokens: parsed.usage?.total_tokens,
      };
    } catch {
      return { responseLength: body.length };
    }
  }

  private loadCaptures(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.captures = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load captures:', error);
    }
  }

  private saveCaptures(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.captures));
    } catch (error) {
      console.warn('Failed to save captures:', error);
      // Implement cleanup if quota exceeded
      this.cleanupOldCaptures();
    }
  }

  private cleanupOldCaptures(): void {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.captures = this.captures.filter(c => c.timestamp > oneDayAgo);
    this.saveCaptures();
  }

  private syncCaptures(): void {
    // Sync with remote server if available
    if (window.navigator.onLine) {
      // Implementation depends on your backend
      console.log('Syncing captures...', this.captures.length);
    }
  }

  // Public API
  public getEmissions(timeframe: 'today' | 'week' | 'month' = 'today'): number {
    const now = Date.now();
    const filters: Record<string, number> = {
      today: now - 24 * 60 * 60 * 1000,
      week: now - 7 * 24 * 60 * 60 * 1000,
      month: now - 30 * 24 * 60 * 60 * 1000,
    };

    return this.captures
      .filter(c => c.timestamp > filters[timeframe])
      .reduce((sum, c) => sum + (c.emissions || 0), 0);
  }

  public getStats(): any {
    return {
      totalCaptures: this.captures.length,
      todayEmissions: this.getEmissions('today'),
      weekEmissions: this.getEmissions('week'),
      monthEmissions: this.getEmissions('month'),
    };
  }
}

// Auto-initialize when loaded
if (typeof window !== 'undefined') {
  (window as any).qarbonTracker = new BrowserAgnosticTracker();
}
