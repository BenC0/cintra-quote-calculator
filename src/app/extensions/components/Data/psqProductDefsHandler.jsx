import { getFirstValue } from "../Utils/getFirstValue";

export const psqProductDefsHandler = (rawImpProducts, impResourceDict) => {
    return rawImpProducts.map((r) => {
        const [firstResourceId] = (r.values.resource || []).map((x) => x.id);
        return {
            field: r.id,
            label: r.values.name,
            product_type: getFirstValue("product_type", r),
            resource: impResourceDict[firstResourceId] || null,
            psq_config_reference: r.values.psq_config_reference.map(a => a.id),
            line_item_id: r?.values?.line_item_id ?? false,
        };
    });
}