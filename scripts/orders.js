import { products } from "../data/products.js";
import dayjs from "https://unpkg.com/dayjs@1.11.10/esm/index.js";
import { formatCurrency } from "./utils/money.js";
import { addToCart } from "../data/cart.js";

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

// Renders all paid orders with their details and estimated delivery dates
function renderOrders(orders) {
  const ordersGrid = document.querySelector('.js-orders-grid');
  if (!ordersGrid) return;
  
  // Only show paid orders
  const paidOrders = orders.filter(order => order.status === 'paid');
  
  if (!paidOrders || paidOrders.length === 0) {
    ordersGrid.innerHTML = `
      <div class="text-center py-12">
        <div class="text-gray-500 text-lg mb-4">No paid orders found.</div>
        <a href="amazon.html" class="text-blue-600 hover:underline">Start Shopping</a>
      </div>
    `;
    return;
  }

  ordersGrid.innerHTML = paidOrders.map(order => {
    const orderDate = new Date(order.created_at || order.createdAt || Date.now());
    const estDelivery = dayjs(orderDate).add(7, 'day').format('dddd, MMMM D');
    
    return `
      <div class="order-container bg-white border rounded-lg shadow-sm p-6 animate__animated animate__fadeInUp">
        <div class="order-header border-b pb-4 mb-6">
          <div class="flex flex-col md:flex-row md:justify-between md:items-center">
            <div class="mb-4 md:mb-0">
              <div class="text-gray-500 text-sm">Order Placed</div>
              <div class="font-semibold text-lg">${orderDate.toLocaleDateString()}</div>
            </div>
            <div class="mb-4 md:mb-0">
              <div class="text-gray-500 text-sm">Order ID</div>
              <div class="font-mono text-sm">${order.id}</div>
            </div>
            <div>
              <div class="text-gray-500 text-sm">Estimated Delivery</div>
              <div class="text-green-700 font-bold">${estDelivery}</div>
            </div>
          </div>
        </div>
        <div class="js-order-items-${order.id} space-y-6">
          <div class="text-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <div class="text-gray-500 mt-2">Loading order items...</div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Fetch order items for each order
  paidOrders.forEach(order => {
    fetchOrderItems(order.id);
  });

  // Update order summary
  updateOrderSummary(paidOrders);
}

// Fetches order items for a specific order from the server
async function fetchOrderItems(orderId) {
  try {
    const res = await fetch(`http://localhost:3000/order-items/${orderId}`);
    if (!res.ok) {
      throw new Error('Failed to fetch order items');
    }
    const orderItems = await res.json();
    renderOrderItems(orderId, orderItems);
  } catch (error) {
    console.error('Error fetching order items:', error);
    const container = document.querySelector(`.js-order-items-${orderId}`);
    if (container) {
      container.innerHTML = '<div class="text-red-500 text-center">Failed to load order items</div>';
    }
  }
}

// Renders order items with product details and action buttons
function renderOrderItems(orderId, orderItems) {
  const container = document.querySelector(`.js-order-items-${orderId}`);
  if (!container) return;

  if (!orderItems || orderItems.length === 0) {
    container.innerHTML = '<div class="text-gray-500 text-center">No items found in this order</div>';
    return;
  }

  container.innerHTML = orderItems.map(item => {
    const product = products.find(p => p.id === item.product_id);
    if (!product) return '';

    const orderDate = new Date();
    const estDelivery = dayjs(orderDate).add(7, 'day').format('dddd, MMMM D');

    return `
      <div class="cart-item-container border rounded-lg p-6 bg-gray-50">
        <div class="delivery-date text-sm text-gray-600 mb-3">
          Estimated delivery: <span class="font-semibold text-green-700">${estDelivery}</span>
        </div>
        <div class="cart-item-details-grid grid grid-cols-1 md:grid-cols-3 gap-6">
          <img class="product-image w-32 h-32 object-contain bg-white border rounded" src="${product.image}" alt="${product.name}">
          <div class="cart-item-details">
            <div class="product-name font-semibold text-lg mb-2">${product.name}</div>
            <div class="product-price text-gray-700 font-bold mb-2">$${formatCurrency(item.price_cents || product.priceCents)}</div>
            <div class="product-quantity text-gray-600">Quantity: ${item.quantity}</div>
          </div>
          <div class="product-actions flex flex-col justify-center">
            <a href="tracking.html?orderId=${orderId}&productId=${product.id}">
              <button class="track-package-button bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition w-full mb-2">
                Track Package
              </button>
            </a>
            <button class="buy-again-button bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition w-full" data-product-id="${product.id}" data-quantity="${item.quantity}">
              Buy Again
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Add event listeners for Buy Again buttons
  container.querySelectorAll('.buy-again-button').forEach(button => {
    button.addEventListener('click', async () => {
      const productId = button.dataset.productId;
      const quantity = parseInt(button.dataset.quantity);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!user.id) {
        alert('Please sign in to add items to your cart.');
        return;
      }

      try {
        button.disabled = true;
        button.textContent = 'Adding...';
        
        await addToCart(user.id, productId, quantity);
        
        button.textContent = 'Added!';
        button.classList.remove('bg-gray-200', 'hover:bg-gray-300');
        button.classList.add('bg-green-600', 'text-white');
        
        setTimeout(() => {
          button.textContent = 'Buy Again';
          button.disabled = false;
          button.classList.remove('bg-green-600', 'text-white');
          button.classList.add('bg-gray-200', 'hover:bg-gray-300');
        }, 2000);
        
      } catch (error) {
        console.error('Error adding to cart:', error);
        button.textContent = 'Error';
        button.disabled = false;
        
        setTimeout(() => {
          button.textContent = 'Buy Again';
        }, 2000);
      }
    });
  });
}

// Updates the order summary statistics display
function updateOrderSummary(orders) {
  const totalOrders = orders.length;
  const totalItems = orders.reduce((sum, order) => sum + (order.item_count || 0), 0);
  
  document.querySelector('.js-total-orders').textContent = totalOrders;
  document.querySelector('.js-items-shipped').textContent = totalItems;
  document.querySelector('.js-in-transit').textContent = Math.floor(totalItems * 0.7); // Simulated data
  document.querySelector('.js-delivered').textContent = Math.floor(totalItems * 0.3); // Simulated data
}

// Fetches all orders for the current user from the server
async function fetchOrders() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.id;
  
  if (!userId) {
    document.querySelector('.js-orders-grid').innerHTML = `
      <div class="text-center py-12">
        <div class="text-gray-500 text-lg mb-4">Please sign in to view your orders.</div>
        <a href="sign.html" class="text-blue-600 hover:underline">Sign In</a>
      </div>
    `;
    return;
  }

  try {
    const res = await fetch(`http://localhost:3000/orders/${userId}`);
    if (res.ok) {
      const orders = await res.json();
      renderOrders(orders);
    } else {
      renderOrders([]);
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
    renderOrders([]);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchOrders();
}); 