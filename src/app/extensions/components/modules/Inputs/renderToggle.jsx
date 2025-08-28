import {
    Flex,
    Toggle,
    Text,
} from "@hubspot/ui-extensions";


export const renderToggle = (field, onChange, planId, existingValue, supressLabel = false, rulesExcludingCurrentField) => {
    let Excluded = rulesExcludingCurrentField.length > 0
    return <Flex key={`${planId}::${field.field}-wrapper`} direction="column">
            <Flex key={`${planId}::${field.field}`} justify="between" align="center">
            {!!!supressLabel ? (
                <Text format={{ fontWeight: 'normal', variant: 'bodytext' }}>
                    { field.label }
                </Text>
            ) : <></>}
            <Toggle
                size="md"
                label={field.label}
                labelDisplay="hidden"
                id={`${planId}__${field.field}`}
                name={`${planId}__${field.field}`}
                checked={existingValue ?? field.checked}
                onChange={e => onChange(field, e, planId)}
                textChecked={field.values.active}
                textUnchecked={field.values.inactive}
                readonly={Excluded}
                required={true}
            />
        </Flex>
        {Excluded && (
            <Text variant="microcopy" format={{ fontWeight: 'normal', variant: 'bodytext' }}>
                { rulesExcludingCurrentField.map(rule => `${field.label} cannot be selected when ${rule.validationMessage}`).join(", ") }
            </Text>
        )}
    </Flex>
}