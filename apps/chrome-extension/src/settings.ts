/**
 * QarbonQuery Chrome Extension Settings Page
 */

// Default settings configuration
interface QarbonSettings {
  thresholds: {
    low: number;
    medium: number;
    high: number;
  };
  notifications: {
    realtimeNotifications: boolean;
    highEmissionWarnings: boolean;
  };
  dataRetention: {
    days: number;
  };
  privacy: {
    pauseTracking: boolean;
  };
  version: string;
  lastUpdated: string;
}

const DEFAULT_SETTINGS: QarbonSettings = {
  thresholds: {
    low: 5,
    medium: 25,
    high: 50
  },
  notifications: {
    realtimeNotifications: true,
    highEmissionWarnings: true
  },
  dataRetention: {
    days: 90
  },
  privacy: {
    pauseTracking: false
  },
  version: '1.0.0',
  lastUpdated: new Date().toISOString()
};

// Settings storage management
class SettingsManager {
  private static readonly STORAGE_KEY = 'qarbon_settings';

  /**
   * Load settings from storage
   */
  static async loadSettings(): Promise<QarbonSettings> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(this.STORAGE_KEY, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        const savedSettings = result[this.STORAGE_KEY];
        if (savedSettings) {
          // Merge with defaults to ensure all properties exist
          const settings = { ...DEFAULT_SETTINGS, ...savedSettings };
          resolve(settings);
        } else {
          resolve(DEFAULT_SETTINGS);
        }
      });
    });
  }

  /**
   * Save settings to storage
   */
  static async saveSettings(settings: QarbonSettings): Promise<void> {
    return new Promise((resolve, reject) => {
      const settingsToSave = {
        ...settings,
        lastUpdated: new Date().toISOString()
      };

      chrome.storage.local.set({ [this.STORAGE_KEY]: settingsToSave }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        // Broadcast settings change to other parts of the extension
        this.broadcastSettingsChange(settingsToSave);
        resolve();
      });
    });
  }

  /**
   * Reset settings to defaults
   */
  static async resetToDefaults(): Promise<void> {
    const defaultSettings = { ...DEFAULT_SETTINGS };
    await this.saveSettings(defaultSettings);
  }

  /**
   * Broadcast settings changes to popup and background scripts
   */
  private static broadcastSettingsChange(settings: QarbonSettings): void {
    // Send message to background script
    chrome.runtime.sendMessage({
      type: 'SETTINGS_UPDATED',
      data: settings
    }).catch(() => {
      // Ignore errors if background script isn't ready
    });

    // Trigger storage change event
    chrome.storage.onChanged.hasListeners() && chrome.storage.local.set({
      qarbon_settings_timestamp: Date.now()
    });
  }

  /**
   * Export all data including settings and emissions
   */
  static async exportAllData(): Promise<string> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(null, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        const exportData = {
          settings: result[this.STORAGE_KEY] || DEFAULT_SETTINGS,
          emissions: {} as Record<string, any>,
          queries: result.qarbon_queries || {},
          exportDate: new Date().toISOString(),
          version: '1.0.0'
        };

        // Extract all emission data
        Object.keys(result).forEach(key => {
          if (key.startsWith('qarbon_emissions_')) {
            exportData.emissions[key] = result[key];
          }
        });

        resolve(JSON.stringify(exportData, null, 2));
      });
    });
  }

  /**
   * Import data from JSON
   */
  static async importData(jsonData: string): Promise<{ imported: number; errors: string[] }> {
    return new Promise((resolve, reject) => {
      try {
        const data = JSON.parse(jsonData);
        let importedCount = 0;
        const errors: string[] = [];

        const itemsToImport: Record<string, any> = {};

        // Import settings
        if (data.settings) {
          itemsToImport[this.STORAGE_KEY] = {
            ...DEFAULT_SETTINGS,
            ...data.settings,
            lastUpdated: new Date().toISOString()
          };
          importedCount++;
        }

        // Import emissions data
        if (data.emissions) {
          Object.keys(data.emissions).forEach(key => {
            if (key.startsWith('qarbon_emissions_')) {
              itemsToImport[key] = data.emissions[key];
              importedCount++;
            }
          });
        }

        // Import queries data
        if (data.queries) {
          itemsToImport.qarbon_queries = data.queries;
          importedCount++;
        }

        chrome.storage.local.set(itemsToImport, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          resolve({ imported: importedCount, errors });
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        reject(new Error(`Invalid JSON data: ${errorMessage}`));
      }
    });
  }

  /**
   * Clear all extension data
   */
  static async clearAllData(): Promise<number> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(null, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        const keysToRemove = Object.keys(result).filter(key => 
          key.startsWith('qarbon_') || key === this.STORAGE_KEY
        );

        if (keysToRemove.length === 0) {
          resolve(0);
          return;
        }

        chrome.storage.local.remove(keysToRemove, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          resolve(keysToRemove.length);
        });
      });
    });
  }
}

