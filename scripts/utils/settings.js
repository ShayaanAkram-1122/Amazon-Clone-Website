// Global Settings Management
class SettingsManager {
    constructor() {
        this.settings = this.loadSettings();
        this.applySettings();
    }

    // Default settings
    getDefaultSettings() {
        return {
            theme: 'light',
            fontSize: 16,
            language: 'en',
            notifications: {
                orderUpdates: true,
                promotionalEmails: false,
                priceDropAlerts: true,
                productRecommendations: false
            },
            privacy: {
                dataSharing: true,
                twoFactorEnabled: false
            },
            shipping: {
                amazonDayDelivery: false,
                signatureRequired: false
            },
            appearance: {
                compactMode: false,
                highContrast: false
            }
        };
    }

    // Load settings from localStorage
    loadSettings() {
        const savedSettings = localStorage.getItem('appSettings');
        if (savedSettings) {
            try {
                const parsedSettings = JSON.parse(savedSettings);
                const mergedSettings = { ...this.getDefaultSettings(), ...parsedSettings };
                return this.validateSettings(mergedSettings);
            } catch (error) {
                console.error('Error loading settings:', error);
                return this.getDefaultSettings();
            }
        }
        return this.getDefaultSettings();
    }

    // Validate and clean settings
    validateSettings(settings) {
        const validated = { ...settings };
        
        // Ensure theme is a valid string
        if (typeof validated.theme !== 'string' || !['light', 'dark', 'auto'].includes(validated.theme)) {
            console.warn('Invalid theme found in settings, resetting to light');
            validated.theme = 'light';
        }
        
        // Ensure fontSize is a valid number
        if (typeof validated.fontSize !== 'number' || validated.fontSize < 12 || validated.fontSize > 20) {
            console.warn('Invalid fontSize found in settings, resetting to 16');
            validated.fontSize = 16;
        }
        
        // Ensure language is a valid string
        if (typeof validated.language !== 'string') {
            console.warn('Invalid language found in settings, resetting to en');
            validated.language = 'en';
        }
        
        // Ensure all category objects exist and are objects
        ['notifications', 'privacy', 'shipping', 'appearance'].forEach(category => {
            if (!validated[category] || typeof validated[category] !== 'object') {
                validated[category] = {};
            }
        });
        
        return validated;
    }

    // Save settings to localStorage
    saveSettings() {
        localStorage.setItem('appSettings', JSON.stringify(this.settings));
        this.applySettings();
    }

    // Update a specific setting
    updateSetting(category, key, value) {
        // Debug logging
        console.log('Updating setting:', { category, key, value, valueType: typeof value });
        
        // Check if this is a font size change
        const isFontSizeChange = !category && key === 'fontSize';
        const oldFontSize = this.settings.fontSize;
        
        if (category) {
            if (!this.settings[category] || typeof this.settings[category] !== 'object') {
                this.settings[category] = {};
            }
            this.settings[category][key] = value;
        } else {
            this.settings[key] = value;
        }
        
        // Save settings and apply changes
        this.saveSettings();
        
        // Show font size indicator only if font size actually changed and it's a user-initiated change
        if (isFontSizeChange && oldFontSize !== value && typeof value === 'number') {
            this.applyFontSize(true); // Show indicator
        }
    }

    // Get a specific setting
    getSetting(category, key) {
        if (category) {
            return this.settings[category]?.[key];
        }
        return this.settings[key];
    }

    // Apply all settings globally
    applySettings() {
        this.applyTheme();
        this.applyFontSize(false); // Don't show indicator when loading settings
        this.applyLanguage();
        this.applyAccessibility();
    }

