export const psqTypeDefsHandler = r => ({
    field: r.id,
    label: r.values.name,
    sort_order: r.values.sort_order,
    max_plans: 1,
    quantity_field_label: null,
    input_display_type: "inline-table",
    quantity_frequency_values_table: null
})