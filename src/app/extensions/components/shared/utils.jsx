import { useState, useEffect } from "react";
import { hubspot } from "@hubspot/ui-extensions";

export const generateID = _ => Math.random().toString(16).slice(2)

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

export const formatPrice = price => price.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

export const formatToMaxTwoDecimal = price => price.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
});

export const formatInt = price => price.toLocaleString(undefined, {
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