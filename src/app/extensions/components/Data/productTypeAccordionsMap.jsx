export const productTypeAccordionsMap = (productTypeDefs, productDefs, valueTables) => {
    const customProductTypeDef = {
        "field": "CustomProductType",
        "label": "Custom Products",
        "sort_order": productTypeDefs.length,
        "max_plans": -1,
        "quantity_field_label": "Quantity",
        "input_display_type": "table",
        "is_payroll_product_type": false,
        "is_quote_details_type": false,
        "use_quantity_as_implementation_headcount": false,
        "standard_implementation_calculation_type": "default",
        "standard_implementation_calculation_product": null,
        "quantityFieldDef": {
            "field": "quantity",
            "label": "Quantity",
            "input_values_table": "",
            "input_type": "Number",
            "pricing_structure": {"label": "N/A",},
            "product_type": {
                "id": "CustomProductType",
                "name": "Custom Products",
                "type": "foreignid"
            },
            "product_sub_type": {
                "label": "Details",
                "name": "details"
            },
            "requires_psq": false,
            "contract_length_dropdown": false,
            "education_client_toggle": false,
            "public_sector_toggle": false,
            "value": 0
        },
    }
    const customProductFields = [
        {
            "field": "CustomProductName",
            "label": "Custom Product Name",
            "input_values_table": "",
            "input_type": "Text",
            "pricing_structure": {
                "label": "N/A",
            },
            "product_type": {
                "id": "CustomProductType",
                "name": "Custom Products",
                "type": "foreignid"
            },
            "product_sub_type": {
                "id": "1",
                "name": "core",
                "label": "Core",
                "type": "option",
                "order": 0
            },
            "requires_psq": false,
            "contract_length_dropdown": false,
            "education_client_toggle": false,
            "public_sector_toggle": false
        },
        {
            "field": "CustomProductPrice",
            "label": "Custom Product Price",
            "input_values_table": "",
            "input_type": "Number",
            "pricing_structure": {
                "label": "N/A",
            },
            "product_type": {
                "id": "CustomProductType",
                "name": "Custom Products",
                "type": "foreignid"
            },
            "product_sub_type": {
                "id": "1",
                "name": "core",
                "label": "Core",
                "type": "option",
                "order": 0
            },
            "requires_psq": false,
            "contract_length_dropdown": false,
            "education_client_toggle": false,
            "public_sector_toggle": false
        }
    ]
    return [...productTypeDefs, customProductTypeDef].map((productType) => {
        const output = { ...productType };
        // Populate frequency field options from dynamic tables
        if (output.frequencyFieldDef) {
            output.frequencyFieldDef.values = valueTables[output.quantity_frequency_values_table] || null;
        }
        // Build field definitions including default values per input type
        output.fields = [...productDefs, ...customProductFields]
            .filter((a) => a.product_type.id === productType.field)
            .map((field) => {
                let values = null;
                let defaultValue = null;
                switch (field.input_type) {
                    case "Toggle":
                        values = { active: "Yes", inactive: "No" };
                        defaultValue = false;
                        break;
                    case "Number":
                        values = { min: 0 };
                        defaultValue = 0;
                        break;
                    case "Text":
                        values = { default: "" };
                        defaultValue = "";
                        break;
                    case "Radio":
                    case "Dropdown":
                        values = valueTables[field.input_values_table];
                        defaultValue = values ? values[0].value : null;
                        break;
                    default:
                        return null;
                }
                return { ...field, values, defaultValue };
            })
            .filter((f) => f !== null);
        return output;
    })
}