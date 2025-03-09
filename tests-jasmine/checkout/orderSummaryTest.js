import { renderCart} from "../../scripts/checkout/orderSummary.js";

describe('Test suite: Render Order Summary', ()=>
{
    it('displays the cart',()=>
    {
        document.querySelector('.js-test-container').innerHTML= `
            <div class="js-order-summary"></div>
            
        `;
    })
})