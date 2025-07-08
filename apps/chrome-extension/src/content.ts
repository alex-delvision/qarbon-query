/**
 * QarbonQuery Chrome Extension Content Script
 */

// Track page interactions and data usage (commented out for build)
// let pageLoadTime = Date.now();
// let dataTransferred = 0;

// Monitor network requests to estimate data transfer (commented out for build)
// const observer = new PerformanceObserver((list) => {
//   for (const entry of list.getEntries()) {
//     if (entry.name.includes('http')) {
//       // Estimate data transfer size
//       dataTransferred += Math.max((entry as any).transferSize || 1024, 1024);
//     }
//   }
// });

// observer.observe({ entryTypes: ['resource'] });

// Track time spent on page (commented out for build)
// window.addEventListener('beforeunload', () => {
//   const timeSpent = (Date.now() - pageLoadTime) / 1000 / 60; // Convert to minutes
//
//   // Send tracking data to background script
//   (window as any).chrome?.runtime?.sendMessage({
//     type: 'TRACK_EMISSION',
//     data: {
//       dataTransfer: dataTransferred / (1024 * 1024), // Convert to MB
//       timeSpent: timeSpent,
//       deviceType: 'desktop'
//     }
//   });
// });

// Track scroll depth and interactions for engagement metrics
let maxScrollDepth = 0;
let _interactions = 0; // Placeholder for future analytics

window.addEventListener('scroll', () => {
  const scrollDepth =
    window.scrollY / (document.body.scrollHeight - window.innerHeight);
  maxScrollDepth = Math.max(maxScrollDepth, scrollDepth);
});

['click', 'keydown', 'mousemove'].forEach(eventType => {
  document.addEventListener(
    eventType,
    () => {
      _interactions++;
    },
    { passive: true }
  );
});

console.log('QarbonQuery content script loaded');

// API Response Capture for Manifest V3 compatibility
// URL patterns for different AI providers
const AI_API_PATTERNS = [
  /api\.openai\.com\/v1\/chat\/completions/,
  /api\.anthropic\.com\/v1\/messages/,
  /generativelanguage\.googleapis\.com\/v1.*\/models\/.*:generateContent/,
  /bedrock.*\.amazonaws\.com\/model\/.*\/invoke/,
  /chat\.openai\.com\/backend-api\/conversation/,
  /claude\.ai\/api\/organizations\/.*\/chat_conversations\/.*\/completion/,
  /bard\.google\.com\/_\/BardChatUi\/data\/assistant\.lamda\.BardFrontendService/,
  /gemini\.google\.com\/_\/BardChatUi\/data\/assistant\.lamda\.BardFrontendService/,
];

// Check if URL matches AI API patterns
function isAIAPIRequest(url: string): boolean {
  return AI_API_PATTERNS.some(pattern => pattern.test(url));
}

