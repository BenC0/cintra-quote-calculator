import { useState, useEffect } from "react";
import { hubspot } from "@hubspot/ui-extensions";

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