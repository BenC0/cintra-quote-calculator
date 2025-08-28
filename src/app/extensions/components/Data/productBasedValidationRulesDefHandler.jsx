export const productBasedValidationRulesDefHandler = r => ({
    product_id: r.values.product_id,
    product_value: r.values.product_value,
    scope: r.values.scope.name,
    excluded_products: r.values.excluded_products,
})