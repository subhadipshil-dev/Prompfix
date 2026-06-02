// API Mode Prompts
const MODE_PROMPTS = {
  Basic: 'Fix only grammar and spelling errors.',
  Balanced: 'Improve clarity and structure while maintaining the original meaning.',
  Advanced: 'Completely rewrite to be more impactful, clear, and well-structured.'
};

// Style Prompts
const STYLE_PROMPTS = {
  Clearer: 'Make it clear and easy to understand.',
  'More Detailed': 'Add more detail and explanation.',
  Shorter: 'Make it concise and brief.',
  Professional: 'Use professional and formal language.',
  'For Coding': 'Optimize for technical accuracy and code clarity.'
};

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('setup/setup.html') });
  }
});

// Handle refinement requests from content/popup scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'refinePrompt') {
    handleRefinement(request, sendResponse);
    return true; // Keep channel open for async response
  }
});

async function handleRefinement(request, sendResponse) {
  try {
    const { prompt, mode, style, comment } = request;
    
    // Get API config
    const stored = await chrome.storage.local.get(['apiKeys', 'apiProvider', 'geminiModel']);
    const provider = stored.apiProvider || 'OpenAI';
    const apiKeys = stored.apiKeys || {};
    const apiKey = apiKeys[provider];
    const geminiModel = stored.geminiModel || 'gemini-3.5-flash';
    
    if (!apiKey) {
      throw new Error(`Missing API key for ${provider}. Please open setup and add it.`);
    }
    
    // Build request
    const modePrompt = MODE_PROMPTS[mode] || MODE_PROMPTS.Balanced;
    const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.Clearer;
    let userMessage = prompt.trim();
    if (comment && comment.trim()) {
      userMessage += `\n\nRefine again with this request: ${comment.trim()}`;
    }
    
    const requestConfigs = buildProviderRequest(provider, apiKey, modePrompt, stylePrompt, userMessage, geminiModel);
    const configs = Array.isArray(requestConfigs) ? requestConfigs : [requestConfigs];
    
    let lastError = null;
    let response;
    let requestConfig;
    for (requestConfig of configs) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      try {
        response = await fetch(requestConfig.url, { 
          ...requestConfig.options,
          signal: controller.signal 
        });
      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error;
        if (error?.name === 'AbortError') {
          lastError = new Error(`${provider} request timed out after 30 seconds.`);
          break;
        }
        console.warn(`Request failed for ${requestConfig.url}:`, error);
        continue;
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`${provider} error response (${response.status}) for ${requestConfig.url}:`, errorText);
        lastError = new Error(`${provider} request failed: ${response.status} - ${errorText}`);
        if (response.status === 404) {
          continue; // try next Gemini candidate if available
        }
        break;
      }
      
      const data = await response.json();
      const refined = extractResponseText(provider, data);
      if (!refined) {
        lastError = new Error(`${provider} returned an empty response.`);
        break;
      }
      return sendResponse({ success: true, refined });
    }

    throw lastError || new Error(`${provider} request failed.`);
  } catch (error) {
    console.error('Refinement error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

function buildProviderRequest(provider, apiKey, modePrompt, stylePrompt, userMessage, geminiModel) {
  const combinedPrompt = `${modePrompt}\n${stylePrompt}\n\nText to refine:\n${userMessage}`;
  
  if (provider === 'Gemini') {
    const models = geminiModel ? [geminiModel] : ['gemini-3.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    return models.map((model) => ({
      url: `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: combinedPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 650
          }
        })
      }
    }));
  } else if (provider === 'Claude') {
    return {
      url: 'https://api.anthropic.com/v1/messages',
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 650,
          messages: [{ role: 'user', content: combinedPrompt }]
        })
      }
    };
  } else if (provider === 'OpenRouter') {
    return {
      url: 'https://api.openrouter.ai/v1/chat/completions',
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 650,
          messages: [{ role: 'user', content: combinedPrompt }]
        })
      }
    };
  } else {
    // Default to OpenAI
    return {
      url: 'https://api.openai.com/v1/chat/completions',
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 650,
          messages: [{ role: 'user', content: combinedPrompt }]
        })
      }
    };
  }
}

function extractResponseText(provider, data) {
  if (provider === 'Gemini') {
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } else if (provider === 'Claude') {
    return data?.content?.[0]?.text || '';
  } else {
    // OpenAI, OpenRouter
    return data?.choices?.[0]?.message?.content || '';
  }
}
