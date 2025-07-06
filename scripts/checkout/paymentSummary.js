import { fetchCart } from "../../data/cart.js";
import { products } from "../../data/products.js";
import { delieveryOptions } from "../../data/delieveryOptions.js";
import { formatCurrency } from "../utils/money.js";

// Calculates and renders the payment summary with all costs and totals
export async function renderPaymentSummary() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user.id) return;
  const cart = await fetchCart(user.id);
  
  let itemsTotalCents = 0;
  let shippingTotalCents = 0;
  cart.forEach((cartItem) => {
    const product = products.find((p) => p.id === cartItem.product_id || p.id === cartItem.productId);
    if (product) {
      itemsTotalCents += product.priceCents * cartItem.quantity;
      const deliveryOptionId = cartItem.delivery_option_id || '1';
      const deliveryOption = delieveryOptions.find((d) => d.id === deliveryOptionId) || delieveryOptions[0];
      shippingTotalCents += deliveryOption.priceCents;
    }
  });
  const subtotalCents = itemsTotalCents + shippingTotalCents;
  const estimatedTaxCents = Math.round(subtotalCents * 0.10);
  const orderTotalCents = subtotalCents + estimatedTaxCents;

  const paymentSummaryEls = document.querySelectorAll('.payment-summary-row .payment-summary-money');
  if (paymentSummaryEls.length >= 5) {
    paymentSummaryEls[0].textContent = `$${formatCurrency(itemsTotalCents)}`;
    paymentSummaryEls[1].textContent = `$${formatCurrency(shippingTotalCents)}`;
    paymentSummaryEls[2].textContent = `$${formatCurrency(subtotalCents)}`;
    paymentSummaryEls[3].textContent = `$${formatCurrency(estimatedTaxCents)}`;
    paymentSummaryEls[4].textContent = `$${formatCurrency(orderTotalCents)}`;
  }
}