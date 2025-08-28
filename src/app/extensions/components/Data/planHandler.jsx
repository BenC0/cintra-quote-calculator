import { generateID } from "../Utils/generateID";

// ------------------------- Plan CRUD Handlers -------------------------

// Add a new plan for a given product type
const addPlan = (dispatch, productTypeName, planIdArg = null) => {
    const newId = planIdArg || generateID();
    dispatch({
        type: 'ADD_PLAN',
        payload: { plan: { id: newId, type: productTypeName } }
    });
    return newId;
};

// Clone an existing plan by copying its values
const clonePlan = (dispatch, typeName, planId, selectedValues) => {
    const newId = generateID();
    const originalValues = selectedValues[planId] || {};
    dispatch({
        type: 'ADD_PLAN',
        payload: { plan: { id: newId, type: typeName, initialValues: originalValues } }
    });
};

// Delete a plan by removing it via reducer
const deletePlan = (dispatch, typeName, planId) => {
    dispatch({
        type: 'REMOVE_PLAN',
        payload: { planId }
    });
};

// Bundle plan handlers for passing into child components
export const planHandler = { add: addPlan, clone: clonePlan, delete: deletePlan };