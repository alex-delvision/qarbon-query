/**
 * QarbonQuery Chrome Extension Popup Script
 */

// Storage utilities for QarbonQuery data
class QarbonStorageManager {
  static async getEmissionsData(): Promise<{ total: number; breakdown: Record<string, number>; queries: number }> {
    return new Promise((resolve, reject) => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const storageKey = `qarbon_emissions_${today}`;
        
        chrome.storage.local.get([storageKey, 'qarbon_queries', 'qarbon_settings'], (result) => {
          if (chrome.runtime.lastError) {
            console.error('Storage get error:', chrome.runtime.lastError.message);
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          
          const todayEmissions = result[storageKey] || [];
          const queriesData = result['qarbon_queries'] || { total: 0, daily: {} };
          
          // Calculate total emissions and breakdown by provider
          let totalEmissions = 0;
          const breakdown: Record<string, number> = {};
          
          todayEmissions.forEach((entry: any) => {
            const emissions = entry.emissions || 0;
            totalEmissions += emissions;
            
            const provider = entry.provider || 'unknown';
            breakdown[provider] = (breakdown[provider] || 0) + emissions;
          });
          
          resolve({
            total: totalEmissions,
            breakdown,
            queries: queriesData.total || 0
          });
        });
      } catch (error) {
        console.error('Error in getEmissionsData:', error);
        reject(error);
      }
    });
  }
  
  static async getAllStorageData(): Promise<Record<string, any>> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(null, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
    });
  }
}

// Real-time emission display state
let realTimeEmissions = { current: 0, confidence: { low: 0, high: 0 } };
let isRealTimeActive = false;

// Color coding thresholds (in grams CO₂e)
const EMISSION_THRESHOLDS = {
  LOW: 5,     // < 5g - green
  MEDIUM: 25, // 5-25g - yellow
  HIGH: 50    // 25-50g - orange, >50g - red
};

// Main popup initialization
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize popup UI
  const emissionsDisplay = document.getElementById('emissions-total');
  const categoryBreakdown = document.getElementById('category-breakdown');
  const loadingIndicator = document.getElementById('loading') || createLoadingIndicator();
  
  // Setup real-time emission message listener
  setupRealTimeListener(emissionsDisplay);
  
  try {
    // Show loading state
    if (loadingIndicator) {
      loadingIndicator.style.display = 'block';
    }
    
    // Load real data from chrome.storage.local
    const emissionsData = await QarbonStorageManager.getEmissionsData();
    
    // Update emissions display
    if (emissionsDisplay) {
      const totalKg = emissionsData.total / 1000; // Convert grams to kg
      emissionsDisplay.textContent = `${totalKg.toFixed(3)} kg CO₂e`;
    }
    
    // Update category breakdown
    if (categoryBreakdown) {
      categoryBreakdown.innerHTML = ''; // Clear existing content
      
      if (Object.keys(emissionsData.breakdown).length === 0) {
        const noDataItem = document.createElement('div');
        noDataItem.className = 'category-item no-data';
        noDataItem.innerHTML = `
          <span class="category-name">No data yet</span>
          <span class="category-amount">Use AI services to see emissions</span>
        `;
        categoryBreakdown.appendChild(noDataItem);
      } else {
        Object.entries(emissionsData.breakdown).forEach(([provider, emissions]) => {
          const item = document.createElement('div');
          item.className = 'category-item';
          const emissionsKg = (emissions as number) / 1000; // Convert grams to kg
          item.innerHTML = `
            <span class="category-name">${provider}</span>
            <span class="category-amount">${emissionsKg.toFixed(3)} kg</span>
          `;
          categoryBreakdown.appendChild(item);
        });
      }
    }
    
    // Update queries count if element exists
    const queriesDisplay = document.getElementById('queries-count');
    if (queriesDisplay) {
      queriesDisplay.textContent = `${emissionsData.queries} queries today`;
    }
    
    console.log('QarbonQuery popup loaded with data:', emissionsData);
    
  } catch (error) {
    console.error('Error loading emissions data:', error);
    
    // Show error state
    if (emissionsDisplay) {
      emissionsDisplay.textContent = 'Error loading data';
    }
    
    if (categoryBreakdown) {
      categoryBreakdown.innerHTML = `
        <div class="category-item error">
          <span class="category-name">Error</span>
          <span class="category-amount">Failed to load data</span>
        </div>
      `;
    }
  } finally {
    // Hide loading state
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
  }
  
  // Debug: Log all storage data to console
  try {
    const allData = await QarbonStorageManager.getAllStorageData();
    console.log('All QarbonQuery storage data:', allData);
  } catch (error) {
    console.error('Error getting all storage data:', error);
  }
  
  function createLoadingIndicator(): HTMLElement {
    const loading = document.createElement('div');
    loading.id = 'loading';
    loading.textContent = 'Loading...';
    loading.style.display = 'none';
    document.body.appendChild(loading);
    return loading;
  }

  // Add click handlers
  const refreshButton = document.getElementById('refresh-btn');
  if (refreshButton) {
    refreshButton.addEventListener('click', () => {
      // Refresh emissions data
      window.location.reload();
    });
  }

  const settingsButton = document.getElementById('settings-btn');
  if (settingsButton) {
    settingsButton.addEventListener('click', () => {
      // Open settings page
      (window as any).chrome?.tabs.create({
        url: 'chrome://extensions/?id=' + (window as any).chrome?.runtime?.id,
      });
    });
  }
  
  // Debug storage button handlers
  const debugStorageButton = document.getElementById('debug-storage-btn');
  const clearStorageButton = document.getElementById('clear-storage-btn');
  const storageDebugDiv = document.getElementById('storage-debug');
  
  if (debugStorageButton && storageDebugDiv) {
    debugStorageButton.addEventListener('click', async () => {
      try {
        const allData = await QarbonStorageManager.getAllStorageData();
        
        // Format storage data for display
        const formatData = (data: Record<string, any>) => {
          const entries = Object.entries(data);
          if (entries.length === 0) {
            return 'No QarbonQuery data found';
          }
          
          return entries.map(([key, value]) => {
            const valueStr = typeof value === 'object' 
              ? JSON.stringify(value).substring(0, 100) + (JSON.stringify(value).length > 100 ? '...' : '')
              : String(value);
            return `${key}: ${valueStr}`;
          }).join('\n');
        };
        
        storageDebugDiv.textContent = formatData(allData);
        storageDebugDiv.style.display = storageDebugDiv.style.display === 'none' ? 'block' : 'none';
        
      } catch (error) {
        console.error('Error fetching storage data:', error);
        storageDebugDiv.textContent = 'Error loading storage data';
        storageDebugDiv.style.display = 'block';
      }
    });
  }
  
  if (clearStorageButton) {
    clearStorageButton.addEventListener('click', async () => {
      if (confirm('Clear all QarbonQuery data? This cannot be undone.')) {
        try {
          const response = await new Promise<{success?: boolean; error?: string; removedCount?: number}>((resolve) => {
            chrome.runtime.sendMessage({ type: 'CLEAR_STORAGE_DATA' }, resolve);
          });
          
          if (response.error) {
            alert('Error clearing data: ' + response.error);
          } else {
            alert(`Successfully cleared ${response.removedCount || 0} data entries`);
            window.location.reload();
          }
        } catch (error) {
          console.error('Error clearing storage:', error);
          alert('Error clearing data');
        }
      }
    });
  }
  
  // Initialize real-time display
  updateRealTimeDisplay(emissionsDisplay);
});

