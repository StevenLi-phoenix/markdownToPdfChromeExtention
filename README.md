# ChatGPT to PDF Chrome Extension

Easily export ChatGPT conversations to PDF.

## Features

- **Styling**: Keeps ChatGPT's original look
- **Themes**: Light, Dark, or Auto
- **Direct Download**: No print dialog
- **Floating Button**: In-page export with theme options
- **Dark Mode Fix**: Corrects white-on-white text
- **Responsive**: Adapts to screen sizes
- **Shortcut**: Use Ctrl+Shift+P
- **Auto-load**: Loads all messages
- **Theme Memory**: Remembers your choice

## Installation

1. Download or clone the repository
2. Go to `chrome://extensions/` in Chrome
3. Enable "Developer mode"
4. Click "Load unpacked" and select the folder
5. The icon will appear in your toolbar

## Usage

### Floating Button (Recommended)
1. Open a ChatGPT conversation
2. Click the floating PDF button
3. Choose a theme
4. PDF downloads automatically

### Extension Popup
1. Open a ChatGPT conversation
2. Click the extension icon
3. Choose a theme
4. Click export
5. PDF downloads automatically

### Keyboard Shortcut
1. Open a ChatGPT conversation
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Choose a theme
4. PDF downloads automatically

## How It Works

The extension uses browser features to:

1. Extract content with CSS selectors
2. Preserve CSS styles
3. Generate HTML with styles
4. Print to PDF using `window.print()`

## Technical Details

### Supported Sites
- `https://chatgpt.com/*`
- `https://chat.openai.com/*`

### Browser Compatibility
- Chrome (Manifest V3)
- Chromium-based browsers

### Files Structure
```
├── manifest.json          # Extension configuration
├── content-script.js      # Main extraction logic
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
└── icons/                # Extension icons
```

## Permissions

The extension requires minimal permissions:
- `activeTab`: To access the current ChatGPT tab
- `scripting`: To inject the content script
- Host permissions for ChatGPT domains only


## Privacy

This extension:
- Only works on ChatGPT pages
- Does not collect or transmit any data
- Processes everything locally in your browser
- Does not require account access or API keys

## Contributing

Feel free to submit issues or pull requests to improve the extension.

## License

MIT License - see LICENSE file for details.
