const LOGO_ID = 'prompfix-logo';
const PANEL_ID = 'prompfix-refine-panel';

let activeTarget = null;
let currentText = '';
let panelElement = null;
let logoElement = null;
let settings = { defaultMode: 'Balanced', saveHistory: false, apiProvider: 'OpenAI' };

const MODE_NAMES = ['Basic', 'Balanced', 'Advanced'];

// Cool professional inline SVG logo mark (sparkle + refinement symbol)
function getLogoSVG() {
  return `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="pfGrad" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop stop-color="#ffffff" stop-opacity="0.95"/>
          <stop offset="1" stop-color="#f0e7ff" stop-opacity="0.85"/>
        </linearGradient>
      </defs>
      <!-- Outer refined shape hint -->
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"/>
      <!-- Main sparkle / refinement glyph -->
      <path d="M12 5.2 L13.6 10.4 L19 12 L13.6 13.6 L12 18.8 L10.4 13.6 L5 12 L10.4 10.4 Z" fill="url(#pfGrad)"/>
      <!-- Small accent dot for polish -->
      <circle cx="17.2" cy="6.8" r="1.35" fill="#fff" fill-opacity="0.9"/>
    </svg>
  `;
}

// Create the draggable floating logo (replaces the old text button)
function createLogo() {
  if (logoElement) return logoElement;

  const logo = document.createElement('div');
  logo.id = LOGO_ID;
  logo.className = 'prompfix-logo';
  logo.innerHTML = getLogoSVG();
  logo.title = 'Prompfix — Refine prompt';
  logo.setAttribute('aria-label', 'Open Prompfix prompt refiner');

  // Drag + click handling
  makeDraggable(logo);

  // Keyboard support
  logo.setAttribute('tabindex', '0');
  logo.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPanel();
    }
  });

  document.body.appendChild(logo);
  logoElement = logo;
  return logo;
}

function makeDraggable(logo) {
  let startClientX = 0;
  let startClientY = 0;
  let startLeft = 0;
  let startTop = 0;
  let hasMoved = false;
  let pointerId = null;

  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

  function onPointerDown(e) {
    if (e.button !== 0) return;
    hasMoved = false;
    pointerId = e.pointerId;

    const rect = logo.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;
    startClientX = e.clientX;
    startClientY = e.clientY;

    logo.setPointerCapture(pointerId);
    logo.classList.add('dragging');
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!logo.hasPointerCapture(e.pointerId)) return;

    const dx = e.clientX - startClientX;
    const dy = e.clientY - startClientY;

    if (!hasMoved && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      hasMoved = true;
    }

    let nextLeft = startLeft + dx;
    let nextTop = startTop + dy;

    const pad = 10;
    const w = logo.offsetWidth;
    const h = logo.offsetHeight;

    nextLeft = clamp(nextLeft, pad, window.innerWidth - w - pad);
    nextTop = clamp(nextTop, pad, window.innerHeight - h - pad);

    logo.style.left = `${nextLeft}px`;
    logo.style.top = `${nextTop}px`;
  }

  function onPointerUp(e) {
    if (pointerId !== null && logo.hasPointerCapture(e.pointerId)) {
      logo.releasePointerCapture(e.pointerId);
    }
    logo.classList.remove('dragging');
    pointerId = null;

    // Persist last user position
    const r = logo.getBoundingClientRect();
    logoPosition = { left: r.left, top: r.top };
    hasUserDragged = true;

    // If it was a clean click (little to no movement), open the panel
    if (!hasMoved) {
      openPanel();
    }
  }

  logo.addEventListener('pointerdown', onPointerDown);
  logo.addEventListener('pointermove', onPointerMove);
  logo.addEventListener('pointerup', onPointerUp);
  logo.addEventListener('lostpointercapture', () => {
    logo.classList.remove('dragging');
  });
}

// Remember last user-dragged position (session)
let logoPosition = null;
let hasUserDragged = false;

function showLogo(target) {
  const logo = createLogo();

  if (hasUserDragged && logoPosition) {
    // Respect where the user last placed it
    logo.style.left = `${logoPosition.left}px`;
    logo.style.top = `${logoPosition.top}px`;
  } else if (target) {
    // Smart initial placement near the field (right side, vertically centered)
    const rect = target.getBoundingClientRect();
    const logoW = 38;
    const logoH = 38;

    let left = window.scrollX + rect.right + 12;
    let top = window.scrollY + rect.top + (rect.height / 2) - (logoH / 2);

    // Keep inside viewport
    const pad = 12;
    left = Math.max(pad, Math.min(left, window.innerWidth - logoW - pad));
    top = Math.max(pad, Math.min(top, window.innerHeight - logoH - pad));

    logo.style.left = `${left}px`;
    logo.style.top = `${top}px`;
  } else {
    // Safe default: bottom-right corner
    logo.style.right = '20px';
    logo.style.bottom = '20px';
    logo.style.left = 'auto';
    logo.style.top = 'auto';
  }

  logo.style.display = 'flex';
  logo.style.opacity = '0';
  logo.style.transform = 'scale(0.8)';

  requestAnimationFrame(() => {
    logo.style.transition = 'opacity 0.18s ease, transform 0.22s cubic-bezier(0.4,0,0.2,1)';
    logo.style.opacity = '1';
    logo.style.transform = 'scale(1)';
  });
}

function hideLogo() {
  if (logoElement) {
    logoElement.style.transition = 'opacity 0.16s ease, transform 0.16s ease';
    logoElement.style.opacity = '0';
    logoElement.style.transform = 'scale(0.85)';

    setTimeout(() => {
      if (logoElement) {
        logoElement.style.display = 'none';
        logoElement.style.transform = 'scale(1)';
      }
    }, 160);
  }
}

