/**
 * QarbonQuery UI Enhancements
 * Glass-morphism, micro-interactions, skeleton loaders, and icon management
 */

// Platform icon cache for lazy loading
const iconCache = new Map<string, string>();

/**
 * Lazy-load platform icons with caching
 */
export async function loadPlatformIcon(provider: string): Promise<string> {
  const normalizedProvider = provider.toLowerCase();
  
  // Check cache first
  if (iconCache.has(normalizedProvider)) {
    return iconCache.get(normalizedProvider)!;
  }

  // Icon mapping for SVG files
  const iconMap: Record<string, string> = {
    'openai': 'openai.svg',
    'anthropic': 'anthropic.svg',
    'claude': 'anthropic.svg',
    'google': 'google.svg',
    'gemini': 'google.svg',
    'bard': 'google.svg',
    'microsoft': 'microsoft.svg',
    'copilot': 'microsoft.svg',
    'meta': 'meta.svg',
    'facebook': 'meta.svg',
    'default': 'default.svg'
  };

  // Find matching icon filename
  let iconFile = iconMap['default'];
  for (const [key, file] of Object.entries(iconMap)) {
    if (normalizedProvider.includes(key)) {
      iconFile = file;
      break;
    }
  }

  try {
    // Load SVG content
    const response = await fetch(chrome.runtime.getURL(`icons/platforms/${iconFile}`));
    if (response.ok) {
      const svgContent = await response.text();
      iconCache.set(normalizedProvider, svgContent);
      return svgContent;
    }
  } catch (error) {
    console.warn(`Failed to load icon for ${provider}:`, error);
  }

  // Fallback to emoji or default
  const fallbackEmojis: Record<string, string> = {
    'openai': '🤖',
    'anthropic': '🤖',
    'claude': '🤖',
    'google': '🔍',
    'gemini': '💎',
    'microsoft': '💫',
    'copilot': '🚁',
    'meta': '🌐',
    'default': '❓'
  };

  let fallbackIcon = fallbackEmojis['default'] || '❓';
  for (const [key, emoji] of Object.entries(fallbackEmojis)) {
    if (normalizedProvider.includes(key)) {
      fallbackIcon = emoji;
      break;
    }
  }

  iconCache.set(normalizedProvider, fallbackIcon);
  return fallbackIcon;
}

/**
 * Add ripple effect to button
 */
