import { useCallback } from "react";
import { hubspot } from "@hubspot/ui-extensions";

export const useUpdateQuote = () => {
    return useCallback(async details => {
        if (!details || !details.deal || !details.quote_id) {
            return false;
        }

        const {
            deal,
            quote_id,
            name,
            selected_values
        } = details;

        return hubspot
        .serverless("update_quote_row", {
            parameters: {
                rowId: quote_id,
                values: {
                    deal_id: `${deal}`,
                    name: `${name}-updated`,
                    selected_values,
                    submitted: false
                }
            },
        })
        .then(res => {
            return true
        })
        .catch(e => {
            console.error("Failed To Update Quote Row", e)
            return false
        });
    }, []);
}
