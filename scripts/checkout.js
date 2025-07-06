import { updateCartFromDB } from "./checkout/orderSummary.js"; 
import { renderPaymentSummary } from "./checkout/paymentSummary.js";

// Initializes the checkout page by fetching cart data and rendering components
document.addEventListener('DOMContentLoaded', async function() {
  await updateCartFromDB();
  
  const pendingOrderId = localStorage.getItem('pendingOrderId');
  if (pendingOrderId) {
    console.log('Found pending order:', pendingOrderId);
  }
});