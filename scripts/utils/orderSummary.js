// Calculates the complete order summary including items, shipping, and total
export async function calculateOrderSummary(userId) {
  try {
    const cartRes = await fetch(`http://localhost:3000/cart/${userId}`);
    if (!cartRes.ok) {
      console.error('Failed to fetch cart data');
      return { itemsTotal: 0, shippingTotal: 0, totalAmount: 0 };
    }
    
    const cartItems = await cartRes.json();
    
    if (cartItems.length === 0) {
      return { itemsTotal: 0, shippingTotal: 0, totalAmount: 0 };
    }
    
    const productsRes = await fetch('http://localhost:3000/products');
    if (!productsRes.ok) {
      console.error('Failed to fetch products data');
      return { itemsTotal: 0, shippingTotal: 0, totalAmount: 0 };
    }
    
    const products = await productsRes.json();
    
    let itemsTotalCents = 0;
    cartItems.forEach(cartItem => {
      const product = products.find(p => p.id === cartItem.product_id);
      if (product) {
        itemsTotalCents += product.priceCents * cartItem.quantity;
      }
    });
    
    const itemsTotal = itemsTotalCents / 100;
    const shippingTotal = itemsTotal >= 25 ? 0 : 5.99;
    const totalAmount = itemsTotal + shippingTotal;
    
    return {
      itemsTotal: itemsTotal.toFixed(2),
      shippingTotal: shippingTotal.toFixed(2),
      totalAmount: totalAmount.toFixed(2)
    };
    
  } catch (error) {
    console.error('Error calculating order summary:', error);
    return { itemsTotal: '0.00', shippingTotal: '0.00', totalAmount: '0.00' };
  }
}

// Updates all order summary display elements on the page
export async function updateOrderSummaryDisplay(userId) {
  const summary = await calculateOrderSummary(userId);
  
  const itemsTotalElements = document.querySelectorAll('.js-items-total');
  const shippingTotalElements = document.querySelectorAll('.js-shipping-total');
  const totalAmountElements = document.querySelectorAll('.js-total-amount');
  
  itemsTotalElements.forEach(el => {
    el.textContent = `$${summary.itemsTotal}`;
  });
  
  shippingTotalElements.forEach(el => {
    el.textContent = `$${summary.shippingTotal}`;
  });
  
  totalAmountElements.forEach(el => {
    el.textContent = `$${summary.totalAmount}`;
  });
} 