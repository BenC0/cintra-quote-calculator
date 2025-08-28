export const formatInt = (price = 0) => price.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
});