import React from "react";
import {
    Accordion,
    Flex,
    Button,
} from "@hubspot/ui-extensions";
import { ProductTypeFormPanel } from "./ProductTypeFormPanel";
import { renderInlinePlan } from "./renderInlinePlan";
import { renderTablePlans } from "./renderTablePlans";
import { renderInlineTablePlans } from "./renderInlineTablePlans";

export const ProductTypeAccordion = ({
    productType,
    planIds = [],
    handler,
    planHandler,
    selectedValues = {},
    actions,
    productBasedValidationRules = [],
    dispatch
}) => {
    const maxItems = productType.max_plans;
    const validPlanIds = planIds.filter(a => a != "temp")
    const hasTempId = planIds.filter(a => a == "temp").length > 0
    const tempPlanValues = selectedValues["temp"]
    const canAdd = maxItems < 0 || validPlanIds < maxItems;
    let defaultValues = {
        quantity_value: 0,
        frequency_value: "weekly",
    }
    productType.fields.forEach(field => {
        if (hasTempId && !!tempPlanValues[field.field]) {
            defaultValues[field.field] = tempPlanValues[field.field]
        } else {
            defaultValues[field.field] = field.defaultValue
        }
    })

    if (hasTempId) {
        if (!!tempPlanValues.quantity_value) defaultValues["quantity_value"] = tempPlanValues.quantity_value
        if (!!tempPlanValues.frequency_value) defaultValues["frequency_value"] = tempPlanValues.frequency_value
    }

    return (
        <Accordion title={productType.label} defaultOpen>
            <Flex direction="column" gap="sm">
                {productType.input_display_type === "inline" ? (
                    planIds.map((planId) => (
                        <React.Fragment key={planId}>
                            {renderInlinePlan(productType, handler, planId, selectedValues)}
                        </React.Fragment>
                    ))
                ) : <></>}
                {productType.input_display_type === "table" ? (
                    <>
                        {renderTablePlans(
                            productType,
                            planIds,
                            selectedValues,
                            canAdd,
                            actions,
                            handler,
                            planHandler,
                            productBasedValidationRules,
                            dispatch
                        )}
                        {canAdd && (
                            <Flex>
                                <Button
                                    variant="secondary"
                                    overlay={
                                        <ProductTypeFormPanel
                                            name={productType.label}
                                            fields={productType.fields}
                                            quantity={productType.quantityFieldDef}
                                            frequency={productType.frequencyFieldDef}
                                            planId="temp"
                                            handler={handler}
                                            initialLookup={defaultValues}
                                            actions={actions}
                                            onSubmit={(generatedId) => {
                                                planHandler.clone(dispatch, productType.label, generatedId, selectedValues);
                                                planHandler.delete(dispatch, productType.label, generatedId);
                                            }}
                                            productBasedValidationRules = {productBasedValidationRules}
                                        />
                                    }
                                >
                                    Add {productType.label}
                                </Button>
                            </Flex>
                        )}
                    </>
                ) : <></>}
                {productType.input_display_type === "inline-table" ? (
                    <>
                        {renderInlineTablePlans(
                            productType,
                            planIds,
                            selectedValues,
                            handler,
                        )}
                    </>
                ) : <></>}
            </Flex>
        </Accordion>
    );
};