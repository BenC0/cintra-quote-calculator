export const psqImpConfigHandler = r => ({
    id: r.id,
    name: r.values.name,
    product_value: r.values.product_value,
    product_references: r.values.product_reference?.map(a => a.id) ?? [],
})