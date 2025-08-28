import { useState, useEffect } from "react";
import { hubspot } from "@hubspot/ui-extensions";

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