(function() {
  'use strict';
  
  let currentView = 'today';
  
  // Initialize popup
  async function initializePopup() {
    setupTabSwitching();
    await updateData();
    
    // Auto-refresh every 2 seconds
    setInterval(updateData, 2000);
  }
  
  // Setup tab switching functionality
  function setupTabSwitching() {
    const tabs = document.querySelectorAll('.tab');
    const views = document.querySelectorAll('.view');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active class from all tabs and views
        tabs.forEach(t => t.classList.remove('active'));
        views.forEach(v => v.classList.remove('active'));
        
        // Add active class to clicked tab
        tab.classList.add('active');
        currentView = tab.dataset.view;
        
        // Show corresponding view
        const targetView = document.getElementById(`${currentView}-view`);
        if (targetView) {
          targetView.classList.add('active');
        }
        
        // Update data for new view
        updateData();
      });
    });
  }
  
  // Get stats from active tab content script
  async function getStatsFromTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) return null;
      
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          if (typeof window.__qarbonGetStats === 'function') {
            return window.__qarbonGetStats();
          }
          
          // Fallback: read directly from localStorage
          const captures = JSON.parse(localStorage.getItem('qarbon_sse_captures') || '[]');
          const today = new Date().toDateString();
          const todayCaptures = captures.filter(c => new Date(c.timestamp).toDateString() === today);
          
          return {
            today: {
              captures: todayCaptures.length,
              emissions: todayCaptures.reduce((sum, c) => sum + (c.emissions || 0), 0),
              tokens: todayCaptures.reduce((sum, c) => sum + (c.tokens || 0), 0)
            },
            allTime: {
              captures: captures.length,
              emissions: captures.reduce((sum, c) => sum + (c.emissions || 0), 0)
            }
          };
        }
      });
      
      return results?.[0]?.result || null;
    } catch (error) {
      console.log('Failed to get stats from tab:', error);
      return null;
    }
  }
  
  // Calculate weekly and monthly stats
  function calculatePeriodStats(captures, days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    const periodCaptures = captures.filter(c => new Date(c.timestamp) >= cutoff);
    
    return {
      captures: periodCaptures.length,
      emissions: periodCaptures.reduce((sum, c) => sum + (c.emissions || 0), 0),
      tokens: periodCaptures.reduce((sum, c) => sum + (c.tokens || 0), 0)
    };
  }
  
  // Update data display
  async function updateData() {
    const stats = await getStatsFromTab();
    
    if (!stats) {
      // Show placeholder data
      updateEmissionsDisplay('today', { emissions: 0, captures: 0, tokens: 0 });
      updateEmissionsDisplay('week', { emissions: 0, captures: 0, tokens: 0 });
      updateEmissionsDisplay('month', { emissions: 0, captures: 0, tokens: 0 });
      return;
    }
    
    // Get captures for period calculations
    let allCaptures = [];
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.id) {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => JSON.parse(localStorage.getItem('qarbon_sse_captures') || '[]')
        });
        allCaptures = results?.[0]?.result || [];
      }
    } catch (error) {
      console.log('Failed to get captures:', error);
    }
    
    // Calculate stats for each period
    const todayStats = stats.today;
    const weekStats = calculatePeriodStats(allCaptures, 7);
    const monthStats = calculatePeriodStats(allCaptures, 30);
    
    // Update displays
    updateEmissionsDisplay('today', todayStats);
    updateEmissionsDisplay('week', weekStats);
    updateEmissionsDisplay('month', monthStats);
  }
  
  // Update emissions display for a specific period
  function updateEmissionsDisplay(period, stats) {
    const suffix = period === 'today' ? '' : `-${period}`;
    
    // Update main emissions total
    const emissionsElement = document.getElementById(`emissions-total${suffix}`);
    if (emissionsElement) {
      const grams = (stats.emissions * 1000).toFixed(2);
      emissionsElement.textContent = `${grams} g CO₂e`;
    }
    
    // Update breakdown if it exists
    const breakdownElement = document.getElementById(`category-breakdown${suffix}`);
    if (breakdownElement) {
      breakdownElement.innerHTML = `
        <div class="breakdown-item">
          <span class="label">Captures:</span>
          <span class="value">${stats.captures}</span>
        </div>
        <div class="breakdown-item">
          <span class="label">Tokens:</span>
          <span class="value">${stats.tokens?.toLocaleString() || 0}</span>
        </div>
      `;
    }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePopup);
  } else {
    initializePopup();
  }
  
  console.log('🌱 QarbonQuery Popup initialized');
})();
