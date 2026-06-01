const MODE_PROMPTS = {
  Basic: 'Fix grammar, spelling, punctuation, and verb usage only. Keep original wording as close as possible.',
  Balanced: 'Improve grammar, sentence structure, and clarity. Rearrange if needed. Do not change the core meaning.',
  Advanced: 'Rewrite the prompt entirely with stronger context, clearer structure, and a more complete instruction. Preserve the user\'s original intent.'
};
const STYLE_PROMPTS = {
  Clearer: 'Make the prompt easy to understand. Remove ambiguity.',
  'More Detailed': 'Add useful context, specific details, and structure.',
  Shorter: 'Remove unnecessary words. Keep it concise but complete.',
  Professional: 'Improve the tone to be professional and polished.',
  'For Coding': 'Rewrite as a clear, specific developer request with technical precision.'
};

// Send refinement request to background service worker
// The background worker handles all API calls to avoid CORS issues
async function fetchRefinement(prompt, mode, style, comment = '') {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        action: 'refinePrompt',
        prompt,
        mode,
        style,
        comment
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('Message error:', chrome.runtime.lastError);
          reject(new Error('Failed to send request to background service. Please reload the extension.'));
        } else if (!response) {
          reject(new Error('No response from background service. Please reload the extension.'));
        } else if (response.success) {
          resolve(response.refined);
        } else {
          reject(new Error(response.error || 'Refinement failed'));
        }
      }
    );
  });
}
