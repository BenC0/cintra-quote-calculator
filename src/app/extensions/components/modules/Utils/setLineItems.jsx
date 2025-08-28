import { hubspot } from "@hubspot/ui-extensions";

export const setLineItems = ({deal, quote_id, line_items}) => {
    return hubspot
    .serverless("associate_line_items", {
        parameters: {
            quote_id: quote_id,
            deal_id: `${deal}`,
            products: line_items,
        },
    })
    .then(res => {
        return true
    })
    .catch(e => {
        console.error("Failed To Associate Line Items", e)
        return false
    });
}