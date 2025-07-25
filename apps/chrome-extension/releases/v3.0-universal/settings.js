(() => {
  'use strict';
  const t = {
    thresholds: { low: 5, medium: 25, high: 50 },
    notifications: { realtimeNotifications: !0, highEmissionWarnings: !0 },
    dataRetention: { days: 90 },
    privacy: { pauseTracking: !1 },
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
  };
  class e {
    static STORAGE_KEY = 'qarbon_settings';
    static async loadSettings() {
      return new Promise((e, s) => {
        chrome.storage.local.get(this.STORAGE_KEY, i => {
          if (chrome.runtime.lastError)
            return void s(new Error(chrome.runtime.lastError.message));
          const n = i[this.STORAGE_KEY];
          if (n) {
            const s = { ...t, ...n };
            e(s);
          } else e(t);
        });
      });
    }
    static async saveSettings(t) {
      return new Promise((e, s) => {
        const i = { ...t, lastUpdated: new Date().toISOString() };
        chrome.storage.local.set({ [this.STORAGE_KEY]: i }, () => {
          chrome.runtime.lastError
            ? s(new Error(chrome.runtime.lastError.message))
            : (this.broadcastSettingsChange(i), e());
        });
      });
    }
    static async resetToDefaults() {
      const e = { ...t };
      await this.saveSettings(e);
    }
    static broadcastSettingsChange(t) {
      (chrome.runtime
        .sendMessage({ type: 'SETTINGS_UPDATED', data: t })
        .catch(() => {}),
        chrome.storage.onChanged.hasListeners() &&
          chrome.storage.local.set({ qarbon_settings_timestamp: Date.now() }));
    }
    static async exportAllData() {
      return new Promise((e, s) => {
        chrome.storage.local.get(null, i => {
          if (chrome.runtime.lastError)
            return void s(new Error(chrome.runtime.lastError.message));
          const n = {
            settings: i[this.STORAGE_KEY] || t,
            emissions: {},
            queries: i.qarbon_queries || {},
            exportDate: new Date().toISOString(),
            version: '1.0.0',
          };
          (Object.keys(i).forEach(t => {
            t.startsWith('qarbon_emissions_') && (n.emissions[t] = i[t]);
          }),
            e(JSON.stringify(n, null, 2)));
        });
      });
    }
    static async importData(e) {
      return new Promise((s, i) => {
        try {
          const n = JSON.parse(e);
          let a = 0;
          const r = [],
            o = {};
          (n.settings &&
            ((o[this.STORAGE_KEY] = {
              ...t,
              ...n.settings,
              lastUpdated: new Date().toISOString(),
            }),
            a++),
            n.emissions &&
              Object.keys(n.emissions).forEach(t => {
                t.startsWith('qarbon_emissions_') &&
                  ((o[t] = n.emissions[t]), a++);
              }),
            n.queries && ((o.qarbon_queries = n.queries), a++),
            chrome.storage.local.set(o, () => {
              chrome.runtime.lastError
                ? i(new Error(chrome.runtime.lastError.message))
                : s({ imported: a, errors: r });
            }));
        } catch (t) {
          const e = t instanceof Error ? t.message : 'Unknown error';
          i(new Error(`Invalid JSON data: ${e}`));
        }
      });
    }
    static async clearAllData() {
      return new Promise((t, e) => {
        chrome.storage.local.get(null, s => {
          if (chrome.runtime.lastError)
            return void e(new Error(chrome.runtime.lastError.message));
          const i = Object.keys(s).filter(
            t => t.startsWith('qarbon_') || t === this.STORAGE_KEY
          );
          0 !== i.length
            ? chrome.storage.local.remove(i, () => {
                chrome.runtime.lastError
                  ? e(new Error(chrome.runtime.lastError.message))
                  : t(i.length);
              })
            : t(0);
        });
      });
    }
  }
  class s {
    settings = t;
    statusMessageElement = null;
    constructor() {
      ((this.statusMessageElement = document.getElementById('status-message')),
        this.initializeUI());
    }
    async initializeUI() {
      try {
        ((this.settings = await e.loadSettings()),
          this.populateUI(),
          this.setupEventListeners(),
          this.showStatus('Settings loaded successfully', 'success'));
      } catch (t) {
        (console.error('Error initializing settings UI:', t),
          this.showStatus('Error loading settings', 'error'));
      }
    }
    populateUI() {
      (this.setInputValue('threshold-low', this.settings.thresholds.low),
        this.setInputValue('threshold-medium', this.settings.thresholds.medium),
        this.setInputValue('threshold-high', this.settings.thresholds.high),
        this.setCheckboxValue(
          'realtime-notifications',
          this.settings.notifications.realtimeNotifications
        ),
        this.setCheckboxValue(
          'high-emission-warnings',
          this.settings.notifications.highEmissionWarnings
        ),
        this.setSliderValue('retention-days', this.settings.dataRetention.days),
        this.setCheckboxValue(
          'pause-tracking',
          this.settings.privacy.pauseTracking
        ));
    }
    setupEventListeners() {
      (this.addInputListener('threshold-low', t => {
        ((this.settings.thresholds.low = parseFloat(t)),
          this.validateThresholds());
      }),
        this.addInputListener('threshold-medium', t => {
          ((this.settings.thresholds.medium = parseFloat(t)),
            this.validateThresholds());
        }),
        this.addInputListener('threshold-high', t => {
          ((this.settings.thresholds.high = parseFloat(t)),
            this.validateThresholds());
        }),
        this.addCheckboxListener('realtime-notifications', t => {
          this.settings.notifications.realtimeNotifications = t;
        }),
        this.addCheckboxListener('high-emission-warnings', t => {
          this.settings.notifications.highEmissionWarnings = t;
        }),
        this.addSliderListener('retention-days', t => {
          ((this.settings.dataRetention.days = parseInt(t)),
            this.updateRetentionDisplay(parseInt(t)));
        }),
        this.addCheckboxListener('pause-tracking', t => {
          this.settings.privacy.pauseTracking = t;
        }),
        this.addButtonListener('save-settings-btn', () => this.saveSettings()),
        this.addButtonListener('reset-defaults-btn', () =>
          this.resetToDefaults()
        ),
        this.addButtonListener('export-data-btn', () => this.exportData()),
        this.addButtonListener('import-data-btn', () => this.triggerImport()),
        this.addButtonListener('clear-all-data-btn', () =>
          this.clearAllData()
        ));
      const t = document.getElementById('import-file-input');
      t && t.addEventListener('change', t => this.handleFileImport(t));
    }
    validateThresholds() {
      const { low: t, medium: e, high: s } = this.settings.thresholds;
      (e <= t &&
        ((this.settings.thresholds.medium = t + 1),
        this.setInputValue(
          'threshold-medium',
          this.settings.thresholds.medium
        )),
        s <= e &&
          ((this.settings.thresholds.high = e + 1),
          this.setInputValue('threshold-high', this.settings.thresholds.high)));
    }
    async saveSettings() {
      try {
        (this.setButtonLoading('save-settings-btn', !0),
          await e.saveSettings(this.settings),
          this.showStatus('Settings saved successfully!', 'success'));
      } catch (t) {
        (console.error('Error saving settings:', t),
          this.showStatus('Error saving settings', 'error'));
      } finally {
        this.setButtonLoading('save-settings-btn', !1);
      }
    }
    async resetToDefaults() {
      if (confirm('Reset all settings to defaults? This cannot be undone.'))
        try {
          (this.setButtonLoading('reset-defaults-btn', !0),
            await e.resetToDefaults(),
            (this.settings = { ...t }),
            this.populateUI(),
            this.showStatus('Settings reset to defaults', 'success'));
        } catch (t) {
          (console.error('Error resetting settings:', t),
            this.showStatus('Error resetting settings', 'error'));
        } finally {
          this.setButtonLoading('reset-defaults-btn', !1);
        }
    }
    async exportData() {
      try {
        this.setButtonLoading('export-data-btn', !0);
        const t = await e.exportAllData(),
          s = new Blob([t], { type: 'application/json' }),
          i = URL.createObjectURL(s),
          n = document.createElement('a');
        ((n.href = i),
          (n.download = `qarbon-data-export-${new Date().toISOString().split('T')[0]}.json`),
          n.click(),
          URL.revokeObjectURL(i),
          this.showStatus('Data exported successfully!', 'success'));
      } catch (t) {
        (console.error('Error exporting data:', t),
          this.showStatus('Error exporting data', 'error'));
      } finally {
        this.setButtonLoading('export-data-btn', !1);
      }
    }
    triggerImport() {
      const t = document.getElementById('import-file-input');
      t && t.click();
    }
    async handleFileImport(t) {
      const s = t.target,
        i = s.files?.[0];
      if (i)
        try {
          this.setButtonLoading('import-data-btn', !0);
          const t = await i.text(),
            s = await e.importData(t);
          ((this.settings = await e.loadSettings()), this.populateUI());
          let n = `Successfully imported ${s.imported} items`;
          (s.errors.length > 0 && (n += ` (${s.errors.length} errors)`),
            this.showStatus(n, 'success'));
        } catch (t) {
          console.error('Error importing data:', t);
          const e = t instanceof Error ? t.message : 'Unknown error';
          this.showStatus(`Import failed: ${e}`, 'error');
        } finally {
          (this.setButtonLoading('import-data-btn', !1), (s.value = ''));
        }
    }
    async clearAllData() {
      if (
        confirm(
          'Clear ALL QarbonQuery data? This will permanently delete all settings, emission data, and cannot be undone.'
        )
      )
        try {
          this.setButtonLoading('clear-all-data-btn', !0);
          const s = await e.clearAllData();
          ((this.settings = { ...t }),
            this.populateUI(),
            this.showStatus(`Cleared ${s} data entries`, 'success'));
        } catch (t) {
          (console.error('Error clearing data:', t),
            this.showStatus('Error clearing data', 'error'));
        } finally {
          this.setButtonLoading('clear-all-data-btn', !1);
        }
    }
    setInputValue(t, e) {
      const s = document.getElementById(t);
      s && (s.value = e.toString());
    }
    setCheckboxValue(t, e) {
      const s = document.getElementById(t);
      s && (s.checked = e);
    }
    setSliderValue(t, e) {
      const s = document.getElementById(t);
      s && ((s.value = e.toString()), this.updateRetentionDisplay(e));
    }
    updateRetentionDisplay(t) {
      const e = document.getElementById('retention-value');
      e && (e.textContent = `${t} days`);
    }
    addInputListener(t, e) {
      const s = document.getElementById(t);
      s &&
        s.addEventListener('input', t => {
          e(t.target.value);
        });
    }
    addCheckboxListener(t, e) {
      const s = document.getElementById(t);
      s &&
        s.addEventListener('change', t => {
          e(t.target.checked);
        });
    }
    addSliderListener(t, e) {
      const s = document.getElementById(t);
      s &&
        s.addEventListener('input', t => {
          e(t.target.value);
        });
    }
    addButtonListener(t, e) {
      const s = document.getElementById(t);
      s && s.addEventListener('click', e);
    }
    setButtonLoading(t, e) {
      const s = document.getElementById(t);
      s && (e ? s.classList.add('loading') : s.classList.remove('loading'));
    }
    showStatus(t, e) {
      this.statusMessageElement &&
        ((this.statusMessageElement.textContent = t),
        (this.statusMessageElement.className = `status-message ${e}`),
        setTimeout(() => {
          this.statusMessageElement &&
            ((this.statusMessageElement.textContent = ''),
            (this.statusMessageElement.className = 'status-message'));
        }, 3e3));
    }
  }
  document.addEventListener('DOMContentLoaded', () => {
    new s();
  });
})();
