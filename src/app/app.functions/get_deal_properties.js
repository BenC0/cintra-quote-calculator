const hubspot = require('@hubspot/api-client');

exports.main = async (context) => {
    try {
        // 1. Auth
        const accessToken = process.env.PRIVATE_APP_ACCESS_TOKEN;
        if (!accessToken) { throw new Error("Missing PRIVATE_APP_ACCESS_TOKEN secret"); }
        const hubspotClient = new hubspot.Client({ accessToken });
        // 2. Get and validate dealId
        const dealId = context.parameters.dealId;
        if (!dealId) { throw new Error("Missing required parameter: dealId"); }

        const propertiesToRetrieve = [
            "provisional_go_live_date"
        ];

        const dealInfo = await hubspotClient.crm.deals.basicApi.getById(dealId, propertiesToRetrieve);

        return {
            statusCode: 200,
            body: { deal: dealInfo.properties },
        };
    } catch (error) {
        console.error("Error retrieving associated companies:", error);
        console.log(error)
        return {
            statusCode: error.statusCode || 500,
            body: { message: error.message || "Internal Server Error" },
        };
    }
};
