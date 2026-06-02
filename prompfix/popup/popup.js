const inputPrompt = document.getElementById('input-prompt');
const refineButton = document.getElementById('refine-button');
const refinedText = document.getElementById('refined-text');
const copyButton = document.getElementById('copy-button');
const copyFeedback = document.getElementById('copy-feedback');
const styleButtons = Array.from(document.querySelectorAll('.style-button'));
const manageKeysButton = document.getElementById('manage-keys-button');
const notice = document.getElementById('notice');
const statusModel = document.getElementById('status-model');

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
    'promptHistory',
    'apiProvider'
  ]);

  if (!stored.setupComplete) {
    notice.textContent = 'Please finish setup before using Prompfix.';
    notice.classList.remove('hidden');
    refineButton.disabled = true;
    return;
  }

  defaultMode = stored.defaultMode || 'Balanced';
  saveHistory = stored.saveHistory || false;
  promptHistory = Array.isArray(stored.promptHistory) ? stored.promptHistory : [];
  
  // Update status model display
  if (stored.apiProvider) {
    statusModel.textContent = `Model: ${stored.apiProvider}`;
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

  try {
    const result = await sendRefineRequest(prompt, defaultMode, selectedStyle);
    refinedText.textContent = result.refined;
    if (saveHistory) {
      addHistoryItem(prompt, result.refined);
    }
  } catch (error) {
    const errorMsg = error.message || 'Unable to refine prompt right now.';
    notice.textContent = errorMsg;
    notice.classList.remove('hidden');
  } finally {
    refineButton.textContent = 'Refine Prompt';
    refineButton.disabled = false;
  }
});

copyButton.addEventListener('click', async () => {
  const text = refinedText.textContent.trim();
  if (!text || text === 'Your refined prompt will appear here.') return;
  await navigator.clipboard.writeText(text);
  copyFeedback.textContent = 'Copied!';
  setTimeout(() => (copyFeedback.textContent = ''), 1200);
});

async function sendRefineRequest(prompt, mode, style) {
  const refined = await fetchRefinement(prompt, mode, style);
  return { refined };
}

function addHistoryItem(input, output) {
  const entry = { input, output, timestamp: Date.now() };
  promptHistory = [...(promptHistory || []), entry].slice(-20);
  chrome.storage.local.set({ promptHistory });
}

manageKeysButton.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('setup/setup.html') });
});

loadSettings();
