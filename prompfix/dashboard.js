// Prompfix Dashboard - Dark Theme (Manifest V3)
// All data in chrome.storage.local only. No server calls.

// Safe storage helper - works in extension and as plain HTML for testing
const storage = (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) 
  ? chrome.storage.local 
  : {
      get: (keys, cb) => {
        // Mock data for when opened as plain file
        const mock = {
          firstName: 'Subhadip',
          socialLink: 'https://x.com/subhadip',
          apiKeys: { OpenAI: 'sk-test123...', Claude: '' },
          defaultMode: 'Advanced',
          saveHistory: true,
          promptHistory: [
            { input: 'write email job', output: 'Write a professional job application…', timestamp: Date.now() - 120000 },
            { input: 'make code better', output: 'Refactor this function for readability…', timestamp: Date.now() - 3600000 }
          ],
          dashboardStats: {
            promptsRefined: 128,
            apiCallsToday: 24,
            clarityScore: 84,
            modeBreakdown: { Basic: 42, Advanced: 55, Balanced: 31 },
            weekly: [
              { refined: 40, retried: 25 },
              { refined: 55, retried: 35 },
              { refined: 30, retried: 20 },
              { refined: 65, retried: 50 },
              { refined: 48, retried: 30 },
              { refined: 20, retried: 15 },
              { refined: 35, retried: 18 }
            ]
          }
        };
        setTimeout(() => cb(mock), 10);
      },
      set: (obj, cb) => { console.log('Saved (mock):', obj); if (cb) cb(); }
    };

const VIEWS = {
  dashboard: 'view-dashboard',
  apis: 'view-apis',
  profile: 'view-profile',
  'refine-mode': 'view-refine-mode',
  settings: 'view-settings',
  history: 'view-history',
  support: 'view-support'
};

let currentTab = 'dashboard';

function showView(tab) {
  Object.values(VIEWS).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  const viewEl = document.getElementById(VIEWS[tab]);
  if (viewEl) viewEl.style.display = '';

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tab);
  });

  currentTab = tab;
  loadViewData(tab);
}

function loadViewData(tab) {
  storage.get([
    'firstName', 'socialLink', 'apiKeys', 'defaultMode', 
    'saveHistory', 'promptHistory', 'dashboardStats'
  ], (data) => {
    const firstName = data.firstName || 'User';
    const apiKeys = data.apiKeys || {};
    const defaultMode = data.defaultMode || 'Balanced';
    const saveHistory = !!data.saveHistory;
    const promptHistory = Array.isArray(data.promptHistory) ? data.promptHistory : [];
    const stats = data.dashboardStats || {};

    const profileNameEl = document.getElementById('profile-name');
    if (profileNameEl) profileNameEl.textContent = firstName;

    if (tab === 'dashboard') {
      renderDashboard(stats, promptHistory, defaultMode);
    }
    if (tab === 'apis') {
      renderAPIs(apiKeys);
    }
    if (tab === 'profile') {
      renderProfile(firstName, data.socialLink || '');
    }
    if (tab === 'refine-mode') {
      renderRefineMode(defaultMode);
    }
    if (tab === 'settings') {
      renderSettings(saveHistory);
    }
    if (tab === 'history') {
      renderHistory(promptHistory);
    }
  });
}

