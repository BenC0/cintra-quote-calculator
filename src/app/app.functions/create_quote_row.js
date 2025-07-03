const hubspot = require('@hubspot/api-client');

/**
 * Serverless function for a HubSpot UI Extension Card that creates a new row in a HubDB table.
 * Expects an environment variable `PRIVATE_APP_ACCESS_TOKEN` for authentication,
 * and uses the table **name** (slug) to identify the table.
 * Requires two input parameters on `context.parameters`:
 *   - `tableName` (string): the HubDB table slug or numeric ID
 *   - `values` (object): a mapping of column names to values for the new row
 */
exports.main = async (context) => {
    try {
        // Ensure the access token is provided
        const accessToken = process.env['PRIVATE_APP_ACCESS_TOKEN'];
        if (!accessToken) {
            throw new Error("Missing PRIVATE_APP_ACCESS_TOKEN secret");
        }

        // Initialize the HubSpot API client
        const hubspotClient = new hubspot.Client({ accessToken });

        // Table slug or ID and new row values from parameters
        const tableName = "cintra_calculator_quotes";
        const values = context.parameters.values;

        // Build the request body
        const rowRequest = { values };
        
        // Create a new row in the specified HubDB table
        const apiResponse = await hubspotClient.cms.hubdb.rowsApi.createTableRow(
            tableName,
            rowRequest
        );

        // Publish the draft of the table to make changes live
        await hubspotClient.cms.hubdb.tablesApi.publishDraftTable(
            tableName
        );

        // Simplify the response shape
        const newRow = {
            id: apiResponse.id,
            values: apiResponse.values,
        };

        // Return the newly created row in the response body
        return {
            statusCode: 200,
            body: { rows: newRow },
        };
    } catch (error) {
        console.error("Error creating HubDB row:", error.message);
        return {
            statusCode: error.statusCode || 500,
            body: { message: error.message || "Internal Server Error" },
        };
    }
};
