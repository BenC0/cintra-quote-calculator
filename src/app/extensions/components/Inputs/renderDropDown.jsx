import {
    Flex,
    Select,
    Text,
} from "@hubspot/ui-extensions";

export const renderDropDown = (field, onChange, planId, existingValue, supressLabel = false, rulesExcludingCurrentField) => {
    let Excluded = rulesExcludingCurrentField.length > 0
    return <Flex key={`${planId}::${field.field}-wrapper`} direction="column">
            <Flex key={`${planId}::${field.field}`} justify="between" align="center">
            {!!!supressLabel ? (
                <Text format={{ fontWeight: 'normal', variant: 'bodytext' }}>
                    { field.label }
                </Text>
            ) : <></>}
            <Select
                options={field.values?.map(field => ({ label: field.values.name, value: field.values.value })).sort((a, b) => a.value - b.value) || []}
                value={existingValue ?? field.value}
                id={`${planId}__${field.field}`}
                name={`${planId}__${field.field}`}
                onChange={e => onChange(field, e, planId)}
                readOnly={Excluded}
            />
        </Flex>
        {Excluded && (
            <Text variant="microcopy" format={{ fontWeight: 'normal', variant: 'bodytext' }}>
                { rulesExcludingCurrentField.map(rule => `${field.label} cannot be selected when ${rule.validationMessage}`).join(", ") }
            </Text>
        )}
    </Flex>
}