// Global Theme Management
export class ThemeManager {
  constructor() {
    this.themeToggle = null;
    this.themeIcon = null;
    this.backToTopBtn = null;
    this.init();
  }

  init() {
    this.setupThemeToggle();
    this.setupBackToTop();
    this.applyTheme();
  }

  setupThemeToggle() {
    // Find theme toggle elements
    this.themeToggle = document.getElementById('theme-toggle');
    this.themeIcon = document.getElementById('theme-icon');
    
    if (this.themeToggle) {
      this.themeToggle.addEventListener('click', () => {
        const current = localStorage.getItem('theme') || 'light';
        this.setTheme(current === 'dark' ? 'light' : 'dark');
        
        // Close dropdown if it exists
        const dropdown = document.getElementById('account-dropdown');
        if (dropdown) {
          dropdown.classList.add('hidden');
        }
      });
    }
  }

  setupBackToTop() {
    // Create back to top button if it doesn't exist
    if (!document.getElementById('back-to-top')) {
      this.createBackToTopButton();
    }
    
    this.backToTopBtn = document.getElementById('back-to-top');
    
    if (this.backToTopBtn) {
      window.addEventListener('scroll', () => this.toggleBackToTop());
      
      this.backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
    }
  }

  createBackToTopButton() {
    const backToTopBtn = document.createElement('button');
    backToTopBtn.id = 'back-to-top';
    backToTopBtn.className = 'fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 opacity-0 invisible z-40 animate__animated';
    backToTopBtn.innerHTML = '<span class="material-icons">keyboard_arrow_up</span>';
    
    // Add hover styles
    backToTopBtn.style.transition = 'all 0.3s ease';
    backToTopBtn.addEventListener('mouseenter', () => {
      backToTopBtn.style.transform = 'translateY(-2px)';
      backToTopBtn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    });
    backToTopBtn.addEventListener('mouseleave', () => {
      backToTopBtn.style.transform = 'translateY(0)';
      backToTopBtn.style.boxShadow = '';
    });
    
    document.body.appendChild(backToTopBtn);
  }

  toggleBackToTop() {
    if (!this.backToTopBtn) return;
    
    if (window.scrollY > 300) {
      this.backToTopBtn.classList.remove('opacity-0', 'invisible');
      this.backToTopBtn.classList.add('opacity-100', 'visible', 'animate__fadeIn');
    } else {
      this.backToTopBtn.classList.add('opacity-0', 'invisible');
      this.backToTopBtn.classList.remove('opacity-100', 'visible', 'animate__fadeIn');
    }
  }

  setTheme(theme) {
    const isDark = theme === 'dark';
    
    // Update body classes
    if (isDark) {
      document.body.classList.remove('bg-gradient-to-br', 'from-gray-50', 'to-blue-100');
      document.body.classList.add('bg-gray-900', 'text-white');
    } else {
      document.body.classList.remove('bg-gray-900', 'text-white');
      document.body.classList.add('bg-gradient-to-br', 'from-gray-50', 'to-blue-100');
    }

    // Update header theme
    this.updateHeaderTheme(isDark);
    
    // Update form elements
    this.updateFormElements(isDark);
    
    // Update product cards if they exist
    this.updateProductCards(isDark);
    
    // Update account dropdown and other UI elements
    this.updateUIElements(isDark);
    
    // Update theme icon
    if (this.themeIcon) {
      this.themeIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
    }
    
    // Save theme preference
    localStorage.setItem('theme', theme);
    
    // Dispatch custom event for other scripts to listen to
    document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
  }

  updateHeaderTheme(isDark) {
    const headers = document.querySelectorAll('.amazon-header, .checkout-header');
    headers.forEach(header => {
      if (isDark) {
        header.classList.remove('bg-[#232f3e]');
        header.classList.add('bg-gray-800');
      } else {
        header.classList.remove('bg-gray-800');
        header.classList.add('bg-[#232f3e]');
      }
    });
  }

