import { hubspot } from "@hubspot/ui-extensions";

export const useCreateQuote = ({deal, name}) => {
    return hubspot
    .serverless("create_quote_row", {
        parameters: {
            values: {
                deal_id: `${deal}`,
                name,
                selected_values: "",
            }
        },
    }).then((res) => {
        let rows = res.body.rows
        return rows
    })
    .catch(console.warn);
}