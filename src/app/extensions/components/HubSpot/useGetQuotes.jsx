import { hubspot } from "@hubspot/ui-extensions";

export const useGetQuotes = (deal) => {
    return hubspot
    .serverless("get_quote_row", {
        parameters: {
            values: {
                deal_id: `${deal}`
            }
        },
    }).then((res) => {
        let rows = res.body.rows;
        rows = rows.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt))
        return rows
    })
    .catch(console.warn);
}