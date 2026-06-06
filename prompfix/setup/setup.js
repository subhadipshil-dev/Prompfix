// Prompfix Setup Wizard
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
const progressFill = document.getElementById('progress-fill');
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');

let selectedModel = 'GPT-4o';
let selectedStyle = 'Concise';

// Initialize
window.addEventListener('DOMContentLoaded', () => {
  loadSavedSettings();
  setupEventListeners();
  updateUI();
});

function setupEventListeners() {
  // API Provider change
  if (apiProviderSelect) {
    apiProviderSelect.addEventListener('change', (e) => {
      toggleGeminiModelField(e.target.value);
    });
  }

  // Toggle password visibility
  if (toggleKeyButton) {
    toggleKeyButton.addEventListener('click', (e) => {
      e.preventDefault();
      const isPassword = apiKeyInput.type === 'password';
      apiKeyInput.type = isPassword ? 'text' : 'password';
      toggleKeyButton.textContent = isPassword ? 'Hide' : 'Show';
    });
  }

  // Model selection
  document.querySelectorAll('.model-card').forEach((card) => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.model-card').forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
      selectedModel = card.dataset.model;
    });
  });

  // Style selection
  document.querySelectorAll('.style-item').forEach((item) => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.style-item').forEach((i) => i.classList.remove('active'));
      item.classList.add('active');
      selectedStyle = item.dataset.style;
    });
  });

  // Navigation buttons
  if (prevButton) {
    prevButton.addEventListener('click', () => prevStep());
  }
  if (nextButton) {
    nextButton.addEventListener('click', () => nextStep());
  }

  // Finish button
  const finishButton = document.getElementById('finish-button');
  if (finishButton) {
    finishButton.addEventListener('click', finishSetup);
  }
}

function toggleGeminiModelField(provider) {
  if (geminiModelContainer) {
    geminiModelContainer.style.display = provider === 'Gemini' ? 'block' : 'none';
  }
}

function loadSavedSettings() {
  chrome.storage.local.get(
    ['firstName', 'socialLink', 'apiProvider', 'defaultMode', 'saveHistory', 'geminiModel'],
    (stored) => {
      if (stored.firstName && displayNameInput) displayNameInput.value = stored.firstName;
      if (stored.socialLink && socialLinkInput) socialLinkInput.value = stored.socialLink;
      if (stored.apiProvider && apiProviderSelect) apiProviderSelect.value = stored.apiProvider;
      if (stored.defaultMode) selectedStyle = stored.defaultMode;
      if (stored.geminiModel && geminiModelSelect) geminiModelSelect.value = stored.geminiModel;
      if (stored.saveHistory && saveHistoryInput) saveHistoryInput.checked = true;

      // Set active model
      if (stored.defaultMode) {
        document.querySelectorAll('.model-card').forEach((card) => {
          if (card.dataset.model === stored.defaultMode) {
            card.classList.add('active');
            selectedModel = stored.defaultMode;
          } else {
            card.classList.remove('active');
          }
        });
      }

      // Set active style
      document.querySelectorAll('.style-item').forEach((item) => {
        item.classList.toggle('active', item.dataset.style === selectedStyle);
      });

      toggleGeminiModelField(apiProviderSelect?.value || 'OpenAI');
    }
  );
}

