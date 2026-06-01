const form = document.getElementById('setup-form');
const firstNameInput = document.getElementById('first-name');
const socialLinkInput = document.getElementById('social-link');
const defaultModeInput = document.getElementById('default-mode');
const apiProviderInput = document.getElementById('api-provider');
const apiKeyInput = document.getElementById('api-key');
const toggleKeyButton = document.getElementById('toggle-key');
const saveHistoryInput = document.getElementById('save-history');
const statusMessage = document.getElementById('status-message');

window.addEventListener('DOMContentLoaded', async () => {
  const stored = await chrome.storage.local.get([
    'firstName',
    'socialLink',
    'defaultMode',
    'apiProvider',
    'saveHistory'
  ]);

  if (stored.firstName) firstNameInput.value = stored.firstName;
  if (stored.socialLink) socialLinkInput.value = stored.socialLink;
  if (stored.defaultMode) defaultModeInput.value = stored.defaultMode;
  if (stored.apiProvider) apiProviderInput.value = stored.apiProvider;
  saveHistoryInput.checked = stored.saveHistory || false;
});

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
  const saveHistory = saveHistoryInput.checked;

  if (!firstName || !apiKey) {
    statusMessage.textContent = 'Please fill in your name and API key.';
    return;
  }

  await chrome.storage.local.set({
    setupComplete: true,
    firstName,
    socialLink,
    defaultMode,
    apiProvider,
    apiKey,
    saveHistory,
    promptHistory: []
  });

  statusMessage.textContent = 'Setup complete — closing this tab now.';
  setTimeout(() => window.close(), 700);
});