    // Apply theme settings
    applyTheme() {
        let theme = this.settings.theme;
        const root = document.documentElement;
        
        // Ensure theme is a string and valid
        if (typeof theme !== 'string') {
            console.warn('Invalid theme value:', theme, 'falling back to light theme');
            theme = 'light';
            this.settings.theme = 'light';
        }
        
        // Validate theme value
        const validThemes = ['light', 'dark', 'auto'];
        if (!validThemes.includes(theme)) {
            console.warn('Invalid theme:', theme, 'falling back to light theme');
            theme = 'light';
            this.settings.theme = 'light';
        }
        
        // Remove existing theme classes
        root.classList.remove('theme-light', 'theme-dark', 'theme-auto');
        
        // Add new theme class
        root.classList.add(`theme-${theme}`);
        
        // Apply theme-specific styles
        if (theme === 'dark') {
            root.style.setProperty('--bg-primary', '#1a1a1a');
            root.style.setProperty('--bg-secondary', '#2d2d2d');
            root.style.setProperty('--text-primary', '#ffffff');
            root.style.setProperty('--text-secondary', '#cccccc');
            root.style.setProperty('--border-color', '#404040');
        } else if (theme === 'light') {
            root.style.setProperty('--bg-primary', '#ffffff');
            root.style.setProperty('--bg-secondary', '#f8f9fa');
            root.style.setProperty('--text-primary', '#1a1a1a');
            root.style.setProperty('--text-secondary', '#6b7280');
            root.style.setProperty('--border-color', '#e5e7eb');
        } else if (theme === 'auto') {
            // Auto theme - use system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                root.style.setProperty('--bg-primary', '#1a1a1a');
                root.style.setProperty('--bg-secondary', '#2d2d2d');
                root.style.setProperty('--text-primary', '#ffffff');
                root.style.setProperty('--text-secondary', '#cccccc');
                root.style.setProperty('--border-color', '#404040');
            } else {
                root.style.setProperty('--bg-primary', '#ffffff');
                root.style.setProperty('--bg-secondary', '#f8f9fa');
                root.style.setProperty('--text-primary', '#1a1a1a');
                root.style.setProperty('--text-secondary', '#6b7280');
                root.style.setProperty('--border-color', '#e5e7eb');
            }
        }
    }

    // Apply font size settings
    applyFontSize(showIndicator = false) {
        const fontSize = this.settings.fontSize;
        document.documentElement.style.fontSize = `${fontSize}px`;
        
        // Update CSS custom property for consistent sizing
        document.documentElement.style.setProperty('--base-font-size', `${fontSize}px`);
        
        // Apply to body and common elements for immediate effect
        document.body.style.fontSize = `${fontSize}px`;
        
        // Update common text elements
        const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button, input, textarea, select, label');
        textElements.forEach(element => {
            const currentSize = window.getComputedStyle(element).fontSize;
            const currentSizeNum = parseFloat(currentSize);
            
            // Only update if the element doesn't have a specific font size set
            if (currentSizeNum <= 16 || element.style.fontSize === '') {
                element.style.fontSize = `${fontSize}px`;
            }
        });
        
        // Show indicator only if explicitly requested
        if (showIndicator) {
            this.showFontSizeIndicator(fontSize);
        }
        
        // Trigger a custom event for other scripts to listen to
        window.dispatchEvent(new CustomEvent('fontSizeChanged', { 
            detail: { fontSize: fontSize } 
        }));
    }

    // Show font size change indicator
    showFontSizeIndicator(fontSize) {
        // Don't show indicator on settings page
        if (window.location.pathname.includes('settings.html')) {
            return;
        }
        
        // Remove existing indicator
        const existingIndicator = document.getElementById('font-size-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        // Create new indicator
        const indicator = document.createElement('div');
        indicator.id = 'font-size-indicator';
        indicator.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #ff9900, #ff6b35);
                color: white;
                padding: 12px 20px;
                border-radius: 25px;
                font-size: 14px;
                font-weight: 600;
                box-shadow: 0 4px 12px rgba(255, 153, 0, 0.3);
                z-index: 10000;
                transform: translateX(100%);
                transition: transform 0.3s ease;
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                <span style="font-size: 16px;">🔤</span>
                Font size: ${fontSize}px
            </div>
        `;
        
        document.body.appendChild(indicator);
        
        // Animate in
        setTimeout(() => {
            indicator.querySelector('div').style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 2 seconds
        setTimeout(() => {
            if (indicator.querySelector('div')) {
                indicator.querySelector('div').style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (indicator.parentNode) {
                        indicator.remove();
                    }
                }, 300);
            }
        }, 2000);
    }

    // Apply language settings
    applyLanguage() {
        const language = this.settings.language;
        document.documentElement.lang = language;
        
        // Update page title and meta tags if needed
        const title = document.querySelector('title');
        if (title) {
            const currentTitle = title.textContent;
            if (currentTitle.includes('Amazon')) {
                // Keep the Amazon branding, just update language-specific parts
                title.textContent = currentTitle;
            }
        }
    }

    // Apply accessibility settings
    applyAccessibility() {
        const appearance = this.settings.appearance;
        
        if (appearance.highContrast) {
            document.documentElement.classList.add('high-contrast');
        } else {
            document.documentElement.classList.remove('high-contrast');
        }
        
        if (appearance.compactMode) {
            document.documentElement.classList.add('compact-mode');
        } else {
            document.documentElement.classList.remove('compact-mode');
        }
    }

    // Reset settings to defaults
    resetSettings() {
        this.settings = this.getDefaultSettings();
        this.saveSettings();
    }

    // Export settings (for backup)
    exportSettings() {
        return JSON.stringify(this.settings, null, 2);
    }

    // Import settings
    importSettings(settingsJson) {
        try {
            const importedSettings = JSON.parse(settingsJson);
            this.settings = { ...this.getDefaultSettings(), ...importedSettings };
            this.saveSettings();
            return true;
        } catch (error) {
            console.error('Failed to import settings:', error);
            return false;
        }
    }
}

// Global settings instance
window.settingsManager = new SettingsManager();

// Add CSS custom properties for theming
const style = document.createElement('style');
style.textContent = `
    :root {
        --bg-primary: #ffffff;
        --bg-secondary: #f8f9fa;
        --text-primary: #1a1a1a;
        --text-secondary: #6b7280;
        --border-color: #e5e7eb;
        --base-font-size: 16px;
    }

    .theme-dark {
        --bg-primary: #1a1a1a;
        --bg-secondary: #2d2d2d;
        --text-primary: #ffffff;
        --text-secondary: #cccccc;
        --border-color: #404040;
    }

    .high-contrast {
        --text-primary: #000000;
        --text-secondary: #333333;
        --border-color: #000000;
    }

    .compact-mode {
        --base-font-size: 14px;
    }

    .compact-mode * {
        line-height: 1.3 !important;
    }

    /* Apply settings to common elements */
    body {
        background-color: var(--bg-primary) !important;
        color: var(--text-primary) !important;
        font-size: var(--base-font-size) !important;
        transition: font-size 0.3s ease !important;
    }

    /* Font size transitions for smooth changes */
    * {
        transition: font-size 0.3s ease !important;
    }

    /* Ensure text elements respect the base font size */
    p, span, div, h1, h2, h3, h4, h5, h6, a, button, input, textarea, select, label {
        font-size: var(--base-font-size) !important;
    }

    /* Preserve heading sizes relative to base font */
    h1 { font-size: calc(var(--base-font-size) * 2) !important; }
    h2 { font-size: calc(var(--base-font-size) * 1.5) !important; }
    h3 { font-size: calc(var(--base-font-size) * 1.25) !important; }
    h4 { font-size: calc(var(--base-font-size) * 1.1) !important; }
    h5 { font-size: calc(var(--base-font-size) * 1) !important; }
    h6 { font-size: calc(var(--base-font-size) * 0.9) !important; }

    .bg-white {
        background-color: var(--bg-primary) !important;
    }

    .text-gray-900 {
        color: var(--text-primary) !important;
    }

    .text-gray-600 {
        color: var(--text-secondary) !important;
    }

    .border-gray-200 {
        border-color: var(--border-color) !important;
    }

    .bg-gray-100 {
        background-color: var(--bg-secondary) !important;
    }
`;

document.head.appendChild(style);

// Listen for system theme changes
if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (window.settingsManager.getSetting('theme') === 'auto') {
            window.settingsManager.applyTheme();
        }
    });
}

// Listen for font size changes from other pages
window.addEventListener('fontSizeChanged', (event) => {
    const fontSize = event.detail.fontSize;
    if (window.settingsManager) {
        window.settingsManager.showFontSizeIndicator(fontSize);
    }
});

// Add a floating font size indicator for all pages
function addGlobalFontSizeIndicator() {
    // Only add indicator if settings manager exists and we're not on settings page
    if (!window.settingsManager || window.location.pathname.includes('settings.html')) {
        return;
    }
    
    const indicator = document.createElement('div');
    indicator.id = 'global-font-indicator';
    
    // Get font size safely
    const fontSize = window.settingsManager ? window.settingsManager.getSetting('fontSize') : 16;
    const fontSizeText = typeof fontSize === 'number' ? `${fontSize}px` : '16px';
    
    indicator.innerHTML = `
        <div style="
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            z-index: 9999;
            opacity: 0.7;
            transition: opacity 0.3s ease;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
        " title="Click to go to Settings">
            <span style="font-size: 14px;">🔤</span>
            <span id="current-font-size">${fontSizeText}</span>
        </div>
    `;
    
    // Make it clickable to go to settings
    indicator.querySelector('div').addEventListener('click', () => {
        window.location.href = 'settings.html';
    });
    
    // Show on hover
    indicator.querySelector('div').addEventListener('mouseenter', () => {
        indicator.querySelector('div').style.opacity = '1';
    });
    
    indicator.querySelector('div').addEventListener('mouseleave', () => {
        indicator.querySelector('div').style.opacity = '0.7';
    });
    
    document.body.appendChild(indicator);
}

// Add the global indicator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(addGlobalFontSizeIndicator, 1000);
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SettingsManager;
} 