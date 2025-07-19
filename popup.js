class PopupController {
  constructor() {
    this.exportButton = document.getElementById('export-button');
    this.statusDot = document.getElementById('status-dot');
    this.statusText = document.getElementById('status-text');
    this.messageCount = document.getElementById('message-count');
    this.errorMessage = document.getElementById('error-message');
    this.successMessage = document.getElementById('success-message');
    this.exportSection = document.getElementById('export-section');
    this.loading = document.getElementById('loading');
    this.quickLightButton = document.getElementById('quick-light');
    this.quickDarkButton = document.getElementById('quick-dark');
    this.themeOptions = document.querySelectorAll('.theme-option');
    
    this.selectedTheme = 'auto';
    
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadThemePreference();
    await this.checkPageStatus();
  }

  setupEventListeners() {
    this.exportButton.addEventListener('click', () => this.handleExport());
    
    // Theme selection
    this.themeOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        const theme = e.currentTarget.getAttribute('data-theme');
        this.selectTheme(theme);
      });
    });
    
    // Quick export buttons
    this.quickLightButton.addEventListener('click', () => this.handleQuickExport('light'));
    this.quickDarkButton.addEventListener('click', () => this.handleQuickExport('dark'));
    
    // Close popup after successful export
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('success-message')) {
        window.close();
      }
    });
  }

  async checkPageStatus() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        this.showError('Could not access current tab');
        return;
      }

      // Check if we're on ChatGPT
      const isChatGPTUrl = tab.url && (
        tab.url.includes('chatgpt.com') || 
        tab.url.includes('chat.openai.com')
      );

      if (!isChatGPTUrl) {
        this.updateStatus('error', 'Not on ChatGPT page');
        this.messageCount.textContent = 'Please navigate to ChatGPT to use this extension';
        return;
      }

      // Inject content script if needed and check page status
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { 
          action: 'checkIfChatGPT' 
        });
        
        if (response.isChatGPT && response.hasConversation) {
          this.updateStatus('success', 'Ready to export');
          this.messageCount.textContent = `Found ${response.messageCount} messages • Theme: ${response.currentTheme}`;
          this.enableExportButtons();
        } else if (response.isChatGPT) {
          this.updateStatus('warning', 'No conversation found');
          this.messageCount.textContent = 'Start or open a conversation to export';
        } else {
          this.updateStatus('error', 'Not on ChatGPT');
          this.messageCount.textContent = 'Please navigate to a ChatGPT conversation';
        }
      } catch (contentScriptError) {
        // Content script might not be injected yet, try to inject it
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content-script.js']
          });
          
          // Try again after injection
          setTimeout(async () => {
            try {
              const response = await chrome.tabs.sendMessage(tab.id, { 
                action: 'checkIfChatGPT' 
              });
              
              if (response.isChatGPT && response.hasConversation) {
                this.updateStatus('success', 'Ready to export');
                this.messageCount.textContent = `Found ${response.messageCount} messages • Theme: ${response.currentTheme}`;
                this.enableExportButtons();
              } else if (response.isChatGPT) {
                this.updateStatus('warning', 'No conversation found');
                this.messageCount.textContent = 'Start or open a conversation to export';
              }
            } catch (retryError) {
              this.updateStatus('warning', 'Page loading...');
              this.messageCount.textContent = 'Please refresh the page and try again';
            }
          }, 1000);
          
        } catch (injectionError) {
          this.updateStatus('error', 'Cannot access page');
          this.messageCount.textContent = 'Please refresh the page and try again';
        }
      }
      
    } catch (error) {
      console.error('Status check failed:', error);
      this.showError('Failed to check page status');
    }
  }

  updateStatus(type, text) {
    this.statusDot.className = `status-dot ${type}`;
    this.statusText.textContent = text;
  }

  async handleExport(theme = null) {
    if (this.exportButton.disabled) return;
    
    this.showLoading(true);
    this.hideMessages();
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const exportTheme = theme || (this.selectedTheme === 'auto' ? null : this.selectedTheme);
      
      const response = await chrome.tabs.sendMessage(tab.id, { 
        action: 'exportToPDF',
        theme: exportTheme
      });
      
      if (response.success) {
        this.showSuccess(`PDF download started! Theme: ${theme || this.selectedTheme}`);
        
        // Auto-close popup after successful export
        setTimeout(() => {
          window.close();
        }, 1500);
      } else {
        this.showError(response.error || 'Export failed');
      }
      
    } catch (error) {
      console.error('Export failed:', error);
      this.showError('Failed to export conversation. Please try refreshing the page.');
    } finally {
      this.showLoading(false);
    }
  }

  async handleQuickExport(theme) {
    if (this.quickLightButton.disabled && this.quickDarkButton.disabled) return;
    
    this.showLoading(true);
    this.hideMessages();
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const response = await chrome.tabs.sendMessage(tab.id, { 
        action: 'exportToPDF',
        theme: theme
      });
      
      if (response.success) {
        this.showSuccess(`${theme.charAt(0).toUpperCase() + theme.slice(1)} PDF download started!`);
        
        // Auto-close popup after successful export
        setTimeout(() => {
          window.close();
        }, 1500);
      } else {
        this.showError(response.error || 'Export failed');
      }
      
    } catch (error) {
      console.error('Export failed:', error);
      this.showError('Failed to export conversation. Please try refreshing the page.');
    } finally {
      this.showLoading(false);
    }
  }

  showLoading(show) {
    this.loading.style.display = show ? 'block' : 'none';
    this.exportSection.style.display = show ? 'none' : 'block';
  }

  showError(message) {
    this.hideMessages();
    this.errorMessage.textContent = message;
    this.errorMessage.style.display = 'block';
  }

  showSuccess(message) {
    this.hideMessages();
    this.successMessage.textContent = message;
    this.successMessage.style.display = 'block';
  }

  hideMessages() {
    this.errorMessage.style.display = 'none';
    this.successMessage.style.display = 'none';
  }

  selectTheme(theme) {
    this.selectedTheme = theme;
    
    // Update UI
    this.themeOptions.forEach(option => {
      if (option.getAttribute('data-theme') === theme) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });
    
    // Save preference
    this.saveThemePreference(theme);
    
    // Update content script
    this.updateContentScriptTheme(theme);
  }

  async loadThemePreference() {
    try {
      const result = await chrome.storage.local.get('pdfTheme');
      const savedTheme = result.pdfTheme || 'auto';
      this.selectTheme(savedTheme);
    } catch (error) {
      console.warn('Could not load theme preference:', error);
      this.selectTheme('auto');
    }
  }

  async saveThemePreference(theme) {
    try {
      await chrome.storage.local.set({ pdfTheme: theme });
    } catch (error) {
      console.warn('Could not save theme preference:', error);
    }
  }

  async updateContentScriptTheme(theme) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.tabs.sendMessage(tab.id, { 
        action: 'setTheme',
        theme: theme
      });
    } catch (error) {
      // Content script might not be loaded yet, that's ok
    }
  }

  enableExportButtons() {
    this.exportButton.disabled = false;
    this.quickLightButton.disabled = false;
    this.quickDarkButton.disabled = false;
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});

// Handle popup opening/closing
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    // Popup became visible, refresh status
    const controller = new PopupController();
  }
});