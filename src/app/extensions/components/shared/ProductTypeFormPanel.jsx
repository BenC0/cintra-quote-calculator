// ProductTypeFormPanel.jsx
import React, { useState, useEffect } from "react";
import {
    Panel,
    PanelBody,
    PanelSection,
    PanelFooter,
    Button,
    Flex,
    Text,
    Divider,
} from "@hubspot/ui-extensions";
import { renderField } from "./Inputs";
import { v4 as uuidv4 } from "uuid";

export const ProductTypeFormPanel = ({
    name = "",
    productTypeId = "-1",
    fields = [],
    handler = () => {},
    onSubmit = () => {},
    actions,
    quantity_value = 0,
    frequency_value = null,
    planId: externalPlanId = null,
    initialLookup = {},
    quantity = null,
    frequency = null,
}) => {
    const [localPlanId, setLocalPlanId] = useState(externalPlanId);
    useEffect(() => {
        if (externalPlanId) {
            setLocalPlanId(externalPlanId);
        } else {
            setLocalPlanId(uuidv4());
        }
    }, [externalPlanId]);
    if (!localPlanId) return null;

    const grouped_fields = {};
    fields.forEach((field) => {
        const subtype = field.product_sub_type.name;
        if (!grouped_fields[subtype]) grouped_fields[subtype] = [];
        grouped_fields[subtype].push(field);
    });

    if (!!frequency && !!frequency.input_values_table) {
        frequency.value = frequency_value
        if (!grouped_fields["details"]) {
            grouped_fields["details"] = []
        }
        grouped_fields["details"] = [frequency, ...grouped_fields["details"]]
    }

    if (!!quantity) {
        quantity.value =  initialLookup["quantity_value"]
        if (!grouped_fields["details"]) {
            grouped_fields["details"] = []
        }
        grouped_fields["details"] = [quantity, ...grouped_fields["details"]]
    }

    console.log({
        event: "Rendering ProductTypeFormPanel",
        localPlanId,
        initialLookup,
        grouped_fields,
    })

    const arrayHas = arr => Array.isArray(arr) && arr.length > 0

    const has_details = arrayHas(grouped_fields.details) 
    const has_core = arrayHas(grouped_fields.core) 
    const has_addon = arrayHas(grouped_fields["add-on"]) 
    const has_na = arrayHas(grouped_fields["na"]) 
    const isEditMode = Boolean(externalPlanId);

    return (
        <Panel
            id={localPlanId}
            title={`${isEditMode ? "Edit" : "Add"} ${name}`}
            width="medium"
        >
            <PanelBody>
                <PanelSection flush>
                    <Flex direction="column" gap="md">
                        {has_details && (
                            <>
                                <Text format={{ fontWeight: "bold" }}>{name} Details</Text>
                                    {grouped_fields.details.map((field) => renderField(
                                        field,
                                        handler,
                                        localPlanId,
                                        // pass initial value if exists
                                        initialLookup[field.field] !== undefined
                                        ? initialLookup[field.field]
                                        : undefined
                                    ))}
                                {(has_core || has_na || has_addon) && <Divider />}
                            </>
                        )}
                        {has_core && (
                            <>
                                <Text format={{ fontWeight: "bold" }}>Core {name} Products</Text>
                                {grouped_fields.core.map((field) =>
                                    renderField(
                                        field,
                                        handler,
                                        localPlanId,
                                        initialLookup[field.field] !== undefined
                                        ? initialLookup[field.field]
                                        : undefined
                                    )
                                )}
                                {(has_na || has_addon) && <Divider />}
                            </>
                        )}

                        {has_addon && (
                            <>
                                <Text format={{ fontWeight: "bold" }}>Additional {name} Products</Text>
                                {grouped_fields["add-on"].map((field) =>
                                    renderField(
                                        field,
                                        handler,
                                        localPlanId,
                                        initialLookup[field.field] !== undefined
                                        ? initialLookup[field.field]
                                        : undefined
                                    )
                                )}
                                {has_na && <Divider />}
                            </>
                        )}

                        {has_na && (
                            <>
                                <Text format={{ fontWeight: "bold" }}>{name} Products</Text>
                                {grouped_fields.na.map((field) =>
                                    renderField(
                                        field,
                                        handler,
                                        localPlanId,
                                        initialLookup[field.field] !== undefined
                                        ? initialLookup[field.field]
                                        : undefined
                                    )
                                )}
                            </>
                        )}
                    </Flex>
                </PanelSection>
            </PanelBody>

            <PanelFooter>
                <Flex justify="end" gap="small">
                    <Button
                        variant="secondary"
                        onClick={() => {
                            actions.closeOverlay(localPlanId);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => {
                            onSubmit(localPlanId);
                            actions.closeOverlay(localPlanId);
                        }}
                    >
                        {isEditMode ? `Save ${name}` : `Add ${name}`}
                    </Button>
                </Flex>
            </PanelFooter>
        </Panel>
    );
};
