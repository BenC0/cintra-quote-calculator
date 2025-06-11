import React, { useState, useEffect, useReducer, useRef } from "react";  // Core React hooks
import { v4 as uuidv4 } from "uuid";  // Utility to generate unique IDs for plans
import { ProductTypeAccordion } from "./components/shared/ProductTypeAccordion";  // Accordion UI for product types and PSQ sections
import { useFetchDefs, useDynamicFetchDefs, getFirstValue } from "./components/shared/utils";  // Data-fetching and helper functions
import { Divider, Button, hubspot, Flex, Heading } from "@hubspot/ui-extensions";  // HubSpot UI components
import { QuoteSummaryComponent } from "./components/summary/QuoteSummary";  // Summary of quote details
import { checkPSQRequirements, CalculateQuote } from "./components/shared/Calculate";  // Business logic for quote calculation
import { quoteReducer } from "./components/shared/quoteReducer";  // Reducer for state management

// Register the extension in the HubSpot CRM sidebar
hubspot.extend(({ context, runServerlessFunction, actions }) => (
    <Extension
        context={context}
        runServerless={runServerlessFunction}
        actions={actions}
    />
));

// Main extension component
const Extension = ({ context, runServerless, actions }) => {
    // Debug flags for console logging various parts of state and logic
    const debug = true;
    const debugPlans = true;
    const debugProductDetails = false;
    const debugQuote = false;
    const debugPSQ = false;

    // ------------------------- Rendering -------------------------
    // Multi-page workflow: 1=Quote Details, 2=PSQ Details, 3=Quote Sheet
    const [currentPage, setCurrentPage] = useState(1);

    // Initial state for the quote workflow, managed by useReducer
    const initialState = {
        plansById       : {},       // Map of planId -> plan metadata
        planIdsByType   : {},       // Grouping of plan IDs by product/PSQ type
        selectedValues  : {},       // User-entered values for each plan
        quoteResult     : null,     // Computed quote output
        loading         : false,    // Loading flag for async operations
        error           : null,     // Error state
    };
    const [state, dispatch] = useReducer(quoteReducer, initialState);
    const { plansById, planIdsByType, selectedValues } = state;  // Destructure for convenience

    // ------------------------- Data Definitions -------------------------

    // Function to map raw HubSpot record to a product definition object
    const buildProductDef = (r) => {
        return {
            field: r?.id ?? "",
            label: r?.values?.name ?? "",
            input_values_table: r?.values?.input_values_table ?? "",
            input_type: getFirstValue("input_type", r)?.name ?? "",
            pricing_structure: getFirstValue("pricing_structure", r) ?? null,
            product_type: getFirstValue("product_type", r) ?? null,
            product_sub_type: r?.values?.product_sub_type ?? null,
        };
    };

    // Fetch standard implementation day definitions with transformation
    const standardImplementationDaysDefs = useFetchDefs(
        "cintra_calculator_implementation_product_days",
        r => ({
            id: r.id,
            days: r.values.days,
            minimum_quantity: r.values.minimum_quantity,
            product_id: getFirstValue("product_id", r).id,
        })
    );

    // Fetch standard implementation rate definitions with transformation
    const standardImplementationRatesDefs = useFetchDefs(
        "cintra_calculator_implementation_rates",
        r => ({
            id: r.id,
            price: r.values.price,
            minimum_quantity: r.values.minimum_quantity,
            fixed_price: !!r.values.fixed_price,
            product_value: r.values.product_value ?? null,
            product_id: getFirstValue("product_id", r)?.id ?? null,
        })
    );

    // Fetch definitions for product types, add custom quantity/frequency field defs
    const productTypeDefs = useFetchDefs(
        "cintra_calculator_product_types",
        (r) => {
            // Build synthetic fields for quantity and frequency inputs
            const quantityFieldDef = buildProductDef({
                id: "quantity",
                values: {
                    name: r.values.quantity_field_label,
                    input_type: [{ name: "Number" }],
                    product_type: [{ id: r.id, name: r.values.name, type: "foreignid" }],
                    product_sub_type: { label: "Details", name: "details" }
                }
            });
            const frequencyFieldDef = buildProductDef({
                id: "frequency",
                values: {
                    name: "Frequency",
                    input_type: [{ name: "Dropdown" }],
                    product_type: [{ id: r.id, name: r.values.name, type: "foreignid" }],
                    product_sub_type: { label: "Details", name: "details" },
                    input_values_table: r.values.quantity_frequency_values_table
                }
            });
            // Return the full product type definition
            return {
                field: r.id,
                label: r.values.name,
                sort_order: r.values.sort_order,
                max_items: r.values.max_items,
                quantity_field_type: r.values.quantity_field_type,
                quantity_field_label: r.values.quantity_field_label,
                input_display_type: r.values.input_display_type.name,
                quantity_frequency_values_table: r.values.quantity_frequency_values_table,
                use_quantity_as_implementation_headcount: !!r.values.use_quantity_as_implementation_headcount,
                standard_implementation_calculation_type: r.values.standard_implementation_calculation_type?.name ?? "default",
                standard_implementation_calculation_product: getFirstValue("standard_implementation_calculation_product", r)?.id ?? null,
                quantityFieldDef,
                frequencyFieldDef,
            };
        },
        "sort_order"  // Sort product types by this field
    );

    // Fetch basic product definitions
    const productDefs = useFetchDefs("cintra_calculator_products", buildProductDef);

    // Fetch PSQ (Professional Services & Quality) type definitions
    const psqTypeDefs = useFetchDefs(
        "cintra_calculator_psq_types",
        r => ({
            field: r.id,
            label: r.values.name,
            sort_order: r.values.sort_order,
            max_items: 1,
            quantity_field_label: null,
            input_display_type: "inline-table",
            quantity_field_type: null,
            quantity_frequency_values_table: null
        }),
        "sort_order"
    );

    // Fetch product price definitions
    const productPriceDefs = useFetchDefs(
        "cintra_calculator_product_prices",
        (r) => ({
            field: r.id,
            label: r.values.name,
            price: r.values.price,
            bundle_price: r.values.bundle_price,
            product_value: r.values.product_value,
            minimum_quantity: r.values.minimum_quantity,
            maximum_quantity: r.values.maximum_quantity,
            monthly_standing_charge: r.values.monthly_standing_charge,
            product_field: !!getFirstValue("product_id", r) ? getFirstValue("product_id", r).id : null,
        })
    );

    // Fetch raw PSQ implementation resources and products
    const rawImpResources = useFetchDefs("cintra_calculator_psq_implementation_resources");
    const rawImpProducts  = useFetchDefs("cintra_calculator_psq_implementation_products");

    // Build a lookup dictionary for PSQ resources (rates)
    const impResourceDict = React.useMemo(() => {
        const d = {};
        rawImpResources.forEach((r) => {
            const dayRate = Number(r.values.day_rate) || 0;
            d[r.id] = {
                field: r.id,
                label: r.values.name,
                day_rate: dayRate,
                hourly_rate: dayRate / 7,
            };
        });
        return d;
    }, [rawImpResources]);

    // Build PSQ product definitions by enriching each with its associated resource data
    const psqProductDefs = React.useMemo(() => {
        return rawImpProducts.map((r) => {
            const [firstResourceId] = (r.values.resource || []).map((x) => x.id);
            return {
                field: r.id,
                label: r.values.name,
                product_type: getFirstValue("product_type", r),
                resource: impResourceDict[firstResourceId] || null,
            };
        });
    }, [rawImpProducts, impResourceDict]);

    // Identify all value tables needed for dropdown/radio inputs
    const tablesToFetch = React.useMemo(() => {
        // Collect any defined input_values_table or quantity_frequency_values_table references
        return [...productDefs, ...productTypeDefs]
            .map((p) => p.input_values_table || p.quantity_frequency_values_table)
            .filter((tbl) => !!tbl);
    }, [productDefs, productTypeDefs]);
    // Fetch those value tables dynamically for dropdowns and radio groups
    const valueTables = useDynamicFetchDefs(tablesToFetch);

    // ------------------------- State for Accordions -------------------------

    // PSQ accordion sections state
    const [psqAccordions, setPSQAccordions] = useState([]);
    useEffect(() => {
        // Initialize PSQ accordions once types and products are loaded
        setPSQAccordions(
            psqTypeDefs.map((psqType) => {
                const output = { ...psqType };
                // Attach product-level fields to each PSQ type
                output.fields = psqProductDefs
                    .filter((a) => a.product_type.id === psqType.field)
                    .map((field) => ({
                        ...field,
                        value: 0,
                        defaultValue: 0,
                        input_type: "Number",
                        product_sub_type: { name: "N/A" }
                    }));
                return output;
            })
        );
    }, [psqTypeDefs, psqProductDefs]);

    // Product-type accordion sections state
    const [productTypeAccordions, setProductTypeAccordions] = useState([]);
    useEffect(() => {
        // Initialize product-type accordions once definitions and tables are ready
        if (
            productTypeDefs.length > 0
            && productDefs.length > 0
            && Object.keys(valueTables).length
        ) {
            console.count("Initialising Product Type Accoridons")
            console.log({productTypeDefs, productDefs, valueTables})
            setProductTypeAccordions(
                productTypeDefs.map((productType) => {
                    const output = { ...productType };
                    // Populate frequency field options from dynamic tables
                    if (output.frequencyFieldDef) {
                        output.frequencyFieldDef.values = valueTables[output.quantity_frequency_values_table] || null;
                    }
                    // Build field definitions including default values per input type
                    output.fields = productDefs
                        .filter((a) => a.product_type.id === productType.field)
                        .map((field) => {
                            let values = null;
                            let defaultValue = null;
                            switch (field.input_type) {
                                case "Toggle":
                                    values = { active: "Yes", inactive: "No" };
                                    defaultValue = false;
                                    break;
                                case "Number":
                                    values = { min: 0 };
                                    defaultValue = 0;
                                    break;
                                case "Text":
                                    values = { default: "" };
                                    defaultValue = "";
                                    break;
                                case "Radio":
                                case "Dropdown":
                                    values = valueTables[field.input_values_table];
                                    defaultValue = values ? values[0].values : null;
                                    break;
                                default:
                                    return null;  // Skip any unknown input types
                            }
                            return { ...field, values, defaultValue };
                        })
                        .filter((f) => f !== null);
                    return output;
                })
            );
        }
    }, [productTypeDefs, productDefs, valueTables]);

    // Standard implementation definitions state
    const [StandardImplementationDefs, setStandardImplementationDefs] = useState({});
    useEffect(() => {
        // Group day- and rate-definitions into one object for CalculateQuote
        setStandardImplementationDefs({
            days: standardImplementationDaysDefs,
            rates: standardImplementationRatesDefs,
        });
    }, [standardImplementationDaysDefs, standardImplementationRatesDefs]);

    // ------------------------- Initial Plan Setup -------------------------

    // Local state for grouping plan IDs and their selected values
    const [selectedValuesLocal, setSelectedValues] = useState({});
    const plansInitialised = useRef(false);

    useEffect(() => {
        // Don't re-run
        if (plansInitialised.current) return;
        if (productTypeAccordions.length === 0) return;

        plansInitialised.current = true

        console.count("Init Plan Setup")
        console.log({productTypeAccordions})
        const initialPlanIds = {};
        const initialSelected = {};

        // Helper to get default field entries based on type
        const getDefaultFields = (pt) => pt.fields.map((f) => {
            let defaultValue = f.defaultValue;
            switch (f.input_type) {
                case "Toggle": defaultValue = false; break;
                case "Number": defaultValue = 0; break;
                case "Text": defaultValue = ""; break;
                case "Radio":
                case "Dropdown":
                    const vals = valueTables[f.input_values_table];
                    defaultValue = vals ? vals[0].values : null;
                    break;
            }
            return { field: f.field, label: f.label, value: defaultValue };
        });

        // Initialize one plan for each accordion of inline or inline-table type
        productTypeAccordions.forEach((pt) => {
            const needsInline = pt.input_display_type === "inline" || pt.input_display_type === "inline-table";
            if (needsInline) {
                const planId = addPlan(pt.label);
                getDefaultFields(pt).forEach((field) => {
                    dispatch({
                        type: "UPDATE_SELECTED_VALUE",
                        payload: {
                            planId,
                            fieldKey: field.field,
                            value: field.defaultValue,
                        },
                    });
                })
            }
        });
    }, [productTypeAccordions]);

    // ------------------------- Plan CRUD Handlers -------------------------

    // Add a new plan for a given product type
    const addPlan = (productTypeName, planIdArg = null) => {
        const newId = planIdArg || uuidv4();
        console.log(`⚡ Plan created -> productType="${productTypeName}", planId="${newId}"`);
        // Dispatch to reducer
        dispatch({
            type: 'ADD_PLAN',
            payload: { plan: { id: newId, type: productTypeName } }
        });
        return newId;
    };

    // Placeholder for editing an existing plan (not implemented yet)
    const editPlan = (productTypeName, planId) => {
        console.log({ event: "editPlan Called", productTypeName, planId });
    };

    // Clone an existing plan by copying its values
    const clonePlan = (typeName, planId) => {
        const newId = uuidv4();
        const originalValues = selectedValues[planId] || {};
        // Add new plan
        dispatch({
            type: 'ADD_PLAN',
            payload: { plan: { id: newId, type: typeName } }
        });
        // Copy each selected field value
        Object.entries(originalValues).forEach(([fieldKey, value]) => {
            dispatch({
                type: 'UPDATE_SELECTED_VALUE',
                payload: { planId: newId, fieldKey, value }
            });
        });
        console.log({ event: "clonePlan -> new plan created", typeName, from: planId, newPlanId: newId });
    };

    // Delete a plan by removing it via reducer
    const deletePlan = (typeName, planId) => {
        dispatch({
            type: 'REMOVE_PLAN',
            payload: { planId }
        });
        console.log({ event: "deletePlan -> removed", typeName, planId });
    };

    // Bundle plan handlers for passing into child components
    const plan_handler = { add: addPlan, edit: editPlan, clone: clonePlan, delete: deletePlan };

    // ------------------------- Field Change Handlers -------------------------

    // Handle changes to product-type fields
    const handler = (field, value, planId) => {
        const productType = field.product_type.name;
        console.log(`✏️ Plan updated -> planId="${planId}", field="${field.label}" (fieldId=${field.field}), newValue=${JSON.stringify(value)}`);

        // If this plan is brand-new, ensure it's added to state
        if (!(planIdsByType[productType]?.includes(planId))) {
            // plan_handler.add(productType, planId);
        }

        // Update the selectedValues state for this field
        setSelectedValues((prev) => {
            const next = { ...prev };
            if (!next[productType]) next[productType] = [];
            let planObj = next[productType].find((p) => p.id === planId);
            if (!planObj) {
                planObj = { id: planId, fields: [] };
                next[productType].push(planObj);
            }
            // Handle quantity/frequency vs. other fields uniformly
            const isQty = field.field === "quantity";
            const isFrequency = field.field === "frequency";
            if (isQty || isFrequency) {
                planObj[`${field.field}_value`] = value;
            } else {
                const idx = planObj.fields.findIndex((f) => f.field === field.field);
                if (idx >= 0) planObj.fields[idx].value = value;
                else planObj.fields.push({ field: field.field, label: field.label, value });
            }
            return next;
        });
    };

    // Handle changes to PSQ fields (similar to handler above)
    const [selectedPSQValues, setSelectedPSQValues] = useState({});
    const psqHandler = (field, value, planId) => {
        console.log(`✏️ PSQ updated -> planId="${planId}", field="${field.label}" (fieldId=${field.field}), newValue=${JSON.stringify(value)}`);
        setSelectedPSQValues((prev) => {
            const next = { ...prev };
            const productType = field.product_type.name;
            if (!next[productType]) next[productType] = [];
            let planObj = next[productType].find((p) => p.id === planId);
            if (!planObj) {
                planObj = { id: planId, fields: [] };
                next[productType].push(planObj);
            }
            const isQty = field.field === "quantity";
            const isFrequency = field.field === "frequency";
            if (isQty || isFrequency) {
                planObj[`${field.field}_value`] = value;
            } else {
                const idx = planObj.fields.findIndex((f) => f.field === field.field);
                if (idx >= 0) planObj.fields[idx].value = value;
                else planObj.fields.push({ field: field.field, label: field.label, value });
            }
            return next;
        });
    };

    // ------------------------- PSQ Fee Requirement -------------------------

    const [RequiresPSQFee, setRequiresPSQFee] = useState(false);
    useEffect(() => {
        const needsFee = checkPSQRequirements(selectedValues);
        setRequiresPSQFee(needsFee);
        if (debug && debugPSQ) console.log("PSQ Fee Requirement Updated:", needsFee);
    }, [selectedValues]);

    // ------------------------- Quote Calculation -------------------------

    // Recalculate quote whenever inputs change
    const [quote, setQuote] = useState({});
    useEffect(() => {
        const result = CalculateQuote(
            planIdsByType,
            selectedValues,
            selectedPSQValues,
            productPriceDefs,
            productTypeDefs,
            psqTypeDefs,
            psqProductDefs,
            RequiresPSQFee,
            StandardImplementationDefs,
        );
        setQuote(result);
        if (debug && debugQuote) console.log("Quote Calculated: ", result);
    }, [planIdsByType, selectedValues, selectedPSQValues, productPriceDefs, productTypeDefs, psqTypeDefs, psqProductDefs, RequiresPSQFee, StandardImplementationDefs]);


    // Debug
    useEffect(() => {
        console.warn({
            plansById,
            planIdsByType,
            selectedValues
        })
    }, [plansById, planIdsByType, selectedValues ])

    return (
        <Flex direction="column" gap="md">
            {/* Page 1: Select products and quantities */}
            {currentPage === 1 && (
                <>
                    <Heading>Quote Details</Heading>
                    {productTypeAccordions.map((productType) => (
                        <React.Fragment key={productType.field}>
                            <ProductTypeAccordion
                                productType={productType}
                                planIds={planIdsByType[productType.label] || []}
                                actions={actions}
                                selectedValues={selectedValues[productType.label]}
                                handler={handler}
                                plan_handler={plan_handler}
                            />
                            <Divider />
                        </React.Fragment>
                    ))}

                    <QuoteSummaryComponent
                        selectedValues={selectedValues}
                        productTypeDefs={productTypeDefs}
                    />

                    <Flex justify="end">
                        <Button onClick={() => setCurrentPage(2)}>
                            Calculate Implementation Fees
                        </Button>
                    </Flex>
                </>
            )}

            {/* Page 2: PSQ details */}
            {currentPage === 2 && (
                <>
                    <Heading>PSQ Details</Heading>
                    {psqAccordions.map((psqType) => (
                        <React.Fragment key={psqType.field}>
                            <ProductTypeAccordion
                                productType={psqType}
                                planIds={planIdsByType[psqType.label] || []}
                                actions={actions}
                                selectedValues={selectedPSQValues[psqType.label] || []}
                                handler={psqHandler}
                                plan_handler={plan_handler}
                            />
                            <Divider />
                        </React.Fragment>
                    ))}
                    <Flex justify="end" gap="small">
                        <Button variant="secondary" onClick={() => setCurrentPage(1)}>
                            Review Schedule
                        </Button>
                        <Button onClick={() => setCurrentPage(3)}>
                            Next: Quote Sheet
                        </Button>
                    </Flex>
                </>
            )}

            {/* Page 3: Final quote sheet */}
            {currentPage === 3 && (
                <>
                    <Heading>Quote Sheet</Heading>
                    <Flex justify="end" gap="small">
                        <Button variant="secondary" onClick={() => setCurrentPage(1)}>
                            Review Schedule
                        </Button>
                        <Button variant="secondary" onClick={() => setCurrentPage(2)}>
                            Review Implementation Fee
                        </Button>
                        <Button variant="primary" onClick={() => {/* finalize logic */}}>
                            Finish
                        </Button>
                    </Flex>
                </>
            )}
        </Flex>
    );
};

export default Extension;
