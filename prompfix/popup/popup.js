const inputPrompt = document.getElementById('input-prompt');
const refineButton = document.getElementById('refine-button');
const originalText = document.getElementById('original-text');
const refinedText = document.getElementById('refined-text');
const copyButton = document.getElementById('copy-button');
const copyFeedback = document.getElementById('copy-feedback');
const styleButtons = Array.from(document.querySelectorAll('.style-button'));
const historySection = document.getElementById('history-section');
const historyList = document.getElementById('history-list');
const historyCount = document.getElementById('history-count');
const notice = document.getElementById('notice');
const greeting = document.getElementById('greeting');

let selectedStyle = 'Clearer';
let defaultMode = 'Balanced';
let saveHistory = false;
let promptHistory = [];

async function loadSettings() {
  const stored = await chrome.storage.local.get([
    'setupComplete',
    'firstName',
    'defaultMode',
    'saveHistory',
    'promptHistory'
  ]);

  if (!stored.setupComplete) {
    notice.textContent = 'Please finish setup before using Prompfix. The setup page should open automatically on install.';
    notice.classList.remove('hidden');
    refineButton.disabled = true;
    return;
  }

  defaultMode = stored.defaultMode || 'Balanced';
  saveHistory = stored.saveHistory || false;
  promptHistory = Array.isArray(stored.promptHistory) ? stored.promptHistory : [];
  greeting.textContent = stored.firstName ? `Hello, ${stored.firstName}.` : 'Refine prompts instantly.';
  if (promptHistory.length > 0 && saveHistory) {
    renderHistory();
    historySection.classList.remove('hidden');
  }
}

function setActiveStyle(button) {
  styleButtons.forEach((btn) => btn.classList.remove('active'));
  button.classList.add('active');
  selectedStyle = button.dataset.style;
}

styleButtons.forEach((button) => {
  button.addEventListener('click', () => setActiveStyle(button));
});

refineButton.addEventListener('click', async () => {
  const prompt = inputPrompt.value.trim();
  if (!prompt) {
    notice.textContent = 'Paste a prompt before refining.';
    notice.classList.remove('hidden');
    return;
  }
  notice.classList.add('hidden');
  refineButton.textContent = 'Refining…';
  refineButton.disabled = true;
  originalText.textContent = prompt;

  try {
    const result = await sendRefineRequest(prompt, defaultMode, selectedStyle);
    refinedText.textContent = result.refined;
    if (saveHistory) {
      addHistoryItem(prompt, result.refined);
    }
  } catch (error) {
    notice.textContent = error.message || 'Unable to refine prompt right now.';
    notice.classList.remove('hidden');
  } finally {
    refineButton.textContent = 'Refine prompt';
    refineButton.disabled = false;
  }
});

copyButton.addEventListener('click', async () => {
  const text = refinedText.textContent.trim();
  if (!text) return;
  await navigator.clipboard.writeText(text);
  copyFeedback.textContent = 'Copied!';
  setTimeout(() => (copyFeedback.textContent = ''), 1200);
});

async function sendRefineRequest(prompt, mode, style) {
  const response = await chrome.runtime.sendMessage({
    action: 'refinePrompt',
    payload: { prompt, mode, style }
  });

  if (!response || !response.success) {
    throw new Error(response?.error || 'Refinement request failed');
  }
  return response.result;
}

function renderHistory() {
  historyList.innerHTML = '';
  const historyToShow = promptHistory.slice(-5).reverse();
  historyCount.textContent = `(${historyToShow.length})`;

  historyToShow.forEach((entry) => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      <strong>${new Date(entry.timestamp).toLocaleString()}</strong>
      <div>${escapeHtml(entry.input)}</div>
      <div class="history-output">${escapeHtml(entry.output)}</div>
    `;
    historyList.appendChild(item);
  });
}

function addHistoryItem(input, output) {
  const entry = { input, output, timestamp: Date.now() };
  promptHistory = [...(promptHistory || []), entry].slice(-20);
  chrome.storage.local.set({ promptHistory });
  renderHistory();
  historySection.classList.remove('hidden');
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

loadSettings();
