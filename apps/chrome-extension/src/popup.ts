/**
 * QarbonQuery Chrome Extension Popup Script
 */

import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

// Custom Tooltip Tour System
class TooltipTour {
  private steps: Array<{
    element: string;
    text: string;
    position: 'top' | 'bottom' | 'left' | 'right';
  }> = [];
  private currentStep = 0;
  private overlay: HTMLElement | null = null;
  private tooltip: HTMLElement | null = null;

  constructor() {
    this.addStep(
      '#qarbon-tabs',
      'Navigate through your carbon emission data using these tabs.',
      'bottom'
    );
    this.addStep(
      '#qarbon-chart',
      'This is your 14-day carbon emission trend chart.',
      'bottom'
    );
    this.addStep(
      '[data-tooltip="settings"]',
      'Access settings here to customize your experience.',
      'left'
    );
  }

  private addStep(
    element: string,
    text: string,
    position: 'top' | 'bottom' | 'left' | 'right'
  ): void {
    this.steps.push({ element, text, position });
  }

  start(): void {
    this.currentStep = 0;
    this.createOverlay();
    this.showStep();
  }

  private createOverlay(): void {
    this.overlay = document.createElement('div');
    this.overlay.id = 'tooltip-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9999;
      pointer-events: auto;
    `;
    document.body.appendChild(this.overlay);

    this.tooltip = document.createElement('div');
    this.tooltip.id = 'tooltip-popup';
    this.tooltip.style.cssText = `
      position: absolute;
      background: #333;
      color: white;
      padding: 16px;
      border-radius: 8px;
      font-size: 14px;
      line-height: 1.4;
      max-width: 250px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      pointer-events: auto;
    `;
    document.body.appendChild(this.tooltip);
  }

  private showStep(): void {
    if (this.currentStep >= this.steps.length) {
      this.complete();
      return;
    }

    const step = this.steps[this.currentStep];
    if (!step) {
      this.complete();
      return;
    }

    const element = document.querySelector(step.element) as HTMLElement;

    if (!element || !this.tooltip || !this.overlay) {
      this.next();
      return;
    }

    // Highlight element
    this.highlightElement(element);

    // Position tooltip
    this.positionTooltip(element, step.position);

    // Set tooltip content
    this.tooltip.innerHTML = `
      ${step.text}
      <div style="margin-top: 12px; text-align: right;">
        ${this.currentStep > 0 ? '<button id="tooltip-prev" style="margin-right: 8px; padding: 4px 12px; background: #555; color: white; border: none; border-radius: 4px; cursor: pointer;">Previous</button>' : ''}
        <button id="tooltip-next" style="padding: 4px 12px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">
          ${this.currentStep === this.steps.length - 1 ? 'Finish' : 'Next'}
        </button>
      </div>
    `;

    // Add event listeners
    const nextBtn = this.tooltip.querySelector('#tooltip-next');
    const prevBtn = this.tooltip.querySelector('#tooltip-prev');

    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.next());
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.previous());
    }

    // Close on overlay click
    if (this.overlay) {
      this.overlay.addEventListener('click', e => {
        if (e.target === this.overlay) {
          this.complete();
        }
      });
    }
  }

  private highlightElement(element: HTMLElement): void {
    const rect = element.getBoundingClientRect();

    // Remove existing highlights
    document.querySelectorAll('.tooltip-highlight').forEach(el => el.remove());

    // Create highlight
    const highlight = document.createElement('div');
    highlight.className = 'tooltip-highlight';
    highlight.style.cssText = `
      position: fixed;
      top: ${rect.top - 4}px;
      left: ${rect.left - 4}px;
      width: ${rect.width + 8}px;
      height: ${rect.height + 8}px;
      border: 2px solid #667eea;
      border-radius: 4px;
      background: rgba(102, 126, 234, 0.1);
      z-index: 10001;
      pointer-events: none;
    `;
    document.body.appendChild(highlight);
  }

  private positionTooltip(element: HTMLElement, position: string): void {
    if (!this.tooltip) return;

    const rect = element.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();

    let top = 0;
    let left = 0;

    switch (position) {
      case 'bottom':
        top = rect.bottom + 8;
        left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        break;
      case 'top':
        top = rect.top - tooltipRect.height - 8;
        left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipRect.height / 2;
        left = rect.left - tooltipRect.width - 8;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipRect.height / 2;
        left = rect.right + 8;
        break;
    }

    // Ensure tooltip stays within viewport
    top = Math.max(
      8,
      Math.min(top, window.innerHeight - tooltipRect.height - 8)
    );
    left = Math.max(
      8,
      Math.min(left, window.innerWidth - tooltipRect.width - 8)
    );

    this.tooltip.style.top = `${top}px`;
    this.tooltip.style.left = `${left}px`;
  }

  next(): void {
    this.currentStep++;
    this.showStep();
  }

  previous(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.showStep();
    }
  }

  complete(): void {
    // Clean up
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }

    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }

    document.querySelectorAll('.tooltip-highlight').forEach(el => el.remove());

    // Mark as onboarded
    chrome.storage.local.set({ qarbon_onboarded: true });
  }
}

// Initialize tooltip tour on first popup open
chrome.storage.local.get(['qarbon_onboarded'], result => {
  if (!result.qarbon_onboarded) {
    // Delay to ensure DOM is ready
    setTimeout(() => {
      const tour = new TooltipTour();
      tour.start();
    }, 1000);
  }
});

interface TrendDataPoint {
  date: string;
  emissions: number;
  queries: number;
}

// Storage utilities for QarbonQuery data with caching optimization
class QarbonStorageManager {
  // Cache for aggregated data with TTL
  private static cache = new Map<
    string,
    { data: any; timestamp: number; ttl: number }
  >();
  private static readonly DEFAULT_TTL = 2 * 60 * 1000; // 2 minutes for popup data

  // Optimized aggregated data fetcher with memoization
  static async getAggregatedData(period: 'day' | 'week' | 'month'): Promise<{
    total: number;
    breakdown: Record<string, { emissions: number; queries: number }>;
    queries: number;
    period: string;
  }> {
    const cacheKey = `aggregated_${period}`;

    // Check cache first
    const cached = this.getCached(cacheKey);
    if (cached) {
      console.log(`Cache hit for aggregated data: ${period}`);
      return cached;
    }

    return new Promise((resolve, reject) => {
      try {
        // For week and month, try to use the dedicated aggregate keys first
        if (period === 'week' || period === 'month') {
          const today = new Date();
          const periodKey =
            period === 'week'
              ? this.getWeekKey(today)
              : this.getMonthKey(today);
          const aggregateKey = `qarbon_aggregates_${period}_${periodKey}`;

          chrome.storage.local.get([aggregateKey], result => {
            if (chrome.runtime.lastError) {
              // Fallback to manual aggregation
              this.fallbackAggregation(period, resolve, reject);
              return;
            }

            const aggregate = result[aggregateKey];
            if (aggregate && aggregate.totalEmissions !== undefined) {
              // Use pre-computed aggregate
              const data = {
                total: aggregate.totalEmissions,
                breakdown: aggregate.providerBreakdown || {},
                queries: aggregate.totalQueries || 0,
                period: period,
              };

              // Cache the result
              this.setCached(cacheKey, data);
              console.log(`Using pre-computed ${period} aggregate`);
              resolve(data);
            } else {
              // Fallback to manual aggregation
              this.fallbackAggregation(period, resolve, reject);
            }
          });
        } else {
          // For 'day' period, use manual aggregation
          this.fallbackAggregation(period, resolve, reject);
        }
      } catch (error) {
        console.error(`Error in getAggregatedData(${period}):`, error);
        reject(error);
      }
    });
  }

  // Fallback manual aggregation for when pre-computed data isn't available
  private static fallbackAggregation(
    period: 'day' | 'week' | 'month',
    resolve: Function,
    reject: Function
  ): void {
    const today = new Date();
    const days: string[] = [];

    // Calculate date range based on period
    const dayCount = period === 'day' ? 1 : period === 'week' ? 7 : 30;

    for (let i = 0; i < dayCount; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      if (dateString) {
        days.push(dateString);
      }
    }

    const storageKeys = days.map(day => `qarbon_emissions_${day}`);
    storageKeys.push('qarbon_queries');

    chrome.storage.local.get(storageKeys, result => {
      if (chrome.runtime.lastError) {
        console.error('Storage get error:', chrome.runtime.lastError.message);
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      let totalEmissions = 0;
      let totalQueries = 0;
      const breakdown: Record<string, { emissions: number; queries: number }> =
        {};

      // Process each day's data
      days.forEach(day => {
        const dayEmissions = result[`qarbon_emissions_${day}`] || [];
        dayEmissions.forEach((entry: any) => {
          const emissions = entry.emissions || 0;
          const provider = entry.provider || 'unknown';

          totalEmissions += emissions;
          totalQueries += 1;

          if (!breakdown[provider]) {
            breakdown[provider] = { emissions: 0, queries: 0 };
          }
          breakdown[provider].emissions += emissions;
          breakdown[provider].queries += 1;
        });
      });

      const data = {
        total: totalEmissions,
        breakdown,
        queries: totalQueries,
        period: period,
      };

      // Cache the result
      const cacheKey = `aggregated_${period}`;
      this.setCached(cacheKey, data);
      console.log(`Manual aggregation completed for ${period}`);
      resolve(data);
    });
  }

  // Cache utility methods
  private static getCached(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private static setCached(
    key: string,
    data: any,
    ttlMs: number = this.DEFAULT_TTL
  ): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  // Date helper functions for aggregate keys
  private static getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = this.getWeekNumber(date);
    return `${year}W${week.toString().padStart(2, '0')}`;
  }

  private static getMonthKey(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return `${year}M${month.toString().padStart(2, '0')}`;
  }

  private static getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear =
      (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  static async getEmissionsData(): Promise<{
    total: number;
    breakdown: Record<string, number>;
    queries: number;
  }> {
    return new Promise((resolve, reject) => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const storageKey = `qarbon_emissions_${today}`;

        chrome.storage.local.get(
          [storageKey, 'qarbon_queries', 'qarbon_settings'],
          result => {
            if (chrome.runtime.lastError) {
              console.error(
                'Storage get error:',
                chrome.runtime.lastError.message
              );
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }

            const todayEmissions = result[storageKey] || [];
            const queriesData = result['qarbon_queries'] || {
              total: 0,
              daily: {},
            };

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
              queries: queriesData.total || 0,
            });
          }
        );
      } catch (error) {
        console.error('Error in getEmissionsData:', error);
        reject(error);
      }
    });
  }

  static async getWeekEmissionsData(): Promise<{
    total: number;
    breakdown: Record<string, number>;
    queries: number;
  }> {
    return new Promise((resolve, reject) => {
      try {
        const today = new Date();
        const weekDays: string[] = [];

        // Get last 7 days
        for (let i = 0; i < 7; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          const dateString = date.toISOString().split('T')[0];
          if (dateString) {
            weekDays.push(dateString);
          }
        }

        const storageKeys = weekDays.map(day => `qarbon_emissions_${day}`);
        storageKeys.push('qarbon_queries');

        chrome.storage.local.get(storageKeys, result => {
          if (chrome.runtime.lastError) {
            console.error(
              'Storage get error:',
              chrome.runtime.lastError.message
            );
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          let totalEmissions = 0;
          const breakdown: Record<string, number> = {};

          weekDays.forEach(day => {
            const dayEmissions = result[`qarbon_emissions_${day}`] || [];
            dayEmissions.forEach((entry: any) => {
              const emissions = entry.emissions || 0;
              totalEmissions += emissions;

              const provider = entry.provider || 'unknown';
              breakdown[provider] = (breakdown[provider] || 0) + emissions;
            });
          });

          const queriesData = result['qarbon_queries'] || {
            total: 0,
            daily: {},
          };

          resolve({
            total: totalEmissions,
            breakdown,
            queries: queriesData.total || 0,
          });
        });
      } catch (error) {
        console.error('Error in getWeekEmissionsData:', error);
        reject(error);
      }
    });
  }

  static async getMonthEmissionsData(): Promise<{
    total: number;
    breakdown: Record<string, number>;
    queries: number;
  }> {
    return new Promise((resolve, reject) => {
      try {
        const today = new Date();
        const monthDays: string[] = [];

        // Get last 30 days
        for (let i = 0; i < 30; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          const dateString = date.toISOString().split('T')[0];
          if (dateString) {
            monthDays.push(dateString);
          }
        }

        const storageKeys = monthDays.map(day => `qarbon_emissions_${day}`);
        storageKeys.push('qarbon_queries');

        chrome.storage.local.get(storageKeys, result => {
          if (chrome.runtime.lastError) {
            console.error(
              'Storage get error:',
              chrome.runtime.lastError.message
            );
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          let totalEmissions = 0;
          const breakdown: Record<string, number> = {};

          monthDays.forEach(day => {
            const dayEmissions = result[`qarbon_emissions_${day}`] || [];
            dayEmissions.forEach((entry: any) => {
              const emissions = entry.emissions || 0;
              totalEmissions += emissions;

              const provider = entry.provider || 'unknown';
              breakdown[provider] = (breakdown[provider] || 0) + emissions;
            });
          });

          const queriesData = result['qarbon_queries'] || {
            total: 0,
            daily: {},
          };

          resolve({
            total: totalEmissions,
            breakdown,
            queries: queriesData.total || 0,
          });
        });
      } catch (error) {
        console.error('Error in getMonthEmissionsData:', error);
        reject(error);
      }
    });
  }

  static async getAllStorageData(): Promise<Record<string, any>> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(null, result => {
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
  LOW: 5, // < 5g - green
  MEDIUM: 25, // 5-25g - yellow
  HIGH: 50, // 25-50g - orange, >50g - red
};

// Lightweight View Router
class PopupViewRouter {
  public currentView: string = 'today';

  constructor() {
    this.initializeRouter();
  }

  private initializeRouter(): void {
    // Setup tab click handlers
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', e => {
        const target = e.target as HTMLElement;
        const viewName = target.getAttribute('data-view');
        if (viewName) {
          this.switchToView(viewName);
        }
      });
    });
  }

  public switchToView(viewName: string): void {
    if (this.currentView === viewName) return;

    // Update tabs
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.remove('active');
    });

    const activeTab = document.querySelector(`[data-view="${viewName}"]`);
    if (activeTab) {
      activeTab.classList.add('active');
    }

    // Update views
    document.querySelectorAll('.view').forEach(view => {
      view.classList.remove('active');
    });

    const activeView = document.getElementById(`${viewName}-view`);
    if (activeView) {
      activeView.classList.add('active');
    }

    this.currentView = viewName;

    // Load data for the new view
    this.loadViewData(viewName);
  }

  public async loadViewData(viewName: string): Promise<void> {
    try {
      switch (viewName) {
        case 'today':
          await this.loadTodayData();
          break;
        case 'week':
          await this.loadWeekData();
          break;
        case 'month':
          await this.loadMonthData();
          break;
      }
    } catch (error) {
      console.error(`Error loading ${viewName} data:`, error);
    }
  }

  private async loadTodayData(): Promise<void> {
    const aggregatedData = await QarbonStorageManager.getAggregatedData('day');
    this.updateEmissionsDisplayWithAnimation(
      'emissions-total',
      aggregatedData.total
    );
    this.updatePlatformBreakdown(
      'category-breakdown',
      aggregatedData.breakdown
    );
    await renderTrendChart('day');
  }

  private async loadWeekData(): Promise<void> {
    const aggregatedData = await QarbonStorageManager.getAggregatedData('week');
    this.updateEmissionsDisplayWithAnimation(
      'emissions-total-week',
      aggregatedData.total
    );
    this.updatePlatformBreakdown(
      'category-breakdown-week',
      aggregatedData.breakdown
    );
    await renderTrendChart('week');
  }

  private async loadMonthData(): Promise<void> {
    const aggregatedData =
      await QarbonStorageManager.getAggregatedData('month');
    this.updateEmissionsDisplayWithAnimation(
      'emissions-total-month',
      aggregatedData.total
    );
    this.updatePlatformBreakdown(
      'category-breakdown-month',
      aggregatedData.breakdown
    );
    await renderTrendChart('month');
  }

  private updateEmissionsDisplayWithAnimation(
    elementId: string,
    totalEmissions: number
  ): void {
    const emissionsDisplay = document.getElementById(elementId);
    if (!emissionsDisplay) return;

    // Auto-format between kg and g based on size
    const isKg = totalEmissions >= 1000;
    const displayValue = isKg ? totalEmissions / 1000 : totalEmissions;
    const unit = isKg ? 'kg' : 'g';
    const formattedValue = isKg
      ? displayValue.toFixed(3)
      : displayValue.toFixed(1);

    // Apply number flip animation
    emissionsDisplay.style.animation = 'numberFlip 0.6s ease-out';

    // Update the text after a short delay to sync with animation
    setTimeout(() => {
      emissionsDisplay.textContent = `${formattedValue} ${unit} CO₂e`;
    }, 200);

    // Clear animation class after completion
    setTimeout(() => {
      emissionsDisplay.style.animation = '';
    }, 600);
  }

  private updatePlatformBreakdown(
    elementId: string,
    breakdown: Record<string, { emissions: number; queries: number }>
  ): void {
    const categoryBreakdown = document.getElementById(elementId);
    if (!categoryBreakdown) return;

    categoryBreakdown.innerHTML = ''; // Clear existing content

    if (Object.keys(breakdown).length === 0) {
      const noDataItem = document.createElement('div');
      noDataItem.className = 'category-item no-data';
      noDataItem.innerHTML = `
        <span class="category-name">No data yet</span>
        <span class="category-amount">Use AI services to see emissions</span>
      `;
      categoryBreakdown.appendChild(noDataItem);
    } else {
      // Sort by emissions descending
      const sortedEntries = Object.entries(breakdown).sort(
        (a, b) => b[1].emissions - a[1].emissions
      );

      sortedEntries.forEach(([provider, data]) => {
        const item = document.createElement('div');
        item.className = 'category-item platform-item';

        // Get platform icon
        const platformIcon = this.getPlatformIcon(provider);

        // Auto-format emissions
        const isKg = data.emissions >= 1000;
        const displayValue = isKg ? data.emissions / 1000 : data.emissions;
        const unit = isKg ? 'kg' : 'g';
        const formattedValue = isKg
          ? displayValue.toFixed(3)
          : displayValue.toFixed(1);

        item.innerHTML = `
          <div class="platform-info">
            <span class="platform-icon">${platformIcon}</span>
            <span class="platform-name">${provider}</span>
          </div>
          <div class="platform-stats">
            <span class="emission-amount">${formattedValue} ${unit}</span>
            <span class="query-badge">${data.queries}</span>
          </div>
        `;

        categoryBreakdown.appendChild(item);
      });
    }
  }

  private getPlatformIcon(provider: string): string {
    const iconMap: Record<string, string> = {
      openai: '🤖',
      anthropic: '🤖',
      google: '🔍',
      microsoft: '💫',
      meta: '🌐',
      cohere: '🧠',
      huggingface: '🤗',
      together: '🤝',
      replicate: '🔄',
      perplexity: '🔍',
      claude: '🤖',
      gemini: '💎',
      gpt: '🤖',
      copilot: '🚁',
      bard: '🎭',
      unknown: '❓',
    };

    // Find matching icon (case-insensitive)
    const normalizedProvider = provider.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
      if (normalizedProvider.includes(key)) {
        return icon;
      }
    }

    return iconMap['unknown'] || '❓';
  }
}

import {
  initializeUIEnhancements,
  loadDataWithSkeleton,
  renderEnhancedPlatformBreakdown,
  updateTabUnderline,
} from './ui-enhancements';

// Initialize UI enhancements
initializeUIEnhancements();

// Helper function for updating emissions display with animation
function updateEmissionsDisplayWithAnimation(
  element: HTMLElement,
  totalEmissions: number
): void {
  // Auto-format between kg and g based on size
  const isKg = totalEmissions >= 1000;
  const displayValue = isKg ? totalEmissions / 1000 : totalEmissions;
  const unit = isKg ? 'kg' : 'g';
  const formattedValue = isKg
    ? displayValue.toFixed(3)
    : displayValue.toFixed(1);

  // Apply number flip animation
  element.style.animation = 'numberFlip 0.6s ease-out';

  // Update the text after a short delay to sync with animation
  setTimeout(() => {
    element.textContent = `${formattedValue} ${unit} CO₂e`;
  }, 200);

  // Clear animation class after completion
  setTimeout(() => {
    element.style.animation = '';
  }, 600);
}

// Global router instance
let viewRouter: PopupViewRouter;

// Main popup initialization
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize view router
  viewRouter = new PopupViewRouter();

  // Initialize popup UI
  const emissionsDisplay = document.getElementById('emissions-total');
  const categoryBreakdown = document.getElementById('category-breakdown');
  const loadingIndicator =
    document.getElementById('loading') || createLoadingIndicator();

  // Placeholder function for loading data
  async function loadEmissionsDataForView(viewName: string): Promise<void> {
    // Map viewName to proper period type
    const period =
      viewName === 'today'
        ? ('day' as const)
        : viewName === 'week'
          ? ('week' as const)
          : viewName === 'month'
            ? ('month' as const)
            : ('day' as const);

    const data = await loadDataWithSkeleton(
      () => QarbonStorageManager.getAggregatedData(period),
      {
        total: emissionsDisplay!,
        breakdown: categoryBreakdown!,
      }
    );
    updateEmissionsDisplayWithAnimation(emissionsDisplay!, data.total);
    await renderEnhancedPlatformBreakdown(
      `category-breakdown-${viewName}`,
      data.breakdown
    );
  }

  // Setup real-time emission message listener
  setupRealTimeListener(emissionsDisplay);

  try {
    // Show loading state
    if (loadingIndicator) {
      loadingIndicator.style.display = 'block';
    }

    // Load initial view data using the router for consistency
    await loadEmissionsDataForView('today');

    console.log('QarbonQuery popup loaded successfully');
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
      // Open settings page using chrome.runtime.openOptionsPage()
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        // Fallback for older browsers
        window.open(chrome.runtime.getURL('settings.html'));
      }
    });
  }

  // Week view refresh button
  const refreshWeekButton = document.getElementById('refresh-week-btn');
  if (refreshWeekButton) {
    refreshWeekButton.addEventListener('click', () => {
      if (viewRouter && viewRouter.currentView === 'week') {
        viewRouter.loadViewData('week');
      }
    });
  }

  // Month view refresh button
  const refreshMonthButton = document.getElementById('refresh-month-btn');
  if (refreshMonthButton) {
    refreshMonthButton.addEventListener('click', () => {
      if (viewRouter && viewRouter.currentView === 'month') {
        viewRouter.loadViewData('month');
      }
    });
  }

  // Tab switch handlers
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', e => {
      const target = e.target as HTMLElement;
      const viewName = target.getAttribute('data-view');
      if (viewName) {
        updateTabUnderline(viewName);
        loadEmissionsDataForView(viewName);
      }
    });
  });

  // Export buttons (placeholder functionality)
  const exportWeekButton = document.getElementById('export-week-btn');
  if (exportWeekButton) {
    exportWeekButton.addEventListener('click', async () => {
      try {
        const weekData = await QarbonStorageManager.getWeekEmissionsData();
        const exportData = {
          period: 'week',
          totalEmissions: weekData.total,
          breakdown: weekData.breakdown,
          queries: weekData.queries,
          exportDate: new Date().toISOString(),
        };

        // Simple download as JSON for now
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qarbon-week-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error exporting week data:', error);
        alert('Error exporting data');
      }
    });
  }

  const exportMonthButton = document.getElementById('export-month-btn');
  if (exportMonthButton) {
    exportMonthButton.addEventListener('click', async () => {
      try {
        const monthData = await QarbonStorageManager.getMonthEmissionsData();
        const exportData = {
          period: 'month',
          totalEmissions: monthData.total,
          breakdown: monthData.breakdown,
          queries: monthData.queries,
          exportDate: new Date().toISOString(),
        };

        // Simple download as JSON for now
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qarbon-month-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error exporting month data:', error);
        alert('Error exporting data');
      }
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

          return entries
            .map(([key, value]) => {
              const valueStr =
                typeof value === 'object'
                  ? JSON.stringify(value).substring(0, 100) +
                    (JSON.stringify(value).length > 100 ? '...' : '')
                  : String(value);
              return `${key}: ${valueStr}`;
            })
            .join('\n');
        };

        storageDebugDiv.textContent = formatData(allData);
        storageDebugDiv.classList.toggle('visible');
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
          const response = await new Promise<{
            success?: boolean;
            error?: string;
            removedCount?: number;
          }>(resolve => {
            chrome.runtime.sendMessage({ type: 'CLEAR_STORAGE_DATA' }, resolve);
          });

          if (response.error) {
            alert('Error clearing data: ' + response.error);
          } else {
            alert(
              `Successfully cleared ${response.removedCount || 0} data entries`
            );
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

  chrome.runtime.onMessage.addListener(message => {
    if (message.type === 'AI_TOKENS' && message.data) {
      const { emissions, confidence } = message.data;

      if (typeof emissions === 'number' && confidence) {
        // Update real-time emissions data
        realTimeEmissions = {
          current: emissions,
          confidence: {
            low: confidence.low || 0,
            high: confidence.high || 0,
          },
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

/**
 * Get optimized chart data using dedicated popup chart keys with fallback
 */
async function getDailyAggregates(
  period: 'day' | 'week' | 'month'
): Promise<TrendDataPoint[]> {
  const cacheKey = `chart_data_${period}`;

  // Check cache first
  const cached = QarbonStorageManager['getCached'](cacheKey);
  if (cached) {
    console.log(`Cache hit for chart data: ${period}`);
    return cached;
  }

  return new Promise((resolve, reject) => {
    try {
      // Try to use dedicated popup chart keys for week/month
      if (period === 'week' || period === 'month') {
        const chartKey = `qarbon_popup_chart_${period}`;

        chrome.storage.local.get([chartKey], result => {
          if (chrome.runtime.lastError) {
            // Fallback to manual aggregation
            fallbackChartAggregation(period, resolve, reject, cacheKey);
            return;
          }

          const chartData = result[chartKey];
          if (
            chartData &&
            chartData.labels &&
            chartData.emissions &&
            chartData.queries
          ) {
            // Convert optimized chart data to TrendDataPoint format
            const trendData: TrendDataPoint[] = chartData.labels.map(
              (_label: string, index: number) => {
                // Convert label back to date for consistency
                const today = new Date();
                const daysBack = period === 'week' ? 6 - index : 29 - index;
                const date = new Date(today);
                date.setDate(today.getDate() - daysBack);

                return {
                  date: date.toISOString().split('T')[0],
                  emissions: chartData.emissions[index] || 0,
                  queries: chartData.queries[index] || 0,
                };
              }
            );

            // Cache the result
            QarbonStorageManager['setCached'](cacheKey, trendData, 60 * 1000); // 1 minute TTL for chart data
            console.log(`Using optimized ${period} chart data`);
            resolve(trendData);
          } else {
            // Fallback to manual aggregation
            fallbackChartAggregation(period, resolve, reject, cacheKey);
          }
        });
      } else {
        // For 'day' period (14-day trend), use manual aggregation
        fallbackChartAggregation(period, resolve, reject, cacheKey);
      }
    } catch (error) {
      console.error(`Error in getDailyAggregates(${period}):`, error);
      reject(error);
    }
  });
}

/**
 * Fallback manual chart data aggregation
 */
function fallbackChartAggregation(
  period: 'day' | 'week' | 'month',
  resolve: Function,
  reject: Function,
  cacheKey: string
): void {
  const today = new Date();
  const days: string[] = [];

  // Calculate day count based on period
  const dayCount = period === 'day' ? 14 : period === 'week' ? 7 : 30;

  // Get dates for the period
  for (let i = dayCount - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    if (dateString) {
      days.push(dateString);
    }
  }

  const storageKeys = days.map(day => `qarbon_emissions_${day}`);

  chrome.storage.local.get(storageKeys, result => {
    if (chrome.runtime.lastError) {
      reject(new Error(chrome.runtime.lastError.message));
      return;
    }

    const trendData: TrendDataPoint[] = days.map(day => {
      const dayEmissions = result[`qarbon_emissions_${day}`] || [];
      let totalEmissions = 0;
      let totalQueries = 0;

      dayEmissions.forEach((entry: any) => {
        totalEmissions += entry.emissions || 0;
        totalQueries += 1;
      });

      return {
        date: day,
        emissions: totalEmissions,
        queries: totalQueries,
      };
    });

    // Cache the result
    QarbonStorageManager['setCached'](cacheKey, trendData, 60 * 1000); // 1 minute TTL
    console.log(`Manual chart aggregation completed for ${period}`);
    resolve(trendData);
  });
}

/**
 * Render trend chart using Chart.js
 */
async function renderTrendChart(
  period: 'day' | 'week' | 'month'
): Promise<void> {
  const canvasId =
    period === 'day'
      ? 'trend-chart'
      : period === 'week'
        ? 'trend-chart-week'
        : 'trend-chart-month';

  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  if (!canvas) {
    console.warn(`Canvas element ${canvasId} not found`);
    return;
  }

  try {
    const trendData = await getDailyAggregates(period);
    if (!trendData || trendData.length === 0) {
      console.warn('No trend data available');
      return;
    }

    // Prepare chart data
    const labels = trendData.map(point => {
      const date = new Date(point.date);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    });

    const emissionsData = trendData.map(point => point.emissions);

    // Create gradient for stroke
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 100);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.2)');

    // Destroy existing chart if it exists
    const existingChart = (Chart as any).getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }

    // Create new chart
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Daily Emissions (g CO₂e)',
            data: emissionsData,
            borderColor: gradient,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: '#ffffff',
            pointHoverBorderColor: 'rgba(255, 255, 255, 0.8)',
            pointHoverBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            display: false,
            grid: {
              display: false,
            },
          },
          y: {
            display: false,
            grid: {
              display: false,
            },
            beginAtZero: true,
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              title: function (context: any) {
                const dataIndex = context[0].dataIndex;
                const date = new Date(trendData[dataIndex]?.date || '');
                return date.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                });
              },
              label: function (context: any) {
                const dataIndex = context.dataIndex;
                const point = trendData[dataIndex];
                if (!point) return [];
                const emissionsKg =
                  point.emissions >= 1000
                    ? `${(point.emissions / 1000).toFixed(3)} kg`
                    : `${point.emissions.toFixed(1)} g`;
                return [
                  `Emissions: ${emissionsKg} CO₂e`,
                  `Queries: ${point.queries}`,
                ];
              },
            },
          },
        },
        interaction: {
          intersect: false,
          mode: 'index',
        },
        layout: {
          padding: {
            top: 10,
            bottom: 10,
            left: 10,
            right: 10,
          },
        },
      },
    });
  } catch (error) {
    console.error(`Error rendering trend chart for ${period}:`, error);
  }
}
