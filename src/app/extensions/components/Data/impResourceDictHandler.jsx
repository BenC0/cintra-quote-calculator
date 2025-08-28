export const impResourceDictHandler = (rawImpResources) => {
    const d = {};
    rawImpResources.forEach((r) => {
        const hourlyRate = Number(r.values.hourly_rate) || 0;
        d[r.id] = {
            field: r.id,
            label: r.values.name,
            hourly_rate: hourlyRate,
        };
    });
    return d;
}