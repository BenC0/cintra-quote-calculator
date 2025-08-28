export const getPriceBand = (qtyVal, fieldValue, price_table) => {
    let output = {
        band_price: 0,
        monthly_standing_charge: 0,
        band_price_is_percent: false,
        isFallback: true,
    }
    if (!!fieldValue) {
        if (price_table.length > 0) {
            let price_bands = []
            if (price_table.some(band => !!band.product_value)) {
                price_bands = price_table.filter(band => (band.minimum_quantity <= qtyVal) && (band.product_value == fieldValue))
            } else {
                price_bands = price_table.filter(band => (band.minimum_quantity <= qtyVal))
            }
            if (price_bands.length > 0) {
                price_bands = price_bands.sort((a, b) => a.minimum_quantity - b.minimum_quantity)
                output = price_bands[price_bands.length - 1]
            }
        }
    }
    return output
}