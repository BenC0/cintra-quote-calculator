import { getFirstValue } from "../Utils/getFirstValue"

export const productPriceDefsHandler = r => {
    return {
        field: r.id,
        label: r.values.name,
        band_price: r.values.band_price,
        bundle_price: r.values.bundle_price,
        product_value: r.values.product_value,
        minimum_price: r.values.minimum_price,
        minimum_quantity: r.values.minimum_quantity,
        band_price_is_percent: r.values.band_price_is_percent == 1,
        monthly_standing_charge: r.values.monthly_standing_charge,
        product_field: !!getFirstValue("product_id", r) ? getFirstValue("product_id", r).id : null,
    }
}