const hubspot = require('@hubspot/api-client');

/**
 * Serverless function for a HubSpot UI Extension Card that fetches data from a HubDB table.
 * Expects an environment variable `HUBSPOT_ACCESS_TOKEN` for authentication,
 * and uses the table **name** to lookup the numeric table ID.
 */
exports.main = async (context) => {
    try {
        // Ensure the access token is provided
        const accessToken = process.env['PRIVATE_APP_ACCESS_TOKEN'];
        if (!accessToken) {
            throw new Error("Missing HUBSPOT_ACCESS_TOKEN secret");
        }

        // Initialize the HubSpot API client
        const hubspotClient = new hubspot.Client({ accessToken });

        // HubDB table **name** (slug) to fetch; we’ll resolve this to its numeric ID
        const tableName = context.parameters.tableName;
        // console.log(`Fetching Table: "${tableName}"`)
        // Fetch rows
        const apiResponse = await hubspotClient.cms.hubdb.rowsApi.getTableRows(tableName, {
            archived: false,
        });
        // Map to a simpler shape
        const rows = apiResponse.results.map((row) => ({
            id: row.id,
            values: row.values,
        }));
        // Return rows in the response body
        return {
            statusCode: 200,
            body: { rows },
        };
    } catch (error) {
        console.error("Error fetching HubDB rows:", error.message);
        return {
            statusCode: error.statusCode || 500,
            body: { message: error.message || "Internal Server Error" },
        }
    };
};