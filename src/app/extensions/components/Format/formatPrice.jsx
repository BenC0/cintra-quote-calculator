export const formatPrice = (price = 0) => price.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});