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

export const useDynamicFetchDefs = (tableNames) => {
    const [tables, setTables] = useState({});
  
    useEffect(() => {
        if (!Array.isArray(tableNames)) return;
        // Initialize or clear previous entries
        setTables((prev) => {
            // Preserve existing data for tables that still exist, remove others
            const next = {};
            tableNames.forEach((name) => {
                if (prev[name]) {
                    next[name] = prev[name];
                }
            });
            return next;
        });
    
        tableNames.forEach((tableName) => {
            if (!tableName) return;
            hubspot
            .serverless("get_table_rows", { parameters: { tableName } })
            .then((res) => {
                if (!res.body || !Array.isArray(res.body.rows)) {
                    console.warn(`No rows returned for table: ${tableName}`);
                    setTables((prev) => ({ ...prev, [tableName]: [] }));
                    return;
                }
                const rows = res.body.rows.map((r) => r);
                setTables((prev) => ({ ...prev, [tableName]: rows }));
            })
            .catch(console.warn);
        });
    }, [tableNames]);
  
    return tables;
}

export const getFirstValue = (name, ob) => {
    if (!!ob["values"][name]) {
        if (!!ob["values"][name].length >= 0) {
            return ob["values"][name][0]
        }
        return ob["values"][name]
    }
    return null
};