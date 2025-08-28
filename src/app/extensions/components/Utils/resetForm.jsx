import { getDefaultFields } from "../Data/getDefaultFields"

export const resetForm = (dispatch, plansById, productTypeAccordions, valueTables) => {
    for (let planKey in plansById) {
        let plan = plansById[planKey]
        let planProductType = productTypeAccordions.find(pt => pt.label == plan.type)
        if (planProductType.input_display_type == "inline") {
            getDefaultFields(planProductType, valueTables).forEach((field) => {
                dispatch({
                    type: "UPDATE_SELECTED_VALUE",
                    payload: {
                        planId: plan.id,
                        fieldKey: field.field,
                        value: field.value,
                    },
                });
            })
        } else {
            planHandler.deletePlan(dispatch, plan.type, plan.id)
        }
    }
}