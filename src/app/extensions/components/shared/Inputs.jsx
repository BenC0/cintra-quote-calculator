import React, { useState, useEffect } from "react";
import {
    Flex,
    Select,
    StepperInput,
    Toggle,
    Text,
    Input,
} from "@hubspot/ui-extensions";

export const renderToggle = (field, onChange, planId, existingValue) => {
    return <Flex key={`${planId}::${field.field}`} justify="between" align="center">
        <Text>{field.label}</Text>
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
            required
        />
    </Flex>
}

export const renderDropDown = (field, onChange, planId, existingValue) => {
    return <Flex key={`${planId}::${field.field}`} justify="between" align="center">
        <Text format={{ fontWeight: 'demibold', variant: 'bodytext' }} required>
            { field.label }
        </Text>
        <Select
            options={field.values?.map(field => field.values).sort((a, b) => a.value - b.value) || []}
            value={existingValue ?? field.value}
            id={`${planId}__${field.field}`}
            name={`${planId}__${field.field}`}
            onChange={e => onChange(field, e, planId)}
        />
    </Flex>
}

export const renderNumber = (field, onChange, planId, existingValue) => {
    return <Flex key={`${planId}::${field.field}`} justify="between" align="center">
        <Text>{field.label}</Text>
        <StepperInput
            value={existingValue ?? field.value}
            min={0}
            id={`${planId}__${field.field}`}
            name={`${planId}__${field.field}`}
            onChange={e => onChange(field, e, planId)}
        />
    </Flex>
}

export const renderTextInput = (field, onChange, planId, existingValue) => {
    return <Flex key={`${planId}::${field.field}`} justify="between" align="center">
        <Text format={{ fontWeight: 'demibold', variant: 'bodytext' }} required>
            { field.label }
        </Text>
        <Input
            value={existingValue ?? field.value}
            id={`${planId}__${field.field}`}
            name={`${planId}__${field.field}`}
            label={field.label}
            labelDisplay="hidden"
            onChange={e => onChange(field, e, planId)}
        />
    </Flex>
}

export const renderField = (field, handler, planId, existingValue) => {
    switch (field.input_type) {
        case "Toggle":
            return renderToggle(field, handler, planId, existingValue)
        case "Number":
            return renderNumber(field, handler, planId, existingValue)
        case "Radio":
            break;
        case "Dropdown":
            return renderDropDown(field, handler, planId, existingValue)
        case "Text":
            return renderTextInput(field, handler, planId, existingValue)
        default:
            return null;
    }
}