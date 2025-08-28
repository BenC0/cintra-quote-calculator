import { dedupeArray } from "../Utils/dedupeArray";

export function quoteReducer(state, action) {
    console.log({
        event: "quoteReducer invoked",
        state,
        action
    })
    switch (action.type) {
        case 'ADD_PLAN': {
            const { plan } = action.payload;
            let output = {
                ...state,
                plansById: {
                    ...state.plansById,
                    [plan.id]: plan
                },
                selectedValues: {
                    ...state.selectedValues,
                    [plan.id]: plan.initialValues
                },
                planIdsByType: {
                    ...state.planIdsByType,
                    [plan.type]: [
                        ...(state.planIdsByType[plan.type] || []),
                        plan.id
                    ]
                },
                customPrices: {
                    ...state.customPrices,
                    [plan.id]: { }
                },
                customDiscounts: {
                    ...state.customDiscounts,
                    [plan.id]: { }
                },
                customPSQUnits: {
                    ...state.customPSQUnits,
                    [plan.id]: { }
                }
            };

            output["planIdsByType"][plan.type] = dedupeArray(output["planIdsByType"][plan.type])
            return output
        }

        case 'REMOVE_PLAN': {
            const { planId } = action.payload;
            const { [planId]: removedPlan, ...remainingPlans } = state.plansById;
            const { [planId]: removedVals, ...remainingVals } = state.selectedValues;
            const { [planId]: removedCustomPrices, ...remainingCustomPrices } = state.customPrices;
            const { [planId]: removedCustomDiscounts, ...remainingCustomDiscounts } = state.customDiscounts;
            const { [planId]: removedCustomPSQUnits, ...remainingCustomPSQUnits } = state.customPSQUnits;
            // also remove from grouping
            const newGroup = state.planIdsByType[removedPlan.type]
                .filter(id => id !== planId);
            return {
                ...state,
                plansById: remainingPlans,
                selectedValues: remainingVals,
                customPrices: remainingCustomPrices,
                customDiscounts: remainingCustomDiscounts,
                customPSQUnits: remainingCustomPSQUnits,
                planIdsByType: {
                    ...state.planIdsByType,
                    [removedPlan.type]: newGroup
                }
            };
        }

        case 'UPDATE_SELECTED_VALUE': {
            const { planId, fieldKey, value } = action.payload;
            return {
                ...state,
                selectedValues: {
                    ...state.selectedValues,
                    [planId]: {
                        ...state.selectedValues[planId],
                        [fieldKey]: value
                    }
                }
            };
        }

        case 'UPDATE_CUSTOM_PRICE': {
            const { planId, fieldKey, value } = action.payload;
            return {
                ...state,
                customPrices: {
                    ...state.customPrices,
                    [planId]: {
                        ...state.customPrices[planId],
                        [fieldKey]: value
                    }
                }
            }
        }

        case 'UPDATE_CUSTOM_DISCOUNT': {
            const { planId, fieldKey, value } = action.payload;
            return {
                ...state,
                customDiscounts: {
                    ...state.customDiscounts,
                    [planId]: {
                        ...state.customDiscounts[planId],
                        [fieldKey]: value
                    }
                }
            }
        }

        case 'UPDATE_CUSTOM_PSQ_UNIT': {
            const { planId, fieldKey, value } = action.payload;
            return {
                ...state,
                customPSQUnits: {
                    ...state.customPSQUnits,
                    [planId]: {
                        ...state.customPSQUnits[planId],
                        [fieldKey]: value
                    }
                }
            }
        }

        default:
            return state;
    }
}
