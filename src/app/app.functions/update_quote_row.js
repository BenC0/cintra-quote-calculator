const hubspot = require('@hubspot/api-client');

/**
 * Serverless function for a HubSpot UI Extension Card that updates a row in a HubDB table.
 * Expects an environment variable `PRIVATE_APP_ACCESS_TOKEN` for authentication.
 * Requires input parameters on `context.parameters`:
 *   - `tableName` (string): the HubDB table slug or numeric ID
 *   - `values` (object): a mapping of column names to values for the row
 *   - `rowId` (string|number): the ID of an existing row to update
 */
exports.main = async (context) => {
    try {
        // Ensure the access token is provided
        const accessToken = process.env['PRIVATE_APP_ACCESS_TOKEN'];
        if (!accessToken) {
            throw new Error("Missing PRIVATE_APP_ACCESS_TOKEN secret");
        }
        const hubspotClient = new hubspot.Client({ accessToken });

        const tableName = "cintra_calculator_quotes";
        const { values, rowId } = context.parameters;
        if (typeof values !== 'object' || values === null) {
            throw new Error("Missing or invalid values parameter");
        }
        if (!rowId) {
            throw new Error("Missing rowId parameter for update");
        }

        // Update an existing row (sparse update)
        const result = await hubspotClient.cms.hubdb.rowsApi.updateDraftTableRow(
            tableName,
            rowId,
            { values }
        );

        // Publish the draft of the table to make changes live
        await hubspotClient.cms.hubdb.tablesApi.publishDraftTable(
            tableName
        );

        // Return the updated row
        return {
            statusCode: 200,
            body: { row: result },
        };
    } catch (error) {
        console.error("Error updating HubDB row:", error.message);
        return {
            statusCode: error.statusCode || 500,
            body: { message: error.message || "Internal Server Error" },
        };
    }
};
