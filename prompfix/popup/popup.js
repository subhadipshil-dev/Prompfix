const inputPrompt = document.getElementById('input-prompt');
const refineButton = document.getElementById('refine-button');
const refinedText = document.getElementById('refined-text');
const copyButton = document.getElementById('copy-button');
const copyFeedback = document.getElementById('copy-feedback');
const styleButtons = Array.from(document.querySelectorAll('.style-btn'));
const modeButtons = Array.from(document.querySelectorAll('.mode-btn'));
const manageKeysButton = document.getElementById('manage-keys-button');
const notice = document.getElementById('notice');
const statusModel = document.getElementById('status-model');
const headerProvider = document.getElementById('header-provider');

let selectedStyle = 'Clearer';
let selectedMode = 'Balanced';
let saveHistory = false;
let promptHistory = [];

// Initialize
async function init() {
  await loadSettings();
  setupEventListeners();
}

async function loadSettings() {
  try {
    const stored = await chrome.storage.local.get([
      'setupComplete',
      'firstName',
      'defaultMode',
      'saveHistory',
      'promptHistory',
      'apiProvider'
    ]);

    if (!stored.setupComplete) {
      showNotice('Please finish setup before using Prompfix.', 'error');
      refineButton.disabled = true;
      refineButton.style.opacity = '0.6';
      return;
    }

    selectedMode = stored.defaultMode || 'Balanced';
    saveHistory = stored.saveHistory || false;
    promptHistory = Array.isArray(stored.promptHistory) ? stored.promptHistory : [];
    
    // Show provider in header pill
    if (stored.apiProvider && headerProvider) {
      headerProvider.textContent = stored.apiProvider;
    }

    // Set initial active mode button
    if (modeButtons.length) {
      modeButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === selectedMode);
      });
    }

    // Footer status
    if (statusModel) {
      statusModel.textContent = stored.apiProvider || 'Ready';
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
    showNotice('Failed to load settings. Please try again.', 'error');
  }
}

function setupEventListeners() {
  // Mode buttons (Basic / Balanced / Advanced)
  modeButtons.forEach((button) => {
    button.addEventListener('click', () => setActiveMode(button));
  });

  // Style button selection
  styleButtons.forEach((button) => {
    button.addEventListener('click', () => setActiveStyle(button));
  });

  // Refine button
  refineButton.addEventListener('click', handleRefine);

  // Copy button
  copyButton.addEventListener('click', handleCopy);

  // Settings button
  manageKeysButton.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('setup/setup.html') });
  });

  // Keyboard shortcut - Ctrl/Cmd + Enter to refine
  inputPrompt.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleRefine();
    }
  });
}

function setActiveMode(button) {
  modeButtons.forEach((btn) => btn.classList.remove('active'));
  button.classList.add('active');
  selectedMode = button.dataset.mode;
}

function setActiveStyle(button) {
  styleButtons.forEach((btn) => btn.classList.remove('active'));
  button.classList.add('active');
  selectedStyle = button.dataset.style;
}

async function handleRefine() {
  const prompt = inputPrompt.value.trim();
  if (!prompt) {
    showNotice('Please enter a prompt to refine.', 'error');
    inputPrompt.focus();
    return;
  }

  hideNotice();
  setLoadingState(true);

  try {
    const result = await sendRefineRequest(prompt, selectedMode, selectedStyle);
    displayRefinedText(result.refined);
    
    if (saveHistory) {
      addHistoryItem(prompt, result.refined);
    }
  } catch (error) {
    showNotice(error.message || 'Unable to refine prompt. Please try again.', 'error');
  } finally {
    setLoadingState(false);
  }
}

function setLoadingState(loading) {
  if (!refineButton) return;

  if (loading) {
    refineButton.disabled = true;
    refineButton.innerHTML = `
      <span class="pf-spin" aria-hidden="true">
        <span class="material-symbols-outlined" style="font-size: 20px; line-height: 1;">refresh</span>
      </span>
      <span>Refining...</span>
    `;
  } else {
    refineButton.disabled = false;
    refineButton.innerHTML = `
      <span class="material-symbols-outlined">magic_button</span>
      <span>Refine Prompt</span>
    `;
  }
}

function displayRefinedText(text) {
  refinedText.innerHTML = '';
  const textNode = document.createElement('div');
  textNode.textContent = text;
  textNode.style.whiteSpace = 'pre-wrap';
  textNode.style.wordBreak = 'break-word';
  refinedText.appendChild(textNode);
  
  // Add subtle highlight animation
  refinedText.style.animation = 'none';
  setTimeout(() => {
    refinedText.style.animation = 'slideIn 0.4s ease';
  }, 10);
}

async function handleCopy() {
  const text = refinedText.textContent.trim();
  if (!text || text === 'Your refined prompt will appear here...') return;
  
  try {
    await navigator.clipboard.writeText(text);
    showCopyFeedback();
  } catch (error) {
    console.error('Failed to copy:', error);
    showNotice('Failed to copy to clipboard.', 'error');
  }
}

function showCopyFeedback() {
  copyFeedback.classList.add('show');
  setTimeout(() => {
    copyFeedback.classList.remove('show');
  }, 2000);
}

function showNotice(message, type = 'error') {
  notice.textContent = message;
  notice.className = `pf-notice ${type}`;
  
  // Auto-hide success messages
  if (type === 'success') {
    setTimeout(() => hideNotice(), 3000);
  }
}

function hideNotice() {
  notice.className = 'pf-notice';
  notice.textContent = '';
}

async function sendRefineRequest(prompt, mode, style) {
  const refined = await fetchRefinement(prompt, mode, style);
  return { refined };
}

function addHistoryItem(input, output) {
  const entry = { input, output, timestamp: Date.now() };
  promptHistory = [...(promptHistory || []), entry].slice(-20);
  chrome.storage.local.set({ promptHistory });
}

// Initialize when DOM is ready
function startEntranceAnimation() {
  const popup = document.getElementById('prompfix-popup');
  if (popup) {
    // Force reflow then let CSS animation run (reliable entrance)
    popup.style.animation = 'none';
    // trigger reflow
    void popup.offsetWidth;
    popup.style.animation = '';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init();
    startEntranceAnimation();
  });
} else {
  init();
  startEntranceAnimation();
}
