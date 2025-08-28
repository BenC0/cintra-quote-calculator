import { useRef, useCallback } from "react";

export function useQuoteUpdateQueue(updateQuote, debounceMs = 500) {
    const queueRef = useRef([]);
    const timerRef = useRef(null);

    const enqueueUpdate = useCallback(details => {
        console.log("yay")
        return new Promise(resolve => {
            queueRef.current.push({ details, resolve });
            if (!timerRef.current) {
                timerRef.current = setTimeout(async () => {
                    const items = queueRef.current.splice(0);
                    const byId = {};
                    items.forEach(({ details, resolve }) => {
                        const id = details.quote_id;
                        if (!byId[id]) {
                            byId[id] = { details: { ...details }, resolvers: [resolve] };
                        } else {
                            byId[id].details = { ...byId[id].details, ...details };
                            byId[id].resolvers.push(resolve);
                        }
                    });
                    await Promise.all(
                        Object.values(byId).map(async ({ details, resolvers }) => {
                            let ok = false;
                            try {
                                ok = await updateQuote(details);
                            } catch {}
                            resolvers.forEach(r => r(ok));
                        })
                    );
                    timerRef.current = null;
                }, debounceMs);
            }
        });
    }, [updateQuote]);

    return enqueueUpdate;
}
