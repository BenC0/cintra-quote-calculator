import { getFirstValue } from "../Utils/getFirstValue"

export const standardImplementationDaysDefsHandler = r => {
    return {
        id: r.id,
        days: r.values.days,
        product_value: r.values.product_value,
        minimum_quantity: r.values.minimum_quantity,
        product_id: getFirstValue("product_id", r).id,
    }
}