function updateUI() {
  // Update progress bar
  const progress = (currentStep / totalSteps) * 100;
  if (progressFill) {
    progressFill.style.width = progress + '%';
  }

  // Update step indicators
  document.querySelectorAll('.progress-step').forEach((step, index) => {
    const stepNum = index + 1;
    step.classList.remove('active', 'completed');
    if (stepNum < currentStep) {
      step.classList.add('completed');
    } else if (stepNum === currentStep) {
      step.classList.add('active');
    }
  });

  // Show/hide steps
  document.querySelectorAll('.step-container').forEach((step, index) => {
    step.classList.toggle('active', index + 1 === currentStep);
  });

  // Update button visibility
  if (prevButton) {
    prevButton.style.visibility = currentStep === 1 ? 'hidden' : 'visible';
  }
  
  if (nextButton) {
    if (currentStep === totalSteps) {
      nextButton.style.display = 'none';
    } else {
      nextButton.style.display = 'flex';
      nextButton.innerHTML = `
        <span>${currentStep === totalSteps - 1 ? 'Finish' : 'Continue'}</span>
        <span class="material-symbols-outlined">arrow_forward</span>
      `;
    }
  }

  // Hide navigation on completion screen
  const setupNav = document.getElementById('setup-nav');
  if (setupNav) {
    setupNav.style.display = currentStep === totalSteps ? 'none' : 'flex';
  }
}

function nextStep() {
  if (!validateCurrentStep()) {
    return;
  }

  if (currentStep < totalSteps) {
    currentStep++;
    updateUI();
  }
}

function prevStep() {
  if (currentStep > 1) {
    currentStep--;
    updateUI();
  }
}

function validateCurrentStep() {
  switch (currentStep) {
    case 1: // Profile
      if (!displayNameInput?.value.trim()) {
        showError('Please enter your display name.');
        return false;
      }
      break;
    case 2: // API Key
      if (!apiKeyInput?.value.trim()) {
        showError('Please enter your API key.');
        return false;
      }
      break;
  }
  return true;
}

function showError(message) {
  // Remove any existing error
  const existingError = document.querySelector('.setup-error');
  if (existingError) {
    existingError.remove();
  }

  // Create error element
  const error = document.createElement('div');
  error.className = 'setup-error';
  error.style.cssText = `
    padding: 12px 16px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 12px;
    color: #fca5a5;
    font-size: 13px;
    margin-bottom: 16px;
    animation: slideIn 0.3s ease;
  `;
  error.textContent = message;

  const activeStep = document.querySelector('.step-container.active');
  if (activeStep) {
    activeStep.insertBefore(error, activeStep.firstChild);
  }

  // Auto-remove after 3 seconds
  setTimeout(() => {
    error.remove();
  }, 3000);
}

async function finishSetup() {
  if (apiKeyInput && !apiKeyInput.value.trim()) {
    showError('Please provide an API key before finishing.');
    return;
  }

  const dataToSave = {
    setupComplete: true,
    firstName: displayNameInput?.value.trim() || 'Developer',
    socialLink: socialLinkInput?.value.trim() || '',
    apiProvider: apiProviderSelect?.value || 'OpenAI',
    defaultMode: 'Balanced', // real runtime modes: Basic | Balanced | Advanced (setup styles are visual only for now)
    saveHistory: saveHistoryInput?.checked || false,
    promptHistory: []
  };

  // Add API key
  try {
    const storedKeys = await new Promise((resolve) => {
      chrome.storage.local.get(['apiKeys'], (result) => {
        resolve(result.apiKeys || {});
      });
    });

    storedKeys[dataToSave.apiProvider] = apiKeyInput?.value.trim() || '';
    dataToSave.apiKeys = storedKeys;

    // Add Gemini model if selected
    if (dataToSave.apiProvider === 'Gemini' && geminiModelSelect) {
      dataToSave.geminiModel = geminiModelSelect.value;
    }

    await new Promise((resolve) => {
      chrome.storage.local.set(dataToSave, resolve);
    });

    // Show success and close
    const finishButton = document.getElementById('finish-button');
    if (finishButton) {
      finishButton.innerHTML = `
        <span class="material-symbols-outlined">check</span>
        <span>Done!</span>
      `;
      finishButton.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    }

    setTimeout(() => {
      window.close();
    }, 1000);
  } catch (error) {
    console.error('Setup failed:', error);
    showError('Failed to save settings. Please try again.');
  }
}

// Global functions for onclick handlers
window.nextStep = nextStep;
window.prevStep = prevStep;
window.finishSetup = finishSetup;
