import { getFirstValue } from "../Utils/getFirstValue";

export const getTablesToFetch = (productDefs, productTypeDefs) => {
    return [...productDefs, ...productTypeDefs]
        // Collect any defined input_values_table or quantity_frequency_values_table references
        .map((p) => p.input_values_table || p.quantity_frequency_values_table)
        .filter((tbl) => !!tbl);
}