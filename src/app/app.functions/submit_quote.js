    const hubspot = require('@hubspot/api-client');

    /**
     * Serverless function for removing and recreating line items on a HubSpot deal
     * for a specific quote. Any existing line items tagged with the provided `quote_id`
     * will be removed, and new ones created from the given product templates.
     *
     * Expects an environment variable `PRIVATE_APP_ACCESS_TOKEN` for auth.
     * Input parameters on `context.parameters`:
     *   - `deal_id` (string|number): ID of the deal to operate on
     *   - `quote_id` (string|number): identifier for the quote to purge and recreate
     *   - `products` (Array): list of objects containing:
     *       - `id` (string|number): the ID of an existing product template
     *       - `values` (object, optional): overrides for new line item properties
     */
    exports.main = async (context) => {
    try {
        const accessToken = process.env['PRIVATE_APP_ACCESS_TOKEN'];
        if (!accessToken) throw new Error('Missing PRIVATE_APP_ACCESS_TOKEN');
        const hubspotClient = new hubspot.Client({ accessToken });

        const { deal_id, quote_id: contextQuoteId, products, jsonOutput } = context.parameters;
        if (!deal_id) throw new Error('Missing deal_id parameter');
        if (!jsonOutput) throw new Error('Missing jsonOutput parameter');
        if (contextQuoteId === undefined || contextQuoteId === null) throw new Error('Missing quote_id parameter');
        if (!Array.isArray(products) || products.length === 0) throw new Error('`products` must be a non-empty array');

        fetch("https://prod-41.uksouth.logic.azure.com:443/workflows/fcec3bc6f6a346f19dc9cdc68e22c7fd/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ZHvtWpVAYA9mBgYcEaZLBO74EX3AIOTs1QRC0EoDPqg", {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: jsonOutput
        })
        .then(res => res.text())
        .then(text => console.log("Azure says:", text))

        // 0. Fetch all existing line items associated with this deal
        const assocResponse = await hubspotClient.crm.deals.associationsApi.getAll(
            deal_id,
            'line_items'
        );
        const dealLineItemAssociations = assocResponse.results || [];

        // 1. Remove any existing line items matching this quote_id
        for (const assoc of dealLineItemAssociations) {
            const existingId = assoc.id;
            // fetch its quote_id property
            const { properties: existingProps } = await hubspotClient.crm.lineItems.basicApi.getById(existingId, ['quote_id']);
            if (existingProps.quote_id === String(contextQuoteId)) {
                // archive (delete) the line item
                await hubspotClient.crm.lineItems.basicApi.archive(existingId);
            }
        }

        const processedItems = [];

        // 2. Create and associate fresh line items for this quote
        for (const prod of products) {
            const prodId = prod.id;
            const overrideValues = prod.values || {};

            if (!prodId) throw new Error('Each product entry must have an `id`');

            // a) Retrieve product template
            const { properties: prodProps } = await hubspotClient.crm.products.basicApi.getById(prodId);

            // b) Build line-item properties (including the shared quote_id)
            const lineItemProps = {
                name: prodProps.name || prodProps.product_name,
                description: prodProps.description,
                price: prodProps.price,
                quantity: prodProps.minimum_quantity || 1,
                quote_id: contextQuoteId,
                ...overrideValues
            };

            // c) Create new line item
            const createResp = await hubspotClient.crm.lineItems.basicApi.create({ properties: lineItemProps });
            const lineItemId = createResp.id;

            // d) Associate to deal
            await hubspotClient.crm.associations.batchApi.create('deals', 'line_items', {
                inputs: [{
                    _from: { id: deal_id },
                    to: { id: lineItemId },
                    type: 'deal_to_line_item'
                }]
            });

            // e) Associate to product template (optional, if required)
            await hubspotClient.crm.associations.batchApi.create('line_items', 'products', {
                inputs: [{
                    _from: { id: lineItemId },
                    to: { id: prodId },
                    type: 'line_item_to_product'
                }]
            });

            processedItems.push({ productId: prodId, lineItemId, properties: lineItemProps });
        }

        return {
            statusCode: 200,
            body: { message: 'Quote line items reset and recreated', processedItems }
        };
    } catch (error) {
        console.error('Error resetting line items:', error);
        return {
            statusCode: error.statusCode || 500,
            body: { message: error.message || 'Internal Server Error' }
        };
    }
};
