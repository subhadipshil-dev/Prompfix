# Prompfix — Prompt Refiner

A minimal Chrome extension for refining text prompts with OpenAI's `gpt-4o-mini`, built with vanilla HTML, CSS, and JavaScript.

## Overview

Prompfix helps you improve rough prompts in two ways:

- `popup` interface for manual prompt refinement
- in-page floating `✨ Refine` button for textareas and contenteditable fields

All user settings, API keys, and (optional) prompt history stay on the device using `chrome.storage.local`.

## Features

- First-time setup flow with user profile, mode selection, provider selection, and secure API key storage
- Prompt refinement styles: Clearer, More Detailed, Shorter, Professional, For Coding
- Refinement modes: Basic, Balanced, Advanced
- Original and refined prompts shown side by side in the popup
- Copy refined prompt with a quick feedback indicator
- In-page refinement panel with generate, retry, and re-refine support
- Optional local history storage for refined prompts
- Clean dark UI with purple accent styling

## Extension Structure

```
prompfix/
├── manifest.json
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── setup/
│   ├── setup.html
│   ├── setup.js
│   └── setup.css
├── content/
│   ├── content.js
   └── content.css
└── background/
    └── background.js
```

## Installation

1. Open Chrome and go to `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select the `prompfix/` folder from this repository.
5. The extension icon should appear in the toolbar.

## Usage

### Setup

- On first install, Prompfix opens the setup page automatically.
- Enter your first name and OpenAI API key.
- Choose a default refinement mode and whether prompt history should be saved.
- The API key is stored in `chrome.storage.local` only.

### Popup

- Click the Prompfix icon to open the popup.
- Paste a prompt into the textarea.
- Pick a refinement style and click `Refine prompt`.
- Copy the refined result with the `Copy refined` button.
- Use `Manage API keys` to update your provider selection or edit saved API keys.

### In-page refinement

- Click into any text input, textarea, or contenteditable area.
- The floating `✨ Refine` button appears near the field.
- Click it to open the refinement panel.
- Generate a refined version and replace the selected text.

## Notes

- The extension currently supports OpenAI, Gemini, OpenRouter, and Claude providers.
- Gemini support uses a Google AI Studio API key stored locally, and you can choose the Gemini model available in your account.
- The API key is never shared with any backend; it is used only for requests from the extension.
- Prompt history is opt-in and stored locally.

## Development

- Edit files in `prompfix/`.
- Load the folder as an unpacked extension in Chrome to test changes.

## License

This project is provided under the terms of the included `LICENSE` file.
