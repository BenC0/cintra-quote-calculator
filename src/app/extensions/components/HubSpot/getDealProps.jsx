import { hubspot } from "@hubspot/ui-extensions";

export const getDealProps = (dealID) => {
    return hubspot
    .serverless("get_deal_properties", {
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