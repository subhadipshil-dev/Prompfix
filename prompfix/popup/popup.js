const inputPrompt = document.getElementById('input-prompt');
const refineButton = document.getElementById('refine-button');
const refinedText = document.getElementById('refined-text');
const copyButton = document.getElementById('copy-button');
const copyFeedback = document.getElementById('copy-feedback');
const styleButtons = Array.from(document.querySelectorAll('.style-btn'));
const manageKeysButton = document.getElementById('manage-keys-button');
const notice = document.getElementById('notice');
const statusModel = document.getElementById('status-model');

let selectedStyle = 'Clearer';
let defaultMode = 'Balanced';
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

    defaultMode = stored.defaultMode || 'Balanced';
    saveHistory = stored.saveHistory || false;
    promptHistory = Array.isArray(stored.promptHistory) ? stored.promptHistory : [];
    
    // Update status model display
    if (stored.apiProvider) {
      statusModel.textContent = stored.apiProvider;
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
    showNotice('Failed to load settings. Please try again.', 'error');
  }
}

function setupEventListeners() {
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
    const result = await sendRefineRequest(prompt, defaultMode, selectedStyle);
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
  if (loading) {
    refineButton.disabled = true;
    refineButton.innerHTML = `
      <span class="material-symbols-outlined" style="animation: spin 1s linear infinite;">refresh</span>
      <span>Refining...</span>
    `;
    // Add spin animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    style.id = 'spin-animation';
    if (!document.getElementById('spin-animation')) {
      document.head.appendChild(style);
    }
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
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
