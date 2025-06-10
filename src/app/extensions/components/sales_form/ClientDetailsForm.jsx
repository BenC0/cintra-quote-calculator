import React from "react";
import {
    Divider,
    Text,
    Toggle,
    Select,
    Flex,
} from "@hubspot/ui-extensions";

const ClientDetailsFormComponent = ({ formData, onChange }) => {
    const contractLengthOptions = [
        { label: '12 Months', value: 12 },
        { label: '36 Months', value: 36 },
        { label: '48 Months', value: 48 },
        { label: '60 Months', value: 60 },
    ];

    const handleToggle = field => checked => {
        onChange('ClientDetails', { ...formData, [field]: checked });
    };

    const handleSelect = evt => {
        onChange('ClientDetails', { ...formData, contractLength: evt });
    };

    return (
        <Flex direction="column" align="start" gap="md">
            <Text format={{ fontWeight: 'bold' }}>Client Details</Text>
            <Divider />
            <Toggle
                size="md"
                label="Is this a public sector client?"
                labelDisplay="inline"
                checked={formData.isPublicSector}
                onChange={handleToggle('isPublicSector')}
                textChecked="Yes"
                textUnchecked="No"
                required
            />
            <Toggle
                size="md"
                label="Is this an education client?"
                labelDisplay="inline"
                checked={formData.isEducation}
                onChange={handleToggle('isEducation')}
                textChecked="Yes"
                textUnchecked="No"
                required
            />
            <Flex direction="row" align="center" gap="small">
                <Text format={{ fontWeight: 'demibold', variant: 'bodytext' }} required>
                    Contract Length
                </Text>
                <Select
                    options={contractLengthOptions}
                    value={formData.contractLength}
                    onChange={handleSelect}
                />
            </Flex>
            <Toggle
                size="md"
                label="Groups Insight"
                labelDisplay="inline"
                checked={formData.groupsInsight}
                onChange={handleToggle('groupsInsight')}
                textChecked="Yes"
                textUnchecked="No"
                required
            />
            <Toggle
                size="md"
                label="Interface"
                labelDisplay="inline"
                checked={formData.customInterface}
                onChange={handleToggle('customInterface')}
                textChecked="Custom"
                textUnchecked="Standard"
                required
            />
        </Flex>
    );
};

export { ClientDetailsFormComponent };
