import {
    Flex,
    StepperInput,
    Text,
} from "@hubspot/ui-extensions";

export const renderNumber = (field, onChange, planId, existingValue, supressLabel = false, max_value = null, rulesExcludingCurrentField) => {
    let Excluded = rulesExcludingCurrentField.length > 0
    return <Flex key={`${planId}::${field.field}-wrapper`} direction="column">
            <Flex key={`${planId}::${field.field}`} justify="between" align="center">
            {!!!supressLabel ? (
                <Text format={{ fontWeight: 'normal', variant: 'bodytext' }}>
                    { field.label }
                </Text>
            ) : <></>}
            {!!max_value ? (
                <StepperInput
                    value={existingValue ?? field.value}
                    min={0}
                    // max={max_value}
                    id={`${planId}__${field.field}`}
                    name={`${planId}__${field.field}`}
                    onChange={e => onChange(field, e, planId)}
                    readOnly={Excluded}
                />
            ) : (
                <StepperInput
                    value={existingValue ?? field.value}
                    min={0}
                    id={`${planId}__${field.field}`}
                    name={`${planId}__${field.field}`}
                    onChange={e => onChange(field, e, planId)}
                    readOnly={Excluded}
                />
            )}
        </Flex>
        {Excluded && (
            <Text variant="microcopy" format={{ fontWeight: 'normal', variant: 'bodytext' }}>
                { rulesExcludingCurrentField.map(rule => `${field.label} cannot be selected when ${rule.validationMessage}`).join(", ") }
            </Text>
        )}
    </Flex>
}