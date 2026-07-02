const statusEl = document.getElementById('status');
const keysInput = document.getElementById('keysInput');

function setStatus(msg, isError) {
  statusEl.textContent = msg;
  statusEl.style.color = isError ? '#c0392b' : '#27ae60';
}

function parseKeys(raw) {
  return raw.split(',').map((k) => k.trim()).filter(Boolean);
}

async function getStoredKeys() {
  const { bridgeKeys } = await chrome.storage.local.get('bridgeKeys');
  return bridgeKeys && bridgeKeys.length ? bridgeKeys : [];
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

(async () => {
  const keys = await getStoredKeys();
  keysInput.value = keys.join(', ');
})();

document.getElementById('saveKeys').addEventListener('click', async () => {
  const keys = parseKeys(keysInput.value);
  if (!keys.length) {
    setStatus('Enter at least one key name.', true);
    return;
  }
  await chrome.storage.local.set({ bridgeKeys: keys });
  setStatus('Saved keys: ' + keys.join(', '));
});

document.getElementById('export').addEventListener('click', async () => {
  try {
    const keys = await getStoredKeys();
    if (!keys.length) {
      setStatus('No keys configured. Enter keys above and hit Save first.', true);
      return;
    }

    const tab = await getActiveTab();
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (ks) => ks.reduce((acc, k) => { acc[k] = sessionStorage.getItem(k); return acc; }, {}),
      args: [keys],
    });

    if (!result[keys[0]]) {
      setStatus(`No "${keys[0]}" found on this tab.`, true);
      return;
    }

    await chrome.storage.local.set({ bridgedValues: result, bridgedAt: Date.now() });
    setStatus('Exported from ' + new URL(tab.url).origin);
  } catch (e) {
    setStatus('Export failed: ' + e.message, true);
  }
});

document.getElementById('import').addEventListener('click', async () => {
  try {
    const keys = await getStoredKeys();
    const { bridgedValues } = await chrome.storage.local.get('bridgedValues');
    if (!keys.length || !bridgedValues || !bridgedValues[keys[0]]) {
      setStatus('Nothing exported yet. Run Export on the source tab first.', true);
      return;
    }

    const tab = await getActiveTab();
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (data) => {
        Object.entries(data).forEach(([k, v]) => { if (v) sessionStorage.setItem(k, v); });
        location.reload();
      },
      args: [bridgedValues],
    });
    setStatus('Imported into ' + new URL(tab.url).origin);
  } catch (e) {
    setStatus('Import failed: ' + e.message, true);
  }
});
