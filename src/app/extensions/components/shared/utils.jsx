import React, { useState, useEffect, useCallback } from "react";
import { hubspot } from "@hubspot/ui-extensions";

export const generateID = _ => Math.random().toString(16).slice(2)

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

        console.log("Updating Quote Row")
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
            console.log("Updated Quote Row")
            return true
        })
        .catch(e => {
            console.error("Failed To Update Quote Row", e)
            return false
        });
    }, []);
}

export const setLineItems = ({deal, quote_id, name, selected_values, submitted, line_items, jsonOutput}) => {
    console.log("Associating Line Items")
    return hubspot
    .serverless("associate_line_items", {
        parameters: {
            quote_id: quote_id,
            deal_id: `${deal}`,
            products: line_items,
        },
    })
    .then(res => {
        console.log("Associated Line Items")
        return true
    })
    .catch(e => {
        console.error("Failed To Associate Line Items", e)
        return false
    });
}

export const pushQuoteToContract = ({deal, quote_id, name, selected_values, submitted, line_items, jsonOutput}) => {
    console.log("Submitting Quote")
    return hubspot
    .serverless("submit_quote", {
        parameters: {
            quote_id: quote_id,
            deal_id: `${deal}`,
            products: line_items,
            // jsonOutput: JSON.stringify({ "html": "<table> <tbody> <tr> <td>Hello World</td> </tr> </tbody> </table>" }),
            jsonOutput: JSON.stringify(jsonOutput),
        }
    })
    .then(res => {
        console.log("Submitted Quote")
        return true
    })
    .catch(e => {
        console.error("Failed To Submit Quote", e)
        return false
    });
}

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

export const useFetchDefs = (tableName, transformation = e => e, sort_key = null) => {
    const [defs, setDefs] = useState([]);

    useEffect(() => {
        hubspot
        .serverless("get_table_rows", {
            parameters: { tableName },
        })
        .then((res) => {
            let rows = res.body.rows.map((r) => transformation(r));
            if (!!sort_key) {
                rows = rows.sort((a, b) => a[sort_key] - b[sort_key])
            }
            setDefs(rows);
        })
        .catch(console.warn);
    }, [tableName]);

    return defs;
}

export const useDynamicFetchDefs = (tableNames) => {
    const [tables, setTables] = useState({});

    useEffect(() => {
        // Guard: nothing to do if no tableNames or not an array
        if (!Array.isArray(tableNames) || tableNames.length === 0) {
            setTables({});
            return;
        }

        let cancelled = false;

        (async () => {
            const next = {};

            // Fire off all fetches in parallel
            await Promise.all(
                tableNames.map(async (name) => {
                if (!name) {
                    next[name] = [];
                    return;
                }
                try {
                    const res = await hubspot.serverless("get_table_rows", {
                    parameters: { tableName: name },
                    });
                    const rows =
                    res.body && Array.isArray(res.body.rows)
                        ? res.body.rows.map((r) => r)
                        : [];
                    next[name] = rows;
                } catch (err) {
                    console.warn(`Error fetching table "${name}"`, err);
                    next[name] = [];
                }
                })
            );

            // Only update state if this effect hasn't been torn down
            if (!cancelled) {
                setTables(next);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [tableNames]);

    return tables;
};

export const getFirstValue = (name, ob) => {
    if (!!ob["values"][name]) {
        if (!!ob["values"][name].length >= 0) {
            return ob["values"][name][0]
        }
        return ob["values"][name]
    }
    return null
};

export const toTitleCase = (str = "") => str.replace(
   /\w\S*/g,
    text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
)

export const formatPrice = (price = 0) => price.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

export const formatToMaxTwoDecimal = (price = 0) => price.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
});

export const formatInt = (price = 0) => price.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
});

export const reshapeArray = (inputArray, maxItemsPerRow) => {
    let result = [];
    for (let i = 0; i < inputArray.length; i += maxItemsPerRow) {
        result.push(inputArray.slice(i, i + maxItemsPerRow));
    }
    return result;
}

export const dedupeArray = (array) => [...new Set(array)]