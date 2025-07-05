/**
 * QarbonQuery SSE-Aware Content Script
 * Handles Server-Sent Events for Claude and other streaming APIs
 */

// Import defensive messaging
import { defensiveMessaging } from './lib/defensive-messaging';

interface CaptureData {
  url: string;
  method: string;
  timestamp: number;
  tokens: number;
  emissions: number;
  platform: string;
  responseSize?: number;
}

class SSEAwareTracker {
  private captures: CaptureData[] = [];
  private platform: string;

  constructor() {
    this.platform = this.detectPlatform();
    this.initializeTracking();
    console.log('🌱 QarbonQuery SSE-Aware Tracker initialized for', this.platform);
  }

  private detectPlatform(): string {
    const hostname = location.hostname;
    if (hostname.includes('claude.ai')) return 'claude';
    if (hostname.includes('chat.openai.com')) return 'chatgpt';
    if (hostname.includes('gemini.google.com')) return 'gemini';
    return 'unknown';
  }

  private initializeTracking(): void {
    // Intercept fetch for all platforms
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
      const method = args[1]?.method || 'GET';
      
      // Check if this is an AI API endpoint
      if (this.isAIEndpoint(url)) {
        console.log('🎯 AI API detected:', url);
        
        const response = await originalFetch(...args);
        
        // Handle SSE streams (Claude)
        if (response.headers.get('content-type')?.includes('text/event-stream')) {
          return this.handleSSEResponse(response, url, method);
        }
        
        // Handle regular JSON responses (ChatGPT, Gemini)
        if (response.headers.get('content-type')?.includes('application/json')) {
          return this.handleJSONResponse(response, url, method);
        }
        
        return response;
      }
      
      return originalFetch(...args);
    };
  }

  private isAIEndpoint(url: string): boolean {
    const patterns = [
      /\/completion$/,
      /\/conversation$/,
      /\/chat\/completions$/,
      /\/v1\/messages$/,
      /generateContent/
    ];
    
    return patterns.some(pattern => pattern.test(url));
  }

  private async handleSSEResponse(response: Response, url: string, method: string): Promise<Response> {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    
    const stream = new ReadableStream({
      async start(controller) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          fullContent += chunk;
          controller.enqueue(value);
        }
        
        // Calculate emissions
        const tokens = Math.ceil(fullContent.length / 4);
        const emissions = (tokens / 1000) * 0.002;
        
        // Store capture
        await this.storeCapture({
          url,
          method,
          timestamp: Date.now(),
          tokens,
          emissions,
          platform: this.platform,
          responseSize: fullContent.length
        });
        
        controller.close();
      }
    });
    
    return new Response(stream, {
      headers: response.headers,
      status: response.status,
      statusText: response.statusText
    });
  }

  private async handleJSONResponse(response: Response, url: string, method: string): Promise<Response> {
    const cloned = response.clone();
    
    try {
      const data = await cloned.json();
      const tokens = data.usage?.total_tokens || Math.ceil(JSON.stringify(data).length / 4);
      const emissions = (tokens / 1000) * 0.002;
      
      await this.storeCapture({
        url,
        method,
        timestamp: Date.now(),
        tokens,
        emissions,
        platform: this.platform
      });
    } catch (e) {
      console.warn('Failed to parse JSON response:', e);
    }
    
    return response;
  }

  private async storeCapture(capture: CaptureData): Promise<void> {
    this.captures.push(capture);
    
    console.log(`✅ Captured: ${capture.tokens} tokens, ${capture.emissions.toFixed(4)} g CO₂e`);
    
    // Try to send to background script
    try {
      await defensiveMessaging.sendMessage({
        type: 'EMISSION_CAPTURE',
        data: capture,
        timestamp: Date.now()
      });
    } catch (e) {
      console.warn('Failed to send to background, using fallback storage');
    }
    
    // Always store locally as backup
    this.storeLocally(capture);
  }

  private storeLocally(capture: CaptureData): void {
    const key = `qarbon_capture_${Date.now()}`;
    localStorage.setItem(key, JSON.stringify(capture));
    
    // Also update aggregated stats
    this.updateLocalStats(capture);
  }

  private updateLocalStats(capture: CaptureData): void {
    const statsKey = 'qarbon_stats';
    const stats = JSON.parse(localStorage.getItem(statsKey) || '{}');
    
    const today = new Date().toDateString();
    
    if (!stats[today]) {
      stats[today] = { captures: 0, tokens: 0, emissions: 0 };
    }
    
    stats[today].captures += 1;
    stats[today].tokens += capture.tokens;
    stats[today].emissions += capture.emissions;
    
    localStorage.setItem(statsKey, JSON.stringify(stats));
    
    // Update extension badge
    this.updateBadge(stats[today].emissions);
  }

  private updateBadge(todayEmissions: number): void {
    if (chrome.runtime?.id) {
      chrome.runtime.sendMessage({
        type: 'UPDATE_BADGE',
        emissions: todayEmissions.toFixed(2)
      }).catch(() => {
        // Silent fail - Chrome 138 issue
      });
    }
  }
}

// Initialize
new SSEAwareTracker();

// Export for extension popup to read
(window as any).__qarbonGetStats = () => {
  const stats = JSON.parse(localStorage.getItem('qarbon_stats') || '{}');
  const today = new Date().toDateString();
  const week = Object.entries(stats)
    .filter(([date]) => {
      const d = new Date(date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    })
    .reduce((sum, [_, data]: [string, any]) => ({
      captures: sum.captures + data.captures,
      tokens: sum.tokens + data.tokens,
      emissions: sum.emissions + data.emissions
    }), { captures: 0, tokens: 0, emissions: 0 });
  
  return {
    today: stats[today] || { captures: 0, tokens: 0, emissions: 0 },
    week,
    allTime: Object.values(stats).reduce((sum: any, data: any) => ({
      captures: sum.captures + data.captures,
      tokens: sum.tokens + data.tokens,
      emissions: sum.emissions + data.emissions
    }), { captures: 0, tokens: 0, emissions: 0 })
  };
};

console.log('🌱 QarbonQuery SSE-Aware Content Script loaded');
