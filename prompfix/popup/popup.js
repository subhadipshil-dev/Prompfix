/* Real implementation for Prompfix popup based on uiideas source specs */

let activeMode = 'Balanced';
let activeStyle = 'Clearer';
let apiProvider = 'OpenAI';

const providerLabel = document.getElementById('provider-label');
const statusProvider = document.getElementById('status-provider');

const promptInput = document.getElementById('prompt-input');
const charCount = document.getElementById('char-count');
const grabBtn = document.getElementById('grab-btn');

const modePills = document.getElementById('mode-pills');
const stylePills = document.getElementById('style-pills');

const refineBtn = document.getElementById('refine-btn');

const outputPlaceholder = document.getElementById('output-placeholder');
const outputContent = document.getElementById('output-content');
const outputText = document.getElementById('output-text');
const outputCopyBtn = document.getElementById('output-copy-btn');

const useThisBtn = document.getElementById('use-this-btn');
const insertPageBtn = document.getElementById('insert-page-btn');

const settingsBtn = document.getElementById('settings-btn');
const historyBtn = document.getElementById('history-btn');
const dashLink = document.getElementById('dash-link');

async function loadSettings() {
  try {
    const stored = await chrome.storage.local.get([
      'apiProvider',
      'defaultMode',
      'defaultStyle',
      'selectedModel'
    ]);

    apiProvider = stored.apiProvider || 'OpenAI';
    activeMode = stored.defaultMode || 'Balanced';
    activeStyle = stored.defaultStyle || 'Clearer';

    if (providerLabel) providerLabel.textContent = apiProvider;

    const model = stored.selectedModel || 'gpt-4o-mini';
    if (statusProvider) statusProvider.textContent = `${apiProvider} · ${model}`;

    setActiveModePill(activeMode);
    setActiveStylePill(activeStyle);
  } catch (err) {
    console.error('loadSettings error', err);
    if (providerLabel) providerLabel.textContent = 'OpenAI';
    if (statusProvider) statusProvider.textContent = 'OpenAI · gpt-4o-mini';
  }
}

function setActiveModePill(mode) {
  if (!modePills) return;
  modePills.querySelectorAll('.pill').forEach(p => {
    p.classList.toggle('active-mode', p.dataset.mode === mode);
  });
  activeMode = mode;
}

function setActiveStylePill(style) {
  if (!stylePills) return;
  stylePills.querySelectorAll('.pill').forEach(p => {
    p.classList.toggle('active-style', p.dataset.style === style);
  });
  activeStyle = style;
}

function updateCharCount() {
  const len = (promptInput?.value || '').length;
  if (charCount) charCount.textContent = `${len} chars`;
}

function persistDefaults() {
  chrome.storage.local.set({
    defaultMode: activeMode,
    defaultStyle: activeStyle
  }).catch(() => {});
}

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// Event listeners
if (modePills) {
  modePills.addEventListener('click', (e) => {
    const pill = e.target.closest('.pill');
    if (pill && pill.dataset.mode) {
      setActiveModePill(pill.dataset.mode);
      persistDefaults();
    }
  });
}

if (stylePills) {
  stylePills.addEventListener('click', (e) => {
    const pill = e.target.closest('.pill');
    if (pill && pill.dataset.style) {
      setActiveStylePill(pill.dataset.style);
      persistDefaults();
    }
  });
}

if (promptInput) {
  promptInput.addEventListener('input', updateCharCount);
}

if (grabBtn) {
  grabBtn.addEventListener('click', async () => {
    try {
      const tab = await getCurrentTab();
      if (!tab || !tab.id) return;
      chrome.tabs.sendMessage(tab.id, { action: 'getPageText' }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('Content script not available on this page');
          return;
        }
        if (response && response.success && response.text) {
          promptInput.value = response.text;
          updateCharCount();
          promptInput.focus();
        }
      });
    } catch (e) {
      console.error('grab failed', e);
    }
  });
}

if (refineBtn) {
  refineBtn.addEventListener('click', async () => {
    const prompt = (promptInput?.value || '').trim();
    if (!prompt) {
      promptInput?.focus();
      return;
    }

    const originalHTML = refineBtn.innerHTML;
    refineBtn.disabled = true;
    refineBtn.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style="animation: spin 0.8s linear infinite"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>
      Refining...
    `;

    outputPlaceholder.style.display = 'none';
    outputContent.style.display = 'block';
    outputText.textContent = '';

    try {
      const refined = await fetchRefinement(prompt, activeMode, activeStyle);

      // Stream the result (deliberate slow animation)
      await streamText(outputText, refined, 12);
    } catch (err) {
      outputText.innerHTML = `<span style="color:#fca5a5;">Error: ${escapeHtml(err.message || 'Refinement failed')}</span>`;
    } finally {
      refineBtn.disabled = false;
      refineBtn.innerHTML = originalHTML;
    }
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function streamText(el, fullText, msPerChar = 12) {
  return new Promise((resolve) => {
    el.textContent = '';
    let i = 0;
    const iv = setInterval(() => {
      if (i >= fullText.length) {
        clearInterval(iv);
        el.textContent = fullText;
        resolve();
        return;
      }
      el.textContent += fullText[i++];
    }, msPerChar);
  });
}

if (outputCopyBtn) {
  outputCopyBtn.addEventListener('click', async () => {
    const txt = outputText.textContent.trim();
    if (!txt) return;
    try {
      await navigator.clipboard.writeText(txt);
      const orig = outputCopyBtn.innerHTML;
      outputCopyBtn.innerHTML = 'Copied!';
      setTimeout(() => { outputCopyBtn.innerHTML = orig; }, 1200);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = txt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  });
}

if (useThisBtn) {
  useThisBtn.addEventListener('click', async () => {
    const txt = outputText.textContent.trim();
    if (!txt) return;
    try {
      const tab = await getCurrentTab();
      if (tab && tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: 'replaceActiveInput', text: txt });
      }
    } catch (e) {}
  });
}

if (insertPageBtn) {
  insertPageBtn.addEventListener('click', async () => {
    const txt = outputText.textContent.trim();
    if (!txt) return;
    try {
      const tab = await getCurrentTab();
      if (tab && tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: 'insertAtCursor', text: txt });
      }
    } catch (e) {}
  });
}

if (settingsBtn) {
  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

if (historyBtn) {
  historyBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
  });
}

if (dashLink) {
  dashLink.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
  });
}

if (promptInput) {
  promptInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      refineBtn?.click();
    }
  });
}

async function init() {
  await loadSettings();
  updateCharCount();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}