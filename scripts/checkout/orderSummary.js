import { fetchCart, removeFromCart, updateDeliveryOption, addToCart, updateCartQuantity } from "../../data/cart.js";
import { products } from "../../data/products.js";
import { formatCurrency } from "../utils/money.js";
import dayjs from "https://unpkg.com/dayjs@1.11.10/esm/index.js";
import { delieveryOptions } from "../../data/delieveryOptions.js";
import { renderPaymentSummary } from "./paymentSummary.js";

let cart = [];
const user = JSON.parse(localStorage.getItem('user') || '{}');

// Fetches the user's cart from the database and updates the UI
export async function updateCartFromDB() {
  if (!user.id) return;
  cart = await fetchCart(user.id);
  updateTotalItems();
  renderCart();
}

// Updates the total items count display in the header
function updateTotalItems() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById("total-items").textContent = totalItems;
}

// Renders the complete cart with all items and delivery options
export async function renderCart() {
  const orderSummaryEl = document.querySelector(".js-order-summary");
  orderSummaryEl.innerHTML = ""; 
  let cartSummaryHtml = "";

  cart.forEach((cartItem) => {
    const matchingProduct = products.find(
      (product) => product.id === cartItem.product_id || product.id === cartItem.productId
    );
    if (!matchingProduct) {
      return;
    }

    const delieveryOption =
      delieveryOptions.find((option) => option.id === cartItem.delivery_option_id) ||
      delieveryOptions[0];

    const deliveryDate = dayjs(new Date()).add(delieveryOption.delieveryDays, "days");
    const dateString = deliveryDate.format("dddd, MMMM D");

    cartSummaryHtml += `
      <div class="cart-item-container js-cart-item-container-${matchingProduct.id}">
        <div class="delivery-date">
          Delivery date: ${dateString}
        </div>
        <div class="cart-item-details-grid">
          <img class="product-image" src="${matchingProduct.image}" alt="${matchingProduct.name}">
          <div class="cart-item-details">
            <div class="product-name">
              ${matchingProduct.name}
            </div>
            <div class="product-price">
              $${formatCurrency(matchingProduct.priceCents)}
            </div>
            <div class="product-quantity flex items-center gap-2">
              <span>Quantity:</span>
              <select class="quantity-select border rounded px-2 py-1" data-product-id="${matchingProduct.id}">
                ${[...Array(10).keys()].map(i => `<option value="${i+1}" ${cartItem.quantity == i+1 ? 'selected' : ''}>${i+1}</option>`).join('')}
              </select>
              <span class="delete-quantity-link link-primary js-delete-link text-red-600 ml-2 cursor-pointer" data-product-id="${matchingProduct.id}">Delete</span>
            </div>
          </div>
          <div class="delivery-options">
            <div class="delivery-options-title">
              Choose a delivery option:
            </div>
            ${deliveryOptionsHtml(matchingProduct, cartItem)}
          </div>
        </div>
      </div>
    `;
  });

  orderSummaryEl.innerHTML = cartSummaryHtml; 
  addEventListeners(); 
  renderPaymentSummary();
}

// Generates HTML for delivery options for a specific product
function deliveryOptionsHtml(matchingProduct, cartItem) {
  let html = "";
  delieveryOptions.forEach((delieveryOption) => {
    const deliveryDate = dayjs(new Date()).add(delieveryOption.delieveryDays, "days");
    const dateString = deliveryDate.format("dddd, MMMM D");

    const priceString =
      delieveryOption.priceCents === 0
        ? "FREE"
        : `$${formatCurrency(delieveryOption.priceCents)}`;

    const isChecked = (cartItem && cartItem.delivery_option_id === delieveryOption.id);

    html += `
      <div class="delivery-option">
        <input type="radio" 
          class="delivery-option-input focus:outline-none focus:ring-0"
          name="delivery-option-${matchingProduct.id}"
          value="${delieveryOption.id}" 
          data-product-id="${matchingProduct.id}"
          ${isChecked ? "checked" : ""}>
        <div>
          <div class="delivery-option-date">
            ${dateString}
          </div>
          <div class="delivery-option-price">
            ${priceString} - Shipping
          </div>
        </div>
      </div>
    `;
  });
  return html;
}

// Adds event listeners for delete, delivery option changes, and quantity updates
function addEventListeners() {
  document.querySelectorAll(".js-delete-link").forEach((link) => {
    link.addEventListener("click", async () => {
      const productId = link.dataset.productId;
      const product = products.find(p => p.id === productId);
      await removeFromCart(user.id, productId);
      await updateCartFromDB();
      renderPaymentSummary();
      if (product) {
        const confirmed = confirm(`${product.name} has been removed from your cart and added to your returns.\n\nYou can buy it again anytime from the Returns page.\n\nWould you like to view your returns now?`);
        if (confirmed) {
          window.location.href = 'returns.html';
        }
      }
    });
  });

  document.querySelectorAll(".delivery-option-input").forEach((input) => {
    input.addEventListener("change", async (event) => {
      const productId = event.target.dataset.productId;
      const deliveryOptionId = event.target.value;
      if (user.id && productId && deliveryOptionId) {
        await updateDeliveryOption(user.id, productId, deliveryOptionId);
        await updateCartFromDB();
        renderPaymentSummary();
      }
    });
  });

  document.querySelectorAll(".quantity-select").forEach((select) => {
    select.addEventListener("change", async (event) => {
      const productId = event.target.dataset.productId;
      const newQuantity = parseInt(event.target.value, 10);
      const cartItem = cart.find(item => (item.product_id || item.productId) === productId);
      const deliveryOptionId = cartItem?.delivery_option_id || '1';
      await updateCartQuantity(user.id, productId, newQuantity, deliveryOptionId);
      await updateCartFromDB();
      renderPaymentSummary();
    });
  });
}

updateCartFromDB();

document.querySelector('.place-order-button')?.addEventListener('click', async () => {
  if (!user.id) return;
  const cartItems = await fetchCart(user.id);
  if (!cartItems.length) return alert('Your cart is empty!');
  
  // Check if there's already a pending order
  const pendingOrderId = localStorage.getItem('pendingOrderId');
  if (pendingOrderId) {
    const confirmed = confirm('You have a pending order. Would you like to continue with that order or create a new one?');
    if (confirmed) {
      // Continue with existing order
      window.location.href = 'shipping.html';
      return;
    } else {
      // Clear the pending order and create a new one
      localStorage.removeItem('pendingOrderId');
    }
  }
  
  // Create order without clearing cart - cart will only be cleared after successful payment
  const items = cartItems.map(item => ({
    productId: item.product_id || item.productId,
    quantity: item.quantity,
    priceCents: (products.find(p => p.id === (item.product_id || item.productId))?.priceCents) || 0
  }));
  
  const res = await fetch('http://localhost:3000/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: user.id, items })
  });
  
  if (res.ok) {
    const result = await res.json();
    // Store order ID for payment completion
    localStorage.setItem('pendingOrderId', result.orderId);
    console.log('Order created successfully, pendingOrderId:', result.orderId);
    window.location.href = 'shipping.html';
  } else {
    const errorData = await res.json();
    console.error('Failed to place order:', errorData);
    alert(`Failed to place order: ${errorData.error || 'Please try again.'}`);
  }
});