function renderDashboard(stats, promptHistory, defaultMode) {
  const promptsEl = document.getElementById('stat-prompts-refined');
  if (promptsEl) promptsEl.textContent = stats.promptsRefined ?? (promptHistory.length || 0);

  const callsEl = document.getElementById('stat-api-calls');
  if (callsEl) callsEl.textContent = stats.apiCallsToday ?? 0;

  const clarityEl = document.getElementById('stat-clarity-score');
  if (clarityEl) clarityEl.textContent = stats.clarityScore ?? '--';

  const modeDisplay = document.getElementById('active-mode-display');
  if (modeDisplay) modeDisplay.textContent = defaultMode || 'Advanced';

  const weeklyTotal = document.getElementById('weekly-total');
  if (weeklyTotal) weeklyTotal.textContent = stats.promptsRefined ?? (promptHistory.length || 0);

  const weeklyToday = document.getElementById('weekly-today');
  if (weeklyToday) weeklyToday.textContent = stats.apiCallsToday ?? (Math.floor(Math.random()*6)+1);

  // Dynamic venn bubbles (mode breakdown)
  const vennBasic = document.getElementById('venn-basic');
  const vennAdvanced = document.getElementById('venn-advanced');
  const vennBalanced = document.getElementById('venn-balanced');

  const breakdown = stats.modeBreakdown || { Basic: 30, Advanced: 50, Balanced: 20 };
  if (vennBasic) vennBasic.textContent = breakdown.Basic || 0;
  if (vennAdvanced) vennAdvanced.textContent = breakdown.Advanced || 0;
  if (vennBalanced) vennBalanced.textContent = breakdown.Balanced || 0;

  // Dynamic bar chart heights (weekly)
  const weeklyData = stats.weekly || [
    { refined: 40, retried: 25 },
    { refined: 55, retried: 35 },
    { refined: 30, retried: 20 },
    { refined: 65, retried: 50 },
    { refined: 48, retried: 30 },
    { refined: 20, retried: 15 },
    { refined: 35, retried: 18 }
  ];

  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  days.forEach((day, i) => {
    const data = weeklyData[i] || { refined: 20, retried: 10 };
    const refinedBar = document.getElementById(`bar-${day}-refined`);
    const retriedBar = document.getElementById(`bar-${day}-retried`);
    if (refinedBar) refinedBar.style.height = Math.max(10, Math.min(80, data.refined)) + 'px';
    if (retriedBar) retriedBar.style.height = Math.max(10, Math.min(80, data.retried)) + 'px';
  });
}

function renderAPIs(apiKeys) {
  const listEl = document.getElementById('api-keys-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  const providers = ['OpenAI', 'Claude', 'Gemini', 'OpenRouter'];

  providers.forEach(provider => {
    const key = apiKeys[provider] || '';
    const masked = key ? key.substring(0,4) + '••••••••' + key.slice(-4) : 'Not set';

    const div = document.createElement('div');
    div.className = 'hist-item';
    div.style.marginBottom = '8px';
    div.innerHTML = `
      <div>
        <strong style="color:#c8f565;">${provider}</strong><br>
        <span style="font-family:monospace;font-size:12px;color:#555;">${masked}</span>
      </div>
      <div style="display:flex;gap:6px;">
        <button data-provider="${provider}" class="edit-api-btn inner-pill">Edit</button>
        ${key ? `<button data-provider="${provider}" class="delete-api-btn inner-pill" style="color:#ff6666;">Remove</button>` : ''}
      </div>
    `;
    listEl.appendChild(div);
  });

  listEl.querySelectorAll('.edit-api-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const provider = btn.dataset.provider;
      const current = (apiKeys[provider] || '');
      const newKey = prompt(`Enter API key for ${provider}:`, current);
      if (newKey !== null) saveAPIKey(provider, newKey.trim());
    });
  });

  listEl.querySelectorAll('.delete-api-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const provider = btn.dataset.provider;
      if (confirm(`Remove key for ${provider}?`)) saveAPIKey(provider, '');
    });
  });

  const providerSelect = document.getElementById('api-provider-select');
  const keyInput = document.getElementById('api-key-input');
  const saveBtn = document.getElementById('save-api-key-btn');
  const clearBtn = document.getElementById('clear-api-key-btn');

  if (saveBtn) saveBtn.onclick = () => {
    const p = providerSelect.value;
    const k = keyInput.value.trim();
    if (k) { saveAPIKey(p, k); keyInput.value = ''; }
  };
  if (clearBtn) clearBtn.onclick = () => {
    const p = providerSelect.value;
    if (confirm(`Remove key for ${p}?`)) saveAPIKey(p, '');
  };
}

function saveAPIKey(provider, key) {
  storage.get(['apiKeys'], (res) => {
    const apiKeys = res.apiKeys || {};
    if (key) apiKeys[provider] = key;
    else delete apiKeys[provider];
    storage.set({ apiKeys }, () => loadViewData('apis'));
  });
}

function renderProfile(firstName, socialLink) {
  const nameInput = document.getElementById('profile-firstname');
  const socialInput = document.getElementById('profile-social');
  const saveBtn = document.getElementById('save-profile-btn');

  if (nameInput) nameInput.value = firstName || '';
  if (socialInput) socialInput.value = socialLink || '';

  if (saveBtn) saveBtn.onclick = () => {
    const newName = (nameInput?.value || '').trim() || 'User';
    const newSocial = (socialInput?.value || '').trim();
    storage.set({ firstName: newName, socialLink: newSocial }, () => {
      const pill = document.getElementById('profile-name');
      if (pill) pill.textContent = newName;
      alert('Profile saved!');
      loadViewData('profile');
    });
  };
}