/**
 * Setup listener for real-time AI_TOKENS messages
 */
function setupRealTimeListener(emissionsDisplay: HTMLElement | null): void {
  if (!chrome.runtime?.onMessage) {
    console.warn('Chrome runtime messaging not available');
    return;
  }
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'AI_TOKENS' && message.data) {
      const { emissions, confidence } = message.data;
      
      if (typeof emissions === 'number' && confidence) {
        // Update real-time emissions data
        realTimeEmissions = {
          current: emissions,
          confidence: {
            low: confidence.low || 0,
            high: confidence.high || 0
          }
        };
        
        isRealTimeActive = true;
        
        // Update display immediately
        updateRealTimeDisplay(emissionsDisplay);
        updateFooterStatus(true);
        
        console.log('Real-time emission update:', realTimeEmissions);
        
        // Auto-hide real-time display after 5 seconds
        setTimeout(() => {
          isRealTimeActive = false;
          updateRealTimeDisplay(emissionsDisplay);
          updateFooterStatus(false);
        }, 5000);
      }
    }
    
    return false; // Don't send response
  });
}

/**
 * Update real-time emission display with color coding
 */
function updateRealTimeDisplay(emissionsDisplay: HTMLElement | null): void {
  if (!emissionsDisplay) return;
  
  if (isRealTimeActive && realTimeEmissions.current > 0) {
    // Display real-time emissions with confidence interval
    const current = realTimeEmissions.current;
    const confidenceLow = realTimeEmissions.confidence.low;
    const confidenceHigh = realTimeEmissions.confidence.high;
    
    // Calculate confidence range
    const confidenceRange = Math.abs(confidenceHigh - confidenceLow) / 2;
    
    // Format display text
    const displayText = `${current.toFixed(1)} g CO₂e ± ${confidenceRange.toFixed(1)} g`;
    
    // Apply color coding based on emission magnitude
    const colorClass = getEmissionColorClass(current);
    
    // Update display
    emissionsDisplay.textContent = displayText;
    emissionsDisplay.className = `emissions-total real-time ${colorClass}`;
    
    // Add pulsing animation for real-time updates
    emissionsDisplay.style.animation = 'pulse 2s ease-in-out infinite';
    
    // Update parent card background based on emission level
    const emissionsCard = emissionsDisplay.closest('.emissions-card');
    if (emissionsCard) {
      emissionsCard.className = `emissions-card real-time ${colorClass}`;
    }
    
  } else {
    // Reset to default stored emissions display
    emissionsDisplay.className = 'emissions-total';
    emissionsDisplay.style.animation = '';
    
    const emissionsCard = emissionsDisplay.closest('.emissions-card');
    if (emissionsCard) {
      emissionsCard.className = 'emissions-card';
    }
  }
}

/**
 * Get color class based on emission magnitude
 */
function getEmissionColorClass(emissions: number): string {
  if (emissions < EMISSION_THRESHOLDS.LOW) {
    return 'low-emission';
  } else if (emissions < EMISSION_THRESHOLDS.MEDIUM) {
    return 'medium-emission';
  } else if (emissions < EMISSION_THRESHOLDS.HIGH) {
    return 'high-emission';
  } else {
    return 'very-high-emission';
  }
}

/**
 * Update footer status to show real-time activity
 */
function updateFooterStatus(isActive: boolean): void {
  const footerStatus = document.getElementById('footer-status');
  if (footerStatus) {
    if (isActive) {
      footerStatus.textContent = 'Live emission detected';
      footerStatus.className = 'footer real-time-active';
    } else {
      footerStatus.textContent = 'Real-time tracking active';
      footerStatus.className = 'footer';
    }
  }
}
