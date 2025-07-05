/**
 * QarbonQuery Chrome Extension Content Script - FIXED VERSION
 * Enhanced with robust Chrome API error handling and messaging
 */

// Enhanced Chrome API availability checker
function isChromeAPIAvailable(): boolean {
  return !!(
    typeof chrome !== 'undefined' &&
    chrome.runtime &&
    chrome.runtime.sendMessage &&
    chrome.runtime.id &&
    typeof chrome.runtime.sendMessage === 'function'
  );
}

// Safe Chrome API wrapper with retry logic
class SafeChromeMessaging {
  private static MAX_RETRIES = 3;
  private static RETRY_DELAY = 1000; // 1 second

  static async sendMessage(message: any, options: { timeout?: number; retries?: number } = {}): Promise<any> {
    const { timeout = 5000, retries = this.MAX_RETRIES } = options;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Check if Chrome API is available
        if (!isChromeAPIAvailable()) {
          throw new Error('Chrome runtime API not available');
        }

        // Create promise with timeout
        const result = await Promise.race([
          new Promise((resolve, reject) => {
            try {
              chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(response);
                }
              });
            } catch (error) {
              reject(error);
            }
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Message timeout')), timeout)
          )
        ]);

        return result;

      } catch (error) {
        console.warn(`Message attempt ${attempt + 1} failed:`, error);

        if (attempt === retries) {
          console.error('All message attempts failed:', error);
          throw error;
        }

        // Wait before retry
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        }
      }
    }
  }

  static async sendMessageWithFallback(message: any, fallbackFn?: () => void): Promise<void> {
    try {
      await this.sendMessage(message);
      console.log('✅ Message sent successfully:', message.type);
    } catch (error) {
      console.error('❌ Message sending failed:', error);
      
      // Execute fallback if provided
      if (fallbackFn) {
        console.log('🔄 Executing fallback action...');
        fallbackFn();
      }
    }
  }
}