  updateFormElements(isDark) {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      if (isDark) {
        input.classList.remove('bg-white', 'text-black', 'border-gray-300', 'placeholder-black');
        input.classList.add('bg-gray-700', 'text-white', 'border-gray-600', 'placeholder-gray-300');
        
        // Update placeholder color for dark theme
        input.style.setProperty('--tw-placeholder-opacity', '0.5');
      } else {
        input.classList.remove('bg-gray-700', 'text-white', 'border-gray-600', 'placeholder-gray-300');
        input.classList.add('bg-white', 'text-black', 'border-gray-300', 'placeholder-black');
        
        // Reset placeholder color for light theme
        input.style.removeProperty('--tw-placeholder-opacity');
      }
    });
  }

  updateProductCards(isDark) {
    const productCards = document.querySelectorAll('.product-container');
    productCards.forEach(card => {
      if (isDark) {
        card.classList.remove('bg-white');
        card.classList.add('bg-gray-800');
        
        const productName = card.querySelector('.product-name');
        if (productName) {
          productName.classList.remove('text-black');
          productName.classList.add('text-white');
        }
      } else {
        card.classList.remove('bg-gray-800');
        card.classList.add('bg-white');
        
        const productName = card.querySelector('.product-name');
        if (productName) {
          productName.classList.remove('text-white');
          productName.classList.add('text-black');
        }
      }
    });
  }

  updateUIElements(isDark) {
    // Update account dropdown
    const accountDropdown = document.getElementById('account-dropdown');
    if (accountDropdown) {
      if (isDark) {
        accountDropdown.classList.remove('bg-white');
        accountDropdown.classList.add('bg-gray-800', 'text-white');
        
        // Update dropdown text colors
        const dropdownTexts = accountDropdown.querySelectorAll('span, a, button');
        dropdownTexts.forEach(element => {
          if (element.classList.contains('text-black')) {
            element.classList.remove('text-black');
            element.classList.add('text-white');
          }
          if (element.classList.contains('text-gray-700')) {
            element.classList.remove('text-gray-700');
            element.classList.add('text-gray-300');
          }
        });
        
        // Update hover states for dark theme
        const hoverElements = accountDropdown.querySelectorAll('a, button');
        hoverElements.forEach(element => {
          element.classList.remove('hover:bg-blue-50');
          element.classList.add('hover:bg-gray-700');
        });
      } else {
        accountDropdown.classList.remove('bg-gray-800', 'text-white');
        accountDropdown.classList.add('bg-white');
        
        // Update dropdown text colors
        const dropdownTexts = accountDropdown.querySelectorAll('span, a, button');
        dropdownTexts.forEach(element => {
          if (element.classList.contains('text-white')) {
            element.classList.remove('text-white');
            element.classList.add('text-black');
          }
          if (element.classList.contains('text-gray-300')) {
            element.classList.remove('text-gray-300');
            element.classList.add('text-gray-700');
          }
        });
        
        // Update hover states for light theme
        const hoverElements = accountDropdown.querySelectorAll('a, button');
        hoverElements.forEach(element => {
          element.classList.remove('hover:bg-gray-700');
          element.classList.add('hover:bg-blue-50');
        });
      }
    }

    // Update sort dropdown arrow for dark theme
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      if (isDark) {
        // Change arrow color to white for dark theme
        sortSelect.style.backgroundImage = "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e\")";
      } else {
        // Reset to original arrow color for light theme
        sortSelect.style.backgroundImage = "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e\")";
      }
    }

    // Update search bar placeholder and styling
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      if (isDark) {
        searchInput.classList.remove('placeholder-black');
        searchInput.classList.add('placeholder-gray-300');
        searchInput.style.setProperty('--tw-placeholder-opacity', '0.5');
      } else {
        searchInput.classList.remove('placeholder-gray-300');
        searchInput.classList.add('placeholder-black');
        searchInput.style.removeProperty('--tw-placeholder-opacity');
      }
    }

    // Update search suggestions for dark theme
    const searchSuggestions = document.querySelector('.search-suggestions');
    if (searchSuggestions) {
      if (isDark) {
        searchSuggestions.classList.remove('bg-white', 'border-gray-300');
        searchSuggestions.classList.add('bg-gray-800', 'border-gray-600');
        
        const suggestionItems = searchSuggestions.querySelectorAll('.suggestion-item');
        suggestionItems.forEach(item => {
          item.classList.remove('hover:bg-gray-100', 'border-gray-100');
          item.classList.add('hover:bg-gray-700', 'border-gray-600', 'text-white');
        });
      } else {
        searchSuggestions.classList.remove('bg-gray-800', 'border-gray-600');
        searchSuggestions.classList.add('bg-white', 'border-gray-300');
        
        const suggestionItems = searchSuggestions.querySelectorAll('.suggestion-item');
        suggestionItems.forEach(item => {
          item.classList.remove('hover:bg-gray-700', 'border-gray-600', 'text-white');
          item.classList.add('hover:bg-gray-100', 'border-gray-100', 'text-black');
        });
      }
    }
  }

  // Applies the saved theme on page load
  applyTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    this.setTheme(savedTheme);
  }
}

// Auto-initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ThemeManager();
});

// Export for manual initialization if needed
export const themeManager = new ThemeManager(); 