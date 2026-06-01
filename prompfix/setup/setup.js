const form = document.getElementById('setup-form');
const firstNameInput = document.getElementById('first-name');
const socialLinkInput = document.getElementById('social-link');
const defaultModeInput = document.getElementById('default-mode');
const apiProviderInput = document.getElementById('api-provider');
const geminiModelLabel = document.getElementById('gemini-model-label');
const geminiModelInput = document.getElementById('gemini-model');
const apiKeyInput = document.getElementById('api-key');
const toggleKeyButton = document.getElementById('toggle-key');
const saveHistoryInput = document.getElementById('save-history');
const statusMessage = document.getElementById('status-message');

let storedApiKeys = {};

function getApiKeyHint(provider) {
  switch (provider) {
    case 'Gemini':
      return 'Gemini: Google AI Studio API key (use the API key from your AI Studio project)';
    case 'Claude':
      return 'Claude: Anthropic API key';
    case 'OpenRouter':
      return 'OpenRouter: Bearer token';
    default:
      return 'OpenAI: sk-...';
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  const stored = await chrome.storage.local.get([
    'firstName',
    'socialLink',
    'defaultMode',
    'apiProvider',
    'saveHistory',
    'apiKeys'
  ]);

  storedApiKeys = stored.apiKeys || {};
  if (stored.firstName) firstNameInput.value = stored.firstName;
  if (stored.socialLink) socialLinkInput.value = stored.socialLink;
  if (stored.defaultMode) defaultModeInput.value = stored.defaultMode;
  if (stored.apiProvider) apiProviderInput.value = stored.apiProvider;
  if (stored.geminiModel) geminiModelInput.value = stored.geminiModel;
  saveHistoryInput.checked = stored.saveHistory || false;

  const provider = apiProviderInput.value || 'OpenAI';
  apiKeyInput.value = storedApiKeys[provider] || '';
  apiKeyHint.textContent = getApiKeyHint(provider);
  toggleGeminiModelField(provider);
});

const apiKeyHint = document.getElementById('api-key-hint');

apiProviderInput.addEventListener('change', () => {
  const provider = apiProviderInput.value;
  apiKeyInput.value = storedApiKeys[provider] || '';
  apiKeyHint.textContent = getApiKeyHint(provider);
  toggleGeminiModelField(provider);
});

function toggleGeminiModelField(provider) {
  if (provider === 'Gemini') {
    geminiModelLabel.style.display = 'block';
  } else {
    geminiModelLabel.style.display = 'none';
  }
}

toggleKeyButton.addEventListener('click', () => {
  const isPassword = apiKeyInput.type === 'password';
  apiKeyInput.type = isPassword ? 'text' : 'password';
  toggleKeyButton.textContent = isPassword ? 'Hide' : 'Show';
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const firstName = firstNameInput.value.trim();
  const socialLink = socialLinkInput.value.trim();
  const defaultMode = defaultModeInput.value;
  const apiProvider = apiProviderInput.value;
  const apiKey = apiKeyInput.value.trim();
  const geminiModel = geminiModelInput.value;
  const saveHistory = saveHistoryInput.checked;

  if (!firstName || !apiKey) {
    statusMessage.textContent = 'Please fill in your name and API key.';
    return;
  }

  storedApiKeys[apiProvider] = apiKey;

  const stored = await chrome.storage.local.get(['promptHistory']);
  const promptHistory = Array.isArray(stored.promptHistory) ? stored.promptHistory : [];

  const dataToSave = {
    setupComplete: true,
    firstName,
    socialLink,
    defaultMode,
    apiProvider,
    apiKeys: storedApiKeys,
    saveHistory,
    promptHistory
  };
  if (apiProvider === 'Gemini') {
    dataToSave.geminiModel = geminiModel;
  }

  await chrome.storage.local.set(dataToSave);

  statusMessage.textContent = 'Setup complete — closing this tab now.';
  setTimeout(() => window.close(), 700);
});
