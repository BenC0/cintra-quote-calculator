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

        const associationsResponse = await hubspotClient.crm.deals.associationsApi.getAll(
            dealId,
            'companies'
        );

        const companyIds = associationsResponse.results.map(r => r.id);
        const companies = [];
        const propertiesToRetrieve = [
            "name",
            "client_full_name",
            "client_legal_name",
            "companies_house_number",
            "registered_address"
        ];

        for (const id of companyIds) {
            const company = await hubspotClient.crm.companies.basicApi.getById(id, propertiesToRetrieve);
            companies.push(company);
        }

        const flattenedCompanies = companies.map(r => r.properties)[0]

        return {
            statusCode: 200,
            body: { companies: flattenedCompanies },
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
