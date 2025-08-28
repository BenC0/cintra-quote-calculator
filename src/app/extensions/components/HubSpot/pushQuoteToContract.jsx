import { hubspot } from "@hubspot/ui-extensions";

export const pushQuoteToContract = ({deal, quote_id, name, selected_values, submitted, line_items, jsonOutput}) => {
    return hubspot
    .serverless("submit_quote", {
        parameters: {
            quote_id: quote_id,
            deal_id: `${deal}`,
            products: line_items,
            jsonOutput: JSON.stringify(jsonOutput),
        }
    })
    .then(res => {
        return true
    })
    .catch(e => {
        console.error("Failed To Submit Quote", e)
        return false
    });
}