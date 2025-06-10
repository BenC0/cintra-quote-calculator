import React from "react";
import { renderField } from "./Inputs";

export const renderInlinePlan = (productType, handler, planId, selectedValues) => {
    const selectedPlanValues = Array.isArray(selectedValues) ?
        selectedValues.find((p) => p.id === planId) || null :
        null;

    if (!selectedPlanValues) {
        return productType.fields.map((field) => (
            <React.Fragment key={`${planId}::${field.field}`}>
                {renderField(field, handler, planId)}
            </React.Fragment>
        ));
    } else {
        return productType.fields.map((field) => {
            const fieldPre = selectedPlanValues.fields.find(
                (a) => a.field === field.field
            );
            return (
                <React.Fragment key={`${planId}::${field.field}`}>
                    {fieldPre ?
                        renderField(field, handler, planId, fieldPre.value) : 
                        renderField(field, handler, planId)
                    }
                </React.Fragment>
            );
        });
    }
};