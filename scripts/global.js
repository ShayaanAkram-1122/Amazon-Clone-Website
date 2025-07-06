class GlobalThemeManager {
  constructor() {
    this.themeToggle = null;
    this.themeIcon = null;
    this.backToTopBtn = null;
    this.init();
  }

  // Initializes the global theme manager and sets up all components
  init() {
    this.setupThemeToggle();
    this.setupBackToTop();
    this.applyTheme();
  }

  // Sets up the theme toggle button and its click handler
  setupThemeToggle() {
    this.themeToggle = document.getElementById('theme-toggle');
    this.themeIcon = document.getElementById('theme-icon');
    
    if (this.themeToggle) {
      this.themeToggle.addEventListener('click', () => {
        const current = localStorage.getItem('theme') || 'light';
        this.setTheme(current === 'dark' ? 'light' : 'dark');
        
        const dropdown = document.getElementById('account-dropdown');
        if (dropdown) {
          dropdown.classList.add('hidden');
        }
      });
    }
  }

  // Sets up the back to top button functionality
  setupBackToTop() {
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

  // Creates and styles the back to top button
  createBackToTopButton() {
    const backToTopBtn = document.createElement('button');
    backToTopBtn.id = 'back-to-top';
    backToTopBtn.className = 'fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 opacity-0 invisible z-40 animate__animated';
    backToTopBtn.innerHTML = '<span class="material-icons">keyboard_arrow_up</span>';
    
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

  // Shows or hides the back to top button based on scroll position
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

  // Applies the specified theme to the entire application
  setTheme(theme) {
    const isDark = theme === 'dark';
    
    if (isDark) {
      document.body.classList.remove('bg-gradient-to-br', 'from-gray-50', 'to-blue-100');
      document.body.classList.add('bg-gray-900', 'text-white');
    } else {
      document.body.classList.remove('bg-gray-900', 'text-white');
      document.body.classList.add('bg-gradient-to-br', 'from-gray-50', 'to-blue-100');
    }

    this.updateHeaderTheme(isDark);
    this.updateFormElements(isDark);
    this.updateProductCards(isDark);
    
    if (this.themeIcon) {
      this.themeIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
    }
    
    localStorage.setItem('theme', theme);
    document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
  }

  // Updates the header styling based on the current theme
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

  // Updates form input styling based on the current theme
  updateFormElements(isDark) {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      if (isDark) {
        input.classList.remove('bg-white', 'text-black', 'border-gray-300');
        input.classList.add('bg-gray-700', 'text-white', 'border-gray-600');
      } else {
        input.classList.remove('bg-gray-700', 'text-white', 'border-gray-600');
        input.classList.add('bg-white', 'text-black', 'border-gray-300');
      }
    });
  }

  // Updates product card styling based on the current theme
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

  // Applies the saved theme on page load
  applyTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    this.setTheme(savedTheme);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new GlobalThemeManager();
});

window.GlobalThemeManager = GlobalThemeManager; 