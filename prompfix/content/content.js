const BUTTON_ID = 'prompfix-refine-button';
const PANEL_ID = 'prompfix-refine-panel';
let activeTarget = null;
let currentText = '';
let panelElement = null;
let buttonElement = null;
let settings = { defaultMode: 'Balanced', saveHistory: false };

const MODE_NAMES = ['Basic', 'Balanced', 'Advanced'];

// Create the floating refine button
function createButton() {
  if (buttonElement) return buttonElement;
  
  const button = document.createElement('button');
  button.id = BUTTON_ID;
  button.type = 'button';
  button.className = 'prompfix-refine-button';
  button.textContent = 'Refine';
  button.style.display = 'none'; // Hidden by default
  
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    event.preventDefault();
    openPanel();
  });
  
  // Prevent button from losing focus
  button.addEventListener('mousedown', (e) => e.preventDefault());
  
  document.body.appendChild(button);
  buttonElement = button;
  return button;
}

// Position the button near the target element
function positionButton(target) {
  if (!target) return;
  
  const rect = target.getBoundingClientRect();
  const button = createButton();
  
  // Position: right side of the input, vertically centered
  const left = window.scrollX + rect.right - 110;
  const top = window.scrollY + rect.top + (rect.height / 2) - 16;
  
  button.style.top = `${Math.max(8, top)}px`;
  button.style.left = `${Math.max(8, left)}px`;
  button.style.display = 'flex';
  button.classList.remove('hidden');
  
  // Animate in
  button.style.opacity = '0';
  button.style.transform = 'scale(0.9)';
  requestAnimationFrame(() => {
    button.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    button.style.opacity = '1';
    button.style.transform = 'scale(1)';
  });
}

// Hide the button with animation
function hideButton() {
  if (buttonElement) {
    buttonElement.style.transition = 'all 0.2s ease';
    buttonElement.style.opacity = '0';
    buttonElement.style.transform = 'scale(0.9)';
    setTimeout(() => {
      if (buttonElement) {
        buttonElement.style.display = 'none';
      }
    }, 200);
  }
}

// Create the refinement panel
function createPanel() {
  removePanel();
  
  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.className = 'prompfix-panel';
  panel.innerHTML = `
    <header>
      <h3>Refine Prompt</h3>
      <button type="button" id="prompfix-close" title="Close">×</button>
    </header>
    
    <div>
      <label>Original Text</label>
      <textarea id="prompfix-source" placeholder="Enter your prompt here..."></textarea>
    </div>
    
    <div>
      <label>Mode</label>
      <select id="prompfix-mode"></select>
    </div>
    
    <div class="button-row">
      <button type="button" class="primary-button" id="prompfix-generate">
        <span style="display: flex; align-items: center; gap: 6px; justify-content: center;">
          <span>Generate</span>
        </span>
      </button>
      <button type="button" class="secondary-button" id="prompfix-retry">Retry</button>
    </div>
    
    <div class="status-text">Current mode: <strong id="current-mode-display">Balanced</strong></div>
    
    <div class="comment-section">
      <label>Additional Instructions (Optional)</label>
      <input id="prompfix-comment" placeholder="e.g., Make it shorter, more formal, add examples..." />
      <button type="button" class="secondary-button" id="prompfix-rerefine">Re-refine with Comment</button>
    </div>
    
    <div class="output-box hidden" id="prompfix-output"></div>
    <div class="status-text small-text">Click outside to close</div>
  `;

  document.body.appendChild(panel);
  panelElement = panel;
  
  // Setup event listeners
  panel.querySelector('#prompfix-close').addEventListener('click', removePanel);
  panel.querySelector('#prompfix-generate').addEventListener('click', () => generateRefinement(false));
  panel.querySelector('#prompfix-retry').addEventListener('click', () => generateRefinement(false, true));
  panel.querySelector('#prompfix-rerefine').addEventListener('click', () => generateRefinement(true));
  
  // Set source text
  const sourceTextarea = panel.querySelector('#prompfix-source');
  sourceTextarea.value = currentText;
  
  // Setup mode selector
  const modeSelect = panel.querySelector('#prompfix-mode');
  MODE_NAMES.forEach((mode) => {
    const option = document.createElement('option');
    option.value = mode;
    option.textContent = mode;
    modeSelect.appendChild(option);
  });
  modeSelect.value = settings.defaultMode || 'Balanced';
  
  // Update mode display
  updateModeDisplay();
  modeSelect.addEventListener('change', updateModeDisplay);
  
  // Position panel
  positionPanel(panel);
  
  // Add click outside listener
  setTimeout(() => {
    window.addEventListener('mousedown', handleOutsideClick, true);
  }, 100);
  
  return panel;
}

function updateModeDisplay() {
  const modeSelect = panelElement?.querySelector('#prompfix-mode');
  const modeDisplay = panelElement?.querySelector('#current-mode-display');
  if (modeSelect && modeDisplay) {
    modeDisplay.textContent = modeSelect.value;
  }
}

function positionPanel(panel) {
  if (!activeTarget) return;
  
  const rect = activeTarget.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();
  
  // Position below the target element
  let top = window.scrollY + rect.bottom + 12;
  let left = window.scrollX + rect.left;
  
  // Ensure panel stays within viewport
  const maxTop = window.scrollY + window.innerHeight - panelRect.height - 20;
  const maxLeft = window.scrollX + window.innerWidth - panelRect.width - 20;
  
  top = Math.min(top, maxTop);
  left = Math.min(Math.max(left, 20), maxLeft);
  
  panel.style.top = `${top}px`;
  panel.style.left = `${left}px`;
}