function renderRefineMode(currentMode) {
  const pills = document.querySelectorAll('#refine-mode-pills .mode-pill');
  const saveBtn = document.getElementById('save-refine-mode-btn');
  const descEl = document.getElementById('refine-mode-desc');

  const descriptions = {
    Basic: 'Fix grammar, spelling, and basic clarity only.',
    Balanced: 'Improve clarity while maintaining original tone.',
    Advanced: 'Full rewrite with context, structure, and depth.',
    Coding: 'Optimize for technical accuracy and code clarity.',
    Shorter: 'Make it concise while keeping essential meaning.'
  };

  pills.forEach(pill => {
    pill.classList.toggle('active', pill.dataset.mode === currentMode);
    pill.onclick = () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      if (descEl) descEl.textContent = descriptions[pill.dataset.mode] || '';
    };
  });

  if (descEl) descEl.textContent = descriptions[currentMode] || 'Improves clarity while maintaining original tone.';

  if (saveBtn) saveBtn.onclick = () => {
    const active = document.querySelector('#refine-mode-pills .mode-pill.active');
    if (active) storage.set({ defaultMode: active.dataset.mode }, () => alert('Default mode saved!'));
  };
}

function renderSettings(saveHistory) {
  const toggle = document.getElementById('save-history-toggle');
  if (toggle) {
    toggle.checked = saveHistory;
    toggle.onchange = () => storage.set({ saveHistory: toggle.checked });
  }
}

function renderHistory(promptHistory) {
  const listEl = document.getElementById('history-list');
  const emptyEl = document.getElementById('history-empty');
  if (!listEl || !emptyEl) return;

  listEl.innerHTML = '';
  if (!promptHistory.length) {
    emptyEl.style.display = 'block';
    return;
  }
  emptyEl.style.display = 'none';

  const recent = [...promptHistory].reverse().slice(0, 10);
  recent.forEach(item => {
    const div = document.createElement('div');
    div.className = 'hist-item';
    const time = item.timestamp ? new Date(item.timestamp).toLocaleString() : '';
    div.innerHTML = `
      <span class="hist-orig">${escapeHtml((item.input||'').substring(0,60))}</span>
      <span class="hist-refined">${escapeHtml((item.output||'').substring(0,80))}</span>
      <span class="hist-time">${time}</span>
    `;
    listEl.appendChild(div);
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function initNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = item.dataset.tab;
      if (tab) showView(tab);
    });
  });

  const addBtn = document.getElementById('add-api-key-btn');
  if (addBtn) addBtn.addEventListener('click', () => showView('apis'));

  showView('dashboard');
  console.log('Dashboard initialized. Click sidebar items to switch tabs.');

  storage.get(['firstName'], (res) => {
    const nameEl = document.getElementById('profile-name');
    if (nameEl) nameEl.textContent = res.firstName || 'User';
  });

  const profilePill = document.getElementById('profile-pill');
  if (profilePill) profilePill.addEventListener('click', () => showView('profile'));

  const changeModeBtn = document.getElementById('change-mode-btn');
  if (changeModeBtn) changeModeBtn.addEventListener('click', () => showView('refine-mode'));
}

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();

  storage.get(['dashboardStats', 'promptHistory'], (res) => {
    if (!res.dashboardStats) {
      const demoHistoryLen = res.promptHistory?.length || 42;
      storage.set({
        dashboardStats: {
          promptsRefined: demoHistoryLen,
          apiCallsToday: Math.min(18, demoHistoryLen),
          clarityScore: 84,
          modeBreakdown: { Basic: 42, Advanced: 55, Balanced: 31 },
          weekly: [
            { refined: 40, retried: 25 },
            { refined: 55, retried: 35 },
            { refined: 30, retried: 20 },
            { refined: 65, retried: 50 },
            { refined: 48, retried: 30 },
            { refined: 20, retried: 15 },
            { refined: 35, retried: 18 }
          ]
        }
      });
    }
  });
});
