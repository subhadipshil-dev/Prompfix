// Wizard state
let currentStep = 1;
const totalSteps = 5;

// Form elements
const displayNameInput = document.getElementById('display-name');
const socialLinkInput = document.getElementById('social-link');
const apiProviderSelect = document.getElementById('api-provider');
const apiKeyInput = document.getElementById('api-key');
const toggleKeyButton = document.getElementById('toggle-key');
const geminiModelContainer = document.getElementById('gemini-model-container');
const geminiModelSelect = document.getElementById('gemini-model');
const saveHistoryInput = document.getElementById('save-history');
const modeButtons = document.querySelectorAll('.mode-button');
const progressBar = document.getElementById('progress-bar');
const currentStepDisplay = document.getElementById('current-step-display');
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');

let selectedMode = 'Basic';

// Initialize
window.addEventListener('DOMContentLoaded', () => {
  loadSavedSettings();
  setupEventListeners();
  updateUI();
});

function setupEventListeners() {
  // API Provider change
  apiProviderSelect.addEventListener('change', (e) => {
    toggleGeminiModelField(e.target.value);
  });

  // Toggle password visibility
  toggleKeyButton.addEventListener('click', (e) => {
    e.preventDefault();
    const isPassword = apiKeyInput.type === 'password';
    apiKeyInput.type = isPassword ? 'text' : 'password';
    toggleKeyButton.textContent = isPassword ? 'Hide' : 'Show';
  });

  // Mode selection
  modeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      modeButtons.forEach((b) => b.classList.remove('active'));
      button.classList.add('active');
      selectedMode = button.dataset.mode;
    });
  });

  // Navigation buttons
  prevButton.addEventListener('click', () => prevStep());
  nextButton.addEventListener('click', () => nextStep());
}

function toggleGeminiModelField(provider) {
  if (provider === 'Gemini') {
    geminiModelContainer.classList.remove('hidden');
  } else {
    geminiModelContainer.classList.add('hidden');
  }
}

function loadSavedSettings() {
  chrome.storage.local.get(
    ['firstName', 'socialLink', 'apiProvider', 'defaultMode', 'saveHistory', 'geminiModel'],
    (stored) => {
      if (stored.firstName) displayNameInput.value = stored.firstName;
      if (stored.socialLink) socialLinkInput.value = stored.socialLink;
      if (stored.apiProvider) apiProviderSelect.value = stored.apiProvider;
      if (stored.defaultMode) selectedMode = stored.defaultMode;
      if (stored.geminiModel) geminiModelSelect.value = stored.geminiModel;
      if (stored.saveHistory) saveHistoryInput.checked = true;

      // Set active mode button
      modeButtons.forEach((b) => {
        b.classList.toggle('active', b.dataset.mode === selectedMode);
        if (b.dataset.mode === selectedMode) {
          b.classList.add('active');
          const check = b.querySelector('.mode-check');
          if (check) check.style.display = 'flex';
        }
      });

      toggleGeminiModelField(apiProviderSelect.value);
    }
  );
}

function updateUI() {
  // Update progress bar
  const progress = (currentStep / totalSteps) * 100;
  progressBar.style.width = progress + '%';
  currentStepDisplay.textContent = currentStep;

  // Show/hide steps
  document.querySelectorAll('.step-container').forEach((step) => {
    step.classList.remove('active', 'exit-left', 'exit-right');
  });
  document.getElementById(`step-${currentStep}`).classList.add('active');

  // Update button visibility
  prevButton.style.visibility = currentStep === 1 ? 'hidden' : 'visible';
  if (currentStep === 5) {
    nextButton.textContent = 'Close Setup';
  } else {
    nextButton.innerHTML = 'Continue <span class="material-symbols-outlined text-[18px]">arrow_forward</span>';
  }
}

function nextStep() {
  if (!validateCurrentStep()) {
    return;
  }

  if (currentStep < totalSteps) {
    const currentStepEl = document.getElementById(`step-${currentStep}`);
    currentStepEl.classList.add('exit-left');

    currentStep++;
    updateUI();
  } else if (currentStep === totalSteps) {
    finishSetup();
  }
}

function prevStep() {
  if (currentStep > 1) {
    const currentStepEl = document.getElementById(`step-${currentStep}`);
    currentStepEl.classList.add('exit-right');

    currentStep--;
    updateUI();
  }
}

function validateCurrentStep() {
  switch (currentStep) {
    case 2: // Profile
      if (!displayNameInput.value.trim()) {
        alert('Please enter your display name.');
        return false;
      }
      break;
    case 3: // API Key
      if (!apiKeyInput.value.trim()) {
        alert('Please enter your API key.');
        return false;
      }
      break;
  }
  return true;
}

async function finishSetup() {
  if (!apiKeyInput.value.trim()) {
    alert('Please provide an API key before finishing.');
    return;
  }

  const dataToSave = {
    setupComplete: true,
    firstName: displayNameInput.value.trim() || 'Developer',
    socialLink: socialLinkInput.value.trim(),
    apiProvider: apiProviderSelect.value,
    defaultMode: selectedMode,
    saveHistory: saveHistoryInput.checked,
    promptHistory: []
  };

  // Add API key
  const storedKeys = await new Promise((resolve) => {
    chrome.storage.local.get(['apiKeys'], (result) => {
      resolve(result.apiKeys || {});
    });
  });

  storedKeys[apiProviderSelect.value] = apiKeyInput.value.trim();
  dataToSave.apiKeys = storedKeys;

  // Add Gemini model if selected
  if (apiProviderSelect.value === 'Gemini') {
    dataToSave.geminiModel = geminiModelSelect.value;
  }

  await new Promise((resolve) => {
    chrome.storage.local.set(dataToSave, resolve);
  });

  // Close the setup tab
  window.close();
}

// Global functions for onclick handlers
window.nextStep = nextStep;
window.prevStep = prevStep;
window.finishSetup = finishSetup;
