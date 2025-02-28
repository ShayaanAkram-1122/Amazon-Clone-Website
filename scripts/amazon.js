import { cart , saveToStorage} from '../data/cart.js';
import { products } from '../data/products.js';
import { formatCurrency } from './utils/money.js';

let productsHtml='';
products.forEach((product)=>
{
    productsHtml += `
        <div class="product-container">
          <div class="product-image-container">
            <img class="product-image"
              src="${product.image}">
          </div>

          <div class="product-name limit-text-to-2-lines">
            ${product.name}
          </div>

          <div class="product-rating-container">
            <img class="product-rating-stars"
              src="images/ratings/rating-${product.rating.stars * 10}.png">
            <div class="product-rating-count link-primary">
              ${product.rating.count}
            </div>
          </div>

          <div class="product-price">
            $${formatCurrency(product.priceCents)}
          </div>

          <div class="product-quantity-container">
            <select>
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

          <div class="product-spacer"></div>

          <div class="added-to-cart">
            <img src="images/icons/checkmark.png">
            Added
          </div>

          <button class="add-to-cart-button button-primary js-add-to-cart"
          data-product-id="${product.id}">
            Add to Cart
          </button>
        </div>
    `;
});



console.log(productsHtml);
document.querySelector('.js-products-grid').
innerHTML= productsHtml;
document.querySelectorAll('.js-add-to-cart').forEach((button) => {
  button.addEventListener('click', () => {
    const productId = button.dataset.productId;
    let matchingItem;
    cart.forEach((item) => {
      if (productId === item.productId) {
        matchingItem = item;
      }
    });
    if (matchingItem) {
      matchingItem.quantity++;
    } else {
      cart.push({
        productId: productId,
        quantity: 1,
        delieveryOptionsId: '1'
      });
      saveToStorage();
    }
    let cartQuantity = 0;
    cart.forEach((item) => {
      cartQuantity += item.quantity;
    });
    document.querySelector('.js-cart-quantity')
    .innerHTML = cartQuantity;

    let existingMessage = button.parentNode.querySelector('.added-to-cart');
    if (existingMessage) {
      if (existingMessage.timeoutId) {
        clearTimeout(existingMessage.timeoutId);
      }
      existingMessage.style.opacity = '1';
      existingMessage.timeoutId = setTimeout(() => {
        existingMessage.style.opacity = '0';
      }, 2000);
    } else {
      const message = document.createElement('div');
      message.className = 'added-to-cart';
      message.innerHTML = '<img src="tick.png" alt="tick"> Added to Cart';
      button.parentNode.insertBefore(message, button);
      message.style.opacity = '1';
      message.timeoutId = setTimeout(() => {
        message.style.opacity = '0';
      }, 2000);
    }
  });
});