// Create the refinement panel (professional glass panel)
function createPanel() {
  removePanel();
  
  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.className = 'prompfix-panel';
  panel.innerHTML = `
    <header>
      <div class="panel-logo" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"/>
          <path d="M12 5.2 L13.6 10.4 L19 12 L13.6 13.6 L12 18.8 L10.4 13.6 L5 12 L10.4 10.4 Z" fill="#fff"/>
          <circle cx="17.2" cy="6.8" r="1.35" fill="#fff" fill-opacity="0.9"/>
        </svg>
      </div>
      <div class="panel-title">
        <h3>Refine Prompt</h3>
        <span class="panel-provider" id="panel-provider">${settings.apiProvider}</span>
      </div>
      <button type="button" id="prompfix-close" title="Close">×</button>
    </header>
    
    <div>
      <label>Original Text</label>
      <textarea id="prompfix-source" placeholder="Enter your prompt here..." spellcheck="false"></textarea>
    </div>
    
    <div class="mode-row">
      <label>Mode</label>
      <select id="prompfix-mode"></select>
    </div>
    
    <div class="button-row">
      <button type="button" class="primary-button" id="prompfix-generate">Generate</button>
      <button type="button" class="secondary-button" id="prompfix-retry">Retry</button>
    </div>
    
    <div class="status-text">Mode: <strong id="current-mode-display">Balanced</strong></div>
    
    <div class="comment-section">
      <label>Additional instructions (optional)</label>
      <input id="prompfix-comment" placeholder="e.g. make it shorter, more formal, add examples..." />
      <button type="button" class="secondary-button" id="prompfix-rerefine">Re-refine with this</button>
    </div>
    
    <div class="output-box hidden" id="prompfix-output"></div>
    <div class="status-text small-text">Press Esc or click outside to close</div>
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

    window.removeEventListener('keydown', handleEscToClose, true);

    setTimeout(() => {
      if (panelElement) {
        panelElement.remove();
        panelElement = null;

        // Re-show the draggable logo after closing (if we still have context)
        if (activeTarget && logoElement) {
          logoElement.style.display = 'flex';
          logoElement.style.opacity = '1';
          logoElement.style.transform = 'scale(1)';
        }
      }
    }, 200);

    window.removeEventListener('mousedown', handleOutsideClick, true);
  }
}

function handleOutsideClick(event) {
  if (!panelElement) return;
  if (!panelElement.contains(event.target) && (!logoElement || event.target !== logoElement)) {
    removePanel();
  }
}

function handleEscToClose(event) {
  if (!panelElement) return;
  if (event.key === 'Escape') {
    removePanel();
  }
}

function openPanel() {
  if (!activeTarget) return;

  currentText = getTargetText(activeTarget);

  // Hide the floating logo while panel is visible (less clutter)
  if (logoElement) {
    logoElement.style.transition = 'opacity 0.12s ease';
    logoElement.style.opacity = '0.15';
  }

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

  // Esc closes panel (professional UX)
  window.addEventListener('keydown', handleEscToClose, true);
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
    // Use chosen mode + a solid default style for in-page refinements
    const refined = await fetchRefinement(
      prompt,
      mode,
      'Clearer',
      commentMode ? comment : ''
    );

    outputBox.textContent = refined;
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
    const stored = await chrome.storage.local.get(['defaultMode', 'saveHistory', 'apiProvider']);
    settings.defaultMode = stored.defaultMode || 'Balanced';
    settings.saveHistory = stored.saveHistory || false;
    settings.apiProvider = stored.apiProvider || 'OpenAI';
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
  
  // Ignore if clicking inside panel or on the logo
  if (!target || 
      target.id === LOGO_ID || 
      target.id === PANEL_ID || 
      (panelElement && panelElement.contains(target))) {
    return;
  }

  const editable = isEditableElement(target);
  if (editable) {
    activeTarget = target;
    currentText = getTargetText(target);
    showLogo(target);
  } else {
    // Only hide logo if user is not interacting with our UI
    if (!panelElement) {
      hideLogo();
    }
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
  if (activeTarget && !panelElement && logoElement && logoElement.style.display !== 'none' && !hasUserDragged) {
    // Only auto-adjust logo position if user hasn't taken manual control
    showLogo(activeTarget);
  }
  if (panelElement && activeTarget) {
    positionPanel(panelElement);
  }
}, { passive: true });

window.addEventListener('resize', () => {
  if (activeTarget && !panelElement && logoElement && logoElement.style.display !== 'none') {
    // Keep logo on screen after resize
    const r = logoElement.getBoundingClientRect();
    const pad = 10;
    const w = logoElement.offsetWidth;
    const h = logoElement.offsetHeight;

    let left = Math.max(pad, Math.min(r.left, window.innerWidth - w - pad));
    let top = Math.max(pad, Math.min(r.top, window.innerHeight - h - pad));

    logoElement.style.left = `${left}px`;
    logoElement.style.top = `${top}px`;
  }
  if (panelElement) {
    positionPanel(panelElement);
  }
});

// Initialize
document.addEventListener('click', (event) => {
  if (!activeTarget || (logoElement && event.target === logoElement) || (panelElement && panelElement.contains(event.target))) {
    return;
  }
  if (!isEditableElement(event.target)) {
    // Don't aggressively hide if user might still want the logo
    if (!hasUserDragged && logoElement) {
      // leave it visible once activated
    }
  }
});

// Load settings on init
loadSettings();
