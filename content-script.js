class ChatGPTToPDF {
  constructor() {
    this.conversationSelector = 'div[class*="group/conversation-turn"]';
    this.isExporting = false;
    this.pdfTheme = 'auto'; // 'auto', 'light', 'dark'
    this.initFloatingButton();
    this.loadSettings();
  }

  async extractCSSStyles(theme = null) {
    // For the new approach, we'll focus on our custom CSS
    // since external CSS often causes more problems than it solves
    const cssTexts = [];
    
    // Add minimal base styles
    cssTexts.push(`
      /* Reset some defaults */
      * { box-sizing: border-box; }
      img { max-width: 100%; height: auto; }
      table { width: 100%; }
    `);

    // Add our optimized PDF CSS
    cssTexts.push(this.getPDFOptimizedCSS(theme));

    return cssTexts.join('\n');
  }

  addComputedStyles(cssTexts) {
    // Extract computed styles for conversation elements as fallback
    const conversationElements = document.querySelectorAll(this.conversationSelector);
    const computedStyles = [];
    
    conversationElements.forEach((element, index) => {
      const computed = getComputedStyle(element);
      const className = `computed-style-${index}`;
      element.classList.add(className);
      
      computedStyles.push(`.${className} {
        font-family: ${computed.fontFamily};
        font-size: ${computed.fontSize};
        line-height: ${computed.lineHeight};
        color: ${computed.color};
        background-color: ${computed.backgroundColor};
        padding: ${computed.padding};
        margin: ${computed.margin};
        border: ${computed.border};
        border-radius: ${computed.borderRadius};
      }`);
    });
    
    cssTexts.push(computedStyles.join('\n'));
  }

  detectCurrentTheme() {
    // Detect ChatGPT's current theme
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    
    // Check various indicators for dark mode
    const isDarkMode = 
      htmlElement.classList.contains('dark') ||
      bodyElement.classList.contains('dark') ||
      htmlElement.getAttribute('data-theme') === 'dark' ||
      getComputedStyle(bodyElement).backgroundColor === 'rgb(52, 53, 65)' ||
      getComputedStyle(bodyElement).backgroundColor === 'rgb(32, 33, 35)' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    return isDarkMode ? 'dark' : 'light';
  }

  getPDFOptimizedCSS(theme = null) {
    const currentTheme = this.detectCurrentTheme();
    const finalTheme = theme || (this.pdfTheme === 'auto' ? 'light' : this.pdfTheme);
    
    const themeColors = {
      light: {
        background: '#ffffff',
        text: '#000000',
        secondaryText: '#333333',
        border: '#dddddd',
        codeBackground: '#f5f5f5',
        codeBorder: '#dddddd',
        userBackground: '#f7f7f8',
        assistantBackground: '#ffffff'
      },
      dark: {
        background: '#212121',
        text: '#ffffff',
        secondaryText: '#e0e0e0',
        border: '#444444',
        codeBackground: '#2d2d2d',
        codeBorder: '#555555',
        userBackground: '#2f2f2f',
        assistantBackground: '#1e1e1e'
      }
    };
    
    const colors = themeColors[finalTheme];
    
    return `
      /* Reset and base styles */
      * {
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      html {
        color-scheme: ${finalTheme};
      }
      
      body {
        background: ${colors.background} !important;
        color: ${colors.text} !important;
        margin: 0;
        padding: 20px;
        font-family: system-ui, -apple-system, sans-serif !important;
        line-height: 1.6 !important;
      }
      
      /* Title styling */
      .main-title {
        font-size: 24px !important;
        font-weight: bold !important;
        margin-bottom: 20px !important;
        color: ${colors.text} !important;
        text-align: center !important;
        border-bottom: 2px solid ${colors.border} !important;
        padding-bottom: 10px !important;
      }
      
      /* Conversation container */
      div[class*="group/conversation-turn"] {
        margin-bottom: 20px !important;
        page-break-inside: avoid !important;
        border-radius: 8px !important;
        padding: 16px !important;
        border: 1px solid ${colors.border} !important;
      }
      
      /* User messages */
      div[class*="group/conversation-turn"]:has([data-message-author-role="user"]),
      div[class*="group/conversation-turn"] [data-message-author-role="user"] {
        background-color: ${colors.userBackground} !important;
      }
      
      /* Assistant messages */
      div[class*="group/conversation-turn"]:has([data-message-author-role="assistant"]),
      div[class*="group/conversation-turn"] [data-message-author-role="assistant"] {
        background-color: ${colors.assistantBackground} !important;
      }
      
      /* Text content */
      div[class*="group/conversation-turn"] *,
      div[class*="group/conversation-turn"] p,
      div[class*="group/conversation-turn"] span,
      div[class*="group/conversation-turn"] div {
        color: ${colors.text} !important;
      }
      
      /* Code blocks */
      pre, code {
        background-color: ${colors.codeBackground} !important;
        color: ${finalTheme === 'dark' ? '#f8f8f2' : '#333333'} !important;
        border: 1px solid ${colors.codeBorder} !important;
        border-radius: 4px !important;
        padding: 8px !important;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace !important;
        font-size: 12px !important;
        overflow-wrap: break-word !important;
        white-space: pre-wrap !important;
      }
      
      /* Links */
      a {
        color: ${finalTheme === 'dark' ? '#66b3ff' : '#0066cc'} !important;
        text-decoration: underline !important;
      }
      
      /* Lists */
      ul, ol {
        color: ${colors.text} !important;
      }
      
      li {
        color: ${colors.text} !important;
        margin-bottom: 4px !important;
      }
      
      /* Tables */
      table {
        border-collapse: collapse !important;
        border: 1px solid ${colors.border} !important;
      }
      
      th, td {
        border: 1px solid ${colors.border} !important;
        padding: 8px !important;
        color: ${colors.text} !important;
      }
      
      th {
        background-color: ${colors.codeBackground} !important;
        font-weight: bold !important;
      }
      
      /* Blockquotes */
      blockquote {
        border-left: 4px solid ${colors.border} !important;
        padding-left: 16px !important;
        margin-left: 0 !important;
        color: ${colors.secondaryText} !important;
        background-color: ${colors.codeBackground} !important;
        padding: 12px 16px !important;
        border-radius: 4px !important;
      }
      
      /* Remove ChatGPT UI elements that shouldn't be in PDF */
      button, [role="button"], .cursor-pointer {
        display: none !important;
      }
      
      /* Ensure proper text visibility */
      .text-white {
        color: ${colors.text} !important;
      }
      
      .bg-white {
        background-color: ${colors.background} !important;
      }
      
      @media print {
        body { margin: 0; padding: 20px; }
        * { 
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
      }
    `;
  }

  async scrollToLoadAllMessages() {
    // Scroll to bottom to ensure all lazy-loaded messages are rendered
    return new Promise((resolve) => {
      const scrollStep = () => {
        const currentScroll = window.pageYOffset;
        window.scrollTo(0, document.body.scrollHeight);
        
        setTimeout(() => {
          if (window.pageYOffset === currentScroll) {
            // No more content to load
            resolve();
          } else {
            scrollStep();
          }
        }, 300);
      };
      
      scrollStep();
    });
  }

  extractConversationHTML() {
    const conversationElements = document.querySelectorAll(this.conversationSelector);
    if (conversationElements.length === 0) {
      throw new Error('No conversation messages found on this page');
    }

    return Array.from(conversationElements)
      .map(element => element.outerHTML)
      .join('\n');
  }

  async generatePDFDirectly(conversationHTML, cssStyles, filename) {
    // Create a temporary iframe for PDF generation
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.width = '8.5in';
    iframe.style.height = '11in';
    document.body.appendChild(iframe);
    
    const title = document.title || 'ChatGPT Conversation';
    const timestamp = new Date().toLocaleString();
    
    const htmlContent = `<!DOCTYPE html>
<html dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    ${cssStyles}
  </style>
</head>
<body>
  <h1 class="main-title">${title}</h1>
  <div style="text-align: center; color: #666; font-size: 12px; margin-bottom: 20px;">Exported on ${timestamp}</div>
  ${conversationHTML}
</body>
</html>`;
    
    iframe.contentDocument.open();
    iframe.contentDocument.write(htmlContent);
    iframe.contentDocument.close();
    
    // Wait for content to load
    await new Promise(resolve => {
      iframe.onload = resolve;
      setTimeout(resolve, 1000); // fallback
    });
    
    try {
      // Try to print to PDF
      const printWindow = iframe.contentWindow;
      printWindow.focus();
      
      // Auto-download approach using print
      printWindow.print();
      
      // Alternative: create download link for the HTML
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = filename + '.html';
      downloadLink.style.display = 'none';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
      
    } finally {
      // Clean up
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 2000);
    }
  }

  async exportToPDF(theme = null) {
    if (this.isExporting) {
      console.log('Export already in progress');
      return;
    }

    this.isExporting = true;
    
    try {
      // Show loading state
      this.showStatus('Loading all messages...');
      
      // Ensure all messages are loaded
      await this.scrollToLoadAllMessages();
      
      this.showStatus('Extracting conversation...');
      
      // Extract conversation HTML
      const conversationHTML = this.extractConversationHTML();
      
      this.showStatus('Applying theme and styles...');
      
      // Extract and preserve CSS with theme
      const cssStyles = await this.extractCSSStyles(theme);
      
      this.showStatus('Generating PDF...');
      
      // Generate filename
      const title = document.title || 'ChatGPT Conversation';
      const timestamp = new Date().toISOString().slice(0, 16).replace(/[:\-]/g, '');
      const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}`;
      
      // Generate PDF directly
      await this.generatePDFDirectly(conversationHTML, cssStyles, filename);
      
      this.showStatus('PDF exported successfully!', 'success');
      
    } catch (error) {
      console.error('Export failed:', error);
      this.showStatus(`Export failed: ${error.message}`, 'error');
    } finally {
      this.isExporting = false;
      // Clear status after 3 seconds
      setTimeout(() => this.clearStatus(), 3000);
    }
  }

  showStatus(message, type = 'info') {
    // Remove existing status if any
    this.clearStatus();
    
    const statusElement = document.createElement('div');
    statusElement.id = 'chatgpt-pdf-status';
    statusElement.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#2196f3'};
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      max-width: 300px;
    `;
    statusElement.textContent = message;
    
    document.body.appendChild(statusElement);
  }

  clearStatus() {
    const existingStatus = document.getElementById('chatgpt-pdf-status');
    if (existingStatus) {
      existingStatus.remove();
    }
  }

  initFloatingButton() {
    // Create floating action button
    const floatingButton = document.createElement('div');
    floatingButton.id = 'chatgpt-pdf-floating-btn';
    floatingButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10,9 9,9 8,9"/>
      </svg>
      <span>PDF</span>
    `;
    
    floatingButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 70px;
      height: 70px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      cursor: pointer;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 10px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      transition: all 0.3s ease;
      user-select: none;
      border: none;
      gap: 2px;
    `;
    
    // Hover effects
    floatingButton.addEventListener('mouseenter', () => {
      floatingButton.style.transform = 'scale(1.1)';
      floatingButton.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
    });
    
    floatingButton.addEventListener('mouseleave', () => {
      floatingButton.style.transform = 'scale(1)';
      floatingButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    });
    
    // Click handler
    floatingButton.addEventListener('click', () => {
      this.showThemeSelector();
    });
    
    // Add to page after a short delay to ensure DOM is ready
    setTimeout(() => {
      if (document.body && !document.getElementById('chatgpt-pdf-floating-btn')) {
        document.body.appendChild(floatingButton);
      }
    }, 2000);
  }

  showThemeSelector() {
    // Remove existing selector if any
    const existing = document.getElementById('chatgpt-pdf-theme-selector');
    if (existing) {
      existing.remove();
      return;
    }
    
    const selector = document.createElement('div');
    selector.id = 'chatgpt-pdf-theme-selector';
    selector.innerHTML = `
      <div class="theme-header">Choose PDF Theme</div>
      <button class="theme-option" data-theme="light">
        <div class="theme-preview light-preview"></div>
        <span>Light</span>
      </button>
      <button class="theme-option" data-theme="dark">
        <div class="theme-preview dark-preview"></div>
        <span>Dark</span>
      </button>
      <button class="theme-option" data-theme="auto">
        <div class="theme-preview auto-preview"></div>
        <span>Auto</span>
      </button>
    `;
    
    selector.style.cssText = `
      position: fixed;
      bottom: 100px;
      right: 20px;
      background: white;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
      z-index: 10001;
      font-family: system-ui, -apple-system, sans-serif;
      min-width: 200px;
      border: 1px solid #e5e7eb;
    `;
    
    // Add styles for selector components
    const style = document.createElement('style');
    style.textContent = `
      #chatgpt-pdf-theme-selector .theme-header {
        font-weight: 600;
        margin-bottom: 12px;
        color: #374151;
        text-align: center;
        font-size: 14px;
      }
      
      #chatgpt-pdf-theme-selector .theme-option {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        padding: 12px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        background: white;
        cursor: pointer;
        margin-bottom: 8px;
        transition: all 0.2s ease;
        font-size: 14px;
        color: #374151;
      }
      
      #chatgpt-pdf-theme-selector .theme-option:hover {
        border-color: #3b82f6;
        background: #f8fafc;
      }
      
      #chatgpt-pdf-theme-selector .theme-option:last-child {
        margin-bottom: 0;
      }
      
      #chatgpt-pdf-theme-selector .theme-preview {
        width: 24px;
        height: 24px;
        border-radius: 4px;
        border: 1px solid #d1d5db;
      }
      
      #chatgpt-pdf-theme-selector .light-preview {
        background: linear-gradient(45deg, #ffffff 50%, #f3f4f6 50%);
      }
      
      #chatgpt-pdf-theme-selector .dark-preview {
        background: linear-gradient(45deg, #1f2937 50%, #374151 50%);
      }
      
      #chatgpt-pdf-theme-selector .auto-preview {
        background: linear-gradient(45deg, #ffffff 25%, #1f2937 25%, #1f2937 50%, #ffffff 50%, #ffffff 75%, #1f2937 75%);
        background-size: 8px 8px;
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(selector);
    
    // Add click handlers for theme options
    selector.querySelectorAll('.theme-option').forEach(option => {
      option.addEventListener('click', (e) => {
        const theme = e.currentTarget.getAttribute('data-theme');
        this.pdfTheme = theme;
        this.saveSettings();
        selector.remove();
        style.remove();
        this.exportToPDF(theme === 'auto' ? null : theme);
      });
    });
    
    // Close selector when clicking outside
    setTimeout(() => {
      document.addEventListener('click', (e) => {
        if (!selector.contains(e.target) && !document.getElementById('chatgpt-pdf-floating-btn').contains(e.target)) {
          selector.remove();
          style.remove();
        }
      }, { once: true });
    }, 100);
  }

  saveSettings() {
    localStorage.setItem('chatgpt-pdf-settings', JSON.stringify({
      theme: this.pdfTheme
    }));
  }

  loadSettings() {
    try {
      const settings = localStorage.getItem('chatgpt-pdf-settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        this.pdfTheme = parsed.theme || 'auto';
      }
    } catch (error) {
      console.warn('Could not load PDF settings:', error);
    }
  }
}

// Initialize the extension
const chatGPTToPDF = new ChatGPTToPDF();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'exportToPDF') {
    const theme = request.theme || null;
    chatGPTToPDF.exportToPDF(theme)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Will respond asynchronously
  }
  
  if (request.action === 'setTheme') {
    chatGPTToPDF.pdfTheme = request.theme;
    chatGPTToPDF.saveSettings();
    sendResponse({ success: true });
  }
  
  if (request.action === 'getTheme') {
    sendResponse({ theme: chatGPTToPDF.pdfTheme });
  }
  
  if (request.action === 'checkIfChatGPT') {
    const isChatGPT = window.location.hostname === 'chatgpt.com' || 
                      window.location.hostname === 'chat.openai.com';
    const hasConversation = document.querySelectorAll(chatGPTToPDF.conversationSelector).length > 0;
    
    sendResponse({ 
      isChatGPT, 
      hasConversation,
      messageCount: document.querySelectorAll(chatGPTToPDF.conversationSelector).length,
      currentTheme: chatGPTToPDF.detectCurrentTheme()
    });
  }
});

// Add keyboard shortcut (Ctrl+Shift+P)
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.shiftKey && event.key === 'P') {
    event.preventDefault();
    chatGPTToPDF.exportToPDF();
  }
});

console.log('ChatGPT to PDF extension loaded');