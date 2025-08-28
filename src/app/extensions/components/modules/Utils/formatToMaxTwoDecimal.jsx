export const formatToMaxTwoDecimal = (price = 0) => price.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
});