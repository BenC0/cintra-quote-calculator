import { getFirstValue } from "../Utils/getFirstValue"

export const standardImplementationRatesDefsHandler = r => {
    return {
        id: r.id,
        band_price: r.values.band_price,
        minimum_quantity: r.values.minimum_quantity,
        band_fixed_price: !!r.values.band_fixed_price,
        product_value: r.values.product_value ?? null,
        product_id: getFirstValue("product_id", r)?.id ?? null,
    }
}