export function addRippleEffect(button: HTMLElement, event: MouseEvent): void {
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  const ripple = document.createElement('span');
  ripple.style.cssText = `
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: scale(0);
    animation: ripple-effect 0.6s linear;
    left: ${x}px;
    top: ${y}px;
    width: ${size}px;
    height: ${size}px;
    pointer-events: none;
  `;

  button.appendChild(ripple);

  // Add CSS for ripple animation if not already present
  if (!document.querySelector('#ripple-styles')) {
    const style = document.createElement('style');
    style.id = 'ripple-styles';
    style.textContent = `
      @keyframes ripple-effect {
        to {
          transform: scale(2);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Remove ripple after animation
  setTimeout(() => {
    if (ripple.parentNode) {
      ripple.parentNode.removeChild(ripple);
    }
  }, 600);
}

/**
 * Update tab underline position
 */
export function updateTabUnderline(activeTab: string): void {
  const tabBar = document.querySelector('.tab-bar') as HTMLElement;
  if (tabBar) {
    tabBar.setAttribute('data-active', activeTab);
  }
}

/**
 * Show skeleton loader for element
 */
export function showSkeletonLoader(element: HTMLElement, type: 'text' | 'title' | 'card' = 'text'): void {
  const skeleton = document.createElement('div');
  skeleton.className = `skeleton skeleton-${type}`;
  
  // Store original content
  const originalContent = element.innerHTML;
  element.setAttribute('data-original-content', originalContent);
  
  // Replace with skeleton
  element.innerHTML = '';
  element.appendChild(skeleton);
  element.classList.add('loading');
}

/**
 * Hide skeleton loader and restore content
 */
export function hideSkeletonLoader(element: HTMLElement): void {
  const originalContent = element.getAttribute('data-original-content');
  if (originalContent) {
    element.innerHTML = originalContent;
    element.removeAttribute('data-original-content');
  }
  element.classList.remove('loading');
}

/**
 * Add glass-morphism effect to element
 */
export function applyGlassMorphism(element: HTMLElement): void {
  element.classList.add('glass');
}

/**
 * Initialize enhanced platform breakdown with icons
 */
export async function renderEnhancedPlatformBreakdown(
  elementId: string, 
  breakdown: Record<string, { emissions: number; queries: number }>
): Promise<void> {
  const categoryBreakdown = document.getElementById(elementId);
  if (!categoryBreakdown) return;

  categoryBreakdown.innerHTML = ''; // Clear existing content

  if (Object.keys(breakdown).length === 0) {
    const noDataItem = document.createElement('div');
    noDataItem.className = 'category-item no-data glass';
    noDataItem.innerHTML = `
      <span class="category-name">No data yet</span>
      <span class="category-amount">Use AI services to see emissions</span>
    `;
    categoryBreakdown.appendChild(noDataItem);
  } else {
    // Sort by emissions descending
    const sortedEntries = Object.entries(breakdown).sort((a, b) => b[1].emissions - a[1].emissions);

    for (const [provider, data] of sortedEntries) {
      const item = document.createElement('div');
      item.className = 'category-item platform-item glass';
      
      // Load platform icon
      const iconContent = await loadPlatformIcon(provider);
      
      // Auto-format emissions
      const isKg = data.emissions >= 1000;
      const displayValue = isKg ? data.emissions / 1000 : data.emissions;
      const unit = isKg ? 'kg' : 'g';
      const formattedValue = isKg ? displayValue.toFixed(3) : displayValue.toFixed(1);
      
      // Check if icon is SVG or emoji
      const isEmoji = !iconContent.includes('<svg');
      const iconHtml = isEmoji 
        ? `<span class="platform-icon-emoji">${iconContent}</span>`
        : `<div class="platform-icon-svg">${iconContent}</div>`;
      
      item.innerHTML = `
        <div class="platform-info">
          ${iconHtml}
          <span class="platform-name">${provider}</span>
        </div>
        <div class="platform-stats">
          <span class="emission-amount">${formattedValue} ${unit}</span>
          <span class="query-badge">${data.queries}</span>
        </div>
      `;
      
      // Add animation delay for staggered appearance
      item.style.animationDelay = `${sortedEntries.indexOf([provider, data]) * 0.1}s`;
      item.style.animation = 'slideIn 0.5s ease-out forwards';
      
      categoryBreakdown.appendChild(item);
    }
  }
}

/**
 * Add CSS for platform icon styling
 */
export function addPlatformIconStyles(): void {
  if (document.querySelector('#platform-icon-styles')) return;

  const style = document.createElement('style');
  style.id = 'platform-icon-styles';
  style.textContent = `
    .platform-icon-svg {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .platform-icon-svg svg {
      width: 20px;
      height: 20px;
      color: var(--text-secondary);
      transition: color var(--animation-speed) ease;
    }
    
    .platform-item:hover .platform-icon-svg svg {
      color: var(--text-primary);
    }
    
    .platform-icon-emoji {
      font-size: 18px;
      width: 24px;
      text-align: center;
      flex-shrink: 0;
      display: block;
    }

    /* Enhanced responsiveness */
    @media (max-width: 350px) {
      .platform-info {
        gap: 8px;
      }
      
      .platform-icon-svg,
      .platform-icon-emoji {
        width: 20px;
      }
      
      .platform-icon-svg svg {
        width: 16px;
        height: 16px;
      }
      
      .platform-name {
        font-size: 13px;
      }
      
      .emission-amount {
        font-size: 13px;
        min-width: 50px;
      }
      
      .query-badge {
        font-size: 10px;
        padding: 3px 6px;
      }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Initialize all UI enhancements
 */
export function initializeUIEnhancements(): void {
  // Add platform icon styles
  addPlatformIconStyles();

  // Add ripple effect to all buttons
  document.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest('.btn');
    if (button && event instanceof MouseEvent) {
      addRippleEffect(button as HTMLElement, event);
    }
  });

  // Apply glass-morphism to existing cards
  document.querySelectorAll('.emissions-card, .chart-container, .breakdown-section').forEach(element => {
    applyGlassMorphism(element as HTMLElement);
  });

  // Enhanced responsive handling
  const handleResize = () => {
    const width = window.innerWidth;
    document.body.setAttribute('data-width', width < 350 ? 'small' : width > 380 ? 'large' : 'medium');
  };

  window.addEventListener('resize', handleResize);
  handleResize(); // Initial call
}

/**
 * Enhanced storage loading with skeleton states
 */
export async function loadDataWithSkeleton<T>(
  loadFunction: () => Promise<T>,
  elements: { [key: string]: HTMLElement }
): Promise<T> {
  // Show skeleton loaders
  Object.entries(elements).forEach(([key, element]) => {
    if (key.includes('total')) {
      showSkeletonLoader(element, 'title');
    } else if (key.includes('breakdown')) {
      showSkeletonLoader(element, 'card');
    } else {
      showSkeletonLoader(element, 'text');
    }
  });

  try {
    // Load data with minimum delay for smooth UX
    const [data] = await Promise.all([
      loadFunction(),
      new Promise(resolve => setTimeout(resolve, 800)) // Minimum skeleton time
    ]);

    return data;
  } finally {
    // Hide skeleton loaders
    Object.values(elements).forEach(element => {
      hideSkeletonLoader(element);
    });
  }
}