// Enhanced storage wrapper with error handling
class SafeChromeStorage {
  static async get(keys: string[]): Promise<Record<string, any>> {
    return new Promise((resolve, reject) => {
      try {
        if (!chrome.storage || !chrome.storage.local) {
          throw new Error('Chrome storage API not available');
        }

        chrome.storage.local.get(keys, (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(result);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  static async set(data: Record<string, any>): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (!chrome.storage || !chrome.storage.local) {
          throw new Error('Chrome storage API not available');
        }

        chrome.storage.local.set(data, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

console.log('🚀 QarbonQuery content script loading with enhanced error handling...');

// Check Chrome API availability on startup
if (!isChromeAPIAvailable()) {
  console.error('❌ Chrome API not available - extension may not function properly');
} else {
  console.log('✅ Chrome API available');
}

// Track page interactions and data usage (commented out for build)
let maxScrollDepthFixed = 0;
let _interactionsFixed = 0; // Placeholder for future analytics

window.addEventListener('scroll', () => {
  const scrollDepth = window.scrollY / (document.body.scrollHeight - window.innerHeight);
  maxScrollDepthFixed = Math.max(maxScrollDepthFixed, scrollDepth);
});

['click', 'keydown', 'mousemove'].forEach(eventType => {
  document.addEventListener(eventType, () => {
    _interactionsFixed++;
  }, { passive: true });
});

console.log('QarbonQuery content script loaded');

// API Response Capture for Manifest V3 compatibility
// URL patterns for different AI providers
const AI_API_PATTERNS_FIXED = [
  /api\.openai\.com\/v1\/chat\/completions/,
  /api\.anthropic\.com\/v1\/messages/,
  /generativelanguage\.googleapis\.com\/v1.*\/models\/.*:generateContent/,
  /bedrock.*\.amazonaws\.com\/model\/.*\/invoke/,
  /chat\.openai\.com\/backend-api\/conversation/,
  /claude\.ai\/api\/organizations\/.*\/chat_conversations\/.*\/completion/,
  /bard\.google\.com\/_\/BardChatUi\/data\/assistant\.lamda\.BardFrontendService/,
  /gemini\.google\.com\/_\/BardChatUi\/data\/assistant\.lamda\.BardFrontendService/
];

// Check if URL matches AI API patterns
function isAIAPIRequestFixed(url: string): boolean {
  return AI_API_PATTERNS_FIXED.some(pattern => pattern.test(url));
}

// Enhanced fetch monkey patch with proper error handling
const originalFetchFixed = window.fetch;
window.fetch = async function(...args: Parameters<typeof fetch>): Promise<Response> {
  const response = await originalFetchFixed.apply(this, args);
  
  try {
    const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
    
    if (isAIAPIRequestFixed(url)) {
      // Clone the response to read the body without consuming it
      const clonedResponse = response.clone();
      
      // Handle response processing asynchronously with error handling
      clonedResponse.text().then(async (responseBody) => {
        const message = {
          type: 'API_RESPONSE_CAPTURED',
          url: url,
          responseBody: responseBody,
          requestId: crypto.randomUUID(),
          timestamp: Date.now()
        };

        // Send with retry logic and fallback
        await SafeChromeMessaging.sendMessageWithFallback(message, () => {
          // Fallback: Store locally for later processing
          console.log('📦 Storing API response locally as fallback');
          localStorage.setItem(`qarbon_api_${Date.now()}`, JSON.stringify(message));
        });
      }).catch(error => {
        console.error('Failed to read response body:', error);
      });
    }
  } catch (error) {
    console.error('Error in fetch monkey patch:', error);
  }
  
  return response;
};

// Type declaration for monkey patched XMLHttpRequest
interface XMLHttpRequest {
  _qarbon_url?: string;
}

// Enhanced XMLHttpRequest monkey patch with proper error handling
const originalXHROpenFixed = XMLHttpRequest.prototype.open;
const originalXHRSendFixed = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
  (this as XMLHttpRequest)._qarbon_url = url.toString();
  return originalXHROpenFixed.apply(this, [method, url, ...args] as any);
};

XMLHttpRequest.prototype.send = function(body?: Document | XMLHttpRequestBodyInit | null) {
  const url = (this as any)._qarbon_url;
  
  if (url && isAIAPIRequestFixed(url)) {
    this.addEventListener('load', async function() {
      try {
        if (this.status >= 200 && this.status < 300) {
          const responseBody = this.responseText;
          
          const message = {
            type: 'API_RESPONSE_CAPTURED',
            url: url,
            responseBody: responseBody,
            requestId: crypto.randomUUID(),
            timestamp: Date.now()
          };

          // Send with retry logic and fallback
          await SafeChromeMessaging.sendMessageWithFallback(message, () => {
            // Fallback: Store locally for later processing
            console.log('📦 Storing XHR response locally as fallback');
            localStorage.setItem(`qarbon_xhr_${Date.now()}`, JSON.stringify(message));
          });
        }
      } catch (error) {
        console.error('Error in XHR response capture:', error);
      }
    });
  }
  
  return originalXHRSendFixed.apply(this, [body] as any);
};

// Platform detection based on hostname
function detectPlatformFixed(): string {
  const hostname = location.hostname;
  
  switch (true) {
    case hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com'):
      return 'chatgpt';
    case hostname.includes('claude.ai'):
      return 'claude';
    case hostname.includes('bard.google.com') || hostname.includes('gemini.google.com'):
      return 'gemini';
    case hostname.includes('bing.com') && location.pathname.includes('chat'):
      return 'bing';
    case hostname.includes('huggingface.co'):
      return 'huggingface';
    default:
      return 'unknown';
  }
}

const currentPlatformFixed = detectPlatformFixed();
console.log('Detected platform:', currentPlatformFixed);

// Platform-specific selectors for chat messages and prompts
const PLATFORM_SELECTORS_FIXED = {
  chatgpt: {
    messageContainer: '[data-message-author-role="user"]',
    promptInput: '#prompt-textarea, textarea[placeholder*="message"], [contenteditable="true"][role="textbox"]',
    sendButton: '[data-testid="send-button"], button[data-testid="send-button"]',
    modelSelector: 'button[id*="model"], .model-selector, [data-testid="model-switcher"]'
  },
  claude: {
    messageContainer: '[data-is-author="human"]',
    promptInput: 'div[contenteditable="true"][role="textbox"], textarea',
    sendButton: 'button[aria-label*="Send"], button:has(svg[data-icon="send"])',
    modelSelector: 'button[aria-label*="Claude"], button[class*="model-selector"], .model-selector'
  },
  gemini: {
    messageContainer: '.user-message, [data-role="user"]',
    promptInput: 'rich-textarea, textarea, [contenteditable="true"]',
    sendButton: 'button[aria-label*="Send"], .send-button',
    modelSelector: '.model-selector, button[aria-label*="Gemini"], button[class*="model-selector"]'
  },
  bing: {
    messageContainer: '.user-message, [data-author="user"]',
    promptInput: 'textarea[placeholder*="Ask me anything"], #searchbox',
    sendButton: 'button[aria-label*="Send"], .send-button',
    modelSelector: '.conversation-style-selector'
  },
  unknown: {
    messageContainer: '[role="user"], .user-message, [data-role="user"]',
    promptInput: 'textarea, input[type="text"], [contenteditable="true"]',
    sendButton: 'button[type="submit"], .send-button, button[aria-label*="Send"]',
    modelSelector: '.model-selector, .model-switcher'
  }
};

// Function to infer the current model from UI elements
function inferCurrentModelFixed(): string {
  if (currentPlatformFixed === 'unknown') return 'unknown';
  
  const selectors = PLATFORM_SELECTORS_FIXED[currentPlatformFixed as keyof typeof PLATFORM_SELECTORS_FIXED];
  const modelElement = document.querySelector(selectors.modelSelector);
  
  if (modelElement) {
    const modelText = modelElement.textContent?.toLowerCase() || '';
    
    // Extract model information based on common patterns
    if (modelText.includes('gpt-4')) return 'gpt-4';
    if (modelText.includes('gpt-3.5')) return 'gpt-3.5-turbo';
    if (modelText.includes('claude-3') && modelText.includes('opus')) return 'claude-3-opus';
    if (modelText.includes('claude-3') && modelText.includes('sonnet')) return 'claude-3-sonnet';
    if (modelText.includes('claude-3') && modelText.includes('haiku')) return 'claude-3-haiku';
    if (modelText.includes('gemini')) return 'gemini-pro';
    if (modelText.includes('creative')) return 'bing-creative';
    if (modelText.includes('balanced')) return 'bing-balanced';
    if (modelText.includes('precise')) return 'bing-precise';
    
    return modelText.trim() || 'unknown';
  }
  
  return 'unknown';
}

// Enhanced function to capture prompt text and metadata
async function capturePromptFixed(promptText: string): Promise<void> {
  const timestamp = new Date().toISOString();
  const inferredModel = inferCurrentModelFixed();
  
  console.log('Capturing prompt:', { promptText: promptText.substring(0, 100), timestamp, inferredModel, platform: currentPlatformFixed });
  
  const promptData = {
    platform: currentPlatformFixed,
    text: promptText,
    timestamp: timestamp,
    model: inferredModel,
    url: location.href
  };

  // Store prompt data locally first (always works)
  await storePromptDataLocalFixed(promptData);
  
  // Send message to background script with fallback
  const message = {
    type: 'PROMPT_CAPTURE',
    platform: currentPlatformFixed,
    text: promptText,
    timestamp: timestamp,
    model: inferredModel,
    url: location.href
  };

  await SafeChromeMessaging.sendMessageWithFallback(message, () => {
    console.log('📦 Prompt stored locally, background messaging failed');
  });
}

// Enhanced function to store prompt data locally with error handling
async function storePromptDataLocalFixed(promptData: any): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const storageKey = `qarbon_prompts_${today}`;
    
    const result = await SafeChromeStorage.get([storageKey]);
    const existingPrompts = result[storageKey] || [];
    
    const promptEntry = {
      id: crypto.randomUUID(),
      ...promptData,
      storedAt: Date.now()
    };
    
    existingPrompts.push(promptEntry);
    
    const updateData: Record<string, any> = {
      [storageKey]: existingPrompts,
      'qarbon_prompts_last_updated': Date.now()
    };
    
    await SafeChromeStorage.set(updateData);
    console.log('✅ Successfully stored prompt data locally:', promptEntry.id);
    
  } catch (error) {
    console.error('❌ Error storing prompt data locally:', error);
    
    // Ultimate fallback: Use localStorage
    try {
      const fallbackKey = `qarbon_prompt_fallback_${Date.now()}`;
      localStorage.setItem(fallbackKey, JSON.stringify(promptData));
      console.log('📦 Stored prompt in localStorage as ultimate fallback');
    } catch (fallbackError) {
      console.error('❌ Even localStorage fallback failed:', fallbackError);
    }
  }
}

// Set up MutationObserver to watch for new chat messages
function setupChatObserverFixed(): void {
  if (currentPlatformFixed === 'unknown') {
    console.log('Unknown platform, skipping chat observer setup');
    return;
  }

  const selectors = PLATFORM_SELECTORS_FIXED[currentPlatformFixed as keyof typeof PLATFORM_SELECTORS_FIXED];
  
  // Observer for new messages being added to the DOM
  const messageObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          
          // Check if the added node or its children contain user messages
          const userMessages = element.matches?.(selectors.messageContainer) 
            ? [element] 
            : element.querySelectorAll?.(selectors.messageContainer) || [];
          
          userMessages.forEach((messageEl) => {
            const messageText = messageEl.textContent?.trim();
            if (messageText && messageText.length > 0) {
              // Add a small delay to ensure the message is fully rendered
              setTimeout(() => {
                capturePromptFixed(messageText).catch((error: any) => {
                  console.error('Error capturing prompt from mutation observer:', error);
                });
              }, 100);
            }
          });
        }
      });
    });
  });
  
  // Start observing the document for changes
  try {
    messageObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });
    console.log('✅ Message observer started');
  } catch (error) {
    console.error('❌ Failed to start message observer:', error);
  }
  
  // Also set up listeners for form submissions and button clicks
  function setupPromptInputListener(): void {
    try {
      const promptInput = document.querySelector(selectors.promptInput);
      const sendButton = document.querySelector(selectors.sendButton);
      
      if (promptInput && sendButton) {
        let lastPromptText = '';
        
        // Store the prompt text when user types
        const handleInput = () => {
          const text = (promptInput as any).textContent?.trim() || (promptInput as HTMLInputElement).value?.trim() || '';
          lastPromptText = text;
        };
        
        promptInput.addEventListener('input', handleInput);
        promptInput.addEventListener('keydown', (e: Event) => {
          const keyEvent = e as KeyboardEvent;
          if (keyEvent.key === 'Enter' && !keyEvent.shiftKey) {
            setTimeout(() => {
              if (lastPromptText) {
                capturePromptFixed(lastPromptText).catch((error: any) => {
                  console.error('Error capturing prompt from keydown:', error);
                });
              }
            }, 50);
          }
        });
        
        // Capture on send button click
        sendButton.addEventListener('click', () => {
          setTimeout(() => {
            if (lastPromptText) {
              capturePromptFixed(lastPromptText).catch((error: any) => {
                console.error('Error capturing prompt from button click:', error);
              });
            }
          }, 50);
        });
        
        console.log('✅ Prompt input listeners attached');
      } else {
        console.log('⚠️ Prompt input or send button not found');
      }
    } catch (error) {
      console.error('❌ Error setting up prompt input listener:', error);
    }
  }
  
  // Set up input listeners immediately and re-setup if DOM changes
  setupPromptInputListener();
  
  // Re-setup listeners when new elements are added (for SPAs)
  const inputObserver = new MutationObserver(() => {
    setupPromptInputListener();
  });
  
  try {
    inputObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
    console.log('✅ Input observer started');
  } catch (error) {
    console.error('❌ Failed to start input observer:', error);
  }
}

// Initialize the chat observer if we're on a supported platform
if (currentPlatformFixed !== 'unknown') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupChatObserverFixed();
    });
  } else {
    setupChatObserverFixed();
  }
} else {
  console.log('Unknown platform, prompt capture not enabled');
}

// Cleanup function for stored fallback data
function cleanupFallbackData(): void {
  try {
    const keys = Object.keys(localStorage);
    const qarbonKeys = keys.filter(key => key.startsWith('qarbon_'));
    
    if (qarbonKeys.length > 0) {
      console.log(`🧹 Found ${qarbonKeys.length} QarbonQuery fallback entries in localStorage`);
      // Could implement cleanup logic here if needed
    }
  } catch (error) {
    console.error('Error during fallback data cleanup:', error);
  }
}

// Run cleanup on page load
setTimeout(cleanupFallbackData, 5000);

console.log('✅ QarbonQuery content script fully loaded with enhanced error handling');
