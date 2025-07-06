import { fetchCart, addToCart, removeFromCart } from '../data/cart.js';
import { products } from '../data/products.js';
import { formatCurrency } from './utils/money.js';
import { ThemeManager } from './utils/theme.js';

const themeManager = new ThemeManager();

document.addEventListener('themeChanged', () => {
  renderProducts();
});

const profileBtn = document.getElementById('profile-btn');
const profileDropdown = profileBtn?.parentElement?.querySelector('.profile-dropdown');
const profileName = document.querySelector('.js-profile-name');
const profileAvatar = document.getElementById('profile-avatar');
if (profileBtn && profileDropdown) {
  profileBtn.onclick = (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle('hidden');
    profileDropdown.classList.add('animate__fadeInDown');
  };
  document.body.addEventListener('click', () => profileDropdown.classList.add('hidden'));
}

const user = JSON.parse(localStorage.getItem('user') || '{}');
if (user && user.name && profileName && profileAvatar) {
  profileName.textContent = user.name;
  profileAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=232f3e&color=fff&rounded=true&size=32`;
}

const logoutBtn = document.getElementById('logout');
if (logoutBtn) {
  logoutBtn.onclick = () => {
    localStorage.removeItem('user');
    window.location.href = 'sign.html';
  };
}
const editProfileBtn = document.getElementById('edit-profile');
if (editProfileBtn) {
  editProfileBtn.onclick = () => window.location.href = 'profile.html';
}
const settingsBtn = document.getElementById('settings');
if (settingsBtn) {
  settingsBtn.onclick = () => window.location.href = 'settings.html';
}

let cart = [];

// Fetches the user's cart from the database and updates the UI
async function updateCartFromDB() {
  if (!user.id) return;
  cart = await fetchCart(user.id);
  updateCartQuantity();
  renderCartDropdown();
}

// Updates the cart quantity display in the header
function updateCartQuantity() {
  let cartQuantity = 0;
  cart.forEach((item) => {
    cartQuantity += item.quantity;
  });
  const cartQuantityEl = document.querySelector('.js-cart-quantity');
  if (cartQuantityEl) {
    cartQuantityEl.innerHTML = cartQuantity > 0 ? cartQuantity : '';
  }
}

// Shows a temporary notification when an item is added to cart
function showAddToCartMessage() {
  let messageEl = document.querySelector('.js-add-to-cart-message');
  if (!messageEl) {
    messageEl = document.createElement('div');
    messageEl.className = 'add-to-cart-message js-add-to-cart-message animate__animated animate__fadeInDown';
    messageEl.style.position = 'fixed';
    messageEl.style.top = '20px';
    messageEl.style.left = '50%';
    messageEl.style.transform = 'translateX(-50%)';
    messageEl.style.background = '#232f3e';
    messageEl.style.color = 'white';
    messageEl.style.padding = '12px 24px';
    messageEl.style.borderRadius = '8px';
    messageEl.style.zIndex = '1000';
    document.body.appendChild(messageEl);
  }
  messageEl.textContent = 'Item added to the cart';
  messageEl.style.display = 'block';
  clearTimeout(messageEl.timeoutId);
  messageEl.timeoutId = setTimeout(() => {
    messageEl.style.display = 'none';
  }, 2000);
}

// Renders the cart dropdown with items and total
function renderCartDropdown() {
  const dropdown = document.querySelector('.js-cart-dropdown-content');
  const totalEl = document.querySelector('.js-cart-total');
  if (!dropdown || !totalEl) return;
  if (cart.length === 0) {
    dropdown.innerHTML = '<div class="text-gray-500 text-center">Your cart is empty.</div>';
    totalEl.textContent = '$0.00';
    return;
  }
  let html = '';
  let total = 0;
  cart.forEach(item => {
    const product = products.find(p => p.id === item.productId);
    if (!product) return;
    const itemTotal = (product.priceCents * item.quantity) / 100;
    total += itemTotal;
    html += `<div class="flex items-center mb-2 animate__animated animate__fadeInLeft animate__faster">
      <img src="${product.image}" class="w-10 h-10 rounded mr-2 shadow" />
      <div class="flex-1">
        <div class="font-semibold text-sm">${product.name}</div>
        <div class="text-xs text-gray-500">Qty: ${item.quantity}</div>
      </div>
      <div class="font-bold text-green-600">$${itemTotal.toFixed(2)}</div>
    </div>`;
  });
  dropdown.innerHTML = html;
  totalEl.textContent = `$${total.toFixed(2)}`;
}

// Renders all products with optional filtering and sorting
function renderProducts(filter = '', sortBy = '') {
  let productsHtml = '';
  const filterValue = filter.trim().toLowerCase();
  let filteredProducts = filterValue
    ? products.filter(p => p.name.toLowerCase().includes(filterValue))
    : products;
  
  // Apply sorting
  if (sortBy) {
    filteredProducts = [...filteredProducts].sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.priceCents - b.priceCents;
        case 'price-high':
          return b.priceCents - a.priceCents;
        case 'rating-high':
          return b.rating.stars - a.rating.stars;
        case 'rating-low':
          return a.rating.stars - b.rating.stars;
        case 'name-az':
          return a.name.localeCompare(b.name);
        case 'name-za':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });
  }
  
  const isDarkTheme = localStorage.getItem('theme') === 'dark';
  const productBgClass = isDarkTheme ? 'bg-gray-800' : 'bg-white';
  const textColorClass = isDarkTheme ? 'text-white' : 'text-black';
  
  filteredProducts.forEach((product, idx) => {
    productsHtml += `
      <div class="product-container ${productBgClass} rounded-xl shadow-lg p-4 flex flex-col items-center transition-transform duration-300 hover:scale-105 animate__animated animate__fadeInUp" style="animation-delay: ${idx * 0.1}s;">
        <div class="product-image-container mb-2">
          <img class="product-image rounded-md w-32 h-32 object-contain transition-transform duration-300 hover:scale-110" src="${product.image}">
        </div>
        <div class="product-name limit-text-to-2-lines font-bold text-lg text-center mb-2 ${textColorClass}" style="max-width: 100%;">
          ${product.name}
        </div>
        <div class="product-rating-container flex items-center mb-1">
          <img class="product-rating-stars w-20" src="images/ratings/rating-${product.rating.stars * 10}.png">
          <div class="product-rating-count link-primary ml-2 text-blue-600 font-semibold">
            ${product.rating.count}
          </div>
        </div>
        <div class="product-price text-xl font-bold text-green-600 mb-2">
          $${formatCurrency(product.priceCents)}
        </div>
        <div class="product-quantity-container mb-2">
          <select class="border rounded px-2 py-1 ${isDarkTheme ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-black border-gray-300'}">
            <option selected value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
            <option value="9">9</option>
            <option value="10">10</option>
          </select>
        </div>
        <div class="product-spacer flex-1"></div>
        <div class="added-to-cart hidden animate__animated animate__fadeInDown">
          <img src="images/icons/checkmark.png" class="inline w-5 h-5 mr-1">Added
        </div>
        <button class="add-to-cart-button button-primary js-add-to-cart w-full py-2 mt-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition animate__animated animate__pulse" data-product-id="${product.id}">
          Add to Cart
        </button>
      </div>
    `;
  });
  document.querySelector('.js-products-grid').innerHTML = productsHtml;
  
  // Re-attach add-to-cart listeners
  document.querySelectorAll('.js-add-to-cart').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!user.id) {
        window.location.href = 'sign.html';
        return;
      }
      const productId = button.dataset.productId;
      const quantity = parseInt(button.parentElement.querySelector('select').value, 10) || 1;
      await addToCart(user.id, productId, quantity);
      await updateCartFromDB();
      showAddToCartMessage();
      const card = button.closest('.product-container');
      const added = card.querySelector('.added-to-cart');
      added.classList.remove('hidden');
      setTimeout(() => added.classList.add('hidden'), 1200);
    });
  });
}

// Initial render
renderProducts('', '');
updateCartFromDB();

// Search and sort functionality
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');

function updateProducts() {
  const filterValue = searchInput ? searchInput.value : '';
  const sortValue = sortSelect ? sortSelect.value : '';
  renderProducts(filterValue, sortValue);
}

// Search suggestions functionality
function createSearchSuggestions() {
  // Remove existing suggestions if any
  const existingSuggestions = document.querySelector('.search-suggestions');
  if (existingSuggestions) {
    existingSuggestions.remove();
  }

  if (!searchInput || !searchInput.value.trim()) return;

  const searchTerm = searchInput.value.toLowerCase();
  const suggestions = products
    .filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      product.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm))
    )
    .slice(0, 5) // Limit to 5 suggestions
    .map(product => product.name);

  if (suggestions.length === 0) return;

  const suggestionsContainer = document.createElement('div');
  suggestionsContainer.className = 'search-suggestions absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-b-lg shadow-lg z-50 max-h-60 overflow-y-auto';
  
  suggestions.forEach(suggestion => {
    const suggestionItem = document.createElement('div');
    suggestionItem.className = 'suggestion-item px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150';
    suggestionItem.textContent = suggestion;
    suggestionItem.addEventListener('click', () => {
      searchInput.value = suggestion;
      updateProducts();
      suggestionsContainer.remove();
    });
    suggestionsContainer.appendChild(suggestionItem);
  });

  // Insert suggestions after search input
  const searchContainer = searchInput.closest('.relative');
  if (searchContainer) {
    searchContainer.appendChild(suggestionsContainer);
  }
}

function clearSearchSuggestions() {
  const suggestions = document.querySelector('.search-suggestions');
  if (suggestions) {
    suggestions.remove();
  }
}

if (searchInput) {
  searchInput.addEventListener('input', () => {
    updateProducts();
    createSearchSuggestions();
  });
  
  searchInput.addEventListener('focus', createSearchSuggestions);
  searchInput.addEventListener('blur', () => {
    // Delay clearing to allow clicking on suggestions
    setTimeout(clearSearchSuggestions, 200);
  });
}

if (sortSelect) {
  sortSelect.addEventListener('change', updateProducts);
}

// Search button functionality
const searchBtn = document.getElementById('search-btn');
if (searchBtn) {
  searchBtn.addEventListener('click', updateProducts);
}

// Enter key functionality for search input
if (searchInput) {
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      updateProducts();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartFromDB();
});