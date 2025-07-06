// Retrieves the user's cart items from the server
export async function fetchCart(userId) {
  const res = await fetch(`http://localhost:3000/cart/${userId}`);
  if (!res.ok) return [];
  return await res.json();
}

// Adds a product to the user's cart with specified quantity and delivery option
export async function addToCart(userId, productId, quantity = 1, deliveryOptionId = '1') {
  await fetch("http://localhost:3000/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, productId, quantity, deliveryOptionId }),
  });
}

// Updates the delivery option for a specific cart item
export async function updateDeliveryOption(userId, productId, deliveryOptionId) {
  await fetch("http://localhost:3000/cart/delivery", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, productId, deliveryOptionId }),
  });
}

// Updates the quantity of a specific product in the user's cart
export async function updateCartQuantity(userId, productId, quantity, deliveryOptionId = '1') {
  await fetch("http://localhost:3000/cart/quantity", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, productId, quantity, deliveryOptionId }),
  });
}

// Removes a product from the user's cart and adds it to returns
export async function removeFromCart(userId, productId) {
  const cartRes = await fetch(`http://localhost:3000/cart/${userId}`);
  if (cartRes.ok) {
    const cartItems = await cartRes.json();
    const cartItem = cartItems.find(item => (item.product_id || item.productId) === productId);
    if (cartItem) {
      await fetch('http://localhost:3000/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          productId: productId,
          quantity: cartItem.quantity
        })
      });
    }
  }
  
  await fetch(`http://localhost:3000/cart/${userId}/${productId}`, {
    method: "DELETE",
  });
}

// Removes all items from the user's cart
export async function clearCart(userId) {
  await fetch(`http://localhost:3000/cart/${userId}`, {
    method: "DELETE" });
}
