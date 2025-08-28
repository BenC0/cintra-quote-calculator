import React from "react";
import { renderField } from "../Inputs/Inputs";

export const renderInlinePlan = (productType, fieldHandler, planId, selectedValues) => {
    const selectedPlanValues = selectedValues[planId]
    if (!!productType.fields) {
        if (!selectedPlanValues || Object.keys(selectedPlanValues).length == 0) {
            return productType.fields.map((field) => (
                <React.Fragment key={`${planId}::${field.field}`}>
                    {renderField(field, fieldHandler, planId)}
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
                            renderField(field, fieldHandler, planId, v) : 
                            renderField(field, fieldHandler, planId)
                        }
                    </React.Fragment>
                );
            });
        }
    }
    return <></>
};