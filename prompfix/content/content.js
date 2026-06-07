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

// Remember last panel position across uses (persisted)
let lastPanelPosition = null;
chrome.storage.local.get(['lastRefinePanelPosition'], (res) => {
  if (res.lastRefinePanelPosition) {
    lastPanelPosition = res.lastRefinePanelPosition;
  }
});

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
    <div class="panel-header" id="panel-drag-handle">
      <div class="header-left">
        <div class="header-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L13.6 7.2L19 8.8L13.6 10.4L12 15.6L10.4 10.4L5 8.8L10.4 7.2L12 2Z"/><circle cx="17.5" cy="5.5" r="1.8"/></svg>
        </div>
        <div>
          <div class="panel-title">Refine Prompt</div>
          <div class="panel-subtitle">Powered by Prompfix · ${settings.apiProvider || 'OpenAI'}</div>
        </div>
      </div>
      <div class="close-btn" id="panel-close">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </div>
    </div>

    <!-- Opacity adjustment bar -->
    <div class="opacity-bar" id="panel-opacity-bar" title="Drag to adjust panel opacity">
      <div class="opacity-handle" id="panel-opacity-handle"></div>
    </div>

    <div class="panel-body">

      <!-- Original Text -->
      <div>
        <div class="field-label">Original Text</div>
        <div class="text-wrap">
          <textarea id="orig-textarea" class="orig-textarea" placeholder="Your text will appear here..."></textarea>
          <div class="char-count" id="char-count">0 chars</div>
        </div>
      </div>

      <!-- Refinement Mode -->
      <div>
        <div class="field-label">
          Refinement Mode
          <span id="active-mode-badge" class="mode-badge">Advanced</span>
        </div>
        <div class="mode-pills">
          <div class="mpill" data-mode="Basic">Basic</div>
          <div class="mpill" data-mode="Balanced">Balanced</div>
          <div class="mpill active" data-mode="Advanced">Advanced</div>
          <div class="mpill" data-mode="Coding">Coding</div>
          <div class="mpill" data-mode="Shorter">Shorter</div>
          <div class="mpill" data-mode="Professional">Professional</div>
        </div>
      </div>

      <!-- Generate / Retry -->
      <div class="btn-row">
        <button class="btn-generate" id="btn-generate">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style="margin-right:2px"><path d="M12 2L13.6 7.2L19 8.8L13.6 10.4L12 15.6L10.4 10.4L5 8.8L10.4 7.2L12 2Z"/><circle cx="17.5" cy="5.5" r="1.8"/></svg> Generate
        </button>
        <button class="btn-retry" id="btn-retry">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:2px"><path d="M3 2v6h6"/><path d="M21 12A9 9 0 0 0 6 5.3L3 8"/><path d="M21 22v-6h-6"/><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"/></svg> Retry
        </button>
      </div>

      <!-- Output Preview -->
      <div class="output-preview" id="output-preview" style="display:none">
        <div class="output-label"><span class="output-dot"></span> Refined output</div>
        <div class="output-text" id="output-text"></div>
        <div class="output-actions">
          <button class="oa-btn oa-use" id="btn-use">Use this</button>
          <button class="oa-btn oa-copy" id="btn-copy"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:2px"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy</button>
        </div>
      </div>

      <!-- Additional Instructions (collapsible) -->
      <div class="add-instr">
        <div class="add-instr-header">
          <div class="add-instr-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Additional instructions
            <span class="opt-badge">optional</span>
          </div>
        </div>
        <input id="instr-input" class="instr-input" type="text" placeholder="e.g., Make it shorter, more formal, add examples…" />
        <button class="btn-rerefine" id="btn-rerefine">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px"><path d="M3 2v6h6"/><path d="M21 12A9 9 0 0 0 6 5.3L3 8"/><path d="M21 22v-6h-6"/><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"/></svg>
          Re-refine with comment
        </button>
      </div>

    </div>

    <!-- Footer -->
    <div class="panel-footer">
      <div class="footer-hint">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        API key stays on your device
      </div>
      <div class="footer-hint">Press <span class="kbd">Esc</span> to close</div>
    </div>
  `;

  document.body.appendChild(panel);
  panelElement = panel;

  // Set original text and live char count (matching prototype)
  const source = panel.querySelector('#orig-textarea');
  source.value = currentText;
  const charCount = panel.querySelector('#char-count');
  const updateCount = () => { charCount.textContent = source.value.length + ' chars'; };
  source.addEventListener('input', updateCount);
  updateCount();

  // Mode pills (exact from prototype)
  const pills = panel.querySelectorAll('.mpill');
  const modeBadge = panel.querySelector('#active-mode-badge');
  const defaultMode = settings.defaultMode || 'Advanced';
  pills.forEach(pill => {
    if (pill.dataset.mode === defaultMode) {
      pill.classList.add('active');
      modeBadge.textContent = pill.dataset.mode;
    }
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      modeBadge.textContent = pill.dataset.mode;
    });
  });

  // Wire buttons to real logic (using prototype IDs)
  panel.querySelector('#panel-close').addEventListener('click', removePanel);
  panel.querySelector('#btn-generate').addEventListener('click', () => generateRefinement(false));
  panel.querySelector('#btn-retry').addEventListener('click', () => generateRefinement(false, true));
  panel.querySelector('#btn-rerefine').addEventListener('click', () => generateRefinement(true));

  // "Use this" - replaces the original field on the page + save history
  const useBtn = panel.querySelector('#btn-use');
  if (useBtn) {
    useBtn.addEventListener('click', () => {
      const refined = panel.querySelector('#output-text').textContent.trim();
      if (refined && activeTarget) {
        setTargetText(activeTarget, refined);
        if (settings.saveHistory) {
          saveHistoryEntry(source.value, refined);
        }
        removePanel();
      }
    });
  }

  // Copy button
  const copyBtn = panel.querySelector('#btn-copy');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const t = panel.querySelector('#output-text').textContent;
      navigator.clipboard.writeText(t).then(() => {
        const orig = copyBtn.innerHTML;
        copyBtn.innerHTML = 'Copied!';
        setTimeout(() => { copyBtn.innerHTML = orig; }, 1200);
      }).catch(() => {});
    });
  }

  // Position the panel near the active field + outside click
  positionPanel(panel);
  setTimeout(() => {
    window.addEventListener('mousedown', handleOutsideClick, true);
  }, 100);

  // Esc key close (added here for the new panel)
  const escHandler = (e) => {
    if (e.key === 'Escape' && panelElement) {
      removePanel();
      window.removeEventListener('keydown', escHandler, true);
    }
  };
  window.addEventListener('keydown', escHandler, true);

  // === Make panel moveable (drag by header) ===
  makePanelDraggable(panel, panel.querySelector('#panel-drag-handle'));

  // === Opacity control bar ===
  initPanelOpacityControl(panel, panel.querySelector('#panel-opacity-bar'), panel.querySelector('#panel-opacity-handle'));

  return panel;
}

/* Draggable panel logic (similar to logo but for full panel) */
function makePanelDraggable(panel, handle) {
  if (!handle) return;

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

  handle.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    isDragging = true;
    panel.classList.add('dragging');

    const rect = panel.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;
    startX = e.clientX;
    startY = e.clientY;

    handle.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  handle.addEventListener('pointermove', (e) => {
    if (!isDragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    let newLeft = startLeft + dx;
    let newTop = startTop + dy;

    // Keep panel on screen
    const pad = 8;
    const w = panel.offsetWidth;
    const h = panel.offsetHeight;

    newLeft = clamp(newLeft, pad, window.innerWidth - w - pad);
    newTop = clamp(newTop, pad, window.innerHeight - h - pad);

    panel.style.left = `${newLeft}px`;
    panel.style.top = `${newTop}px`;
    panel.style.right = 'auto'; // clear any previous right positioning
  });

  const endDrag = (e) => {
    if (!isDragging) return;
    isDragging = false;
    panel.classList.remove('dragging');

    if (handle.hasPointerCapture(e.pointerId)) {
      handle.releasePointerCapture(e.pointerId);
    }
  };

  handle.addEventListener('pointerup', endDrag);
  handle.addEventListener('pointercancel', endDrag);
}

/* Opacity control bar (drag left/right to change transparency) */
let panelOpacity = 1;

function initPanelOpacityControl(panel, bar, handle) {
  if (!bar || !handle) return;

  const minOpacity = 0.35;
  const maxOpacity = 1;

  const updateOpacity = (clientX) => {
    const rect = bar.getBoundingClientRect();
    let percent = (clientX - rect.left) / rect.width;
    percent = Math.max(0, Math.min(1, percent));

    panelOpacity = minOpacity + (maxOpacity - minOpacity) * percent;
    panel.style.opacity = panelOpacity;
    handle.style.left = `${percent * 100}%`;
  };

  // Set initial position
  handle.style.left = `${(panelOpacity - minOpacity) / (maxOpacity - minOpacity) * 100}%`;

  let dragging = false;

  bar.addEventListener('pointerdown', (e) => {
    dragging = true;
    updateOpacity(e.clientX);
    bar.setPointerCapture(e.pointerId);
  });

  bar.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    updateOpacity(e.clientX);
  });

  const stop = (e) => {
    if (dragging) {
      dragging = false;
      if (bar.hasPointerCapture(e.pointerId)) bar.releasePointerCapture(e.pointerId);
    }
  };

  bar.addEventListener('pointerup', stop);
  bar.addEventListener('pointercancel', stop);
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

    // Remove global listeners (they were added with {capture: true} in some cases)
    window.removeEventListener('mousedown', handleOutsideClick, true);

    setTimeout(() => {
      if (panelElement) {
        panelElement.remove();
        panelElement = null;

        // Re-show the draggable logo after closing
        if (activeTarget && logoElement) {
          logoElement.style.display = 'flex';
          logoElement.style.opacity = '1';
          logoElement.style.transform = 'scale(1)';
        }
      }
    }, 200);
  }
}

function handleOutsideClick(event) {
  if (!panelElement) return;
  if (!panelElement.contains(event.target) && (!logoElement || event.target !== logoElement)) {
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

  // The new panel already sets up the output box as display:none and handles Esc internally in createPanel.
  // Focus the original textarea
  setTimeout(() => {
    const sourceTextarea = panel.querySelector('#orig-textarea');
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

  const source = panelElement.querySelector('#orig-textarea');
  const activePill = panelElement.querySelector('.mpill.active');
  const mode = activePill ? activePill.dataset.mode : (settings.defaultMode || 'Advanced');
  const commentEl = panelElement.querySelector('#instr-input');
  const comment = commentEl ? commentEl.value.trim() : '';
  const outputBox = panelElement.querySelector('#output-preview');
  const outputTextEl = panelElement.querySelector('#output-text');
  const generateButton = panelElement.querySelector('#btn-generate');
  const retryButton = panelElement.querySelector('#btn-retry');
  const reRefineButton = panelElement.querySelector('#btn-rerefine');

  const prompt = source ? source.value.trim() : '';
  if (!prompt) {
    if (outputBox) outputBox.style.display = 'block';
    if (outputTextEl) outputTextEl.textContent = 'Please enter text to refine.';
    return;
  }

  setLoadingState(true, generateButton, retryButton, reRefineButton);

  try {
    const refined = await fetchRefinement(
      prompt,
      mode,
      'Clearer',
      commentMode ? comment : ''
    );

    // Show output box and stream the text character by character
    if (outputBox) outputBox.style.display = 'block';
    if (outputTextEl) outputTextEl.textContent = '';

    let i = 0;
    const stream = setInterval(() => {
      if (outputTextEl) outputTextEl.textContent += refined[i] || '';
      i++;
      if (i >= refined.length) {
        clearInterval(stream);
        if (settings.saveHistory) {
          saveHistoryEntry(prompt, refined);
        }
      }
    }, 12);

  } catch (error) {
    if (outputBox) outputBox.style.display = 'block';
    if (outputTextEl) outputTextEl.innerHTML = `<span style="color:#fca5a5;">Error: ${escapeHtml(error.message)}</span>`;
  } finally {
    setLoadingState(false, generateButton, retryButton, reRefineButton);
  }
}

function setLoadingState(loading, generateButton, retryButton, reRefineButton) {
  const buttons = [generateButton, retryButton, reRefineButton].filter(Boolean);
  
  if (loading) {
    buttons.forEach(btn => {
      btn.disabled = true;
      if (btn.classList.contains('btn-generate')) {
        btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px"><path d="M3 2v6h6"/><path d="M21 12A9 9 0 0 0 6 5.3L3 8"/></svg> Working...';
      }
    });
  } else {
    buttons.forEach(btn => {
      btn.disabled = false;
      if (btn.classList.contains('btn-generate')) {
        btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style="margin-right:4px"><path d="M12 2L13.6 7.2L19 8.8L13.6 10.4L12 15.6L10.4 10.4L5 8.8L10.4 7.2L12 2Z"/><circle cx="17.5" cy="5.5" r="1.8"/></svg> Generate';
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

// saveHistoryEntry provided by api.js (loaded before this script)

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

// Support for popup commands (grab text, replace input, insert at cursor from the extension popup)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'getPageText') {
    let text = '';
    try {
      const sel = (window.getSelection && window.getSelection().toString().trim()) || '';
      if (sel) {
        text = sel;
      } else if (activeTarget) {
        text = getTargetText(activeTarget);
      } else {
        const ae = document.activeElement;
        if (ae && isEditableElement(ae)) {
          text = getTargetText(ae);
        }
      }
    } catch (e) {}
    sendResponse({ success: true, text: text || '' });
    return true;
  }

  if (msg.action === 'replaceActiveInput' && typeof msg.text === 'string') {
    let target = activeTarget;
    if (!target) {
      const ae = document.activeElement;
      if (ae && isEditableElement(ae)) target = ae;
    }
    if (target) {
      setTargetText(target, msg.text);
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'No active editable field' });
    }
    return true;
  }

  if (msg.action === 'insertAtCursor' && typeof msg.text === 'string') {
    const ae = document.activeElement;
    let ok = false;
    try {
      if (ae && (ae.tagName === 'TEXTAREA' || (ae.tagName === 'INPUT' && /^(text|search|url|tel|email|password)$/.test(ae.type || '')))) {
        const start = ae.selectionStart != null ? ae.selectionStart : ae.value.length;
        const end = ae.selectionEnd != null ? ae.selectionEnd : ae.value.length;
        ae.value = ae.value.slice(0, start) + msg.text + ae.value.slice(end);
        const newPos = start + msg.text.length;
        ae.selectionStart = ae.selectionEnd = newPos;
        ae.dispatchEvent(new Event('input', { bubbles: true }));
        ok = true;
      } else if (ae && ae.isContentEditable) {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(msg.text));
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        } else {
          ae.appendChild(document.createTextNode(msg.text));
        }
        ok = true;
      }
    } catch (e) {}
    sendResponse({ success: ok });
    return true;
  }

  return false;
});
