import { cart, removeFromCart, updateDeliveryOption } from "../../data/cart.js";
import { products } from "../../data/products.js";
import { formatCurrency } from "../utils/money.js";
import dayjs from "https://unpkg.com/dayjs@1.11.10/esm/index.js";
import { delieveryOptions } from "../../data/delieveryOptions.js";

function updateTotalItems() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById("total-items").textContent = totalItems;
}

updateTotalItems();

export function renderCart() {
  const orderSummaryEl = document.querySelector(".js-order-summary");
  orderSummaryEl.innerHTML = ""; 
  let cartSummaryHtml = "";

  cart.forEach((cartItem) => {
    const matchingProduct = products.find(
      (product) => product.id === cartItem.productId
    );
    if (!matchingProduct) return;

    const delieveryOption =
      delieveryOptions.find((option) => option.id === cartItem.id) ||
      delieveryOptions[0];

    const deliveryDate = dayjs().add(delieveryOption.delieveryDays, "days");
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
            <div class="product-quantity">
              <span>
                Quantity: <span class="quantity-label">${cartItem.quantity}</span>
              </span>
              <span class="update-quantity-link link-primary">Update</span>
              <span class="delete-quantity-link link-primary js-delete-link" data-product-id="${matchingProduct.id}">Delete</span>
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
}

function deliveryOptionsHtml(matchingProduct, cartItem) {
  let html = "";
  delieveryOptions.forEach((delieveryOption) => {
    const deliveryDate = dayjs().add(delieveryOption.delieveryDays, "days");
    const dateString = deliveryDate.format("dddd, MMMM D");

    const priceString =
      delieveryOption.priceCents === 0
        ? "FREE"
        : `$${formatCurrency(delieveryOption.priceCents)}`;

    const isChecked = cartItem && cartItem.id === delieveryOption.id;

    html += `
      <div class="delivery-option">
        <input type="radio" 
          class="delivery-option-input"
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

function addEventListeners() {
  document.querySelectorAll(".js-delete-link").forEach((link) => {
    link.addEventListener("click", () => {
      const productId = link.dataset.productId;
      removeFromCart(productId);
      renderCart(); 
      updateTotalItems();
    });
  });

  document.querySelectorAll(".delivery-option-input").forEach((input) => {
    input.addEventListener("change", (event) => {
      const productId = event.target.dataset.productId;
      const deliveryOptionId = event.target.value;
      updateDeliveryOption(productId, deliveryOptionId);
      renderCart();
    });
  });
}
