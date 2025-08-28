export const productTypeDefsHandler = r => {
    // Build synthetic fields for quantity and frequency inputs
    const quantityFieldDef = buildProductDef({
        id: "quantity",
        values: {
            name: r.values.quantity_field_label,
            input_type: { name: "Number" },
            product_type: [{ id: r.id, name: r.values.name, type: "foreignid" }],
            product_sub_type: { label: "Details", name: "details" }
        }
    });
    const frequencyFieldDef = buildProductDef({
        id: "frequency",
        values: {
            name: "Frequency",
            input_type: { name: "Dropdown" },
            product_type: [{ id: r.id, name: r.values.name, type: "foreignid" }],
            product_sub_type: { label: "Details", name: "details" },
            input_values_table: r.values.quantity_frequency_values_table
        }
    });
    // Return the full product type definition
    return {
        field: r.id,
        label: r.values.name,
        sort_order: r.values.sort_order,
        max_plans: r.values.max_plans,
        quantity_field_label: r.values.quantity_field_label,
        input_display_type: r.values.input_display_type.name,
        is_payroll_product_type: !!r.values.is_payroll_product_type && r.values.is_payroll_product_type == 1,
        is_quote_details_type: !!r.values.is_quote_details_type && r.values.is_quote_details_type == 1,
        quantity_frequency_values_table: r.values.quantity_frequency_values_table,
        use_quantity_as_implementation_headcount: !!r.values.use_quantity_as_implementation_headcount,
        standard_implementation_calculation_type: r.values.standard_implementation_calculation_type?.name ?? "default",
        standard_implementation_calculation_product: getFirstValue("standard_implementation_calculation_product", r)?.id ?? null,
        quantityFieldDef,
        frequencyFieldDef,
    };
}