// Get emissions data from the active tab
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  chrome.scripting.executeScript(
    {
      target: { tabId: tabs[0].id },
      func: () => (window.getQarbonStats ? window.getQarbonStats() : {}),
    },
    results => {
      if (results && results[0] && results[0].result) {
        const data = results[0].result;
        const today = new Date().toDateString();
        const todayEmissions = data[today] || 0;

        // Calculate week
        let weekTotal = 0;
        const now = new Date();
        for (let i = 0; i < 7; i++) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          weekTotal += data[date.toDateString()] || 0;
        }

        document.getElementById('today').textContent =
          todayEmissions.toFixed(2) + 'g';
        document.getElementById('week').textContent =
          weekTotal.toFixed(2) + 'g';
      }
    }
  );
});
