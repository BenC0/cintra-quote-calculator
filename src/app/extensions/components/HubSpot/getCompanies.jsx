import { hubspot } from "@hubspot/ui-extensions";

export const getCompanies = (dealID) => {
    return hubspot
    .serverless("get_companies", {
        parameters: {
            dealId: `${dealID}`,
        },
    })
    .then(res => {
        return res
    })
    .catch(e => {
        return false
    });
}