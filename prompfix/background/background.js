const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
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

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('setup/setup.html') });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.action === 'refinePrompt') {
    handleRefineRequest(message.payload)
      .then((response) => sendResponse({ success: true, result: response }))
      .catch((error) => sendResponse({ success: false, error: String(error) }));
    return true;
  }
});

async function handleRefineRequest(payload) {
  const { prompt, mode, style, comment } = payload;
  const config = await chrome.storage.local.get(['apiKey', 'apiProvider']);
  const apiKey = config.apiKey;
  const provider = config.apiProvider || 'OpenAI';

  if (!apiKey) {
    throw new Error('Missing API key. Please open setup and add your OpenAI key.');
  }

  const modePrompt = MODE_PROMPTS[mode] || MODE_PROMPTS.Balanced;
  const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.Clearer;
  let userMessage = prompt.trim();

  if (comment && comment.trim()) {
    userMessage += `\n\nRefine again with this request: ${comment.trim()}`;
  }

  const body = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: `${modePrompt} ${stylePrompt}` },
      { role: 'user', content: userMessage }
    ],
    max_tokens: 650,
    temperature: 0.8
  };

  const response = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const refined = data?.choices?.[0]?.message?.content?.trim();
  if (!refined) {
    throw new Error('OpenAI returned an empty response.');
  }

  return { refined, providerUsed: provider };
}
