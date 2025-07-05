/**
 * Defensive Messaging System with Multiple Fallbacks
 * Implements resilient cross-context communication for Chrome extensions
 */

export interface MessagePayload {
  type: string;
  data: any;
  timestamp: number;
  fallbackUsed?: string;
}

export class DefensiveMessaging {
  private static instance: DefensiveMessaging;
  private messageQueue: MessagePayload[] = [];
  private isProcessing = false;
  
  // Fallback methods in order of preference
  private fallbackChain = [
    this.tryChromeRuntime.bind(this),
    this.tryPortMessaging.bind(this),
    this.tryCustomEvents.bind(this),
    this.tryLocalStorage.bind(this),
    this.tryIndexedDB.bind(this)
  ];

  static getInstance(): DefensiveMessaging {
    if (!DefensiveMessaging.instance) {
      DefensiveMessaging.instance = new DefensiveMessaging();
    }
    return DefensiveMessaging.instance;
  }

  async sendMessage(payload: MessagePayload): Promise<boolean> {
    // Try each fallback method in sequence
    for (const [index, method] of this.fallbackChain.entries()) {
      try {
        const success = await method(payload);
        if (success) {
          console.log(`✅ Message sent via fallback ${index}: ${method.name}`);
          return true;
        }
      } catch (error) {
        console.warn(`Fallback ${index} failed:`, error);
      }
    }
    
    // All fallbacks failed - queue for retry
    this.queueMessage(payload);
    return false;
  }

  private async tryChromeRuntime(payload: MessagePayload): Promise<boolean> {
    if (!this.isChromeRuntimeAvailable()) return false;
    
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(payload, (response) => {
        if (chrome.runtime.lastError) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  private async tryPortMessaging(payload: MessagePayload): Promise<boolean> {
    if (!this.isChromeRuntimeAvailable()) return false;
    
    try {
      const port = chrome.runtime.connect({ name: 'qarbon-fallback' });
      port.postMessage(payload);
      
      return new Promise((resolve) => {
        port.onMessage.addListener((msg) => {
          if (msg.type === 'ack') resolve(true);
        });
        
        setTimeout(() => resolve(false), 1000);
      });
    } catch {
      return false;
    }
  }

  private async tryCustomEvents(payload: MessagePayload): Promise<boolean> {
    const event = new CustomEvent('qarbon-message', {
      detail: payload,
      bubbles: true
    });
    
    window.dispatchEvent(event);
    
    // Wait for acknowledgment
    return new Promise((resolve) => {
      const handler = (e: Event) => {
        if ((e as CustomEvent).detail?.ackId === payload.timestamp) {
          window.removeEventListener('qarbon-ack', handler);
          resolve(true);
        }
      };
      
      window.addEventListener('qarbon-ack', handler);
      setTimeout(() => {
        window.removeEventListener('qarbon-ack', handler);
        resolve(false);
      }, 500);
    });
  }

  private async tryLocalStorage(payload: MessagePayload): Promise<boolean> {
    try {
      const key = `qarbon_msg_${Date.now()}_${Math.random()}`;
      localStorage.setItem(key, JSON.stringify({
        ...payload,
        fallbackUsed: 'localStorage'
      }));
      
      // Trigger storage event for other contexts
      window.dispatchEvent(new StorageEvent('storage', {
        key,
        newValue: JSON.stringify(payload),
        url: window.location.href
      }));
      
      return true;
    } catch {
      return false;
    }
  }

  private async tryIndexedDB(payload: MessagePayload): Promise<boolean> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(['messages'], 'readwrite');
      await tx.objectStore('messages').add({
        ...payload,
        fallbackUsed: 'indexedDB'
      });
      await tx.complete;
      return true;
    } catch {
      return false;
    }
  }

  private isChromeRuntimeAvailable(): boolean {
    return typeof chrome !== 'undefined' && 
           chrome.runtime && 
           chrome.runtime.sendMessage &&
           typeof chrome.runtime.sendMessage === 'function';
  }

  private queueMessage(payload: MessagePayload): void {
    this.messageQueue.push(payload);
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.messageQueue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      const success = await this.sendMessage(message);
      
      if (!success) {
        // Re-queue if still failing
        this.messageQueue.unshift(message);
        break;
      }
    }
    
    this.isProcessing = false;
    
    // Retry queue after delay
    if (this.messageQueue.length > 0) {
      setTimeout(() => this.processQueue(), 5000);
    }
  }

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('QarbonQuery', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('messages')) {
          db.createObjectStore('messages', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
        }
      };
    });
  }
}

// Export singleton instance
export const defensiveMessaging = DefensiveMessaging.getInstance();