// UI Controller for settings page
class SettingsUIController {
  private settings: QarbonSettings = DEFAULT_SETTINGS;
  private statusMessageElement: HTMLElement | null = null;

  constructor() {
    this.statusMessageElement = document.getElementById('status-message');
    this.initializeUI();
  }

  /**
   * Initialize the settings UI
   */
  private async initializeUI(): Promise<void> {
    try {
      // Load current settings
      this.settings = await SettingsManager.loadSettings();
      
      // Populate UI with current settings
      this.populateUI();
      
      // Setup event listeners
      this.setupEventListeners();
      
      this.showStatus('Settings loaded successfully', 'success');
    } catch (error) {
      console.error('Error initializing settings UI:', error);
      this.showStatus('Error loading settings', 'error');
    }
  }

  /**
   * Populate UI elements with current settings
   */
  private populateUI(): void {
    // Emission thresholds
    this.setInputValue('threshold-low', this.settings.thresholds.low);
    this.setInputValue('threshold-medium', this.settings.thresholds.medium);
    this.setInputValue('threshold-high', this.settings.thresholds.high);

    // Notifications
    this.setCheckboxValue('realtime-notifications', this.settings.notifications.realtimeNotifications);
    this.setCheckboxValue('high-emission-warnings', this.settings.notifications.highEmissionWarnings);

    // Data retention
    this.setSliderValue('retention-days', this.settings.dataRetention.days);

    // Privacy controls
    this.setCheckboxValue('pause-tracking', this.settings.privacy.pauseTracking);
  }

  /**
   * Setup event listeners for all UI elements
   */
  private setupEventListeners(): void {
    // Threshold inputs
    this.addInputListener('threshold-low', (value) => {
      this.settings.thresholds.low = parseFloat(value);
      this.validateThresholds();
    });

    this.addInputListener('threshold-medium', (value) => {
      this.settings.thresholds.medium = parseFloat(value);
      this.validateThresholds();
    });

    this.addInputListener('threshold-high', (value) => {
      this.settings.thresholds.high = parseFloat(value);
      this.validateThresholds();
    });

    // Notification toggles
    this.addCheckboxListener('realtime-notifications', (checked) => {
      this.settings.notifications.realtimeNotifications = checked;
    });

    this.addCheckboxListener('high-emission-warnings', (checked) => {
      this.settings.notifications.highEmissionWarnings = checked;
    });

    // Data retention slider
    this.addSliderListener('retention-days', (value) => {
      this.settings.dataRetention.days = parseInt(value);
      this.updateRetentionDisplay(parseInt(value));
    });

    // Privacy controls
    this.addCheckboxListener('pause-tracking', (checked) => {
      this.settings.privacy.pauseTracking = checked;
    });

    // Action buttons
    this.addButtonListener('save-settings-btn', () => this.saveSettings());
    this.addButtonListener('reset-defaults-btn', () => this.resetToDefaults());
    this.addButtonListener('export-data-btn', () => this.exportData());
    this.addButtonListener('import-data-btn', () => this.triggerImport());
    this.addButtonListener('clear-all-data-btn', () => this.clearAllData());

    // File import
    const fileInput = document.getElementById('import-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.addEventListener('change', (e) => this.handleFileImport(e));
    }
  }

  /**
   * Validate threshold values to ensure logical ordering
   */
  private validateThresholds(): void {
    const { low, medium, high } = this.settings.thresholds;
    
    if (medium <= low) {
      this.settings.thresholds.medium = low + 1;
      this.setInputValue('threshold-medium', this.settings.thresholds.medium);
    }
    
    if (high <= medium) {
      this.settings.thresholds.high = medium + 1;
      this.setInputValue('threshold-high', this.settings.thresholds.high);
    }
  }

