import { dedupeArray } from "./Utils/dedupeArray";

export function quoteReducer(state, action) {
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
                }
            };

            output["planIdsByType"][plan.type] = dedupeArray(output["planIdsByType"][plan.type])
            return output
        }

        case 'REMOVE_PLAN': {
            const { planId } = action.payload;
            const { [planId]: removedPlan, ...remainingPlans } = state.plansById;
            const { [planId]: removedVals, ...remainingVals } = state.selectedValues;
            // also remove from grouping
            const newGroup = state.planIdsByType[removedPlan.type]
                .filter(id => id !== planId);
            return {
                ...state,
                plansById: remainingPlans,
                selectedValues: remainingVals,
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

        case 'UPDATE_PLAN': {
            const { planId, updates } = action.payload;
            return {
                ...state,
                plansById: {
                    ...state.plansById,
                    [planId]: {
                        ...state.plansById[planId],
                        ...updates
                    }
                }
            };
        }

        // optionally handle grouping separately
        case 'SET_GROUPINGS': {
            return {
                ...state,
                planIdsByType: action.payload.planIdsByType
            };
        }

        default:
            return state;
    }
}