// Monkey patch fetch to capture API responses
const originalFetch = window.fetch;
window.fetch = async function (
  ...args: Parameters<typeof fetch>
): Promise<Response> {
  const response = await originalFetch.apply(this, args);

  try {
    const url =
      typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;

    if (isAIAPIRequest(url)) {
      // Clone the response to read the body without consuming it
      const clonedResponse = response.clone();

      clonedResponse
        .text()
        .then(responseBody => {
          // Send captured response to background script
          chrome.runtime
            .sendMessage({
              type: 'API_RESPONSE_CAPTURED',
              url: url,
              responseBody: responseBody,
              requestId: crypto.randomUUID(),
              timestamp: Date.now(),
            })
            .catch(error => {
              console.error(
                'Failed to send API response to background:',
                error
              );
            });
        })
        .catch(error => {
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

// Monkey patch XMLHttpRequest to capture API responses
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function (
  method: string,
  url: string | URL,
  ...args: any[]
) {
  (this as XMLHttpRequest)._qarbon_url = url.toString();
  return originalXHROpen.apply(this, [method, url, ...args] as any);
};

XMLHttpRequest.prototype.send = function (
  body?: Document | XMLHttpRequestBodyInit | null
) {
  const url = (this as any)._qarbon_url;

  if (url && isAIAPIRequest(url)) {
    this.addEventListener('load', function () {
      try {
        if (this.status >= 200 && this.status < 300) {
          const responseBody = this.responseText;

          // Send captured response to background script
          chrome.runtime
            .sendMessage({
              type: 'API_RESPONSE_CAPTURED',
              url: url,
              responseBody: responseBody,
              requestId: crypto.randomUUID(),
              timestamp: Date.now(),
            })
            .catch(error => {
              console.error(
                'Failed to send XHR API response to background:',
                error
              );
            });
        }
      } catch (error) {
        console.error('Error in XHR response capture:', error);
      }
    });
  }

  return originalXHRSend.apply(this, [body] as any);
};

// Platform detection based on hostname
function detectPlatform(): string {
  const hostname = location.hostname;

  switch (true) {
    case hostname.includes('chatgpt.com') ||
      hostname.includes('chat.openai.com'):
      return 'chatgpt';
    case hostname.includes('claude.ai'):
      return 'claude';
    case hostname.includes('bard.google.com') ||
      hostname.includes('gemini.google.com'):
      return 'gemini';
    case hostname.includes('bing.com') && location.pathname.includes('chat'):
      return 'bing';
    case hostname.includes('huggingface.co'):
      return 'huggingface';
    default:
      return 'unknown';
  }
}

const currentPlatform = detectPlatform();
console.log('Detected platform:', currentPlatform);

// Platform-specific selectors for chat messages and prompts
const PLATFORM_SELECTORS = {
  chatgpt: {
    messageContainer: '[data-message-author-role="user"]',
    promptInput:
      '#prompt-textarea, textarea[placeholder*="message"], [contenteditable="true"][role="textbox"]',
    sendButton:
      '[data-testid="send-button"], button[data-testid="send-button"]',
    modelSelector:
      'button[id*="model"], .model-selector, [data-testid="model-switcher"]',
  },
  claude: {
    messageContainer: '[data-is-author="human"]',
    promptInput: 'div[contenteditable="true"][role="textbox"], textarea',
    sendButton: 'button[aria-label*="Send"], button:has(svg[data-icon="send"])',
    modelSelector:
      'button[aria-label*="Claude"], button[class*="model-selector"], .model-selector',
  },
  gemini: {
    messageContainer: '.user-message, [data-role="user"]',
    promptInput: 'rich-textarea, textarea, [contenteditable="true"]',
    sendButton: 'button[aria-label*="Send"], .send-button',
    modelSelector:
      '.model-selector, button[aria-label*="Gemini"], button[class*="model-selector"]',
  },
  bing: {
    messageContainer: '.user-message, [data-author="user"]',
    promptInput: 'textarea[placeholder*="Ask me anything"], #searchbox',
    sendButton: 'button[aria-label*="Send"], .send-button',
    modelSelector: '.conversation-style-selector',
  },
  unknown: {
    messageContainer: '[role="user"], .user-message, [data-role="user"]',
    promptInput: 'textarea, input[type="text"], [contenteditable="true"]',
    sendButton:
      'button[type="submit"], .send-button, button[aria-label*="Send"]',
    modelSelector: '.model-selector, .model-switcher',
  },
};

// Function to infer the current model from UI elements
function inferCurrentModel(): string {
  if (currentPlatform === 'unknown') return 'unknown';

  const selectors =
    PLATFORM_SELECTORS[currentPlatform as keyof typeof PLATFORM_SELECTORS];
  const modelElement = document.querySelector(selectors.modelSelector);

  if (modelElement) {
    const modelText = modelElement.textContent?.toLowerCase() || '';

    // Extract model information based on common patterns
    if (modelText.includes('gpt-4')) return 'gpt-4';
    if (modelText.includes('gpt-3.5')) return 'gpt-3.5-turbo';
    if (modelText.includes('claude-3') && modelText.includes('opus'))
      return 'claude-3-opus';
    if (modelText.includes('claude-3') && modelText.includes('sonnet'))
      return 'claude-3-sonnet';
    if (modelText.includes('claude-3') && modelText.includes('haiku'))
      return 'claude-3-haiku';
    if (modelText.includes('gemini')) return 'gemini-pro';
    if (modelText.includes('creative')) return 'bing-creative';
    if (modelText.includes('balanced')) return 'bing-balanced';
    if (modelText.includes('precise')) return 'bing-precise';

    return modelText.trim() || 'unknown';
  }

  return 'unknown';
}

// Function to capture prompt text and metadata
function capturePrompt(promptText: string) {
  const timestamp = new Date().toISOString();
  const inferredModel = inferCurrentModel();

  console.log('Capturing prompt:', {
    promptText,
    timestamp,
    inferredModel,
    platform: currentPlatform,
  });

  // Store prompt data in chrome.storage.local for persistence
  storePromptData({
    platform: currentPlatform,
    text: promptText,
    timestamp: timestamp,
    model: inferredModel,
    url: location.href,
  });

  // Send message to background script
  chrome.runtime
    .sendMessage({
      type: 'PROMPT_CAPTURE',
      platform: currentPlatform,
      text: promptText,
      timestamp: timestamp,
      model: inferredModel,
      url: location.href,
    })
    .catch(error => {
      console.error('Failed to send prompt capture message:', error);
    });
}

// Function to store prompt data in chrome.storage.local
function storePromptData(promptData: any) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const storageKey = `qarbon_prompts_${today}`;

    chrome.storage.local.get([storageKey], result => {
      if (chrome.runtime.lastError) {
        console.error(
          'Storage get error for prompts:',
          chrome.runtime.lastError.message
        );
        return;
      }

      const existingPrompts = result[storageKey] || [];
      const promptEntry = {
        id: crypto.randomUUID(),
        ...promptData,
        storedAt: Date.now(),
      };

      existingPrompts.push(promptEntry);

      const updateData: Record<string, any> = {
        [storageKey]: existingPrompts,
        qarbon_prompts_last_updated: Date.now(),
      };

      chrome.storage.local.set(updateData, () => {
        if (chrome.runtime.lastError) {
          console.error(
            'Storage set error for prompts:',
            chrome.runtime.lastError.message
          );
        } else {
          console.log('Successfully stored prompt data:', promptEntry);
        }
      });
    });
  } catch (error) {
    console.error('Error storing prompt data:', error);
  }
}

// Set up MutationObserver to watch for new chat messages
function setupChatObserver() {
  const selectors =
    PLATFORM_SELECTORS[currentPlatform as keyof typeof PLATFORM_SELECTORS];

  // Observer for new messages being added to the DOM
  const messageObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;

          // Check if the added node or its children contain user messages
          const userMessages = element.matches?.(selectors.messageContainer)
            ? [element]
            : element.querySelectorAll?.(selectors.messageContainer) || [];

          userMessages.forEach(messageEl => {
            const messageText = messageEl.textContent?.trim();
            if (messageText && messageText.length > 0) {
              // Add a small delay to ensure the message is fully rendered
              setTimeout(() => {
                capturePrompt(messageText);
              }, 100);
            }
          });
        }
      });
    });
  });

  // Start observing the document for changes
  messageObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
  });

  // Also set up listeners for form submissions and button clicks
  function setupPromptInputListener() {
    const promptInput = document.querySelector(selectors.promptInput);
    const sendButton = document.querySelector(selectors.sendButton);

    if (promptInput && sendButton) {
      let lastPromptText = '';

      // Store the prompt text when user types
      const handleInput = () => {
        const text =
          promptInput.textContent?.trim() ||
          (promptInput as HTMLInputElement).value?.trim() ||
          '';
        lastPromptText = text;
      };

      promptInput.addEventListener('input', handleInput);
      promptInput.addEventListener('keydown', (e: Event) => {
        const keyEvent = e as KeyboardEvent;
        if (keyEvent.key === 'Enter' && !keyEvent.shiftKey) {
          setTimeout(() => {
            if (lastPromptText) {
              capturePrompt(lastPromptText);
            }
          }, 50);
        }
      });

      // Capture on send button click
      sendButton.addEventListener('click', () => {
        setTimeout(() => {
          if (lastPromptText) {
            capturePrompt(lastPromptText);
          }
        }, 50);
      });
    }
  }

  // Set up input listeners immediately and re-setup if DOM changes
  setupPromptInputListener();

  // Re-setup listeners when new elements are added (for SPAs)
  const inputObserver = new MutationObserver(() => {
    setupPromptInputListener();
  });

  inputObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Initialize the chat observer if we're on a supported platform
if (currentPlatform !== 'unknown') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupChatObserver);
  } else {
    setupChatObserver();
  }
} else {
  console.log('Unknown platform, prompt capture not enabled');
}
