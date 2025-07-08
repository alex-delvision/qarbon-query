(() => {
  'use strict';
  'undefined' != typeof window &&
    (window.qarbonTracker = new (class {
      apiPatterns = [
        /api\.openai\.com\/v1\/chat\/completions/,
        /chat\.openai\.com\/backend-api\/conversation/,
        /api\.anthropic\.com\/v1\/messages/,
        /claude\.ai\/api\/organizations\/.*\/chat_conversations\/.*\/completion/,
        /generativelanguage\.googleapis\.com\/v1.*\/models\/.*:generateContent/,
        /bard\.google\.com\/_\/BardChatUi\/data/,
        /gemini\.google\.com\/_\/BardChatUi\/data/,
        /bedrock.*\.amazonaws\.com\/model\/.*\/invoke/,
      ];
      captures = [];
      storageKey = 'qarbon_agnostic_captures';
      constructor() {
        this.initialize();
      }
      initialize() {
        (this.interceptFetch(),
          this.interceptXHR(),
          this.loadCaptures(),
          setInterval(() => this.syncCaptures(), 3e4));
      }
      interceptFetch() {
        const t = window.fetch;
        window.fetch = async (...e) => {
          const s = await t(...e);
          try {
            const t = 'string' == typeof e[0] ? e[0] : e[0].url;
            this.shouldCapture(t) &&
              s
                .clone()
                .text()
                .then(s => {
                  this.captureAPICall({
                    url: t,
                    method: e[1]?.method || 'GET',
                    timestamp: Date.now(),
                    responseSize: s.length,
                    responseBody: this.sanitizeResponse(s),
                  });
                })
                .catch(t => {
                  console.warn('Failed to capture response:', t);
                });
          } catch (t) {
            console.warn('Fetch intercept error:', t);
          }
          return s;
        };
      }
      interceptXHR() {
        const t = XMLHttpRequest.prototype,
          e = t.open,
          s = t.send;
        ((t.open = function (t, s, ...a) {
          return (
            (this._qarbonUrl = s),
            (this._qarbonMethod = t),
            e.apply(this, [t, s, ...a])
          );
        }),
          (t.send = function (t) {
            const e = this._qarbonUrl,
              a = this._qarbonMethod,
              o = window.qarbonTracker;
            return (
              e &&
                o &&
                o.shouldCapture(e) &&
                this.addEventListener('load', function () {
                  this.status >= 200 &&
                    this.status < 300 &&
                    o.captureAPICall({
                      url: e,
                      method: a,
                      timestamp: Date.now(),
                      responseSize: this.responseText.length,
                      responseBody: o.sanitizeResponse(this.responseText),
                    });
                }),
              s.apply(this, [t])
            );
          }));
      }
      shouldCapture(t) {
        return this.apiPatterns.some(e => e.test(t));
      }
      captureAPICall(t) {
        const e = { ...t, emissions: this.calculateEmissions(t) };
        (this.captures.push(e),
          this.saveCaptures(),
          window.dispatchEvent(
            new CustomEvent('qarbon-capture', { detail: e })
          ));
      }
      calculateEmissions(t) {
        return (Math.ceil(t.responseSize / 4) / 1e3) * 0.002;
      }
      sanitizeResponse(t) {
        try {
          const e = JSON.parse(t);
          return {
            model: e.model,
            usage: e.usage,
            tokens: e.usage?.total_tokens,
          };
        } catch {
          return { responseLength: t.length };
        }
      }
      loadCaptures() {
        try {
          const t = localStorage.getItem(this.storageKey);
          t && (this.captures = JSON.parse(t));
        } catch (t) {
          console.warn('Failed to load captures:', t);
        }
      }
      saveCaptures() {
        try {
          localStorage.setItem(this.storageKey, JSON.stringify(this.captures));
        } catch (t) {
          (console.warn('Failed to save captures:', t),
            this.cleanupOldCaptures());
        }
      }
      cleanupOldCaptures() {
        const t = Date.now() - 864e5;
        ((this.captures = this.captures.filter(e => e.timestamp > t)),
          this.saveCaptures());
      }
      syncCaptures() {
        window.navigator.onLine &&
          console.log('Syncing captures...', this.captures.length);
      }
      getEmissions(t = 'today') {
        const e = Date.now(),
          s = { today: e - 864e5, week: e - 6048e5, month: e - 2592e6 };
        return this.captures
          .filter(e => e.timestamp > s[t])
          .reduce((t, e) => t + (e.emissions || 0), 0);
      }
      getStats() {
        return {
          totalCaptures: this.captures.length,
          todayEmissions: this.getEmissions('today'),
          weekEmissions: this.getEmissions('week'),
          monthEmissions: this.getEmissions('month'),
        };
      }
    })());
})();