function removePanel() {
  if (panelElement) {
    panelElement.style.transition = 'all 0.2s ease';
    panelElement.style.opacity = '0';
    panelElement.style.transform = 'scale(0.98)';
    
    setTimeout(() => {
      if (panelElement) {
        panelElement.remove();
        panelElement = null;
      }
    }, 200);
    
    window.removeEventListener('mousedown', handleOutsideClick, true);
  }
}

function handleOutsideClick(event) {
  if (!panelElement) return;
  if (!panelElement.contains(event.target) && event.target !== buttonElement) {
    removePanel();
  }
}

function openPanel() {
  if (!activeTarget) return;
  
  currentText = getTargetText(activeTarget);
  const panel = createPanel();
  
  const outputBox = panel.querySelector('#prompfix-output');
  if (outputBox) {
    outputBox.classList.add('hidden');
    outputBox.textContent = '';
  }
  
  // Focus on source textarea
  setTimeout(() => {
    const sourceTextarea = panel.querySelector('#prompfix-source');
    if (sourceTextarea) {
      sourceTextarea.focus();
      sourceTextarea.select();
    }
  }, 100);
}

function getTargetText(target) {
  if (target.isContentEditable) {
    return target.innerText.trim();
  }
  if ('value' in target) {
    return target.value.trim();
  }
  return target.textContent.trim();
}

function setTargetText(target, text) {
  if (target.isContentEditable) {
    target.innerText = text;
  } else if ('value' in target) {
    target.value = text;
    target.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

async function generateRefinement(commentMode = false, retry = false) {
  if (!panelElement) return;
  
  const source = panelElement.querySelector('#prompfix-source');
  const mode = panelElement.querySelector('#prompfix-mode').value;
  const comment = panelElement.querySelector('#prompfix-comment').value.trim();
  const outputBox = panelElement.querySelector('#prompfix-output');
  const generateButton = panelElement.querySelector('#prompfix-generate');
  const retryButton = panelElement.querySelector('#prompfix-retry');
  const reRefineButton = panelElement.querySelector('#prompfix-rerefine');

  const prompt = source.value.trim();
  if (!prompt) {
    outputBox.textContent = 'Please enter text to refine.';
    outputBox.classList.remove('hidden');
    return;
  }

  // Set loading state
  setLoadingState(true, generateButton, retryButton, reRefineButton);

  try {
    const refined = await fetchRefinement(prompt, mode, 'Clearer', commentMode ? comment : '');
    
    outputBox.innerHTML = escapeHtml(refined);
    outputBox.classList.remove('hidden');
    
    // Update target text
    setTargetText(activeTarget, refined);
    
    // Save to history
    if (settings.saveHistory) {
      saveHistoryEntry(prompt, refined);
    }
    
    // Scroll to output
    outputBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
  } catch (error) {
    outputBox.innerHTML = `<span style="color: #fca5a5;">Error: ${escapeHtml(error.message)}</span>`;
    outputBox.classList.remove('hidden');
  } finally {
    setLoadingState(false, generateButton, retryButton, reRefineButton);
  }
}

function setLoadingState(loading, generateButton, retryButton, reRefineButton) {
  const buttons = [generateButton, retryButton, reRefineButton].filter(Boolean);
  
  if (loading) {
    buttons.forEach(btn => {
      btn.disabled = true;
      if (btn === generateButton) {
        btn.innerHTML = '<span class="loading-spinner"></span> Working...';
      }
    });
  } else {
    buttons.forEach(btn => {
      btn.disabled = false;
      if (btn === generateButton) {
        btn.innerHTML = '<span>Generate</span>';
      }
    });
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function loadSettings() {
  try {
    const stored = await chrome.storage.local.get(['defaultMode', 'saveHistory']);
    settings.defaultMode = stored.defaultMode || 'Balanced';
    settings.saveHistory = stored.saveHistory || false;
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

async function saveHistoryEntry(input, output) {
  try {
    const stored = await chrome.storage.local.get(['promptHistory']);
    const promptHistory = Array.isArray(stored.promptHistory) ? stored.promptHistory : [];
    const updated = [...promptHistory, { input, output, timestamp: Date.now() }].slice(-20);
    await chrome.storage.local.set({ promptHistory: updated });
  } catch (error) {
    console.error('Failed to save history:', error);
  }
}

function inspectFocus(event) {
  const target = event.target;
  
  // Ignore if clicking inside panel or on button
  if (!target || 
      target.id === BUTTON_ID || 
      target.id === PANEL_ID || 
      (panelElement && panelElement.contains(target))) {
    return;
  }

  const editable = isEditableElement(target);
  if (editable) {
    activeTarget = target;
    currentText = getTargetText(target);
    positionButton(target);
  } else {
    hideButton();
  }
}

function isEditableElement(element) {
  if (!element) return false;
  const tag = element.tagName?.toLowerCase();
  if (tag === 'textarea') return true;
  if (tag === 'input' && /text|search|url|tel|email|password/.test(element.type)) return true;
  if (element.isContentEditable) return true;
  return false;
}

// Event Listeners
window.addEventListener('focusin', inspectFocus);

window.addEventListener('scroll', () => {
  if (activeTarget && !panelElement) {
    positionButton(activeTarget);
  }
  if (panelElement && activeTarget) {
    positionPanel(panelElement);
  }
}, { passive: true });

window.addEventListener('resize', () => {
  if (activeTarget && !panelElement) {
    positionButton(activeTarget);
  }
  if (panelElement) {
    positionPanel(panelElement);
  }
});

// Initialize
document.addEventListener('click', (event) => {
  if (!activeTarget || event.target === buttonElement || (panelElement && panelElement.contains(event.target))) {
    return;
  }
  if (!isEditableElement(event.target)) {
    hideButton();
  }
});

// Load settings on init
loadSettings();
