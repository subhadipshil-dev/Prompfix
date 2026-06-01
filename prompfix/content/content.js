const BUTTON_ID = 'prompfix-refine-button';
const PANEL_ID = 'prompfix-refine-panel';
let activeTarget = null;
let currentText = '';
let panelElement = null;
let buttonElement = null;
let settings = { defaultMode: 'Balanced', saveHistory: false };

const MODE_NAMES = ['Basic', 'Balanced', 'Advanced'];

function createButton() {
  if (buttonElement) return buttonElement;
  const button = document.createElement('button');
  button.id = BUTTON_ID;
  button.type = 'button';
  button.className = 'prompfix-refine-button';
  button.textContent = '✨ Refine';
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    openPanel();
  });
  document.body.appendChild(button);
  buttonElement = button;
  return button;
}

function positionButton(target) {
  if (!target) return;
  const rect = target.getBoundingClientRect();
  const button = createButton();
  const left = window.scrollX + rect.right - 90;
  const top = window.scrollY + rect.top - 10;
  button.style.top = `${Math.max(8, top)}px`;
  button.style.left = `${Math.max(8, left)}px`;
  button.style.display = 'block';
}

function hideButton() {
  if (buttonElement) {
    buttonElement.style.display = 'none';
  }
}

function createPanel() {
  removePanel();
  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.className = 'prompfix-panel';
  panel.innerHTML = `
    <header>
      <h3>Prompfix</h3>
      <button type="button" id="prompfix-close">×</button>
    </header>
    <label>Original text<textarea id="prompfix-source"></textarea></label>
    <label>Mode<select id="prompfix-mode"></select></label>
    <div class="button-row">
      <button type="button" class="primary-button" id="prompfix-generate">Generate</button>
      <button type="button" class="secondary-button" id="prompfix-retry">Retry</button>
    </div>
    <div class="status-text">Current mode uses your saved default and style is Basic.</div>
    <div>
      <label>Comment / change request<input id="prompfix-comment" placeholder="make it shorter, friendlier, more direct" /></label>
      <button type="button" class="secondary-button" id="prompfix-rerefine">Re-refine</button>
    </div>
    <div class="output-box hidden" id="prompfix-output"></div>
    <div class="status-text small-text">Click outside to close.</div>
  `;

  document.body.appendChild(panel);
  panelElement = panel;
  panel.querySelector('#prompfix-close').addEventListener('click', removePanel);
  panel.querySelector('#prompfix-generate').addEventListener('click', () => generateRefinement(false));
  panel.querySelector('#prompfix-retry').addEventListener('click', () => generateRefinement(false, true));
  panel.querySelector('#prompfix-rerefine').addEventListener('click', () => generateRefinement(true));
  panel.querySelector('#prompfix-source').value = currentText;
  const select = panel.querySelector('#prompfix-mode');
  MODE_NAMES.forEach((mode) => {
    const option = document.createElement('option');
    option.value = mode;
    option.textContent = mode;
    select.appendChild(option);
  });
  select.value = settings.defaultMode || 'Balanced';
  positionPanel(panel);
  window.addEventListener('mousedown', handleOutsideClick, true);
  return panel;
}

function positionPanel(panel) {
  if (!activeTarget) return;
  const rect = activeTarget.getBoundingClientRect();
  const top = window.scrollY + rect.bottom + 10;
  const left = window.scrollX + rect.left;
  panel.style.top = `${Math.min(window.scrollY + window.innerHeight - panel.offsetHeight - 12, top)}px`;
  panel.style.left = `${Math.max(12, Math.min(left, window.scrollX + window.innerWidth - panel.offsetWidth - 12))}px`;
}

function removePanel() {
  if (panelElement) {
    panelElement.remove();
    panelElement = null;
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
  outputBox.classList.add('hidden');
  outputBox.textContent = '';
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
    outputBox.textContent = 'Type text to refine before generating.';
    outputBox.classList.remove('hidden');
    return;
  }

  generateButton.textContent = 'Working…';
  generateButton.disabled = true;
  retryButton.disabled = true;
  reRefineButton.disabled = true;

  try {
    const refined = await fetchRefinement(prompt, mode, 'Clearer', commentMode ? comment : '');
    outputBox.textContent = refined;
    outputBox.classList.remove('hidden');
    setTargetText(activeTarget, refined);
    if (settings.saveHistory) {
      saveHistoryEntry(prompt, refined);
    }
  } catch (error) {
    outputBox.textContent = `Error: ${error.message}`;
    outputBox.classList.remove('hidden');
  } finally {
    generateButton.textContent = 'Generate';
    generateButton.disabled = false;
    retryButton.disabled = false;
    reRefineButton.disabled = false;
  }
}

async function loadSettings() {
  const stored = await chrome.storage.local.get(['defaultMode', 'saveHistory']);
  settings.defaultMode = stored.defaultMode || 'Balanced';
  settings.saveHistory = stored.saveHistory || false;
}

async function saveHistoryEntry(input, output) {
  const stored = await chrome.storage.local.get(['promptHistory']);
  const promptHistory = Array.isArray(stored.promptHistory) ? stored.promptHistory : [];
  const updated = [...promptHistory, { input, output, timestamp: Date.now() }].slice(-20);
  await chrome.storage.local.set({ promptHistory: updated });
}

function inspectFocus(event) {
  const target = event.target;
  if (!target || target.id === BUTTON_ID || target.id === PANEL_ID || (panelElement && panelElement.contains(target))) {
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

window.addEventListener('focusin', inspectFocus);
window.addEventListener('scroll', () => { if (activeTarget) positionButton(activeTarget); });
window.addEventListener('resize', () => { if (activeTarget) positionButton(activeTarget); });

loadSettings().then(() => {
  document.addEventListener('click', (event) => {
    if (!activeTarget || event.target === buttonElement || (panelElement && panelElement.contains(event.target))) return;
    if (!isEditableElement(event.target)) {
      hideButton();
    }
  });
});
