class ChatGPTToPDF {
  constructor() {
    this.conversationSelector = 'div[class*="group/conversation-turn"]';
    this.isExporting = false;
    this.pdfTheme = 'auto';
    this.hasPreference = false;
    this.initialized = false;
    
    // Initialize floating button after DOM ready, non-blocking
    this.initWhenReady();
  }

  initWhenReady() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.delayedInit());
    } else {
      this.delayedInit();
    }
  }

  async delayedInit() {
    // Only initialize on ChatGPT conversation pages
    if (!this.isChatGPTConversationPage()) {
      return;
    }
    
    // Wait a bit for ChatGPT to fully load
    setTimeout(async () => {
      try {
        await this.loadSettings();
        await this.initFloatingButton();
        this.initialized = true;
      } catch (error) {
        console.warn('ChatGPT PDF: Init failed', error);
      }
    }, 3000);
  }

  isChatGPTConversationPage() {
    // Check if we're on a ChatGPT conversation page (not homepage, settings, etc.)
    const isValidDomain = window.location.hostname === 'chatgpt.com' || 
                         window.location.hostname === 'chat.openai.com';
    
    // Check if URL contains conversation pattern
    const hasConversationPath = window.location.pathname.includes('/c/') || 
                               document.querySelectorAll(this.conversationSelector).length > 0;
    
    return isValidDomain && hasConversationPath;
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
        margin-bottom: 16px !important;
        border-radius: 8px !important;
        padding: 16px !important;
        border: ${finalTheme === 'dark' ? 'none' : '1px solid ' + colors.border} !important;
        background-color: ${finalTheme === 'dark' ? 'transparent' : colors.background} !important;
        overflow: visible !important;
      }
      
      @media print {
        /* Page setup */
        @page {
          margin: 0.75in 0.5in;
          size: letter;
          orphans: 2;
          widows: 2;
        }
        
        body {
          margin: 0;
          padding: 0;
          line-height: 1.4 !important;
        }
        
        /* Conversation containers - allow breaking for long content */
        div[class*="group/conversation-turn"] {
          margin-bottom: 12px !important;
          padding: 8px !important;
          page-break-inside: auto;
          break-inside: auto;
        }
        
        /* Title should not break */
        .main-title {
          margin-bottom: 16px !important;
          page-break-after: avoid;
        }
        
        /* Code blocks can break across pages */
        pre, code {
          page-break-inside: auto;
          break-inside: auto;
          white-space: pre-wrap !important;
          word-wrap: break-word !important;
        }
        
        /* Prevent UI elements from printing */
        button, [role="button"], .cursor-pointer {
          display: none !important;
        }
      }
      
      /* User messages - preserve ChatGPT styling */
      div[class*="group/conversation-turn"]:has([data-message-author-role="user"]) {
        background-color: ${finalTheme === 'dark' ? 'rgba(52, 53, 65, 0.8)' : colors.userBackground} !important;
        border: ${finalTheme === 'dark' ? 'none' : '1px solid rgba(0,0,0,0.1)'} !important;
        margin: 1.5rem 0 !important;
      }
      
      /* Assistant messages - preserve ChatGPT styling */
      div[class*="group/conversation-turn"]:has([data-message-author-role="assistant"]) {
        background-color: ${finalTheme === 'dark' ? 'rgba(68, 70, 84, 0.8)' : colors.assistantBackground} !important;
        border: ${finalTheme === 'dark' ? 'none' : '1px solid rgba(0,0,0,0.1)'} !important;
        margin: 1.5rem 0 !important;
      }
      
      /* Text content */
      div[class*="group/conversation-turn"] *,
      div[class*="group/conversation-turn"] p,
      div[class*="group/conversation-turn"] span,
      div[class*="group/conversation-turn"] div {
        color: ${colors.text} !important;
      }
      
      /* Code blocks - enhanced styling */
      pre {
        background-color: ${finalTheme === 'dark' ? 'rgba(23, 23, 23, 0.95)' : '#f8f8f8'} !important;
        color: ${finalTheme === 'dark' ? '#e6e6e6' : '#1a1a1a'} !important;
        border: ${finalTheme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e1e5e9'} !important;
        border-radius: 6px !important;
        padding: 12px !important;
        font-family: 'SFMono-Regular', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', monospace !important;
        font-size: 13px !important;
        line-height: 1.4 !important;
        overflow-wrap: break-word !important;
        white-space: pre-wrap !important;
        margin: 8px 0 !important;
      }
      
      code:not(pre code) {
        background-color: ${finalTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'} !important;
        color: ${finalTheme === 'dark' ? '#ff6b6b' : '#c41e3a'} !important;
        border: none !important;
        border-radius: 3px !important;
        padding: 2px 6px !important;
        font-family: 'SFMono-Regular', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', monospace !important;
        font-size: 0.9em !important;
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
      
      /* Tables - improved styling */
      table {
        border-collapse: collapse !important;
        border: ${finalTheme === 'dark' ? '1px solid rgba(255,255,255,0.2)' : '1px solid #d1d5db'} !important;
        width: 100% !important;
        margin: 12px 0 !important;
        border-radius: 6px !important;
        overflow: hidden !important;
      }
      
      th, td {
        border: ${finalTheme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb'} !important;
        padding: 12px !important;
        color: ${colors.text} !important;
        text-align: left !important;
      }
      
      th {
        background-color: ${finalTheme === 'dark' ? 'rgba(255,255,255,0.05)' : '#f9fafb'} !important;
        font-weight: 600 !important;
        font-size: 0.9em !important;
      }
      
      /* Blockquotes */
      blockquote {
        border-left: 4px solid ${finalTheme === 'dark' ? '#4a9eff' : '#2563eb'} !important;
        padding: 16px 20px !important;
        margin: 16px 0 !important;
        color: ${colors.text} !important;
        background-color: ${finalTheme === 'dark' ? 'rgba(74, 158, 255, 0.1)' : 'rgba(37, 99, 235, 0.05)'} !important;
        border-radius: 6px !important;
        font-style: italic !important;
      }
      
      /* Images and media - preserve as-is */
      img {
        max-width: 100% !important;
        height: auto !important;
        border-radius: 6px !important;
        border: none !important;
        background: none !important;
        box-shadow: ${finalTheme === 'dark' ? 'none' : '0 2px 8px rgba(0,0,0,0.1)'} !important;
      }
      
      /* Preserve ChatGPT's avatar styling */
      img[alt*="avatar"], img[alt*="profile"] {
        border-radius: 50% !important;
        width: 24px !important;
        height: 24px !important;
      }
      
      /* Links */
      a {
        color: ${finalTheme === 'dark' ? '#66b3ff' : '#0066cc'} !important;
        text-decoration: none !important;
        border-bottom: 1px solid transparent !important;
        transition: border-color 0.2s ease !important;
      }
      
      a:hover {
        border-bottom-color: currentColor !important;
      }
      
      /* Ensure proper text visibility */
      .text-white {
        color: ${colors.text} !important;
      }
      
      .bg-white {
        background-color: ${colors.background} !important;
      }
      
      /* ChatGPT-specific elements */
      [data-message-author-role] {
        color: ${colors.text} !important;
      }
      
      /* Math and LaTeX - improved rendering */
      .katex, .math {
        color: ${colors.text} !important;
        font-size: 1em !important;
        line-height: 1.2 !important;
      }
      
      /* Ensure MathML renders properly in print */
      .katex-mathml {
        display: inline !important;
        position: static !important;
        clip: auto !important;
        width: auto !important;
        height: auto !important;
      }
      
      /* Hide duplicate LaTeX HTML rendering in favor of MathML */
      .katex-html {
        display: none !important;
      }
      
      /* SVG styling - ensure proper sizing for print */
      svg {
        min-width: 150px !important;
        min-height: 100px !important;
        max-width: 400px !important;
        max-height: 400px !important;
        width: auto !important;
        height: auto !important;
        display: inline-block !important;
        vertical-align: middle !important;
        margin: 8px 0 !important;
      }
      
      @media print {
        svg {
          min-width: 150px !important;
          min-height: 100px !important;
          max-width: 300px !important;
          max-height: 300px !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
      
      /* Image styling - ensure visibility and proper sizing */
      img {
        max-width: 100% !important;
        height: auto !important;
        display: block !important;
        margin: 8px 0 !important;
        border-radius: 6px !important;
        border: none !important;
        background: none !important;
        box-shadow: ${finalTheme === 'dark' ? 'none' : '0 2px 8px rgba(0,0,0,0.1)'} !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        opacity: 1 !important;
        visibility: visible !important;
        object-fit: contain !important;
      }
      
      /* Placeholder styling for CORS-restricted images */
      .image-placeholder {
        width: 100% !important;
        min-height: 200px !important;
        background: ${finalTheme === 'dark' ? 'linear-gradient(135deg, #3a3a3a 0%, #2a2a2a 100%)' : 'linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%)'} !important;
        border: 2px dashed ${finalTheme === 'dark' ? '#555' : '#ccc'} !important;
        border-radius: 8px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        color: ${finalTheme === 'dark' ? '#aaa' : '#666'} !important;
        margin: 8px 0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      @media print {
        img {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
          display: block !important;
          opacity: 1 !important;
          visibility: visible !important;
        }
        
        .image-placeholder {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
      }
      
      /* Lists */
      ul, ol {
        color: ${colors.text} !important;
      }
      
      li {
        color: ${colors.text} !important;
        margin-bottom: 4px !important;
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

  async waitForImagesLoad() {
    // Find all images in the conversation and wait for them to load (what we can)
    const conversationElements = document.querySelectorAll(this.conversationSelector);
    const allImages = [];
    
    conversationElements.forEach(element => {
      const images = element.querySelectorAll('img');
      allImages.push(...images);
    });
    
    // Wait for non-CORS images to load
    const imagePromises = allImages.map(img => {
      return new Promise((resolve) => {
        // Skip CORS-restricted images as they'll be replaced with placeholders
        if (img.src.includes('oaiusercontent.com')) {
          resolve();
          return;
        }
        
        if (img.complete && img.naturalWidth > 0) {
          resolve();
        } else {
          const onLoad = () => {
            img.removeEventListener('load', onLoad);
            img.removeEventListener('error', onLoad);
            resolve();
          };
          img.addEventListener('load', onLoad);
          img.addEventListener('error', onLoad);
          
          // Force reload if src exists but image isn't loaded
          if (img.src) {
            const currentSrc = img.src;
            img.src = '';
            img.src = currentSrc;
          }
        }
      });
    });
    
    // Wait for all loadable images or timeout after 3 seconds
    await Promise.race([
      Promise.all(imagePromises),
      new Promise(resolve => setTimeout(resolve, 3000))
    ]);
  }

  extractConversationHTML() {
    const conversationElements = document.querySelectorAll(this.conversationSelector);
    if (conversationElements.length === 0) {
      throw new Error('No conversation messages found on this page');
    }

    return Array.from(conversationElements)
      .map(element => {
        // Clone the element to avoid modifying the original
        const clonedElement = element.cloneNode(true);
        
        // Fix LaTeX: Remove duplicate rendered LaTeX elements
        // Keep only the original LaTeX source (usually in span.katex-mathml or similar)
        const katexElements = clonedElement.querySelectorAll('.katex');
        katexElements.forEach(katex => {
          // Keep only the LaTeX source, remove rendered HTML
          const mathML = katex.querySelector('.katex-mathml');
          const htmlRender = katex.querySelector('.katex-html');
          if (mathML && htmlRender) {
            // Remove the HTML render, keep only MathML for proper printing
            htmlRender.remove();
          }
        });
        
        // Fix SVG: Ensure SVGs have proper dimensions for print
        const svgElements = clonedElement.querySelectorAll('svg');
        svgElements.forEach(svg => {
          // Get current viewBox for aspect ratio calculation
          const viewBox = svg.getAttribute('viewBox');
          let aspectRatio = 1;
          
          if (viewBox) {
            const [x, y, width, height] = viewBox.split(' ').map(parseFloat);
            if (width && height) {
              aspectRatio = width / height;
            }
          }
          
          // Set explicit dimensions suitable for printing
          const minSize = 150; // Minimum size in pixels
          const maxSize = 400; // Maximum size in pixels
          
          // Calculate dimensions based on aspect ratio
          let newWidth, newHeight;
          if (aspectRatio >= 1) {
            // Wider than tall
            newWidth = Math.min(maxSize, Math.max(minSize, 300));
            newHeight = newWidth / aspectRatio;
          } else {
            // Taller than wide
            newHeight = Math.min(maxSize, Math.max(minSize, 300));
            newWidth = newHeight * aspectRatio;
          }
          
          // Apply the calculated dimensions
          svg.setAttribute('width', newWidth + 'px');
          svg.setAttribute('height', newHeight + 'px');
          svg.style.width = newWidth + 'px';
          svg.style.height = newHeight + 'px';
          svg.style.maxWidth = 'none';
          svg.style.maxHeight = 'none';
          svg.style.minWidth = minSize + 'px';
          svg.style.minHeight = (minSize / aspectRatio) + 'px';
          svg.style.display = 'inline-block';
          svg.style.verticalAlign = 'middle';
        });
        
        // Fix Images: Handle CORS-restricted images with placeholders
        const imgElements = clonedElement.querySelectorAll('img');
        imgElements.forEach((img) => {
          try {
            // Remove lazy loading attributes that can prevent printing
            img.removeAttribute('loading');
            img.removeAttribute('data-src');
            img.removeAttribute('decoding');
            
            // For CORS images that couldn't be converted, create a placeholder
            if (!img.src.startsWith('data:') && img.src.includes('oaiusercontent.com')) {
              // Create a placeholder for CORS-restricted images
              const placeholder = document.createElement('div');
              placeholder.className = 'image-placeholder';
              placeholder.style.cssText = `
                width: 100%;
                min-height: 200px;
                background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%);
                border: 2px dashed #ccc;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: system-ui, sans-serif;
                color: #666;
                text-align: center;
                margin: 8px 0;
                position: relative;
              `;
              
              placeholder.innerHTML = `
                <div style="padding: 20px;">
                  <div style="font-size: 48px; margin-bottom: 10px;">🖼️</div>
                  <div style="font-weight: 600; margin-bottom: 5px;">Generated Image</div>
                  <div style="font-size: 12px; opacity: 0.7;">Image content from ChatGPT</div>
                  <div style="font-size: 10px; margin-top: 8px; opacity: 0.5;">Note: External images cannot be embedded due to security restrictions</div>
                </div>
              `;
              
              // Replace the img with placeholder
              img.parentNode.replaceChild(placeholder, img);
              return;
            }
            
            // Apply consistent styling for print visibility
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.display = 'block';
            img.style.margin = '8px 0';
            img.style.border = 'none';
            img.style.borderRadius = '6px';
            img.style.opacity = '1';
            img.style.visibility = 'visible';
            img.style.printColorAdjust = 'exact';
            img.style.webkitPrintColorAdjust = 'exact';
            
            // Force image to be visible by removing any hidden classes
            img.classList.remove('hidden');
            img.style.display = 'block';
            
            // Add aspect ratio preservation
            const aspectRatio = img.style.aspectRatio;
            if (aspectRatio) {
              img.style.aspectRatio = aspectRatio;
              img.style.objectFit = 'contain';
            }
            
          } catch (error) {
            console.warn('Error processing image:', error);
            // Fallback: apply basic styling
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.display = 'block';
            img.style.opacity = '1';
            img.style.visibility = 'visible';
          }
        });
        
        return clonedElement.outerHTML;
      })
      .join('\n');
  }

  async generatePDFDirectly(conversationHTML, cssStyles, filename) {
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
    
    // Create hidden iframe for print-to-PDF
    const iframe = document.createElement('iframe');
    iframe.style.cssText = `
      position: absolute;
      left: -9999px;
      top: -9999px;
      width: 8.5in;
      height: 11in;
      border: none;
      visibility: hidden;
    `;
    document.body.appendChild(iframe);
    
    // Write content to iframe
    iframe.contentDocument.open();
    iframe.contentDocument.write(htmlContent);
    iframe.contentDocument.close();
    
    // Wait for content to load and render
    await new Promise(resolve => {
      const checkLoad = () => {
        if (iframe.contentDocument.readyState === 'complete') {
          resolve();
        } else {
          setTimeout(checkLoad, 100);
        }
      };
      checkLoad();
    });
    
    // Additional delay for styling to apply
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      // Focus iframe and trigger print dialog
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      
      // Cleanup after a delay
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 3000);
      
    } catch (error) {
      // Fallback: new window approach
      console.warn('Iframe print failed, trying window fallback:', error);
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank', 'width=1000,height=800');
      
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          setTimeout(() => {
            printWindow.focus();
            printWindow.print();
          }, 1000);
        });
        
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
      
      // Remove iframe
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
      
      if (!printWindow) {
        throw new Error('Could not open print window. Please allow popups.');
      }
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
      
      this.showStatus('Processing images...');
      
      // Pre-load all images to ensure they're available for conversion
      await this.waitForImagesLoad();
      
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
      
      // Generate PDF directly with hidden method
      await this.generatePDFDirectly(conversationHTML, cssStyles, filename);
      
      this.showStatus('Print dialog opened! Choose \"Save as PDF\" to download', 'success');
      
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

  async initFloatingButton() {
    // Skip if already exists
    if (document.getElementById('chatgpt-pdf-floating-btn')) {
      return;
    }
    
    // Create floating action button with ChatGPT-like styling
    const floatingButton = document.createElement('button');
    floatingButton.id = 'chatgpt-pdf-floating-btn';
    floatingButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10,9 9,9 8,9"/>
      </svg>
    `;
    
    // ChatGPT-like styling that adapts to theme
    const isDark = this.detectCurrentTheme() === 'dark';
    floatingButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 40px;
      height: 40px;
      background: ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
      border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'};
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'};
      cursor: pointer;
      font-family: system-ui, -apple-system, sans-serif;
      z-index: 1000;
      transition: all 0.2s ease;
      user-select: none;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      opacity: 0.8;
    `;
    
    // Subtle hover effects
    floatingButton.addEventListener('mouseenter', () => {
      floatingButton.style.opacity = '1';
      floatingButton.style.transform = 'translateY(-1px)';
      floatingButton.style.background = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)';
    });
    
    floatingButton.addEventListener('mouseleave', () => {
      floatingButton.style.opacity = '0.8';
      floatingButton.style.transform = 'translateY(0)';
      floatingButton.style.background = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
    });
    
    // Click handler - check preference in real-time
    floatingButton.addEventListener('click', () => {
      if (this.hasPreference) {
        // User has preference, export directly
        this.exportToPDF();
        this.showNotification('PDF export started! Change theme in extension popup.');
      } else {
        // First time, show theme selector
        this.showFirstTimeThemeSelector();
      }
    });
    
    // Add to page if DOM is ready
    if (document.body) {
      document.body.appendChild(floatingButton);
    }
  }

  showFirstTimeThemeSelector() {
    // Remove existing selector if any
    const existing = document.getElementById('chatgpt-pdf-first-time-selector');
    if (existing) {
      existing.remove();
      return;
    }
    
    const isDark = this.detectCurrentTheme() === 'dark';
    const selector = document.createElement('div');
    selector.id = 'chatgpt-pdf-first-time-selector';
    selector.innerHTML = `
      <div class="first-time-header">📄 PDF Export Preference</div>
      <div class="first-time-subtitle">Choose your default PDF theme:</div>
      <button class="first-time-option" data-theme="light">
        <div class="option-preview light-preview"></div>
        <div class="option-content">
          <div class="option-title">Always Light</div>
          <div class="option-desc">White background, black text</div>
        </div>
      </button>
      <button class="first-time-option" data-theme="dark">
        <div class="option-preview dark-preview"></div>
        <div class="option-content">
          <div class="option-title">Always Dark</div>
          <div class="option-desc">Dark background, white text</div>
        </div>
      </button>
      <button class="first-time-option recommended" data-theme="auto">
        <div class="option-preview auto-preview"></div>
        <div class="option-content">
          <div class="option-title">Follow System ✨</div>
          <div class="option-desc">Adapts to your ChatGPT theme</div>
        </div>
      </button>
      <div class="first-time-note">You can change this later in the extension popup</div>
    `;
    
    selector.style.cssText = `
      position: fixed;
      bottom: 70px;
      right: 20px;
      background: ${isDark ? 'rgba(32, 33, 35, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
      border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      z-index: 10001;
      font-family: system-ui, -apple-system, sans-serif;
      min-width: 280px;
      max-width: 320px;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      color: ${isDark ? '#ffffff' : '#000000'};
    `;
    
    // Add styles for first-time selector components
    const style = document.createElement('style');
    style.textContent = `
      #chatgpt-pdf-first-time-selector .first-time-header {
        font-weight: 600;
        margin-bottom: 8px;
        color: ${isDark ? '#ffffff' : '#1f2937'};
        font-size: 16px;
        text-align: center;
      }
      
      #chatgpt-pdf-first-time-selector .first-time-subtitle {
        font-size: 13px;
        color: ${isDark ? 'rgba(255, 255, 255, 0.7)' : '#6b7280'};
        margin-bottom: 16px;
        text-align: center;
      }
      
      #chatgpt-pdf-first-time-selector .first-time-option {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        padding: 12px;
        border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
        border-radius: 8px;
        background: ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'};
        cursor: pointer;
        margin-bottom: 8px;
        transition: all 0.2s ease;
        font-size: 14px;
        color: ${isDark ? '#ffffff' : '#374151'};
      }
      
      #chatgpt-pdf-first-time-selector .first-time-option:hover {
        border-color: #3b82f6;
        background: ${isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'};
      }
      
      #chatgpt-pdf-first-time-selector .first-time-option.recommended {
        border-color: #10b981;
        background: ${isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)'};
      }
      
      #chatgpt-pdf-first-time-selector .first-time-option:last-of-type {
        margin-bottom: 12px;
      }
      
      #chatgpt-pdf-first-time-selector .option-preview {
        width: 32px;
        height: 20px;
        border-radius: 4px;
        border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'};
        flex-shrink: 0;
      }
      
      #chatgpt-pdf-first-time-selector .light-preview {
        background: linear-gradient(90deg, #ffffff 50%, #f3f4f6 50%);
      }
      
      #chatgpt-pdf-first-time-selector .dark-preview {
        background: linear-gradient(90deg, #1f2937 50%, #374151 50%);
      }
      
      #chatgpt-pdf-first-time-selector .auto-preview {
        background: linear-gradient(45deg, #ffffff 25%, #1f2937 25%, #1f2937 50%, #ffffff 50%, #ffffff 75%, #1f2937 75%);
        background-size: 8px 8px;
      }
      
      #chatgpt-pdf-first-time-selector .option-content {
        flex: 1;
      }
      
      #chatgpt-pdf-first-time-selector .option-title {
        font-weight: 500;
        margin-bottom: 2px;
      }
      
      #chatgpt-pdf-first-time-selector .option-desc {
        font-size: 12px;
        opacity: 0.7;
      }
      
      #chatgpt-pdf-first-time-selector .first-time-note {
        font-size: 11px;
        color: ${isDark ? 'rgba(255, 255, 255, 0.5)' : '#9ca3af'};
        text-align: center;
        font-style: italic;
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(selector);
    
    // Add click handlers for theme options
    selector.querySelectorAll('.first-time-option').forEach(option => {
      option.addEventListener('click', async (e) => {
        const theme = e.currentTarget.getAttribute('data-theme');
        this.pdfTheme = theme;
        this.hasPreference = true;
        await this.saveSettings();
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

  async saveSettings() {
    try {
      await chrome.storage.local.set({
        'chatgpt-pdf-settings': {
          theme: this.pdfTheme,
          hasPreference: true
        }
      });
      this.hasPreference = true;
    } catch (error) {
      // Fallback to localStorage
      try {
        localStorage.setItem('chatgpt-pdf-settings', JSON.stringify({
          theme: this.pdfTheme,
          hasPreference: true
        }));
        this.hasPreference = true;
      } catch (localError) {
        console.warn('Could not save PDF settings:', error, localError);
      }
    }
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.local.get('chatgpt-pdf-settings');
      if (result['chatgpt-pdf-settings']) {
        const settings = result['chatgpt-pdf-settings'];
        this.pdfTheme = settings.theme || 'auto';
        this.hasPreference = settings.hasPreference || false;
      }
    } catch (error) {
      // Fallback to localStorage
      try {
        const settings = localStorage.getItem('chatgpt-pdf-settings');
        if (settings) {
          const parsed = JSON.parse(settings);
          this.pdfTheme = parsed.theme || 'auto';
          this.hasPreference = parsed.hasPreference || false;
        }
      } catch (localError) {
        console.warn('Could not load PDF settings:', error, localError);
      }
    }
  }

  showNotification(message, duration = 3000) {
    // Remove existing notification
    const existing = document.getElementById('chatgpt-pdf-notification');
    if (existing) existing.remove();
    
    const isDark = this.detectCurrentTheme() === 'dark';
    const notification = document.createElement('div');
    notification.id = 'chatgpt-pdf-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${isDark ? 'rgba(32, 33, 35, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
      color: ${isDark ? '#ffffff' : '#000000'};
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10002;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      max-width: 300px;
      border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.remove();
      }
    }, duration);
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
    chatGPTToPDF.hasPreference = true;
    chatGPTToPDF.saveSettings();
    sendResponse({ success: true });
  }
  
  if (request.action === 'getTheme') {
    sendResponse({ 
      theme: chatGPTToPDF.pdfTheme,
      hasPreference: chatGPTToPDF.hasPreference
    });
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