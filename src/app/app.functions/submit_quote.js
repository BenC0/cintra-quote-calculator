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

        return fetch("https://prod-43.uksouth.logic.azure.com:443/workflows/0a9d53b2610547ed95b62ec8085cffcc/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=KcjayBp9J5Zz3k5IMiomARDjUyYaf9ebs6_rzBN_cy0", {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: jsonOutput
        })
        .then(res => res.text())
        .then(text => {
            return {
                statusCode: 200,
                body: { message: 'Quote submitted to document' }
            };
        })
        .catch(error => {
            throw new Error(error)
        })
    } catch (error) {
        console.error('Error resetting line items:', error);
        return {
            statusCode: error.statusCode || 500,
            body: { message: error.message || 'Internal Server Error' }
        };
    }
};
