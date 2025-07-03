const hubspot = require('@hubspot/api-client');

/**
 * Serverless function for a HubSpot UI Extension Card that fetches all rows from a HubDB table
 * matching a given deal_id. Expects an environment variable `PRIVATE_APP_ACCESS_TOKEN` for auth,
 * and uses the table slug/ID plus a `values.deal_id` parameter to filter rows.
 *
 * Required context.parameters:
 *   - `tableName` (string): HubDB table slug or numeric ID
 *   - `values.deal_id` (string|number): the deal_id to match against rows
 */
exports.main = async (context) => {
    try {
        // Authentication
        const accessToken = process.env['PRIVATE_APP_ACCESS_TOKEN'];
        if (!accessToken) {
            throw new Error('Missing PRIVATE_APP_ACCESS_TOKEN secret');
        }

        const hubspotClient = new hubspot.Client({ accessToken });

        // Extract table name and deal_id
        const tableName = "cintra_calculator_quotes";
        const dealId = context.parameters.values && context.parameters.values.deal_id;
        if (!dealId) {
            throw new Error('Missing values.deal_id parameter');
        }

        // Fetch all rows from the specified HubDB table
        const apiResponse = await hubspotClient.cms.hubdb.rowsApi.getTableRows(tableName);
        const rows = apiResponse.results.map((row) => ({
            id: row.id,
            values: row.values,
            updatedAt: row.updatedAt,
        }));
        const allRows = rows || [];

        // Filter rows matching the provided deal_id
        const matchingRows = allRows.filter(row => String(row.values.deal_id) === String(dealId));

        // Return matching rows
        return {
            statusCode: 200,
            body: { rows: matchingRows }
        };

    } catch (error) {
        console.error('Error fetching HubDB rows:', error.message);
        return {
            statusCode: error.statusCode || 500,
            body: { message: error.message || 'Internal Server Error' }
        };
    }
};
