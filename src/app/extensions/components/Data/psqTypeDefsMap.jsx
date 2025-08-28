export const psqTypeDefsMap = (psqTypeDefs, psqProductDefs) => {
    return psqTypeDefs.map((psqType) => {
        const output = { ...psqType };
        // Attach product-level fields to each PSQ type
        output.fields = psqProductDefs
            .filter((a) => a.product_type.id === psqType.field)
            .map((field) => ({
                ...field,
                value: 0,
                defaultValue: 0,
                input_type: { name: "Number" },
                product_sub_type: { name: "N/A" }
            }));
        return output;
    })
}