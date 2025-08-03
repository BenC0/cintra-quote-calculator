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
import { generateID } from "./utils";

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
    const [IsValid, setIsValid] = useState(false);
    useEffect(() => {
        if (externalPlanId) {
            setLocalPlanId(externalPlanId);
        } else {
            setLocalPlanId(generateID());
        }
    }, [externalPlanId]);
    if (!localPlanId) return null;
    
    const [localLookup, setLocalLookup] = useState(initialLookup);
    const localLookupHandler = (field, value, planId, action="add") => {
        if (action == "add") {
            setLocalLookup(prev => ({
                ...prev,
                [field.field]: value
            }));
        } else if (action == "remove") {
            setLocalLookup(prev => ({
                ...prev,
                [field.field]: null
            }));
        }
    }

    const isTemp = localPlanId == "temp"
    const preferredLookup = isTemp ? initialLookup : localLookup
    const preferredHandler = isTemp ? handler : localLookupHandler

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
        quantity.value =  preferredLookup["quantity_value"] || 0
        if (!grouped_fields["details"]) {
            grouped_fields["details"] = []
        }
        grouped_fields["details"] = [quantity, ...grouped_fields["details"]]
    }

    const arrayHas = arr => Array.isArray(arr) && arr.length > 0

    const has_details = arrayHas(grouped_fields.details) 
    const has_core = arrayHas(grouped_fields.core) 
    const has_addon = arrayHas(grouped_fields["add-on"]) 
    const has_na = arrayHas(grouped_fields["na"]) 
    const isEditMode = Boolean(externalPlanId);

    useEffect(() => {
        let fieldValueStatus = []
        let requiredFields = []
        if (has_core) { requiredFields = [...requiredFields, ...grouped_fields.core] }
        if (has_details) { requiredFields = [...requiredFields, ...grouped_fields.details] }

        if (has_details) {
            grouped_fields.details.forEach(field => {
                let fieldId = field.field
                if (!!fieldId.match(/^((quantity)|(frequency))$/gi)) {
                    fieldId = `${fieldId}_value`
                }
                let fieldValue = preferredLookup[fieldId]
                fieldValueStatus.push(!!fieldValue)
            })
        }

        if (has_core) {
            let coreFieldStatus = []
            grouped_fields.core.forEach(field => {
                let fieldId = field.field
                if (!!fieldId.match(/^((quantity)|(frequency))$/gi)) {
                    fieldId = `${fieldId}_value`
                }
                let fieldValue = preferredLookup[fieldId]
                coreFieldStatus.push(!!fieldValue)
            })
            fieldValueStatus.push(coreFieldStatus.some(a => !!a))
        }

        if (fieldValueStatus.length > 0) {
            setIsValid(prev => fieldValueStatus.every(a => !!a))
        } else {
            setIsValid(prev => true)
        }
    }, [IsValid, preferredLookup, grouped_fields])

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
                                        preferredHandler,
                                        localPlanId,
                                        // pass initial value if exists
                                        preferredLookup[field.field] !== undefined
                                        ? preferredLookup[field.field]
                                        : undefined
                                    ))}
                                {(has_core || has_na || has_addon) && <Divider />}
                            </>
                        )}
                        {has_core && (
                            <>
                                <Text format={{ fontWeight: "bold" }}>Core {name.indexOf("Product") > -1 ? name : `${name} Products`}</Text>
                                {grouped_fields.core.map((field) =>
                                    renderField(
                                        field,
                                        preferredHandler,
                                        localPlanId,
                                        preferredLookup[field.field] !== undefined
                                        ? preferredLookup[field.field]
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
                                        preferredHandler,
                                        localPlanId,
                                        preferredLookup[field.field] !== undefined
                                        ? preferredLookup[field.field]
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
                                        preferredHandler,
                                        localPlanId,
                                        preferredLookup[field.field] !== undefined
                                        ? preferredLookup[field.field]
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
                        // To Do: Implement validation checks for disable property
                        disabled={!IsValid}
                        onClick={() => {
                            if (!isTemp) {
                                const allFields = [...fields, frequency, quantity]
                                for (let key in localLookup) {
                                    let f = allFields.find(field => field.field == key || field.field == `${key}_value` || key == `${field.field}_value`)
                                    if (!!f) {
                                        handler(f, localLookup[key], localPlanId)
                                    }
                                }
                            }
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
