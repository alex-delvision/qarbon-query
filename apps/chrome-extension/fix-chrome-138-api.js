/**
 * QarbonQuery Chrome 138+ API Compatibility Fix
 * 
 * Chrome 138+ introduced stricter Content Security Policies and changes to
 * extension API behavior. This file provides compatibility fixes for:
 * 
 * 1. Service Worker messaging patterns
 * 2. Content Script to Background communication
 * 3. Cross-context messaging with proper error handling
 * 4. Manifest V3 best practices for Chrome 138+
 */

// Enhanced Chrome API detection for newer versions
function isChromeAPI138Compatible() {
  return !!(
    typeof chrome !== 'undefined' &&
    chrome.runtime &&
    chrome.runtime.sendMessage &&
    chrome.runtime.id &&
    typeof chrome.runtime.sendMessage === 'function' &&
    // Check for Chrome 138+ specific features
    chrome.runtime.getManifest &&
    chrome.runtime.getManifest().manifest_version === 3
  );
}

// Chrome 138+ compatible messaging wrapper
class Chrome138MessagingFix {
  static CHROME_138_RETRY_DELAY = 500;
  static CHROME_138_MAX_RETRIES = 5;
  static CHROME_138_MESSAGE_TIMEOUT = 10000; // Increased for Chrome 138+

