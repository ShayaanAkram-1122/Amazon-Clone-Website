// Converts price from cents to dollars with proper formatting
export function formatCurrency(priceCents) {
    return (Math.round(priceCents) / 100).toFixed(2);
}
export default formatCurrency;