  /**
   * Save current settings
   */
  private async saveSettings(): Promise<void> {
    try {
      this.setButtonLoading('save-settings-btn', true);
      await SettingsManager.saveSettings(this.settings);
      this.showStatus('Settings saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showStatus('Error saving settings', 'error');
    } finally {
      this.setButtonLoading('save-settings-btn', false);
    }
  }

  /**
   * Reset settings to defaults
   */
  private async resetToDefaults(): Promise<void> {
    if (!confirm('Reset all settings to defaults? This cannot be undone.')) {
      return;
    }

    try {
      this.setButtonLoading('reset-defaults-btn', true);
      await SettingsManager.resetToDefaults();
      this.settings = { ...DEFAULT_SETTINGS };
      this.populateUI();
      this.showStatus('Settings reset to defaults', 'success');
    } catch (error) {
      console.error('Error resetting settings:', error);
      this.showStatus('Error resetting settings', 'error');
    } finally {
      this.setButtonLoading('reset-defaults-btn', false);
    }
  }

  /**
   * Export all data as JSON
   */
  private async exportData(): Promise<void> {
    try {
      this.setButtonLoading('export-data-btn', true);
      const data = await SettingsManager.exportAllData();
      
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qarbon-data-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      this.showStatus('Data exported successfully!', 'success');
    } catch (error) {
      console.error('Error exporting data:', error);
      this.showStatus('Error exporting data', 'error');
    } finally {
      this.setButtonLoading('export-data-btn', false);
    }
  }

  /**
   * Trigger file import dialog
   */
  private triggerImport(): void {
    const fileInput = document.getElementById('import-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  /**
   * Handle file import
   */
  private async handleFileImport(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (!file) return;

    try {
      this.setButtonLoading('import-data-btn', true);
      const text = await file.text();
      const result = await SettingsManager.importData(text);
      
      // Reload settings from storage
      this.settings = await SettingsManager.loadSettings();
      this.populateUI();
      
      let message = `Successfully imported ${result.imported} items`;
      if (result.errors.length > 0) {
        message += ` (${result.errors.length} errors)`;
      }
      
      this.showStatus(message, 'success');
    } catch (error) {
      console.error('Error importing data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.showStatus(`Import failed: ${errorMessage}`, 'error');
    } finally {
      this.setButtonLoading('import-data-btn', false);
      target.value = ''; // Reset file input
    }
  }

  /**
   * Clear all extension data
   */
  private async clearAllData(): Promise<void> {
    if (!confirm('Clear ALL QarbonQuery data? This will permanently delete all settings, emission data, and cannot be undone.')) {
      return;
    }

    try {
      this.setButtonLoading('clear-all-data-btn', true);
      const deletedCount = await SettingsManager.clearAllData();
      
      // Reset to defaults
      this.settings = { ...DEFAULT_SETTINGS };
      this.populateUI();
      
      this.showStatus(`Cleared ${deletedCount} data entries`, 'success');
    } catch (error) {
      console.error('Error clearing data:', error);
      this.showStatus('Error clearing data', 'error');
    } finally {
      this.setButtonLoading('clear-all-data-btn', false);
    }
  }

  // Utility methods for UI manipulation
  private setInputValue(id: string, value: number): void {
    const element = document.getElementById(id) as HTMLInputElement;
    if (element) {
      element.value = value.toString();
    }
  }

  private setCheckboxValue(id: string, checked: boolean): void {
    const element = document.getElementById(id) as HTMLInputElement;
    if (element) {
      element.checked = checked;
    }
  }

  private setSliderValue(id: string, value: number): void {
    const element = document.getElementById(id) as HTMLInputElement;
    if (element) {
      element.value = value.toString();
      this.updateRetentionDisplay(value);
    }
  }

  private updateRetentionDisplay(days: number): void {
    const display = document.getElementById('retention-value');
    if (display) {
      display.textContent = `${days} days`;
    }
  }

  private addInputListener(id: string, callback: (value: string) => void): void {
    const element = document.getElementById(id) as HTMLInputElement;
    if (element) {
      element.addEventListener('input', (e) => {
        callback((e.target as HTMLInputElement).value);
      });
    }
  }

  private addCheckboxListener(id: string, callback: (checked: boolean) => void): void {
    const element = document.getElementById(id) as HTMLInputElement;
    if (element) {
      element.addEventListener('change', (e) => {
        callback((e.target as HTMLInputElement).checked);
      });
    }
  }

  private addSliderListener(id: string, callback: (value: string) => void): void {
    const element = document.getElementById(id) as HTMLInputElement;
    if (element) {
      element.addEventListener('input', (e) => {
        callback((e.target as HTMLInputElement).value);
      });
    }
  }

  private addButtonListener(id: string, callback: () => void): void {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('click', callback);
    }
  }

  private setButtonLoading(id: string, loading: boolean): void {
    const element = document.getElementById(id);
    if (element) {
      if (loading) {
        element.classList.add('loading');
      } else {
        element.classList.remove('loading');
      }
    }
  }

  private showStatus(message: string, type: 'success' | 'error' | 'info'): void {
    if (this.statusMessageElement) {
      this.statusMessageElement.textContent = message;
      this.statusMessageElement.className = `status-message ${type}`;
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        if (this.statusMessageElement) {
          this.statusMessageElement.textContent = '';
          this.statusMessageElement.className = 'status-message';
        }
      }, 3000);
    }
  }
}

// Initialize settings UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SettingsUIController();
});

// Export for use in other parts of the extension
export { SettingsManager, type QarbonSettings, DEFAULT_SETTINGS };
