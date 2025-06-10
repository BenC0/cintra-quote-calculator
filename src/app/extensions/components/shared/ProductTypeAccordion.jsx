import React, { useState, useEffect } from "react";
import {
    Accordion,
    Flex,
    Button,
    Text,
} from "@hubspot/ui-extensions";
import { ProductTypeFormPanel } from "./ProductTypeFormPanel";
import { renderInlinePlan } from "./renderInlinePlan";
import { renderTablePlans } from "./renderTablePlans";
import { renderInlineTablePlans } from "./renderInlineTablePlans";

export const ProductTypeAccordion = ({
    productType,
    planIds = [],
    handler,
    plan_handler,
    selectedValues = [],
    actions,
}) => {
    const maxItems = productType.max_items;
    const canAdd = maxItems < 0 || planIds.length < maxItems;
    const [localNewPlanId, setLocalNewPlanId] = useState(null);
    useEffect(() => {
        setLocalNewPlanId(plan_handler.add(productType.label))
    }, []);

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
                            plan_handler,
                        )}
                        {canAdd && (
                            <Flex>
                                <Button
                                    variant="secondary"
                                    overlay={
                                        <ProductTypeFormPanel
                                            name={productType.label}
                                            productTypeId={productType.field}
                                            fields={productType.fields}
                                            quantity={productType.quantityFieldDef}
                                            frequency={productType.frequencyFieldDef}
                                            handler={handler}
                                            actions={actions}
                                            externalPlanId={localNewPlanId}
                                            onSubmit={(generatedId) => {
                                                plan_handler.edit(productType.label, generatedId);
                                            }}
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
                            actions,
                            handler,
                            plan_handler
                        )}
                    </>
                ) : <></>}
            </Flex>
        </Accordion>
    );
};