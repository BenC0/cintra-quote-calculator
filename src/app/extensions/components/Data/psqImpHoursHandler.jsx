export const psqImpHoursHandler = r => ({
	id: r.id,
	name: r.values.name,
	hours: r.values.hours,
	product_value: r.values.product_value,
	psq_product_id: r.values.psq_product_id.map(a => a.id),
	minimum_quantity: r.values.minimum_quantity,
})