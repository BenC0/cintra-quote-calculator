import React from "react";
import { renderField } from "./Inputs";

export const renderInlinePlan = (productType, handler, planId, selectedValues) => {
    const selectedPlanValues = selectedValues[planId]
    // console.log(`Rendering Inline Plan for "${productType.label}"`, {selectedValues, selectedPlanValues})

    if (Object.keys(selectedPlanValues).length == 0) {
        return productType.fields.map((field) => (
            <React.Fragment key={`${planId}::${field.field}`}>
                {renderField(field, handler, planId)}
            </React.Fragment>
        ));
    } else {
        return productType.fields.map((field) => {
            const fieldPre = selectedPlanValues[field.field]
            let v = false
            if (!!fieldPre) {
                v = fieldPre
            }
            return (
                <React.Fragment key={`${planId}::${field.field}`}>
                    {fieldPre ?
                        renderField(field, handler, planId, v) : 
                        renderField(field, handler, planId)
                    }
                </React.Fragment>
            );
        });
    }
};