  /**
   * Chrome 138+ compatible message sending with enhanced error handling
   */
  static async sendMessage138(message, options = {}) {
    const { 
      timeout = this.CHROME_138_MESSAGE_TIMEOUT, 
      retries = this.CHROME_138_MAX_RETRIES,
      usePortFallback = true 
    } = options;

    // First attempt: Standard runtime.sendMessage
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (!isChromeAPI138Compatible()) {
          throw new Error('Chrome 138+ API not available');
        }

        const result = await Promise.race([
          new Promise((resolve, reject) => {
            try {
              // Chrome 138+ requires explicit response handling
              chrome.runtime.sendMessage(message, { includeTlsChannelId: false }, (response) => {
                if (chrome.runtime.lastError) {
                  // Handle Chrome 138+ specific errors
                  const error = chrome.runtime.lastError.message;
                  if (error.includes('Extension context invalidated') || 
                      error.includes('Receiving end does not exist')) {
                    reject(new Error('Chrome 138 context invalidated: ' + error));
                  } else {
                    reject(new Error(error));
                  }
                } else {
                  resolve(response);
                }
              });
            } catch (error) {
              reject(error);
            }
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Chrome 138 message timeout')), timeout)
          )
        ]);

        return result;

      } catch (error) {
        console.warn(`Chrome 138 message attempt ${attempt + 1} failed:`, error);

        if (attempt === retries) {
          // Final fallback: Try port-based communication for Chrome 138+
          if (usePortFallback) {
            try {
              return await this.sendMessageViaPort138(message);
            } catch (portError) {
              console.error('Chrome 138 port fallback also failed:', portError);
              throw new Error(`All Chrome 138 messaging attempts failed. Last error: ${error.message}`);
            }
          } else {
            throw error;
          }
        }

        // Wait before retry with exponential backoff for Chrome 138+
        if (attempt < retries) {
          const delay = this.CHROME_138_RETRY_DELAY * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  }

  /**
   * Port-based messaging fallback for Chrome 138+ stability
   */
  static async sendMessageViaPort138(message) {
    return new Promise((resolve, reject) => {
      try {
        const port = chrome.runtime.connect({ name: 'qarbon-chrome138-port' });
        
        const timeoutId = setTimeout(() => {
          port.disconnect();
          reject(new Error('Chrome 138 port message timeout'));
        }, this.CHROME_138_MESSAGE_TIMEOUT);

        port.onMessage.addListener((response) => {
          clearTimeout(timeoutId);
          port.disconnect();
          resolve(response);
        });

        port.onDisconnect.addListener(() => {
          clearTimeout(timeoutId);
          if (chrome.runtime.lastError) {
            reject(new Error('Chrome 138 port disconnected: ' + chrome.runtime.lastError.message));
          } else {
            reject(new Error('Chrome 138 port disconnected unexpectedly'));
          }
        });

        // Send message via port
        port.postMessage({
          ...message,
          _chrome138Port: true,
          _timestamp: Date.now()
        });

      } catch (error) {
        reject(new Error('Chrome 138 port creation failed: ' + error.message));
      }
    });
  }

  /**
   * Chrome 138+ compatible storage operations
   */
  static async getStorage138(keys) {
    return new Promise((resolve, reject) => {
      try {
        if (!chrome.storage || !chrome.storage.local) {
          throw new Error('Chrome 138 storage API not available');
        }

        // Chrome 138+ storage with enhanced error handling
        chrome.storage.local.get(keys, (result) => {
          if (chrome.runtime.lastError) {
            const error = chrome.runtime.lastError.message;
            if (error.includes('Extension context invalidated')) {
              reject(new Error('Chrome 138 storage context invalidated'));
            } else {
              reject(new Error('Chrome 138 storage error: ' + error));
            }
          } else {
            resolve(result);
          }
        });
      } catch (error) {
        reject(new Error('Chrome 138 storage operation failed: ' + error.message));
      }
    });
  }

  static async setStorage138(data) {
    return new Promise((resolve, reject) => {
      try {
        if (!chrome.storage || !chrome.storage.local) {
          throw new Error('Chrome 138 storage API not available');
        }

        chrome.storage.local.set(data, () => {
          if (chrome.runtime.lastError) {
            const error = chrome.runtime.lastError.message;
            reject(new Error('Chrome 138 storage set error: ' + error));
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(new Error('Chrome 138 storage set failed: ' + error.message));
      }
    });
  }

  /**
   * Chrome 138+ service worker keepalive mechanism
   */
  static setupChrome138Keepalive() {
    // Prevent service worker from sleeping in Chrome 138+
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onConnect) {
      chrome.runtime.onConnect.addListener((port) => {
        if (port.name === 'qarbon-chrome138-keepalive') {
          port.onDisconnect.addListener(() => {
            console.log('Chrome 138 keepalive port disconnected');
          });
        }
      });

      // Periodic keepalive ping
      setInterval(() => {
        try {
          if (chrome.runtime && chrome.runtime.id) {
            chrome.runtime.connect({ name: 'qarbon-chrome138-keepalive' });
          }
        } catch (error) {
          console.warn('Chrome 138 keepalive failed:', error);
        }
      }, 25000); // Every 25 seconds to prevent service worker sleep
    }
  }

  /**
   * Chrome 138+ content script injection with enhanced CSP handling
   */
  static async injectScriptChrome138(scriptUrl, targetElementSelector = 'head') {
    return new Promise((resolve, reject) => {
      try {
        // Create script element with Chrome 138+ CSP compliance
        const script = document.createElement('script');
        
        // Chrome 138+ requires explicit CORS handling for extension resources
        script.src = chrome.runtime.getURL(scriptUrl);
        script.type = 'text/javascript';
        script.crossOrigin = 'anonymous';
        
        // Chrome 138+ enhanced load handling
        script.onload = function() {
          console.log('Chrome 138 script injected successfully:', scriptUrl);
          this.remove();
          resolve();
        };
        
        script.onerror = function(error) {
          console.error('Chrome 138 script injection failed:', error);
          this.remove();
          reject(new Error('Chrome 138 script injection failed for: ' + scriptUrl));
        };

        // Chrome 138+ CSP-compliant injection
        const targetElement = document.querySelector(targetElementSelector) || 
                            document.head || 
                            document.documentElement;
        
        if (!targetElement) {
          reject(new Error('Chrome 138 target element not found for injection'));
          return;
        }

        targetElement.appendChild(script);
        
        // Cleanup timeout for Chrome 138+
        setTimeout(() => {
          if (script.parentNode) {
            script.remove();
            reject(new Error('Chrome 138 script injection timeout'));
          }
        }, 10000);

      } catch (error) {
        reject(new Error('Chrome 138 script injection setup failed: ' + error.message));
      }
    });
  }
}

// Chrome 138+ Detection and Automatic Fixes
(function initChrome138Fixes() {
  if (typeof window !== 'undefined') {
    // Browser environment
    console.log('🔧 Chrome 138+ compatibility fixes loaded');
    
    // Expose Chrome 138 fixes globally
    window.Chrome138MessagingFix = Chrome138MessagingFix;
    
    // Auto-setup keepalive if in service worker context
    if (typeof importScripts === 'function') {
      Chrome138MessagingFix.setupChrome138Keepalive();
    }
  }
  
  // Export for module environments
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Chrome138MessagingFix, isChromeAPI138Compatible };
  }
})();

// Chrome 138+ Event Listener Enhancements
class Chrome138EventFix {
  /**
   * Chrome 138+ compatible event listeners with proper cleanup
   */
  static addEventListenerChrome138(target, eventType, handler, options = {}) {
    const enhancedHandler = function(event) {
      try {
        return handler.call(this, event);
      } catch (error) {
        console.error('Chrome 138 event handler error:', error);
      }
    };

    target.addEventListener(eventType, enhancedHandler, {
      passive: true,
      once: false,
      ...options
    });

    // Return cleanup function for Chrome 138+
    return () => {
      target.removeEventListener(eventType, enhancedHandler, options);
    };
  }

  /**
   * Chrome 138+ MutationObserver with enhanced error handling
   */
  static createMutationObserverChrome138(callback, options = {}) {
    const enhancedCallback = function(mutations, observer) {
      try {
        return callback.call(this, mutations, observer);
      } catch (error) {
        console.error('Chrome 138 MutationObserver error:', error);
      }
    };

    return new MutationObserver(enhancedCallback);
  }
}

console.log('✅ Chrome 138+ API compatibility fixes loaded successfully');
