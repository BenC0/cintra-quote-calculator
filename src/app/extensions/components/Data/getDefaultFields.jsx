// Helper to get default field entries based on type
export const getDefaultFields = (pt, valueTables) => pt.fields.map((f) => {
    let defaultValue = f.defaultValue;
    switch (f.input_type) {
        case "Toggle": defaultValue = false; break;
        case "Number": defaultValue = 0; break;
        case "Text": defaultValue = ""; break;
        case "Radio":
        case "Dropdown":
            const vals = valueTables[f.input_values_table];
            defaultValue = !!vals ? vals.find(v => !!v.values.default) : null
            if (!!defaultValue) {
                defaultValue = defaultValue.values.value
            } else if (!!vals) {
                defaultValue = vals[0].values.value
            }
            break;
    }
    return { field: f.field, label: f.label, value: defaultValue };
});