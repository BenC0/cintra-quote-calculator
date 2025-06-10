import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { ProductTypeAccordion } from "./components/shared/ProductTypeAccordion";
import { useFetchDefs, useDynamicFetchDefs, getFirstValue } from "./components/shared/utils";
import {
    Divider,
    Button,
    hubspot,
    Flex,
    Heading,
} from "@hubspot/ui-extensions";
import { QuoteSummaryComponent } from "./components/summary/QuoteSummary";
import { checkPSQRequirements, CalculateQuote } from "./components/shared/Calculate";

// Register the extension in HubSpot CRM sidebar
hubspot.extend(({ context, runServerlessFunction, actions }) => (
    <Extension
        context={context}
        runServerless={runServerlessFunction}
        actions={actions}
    />
));

const Extension = ({ context, runServerless, actions }) => {
    // debug options, used for enabling/disabling certain console logs.
    const debug = true
    const debugPlans = true
    const debugProductDetails = false
    const debugQuote = false
    const debugPSQ = false

    // Function to build a productDef object based on expected columns
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
    }

    // Function to build a standardImplementationDaysRef object based on expected columns
    const standardImplementationDaysDefs = useFetchDefs("cintra_calculator_implementation_product_days", r => ({
        id: r.id,
        days: r.values.days,
        minimum_quantity: r.values.minimum_quantity,
        product_id: getFirstValue("product_id", r).id,
    }))

    const standardImplementationRatesDefs = useFetchDefs("cintra_calculator_implementation_rates", r => ({
        id: r.id,
        price: r.values.price,
        minimum_quantity: r.values.minimum_quantity,
        fixed_price: !!r.values.fixed_price,
        product_value: r.values.product_value ?? null,
        product_id: getFirstValue("product_id", r)?.id ?? null,
    }))

    const productTypeDefs = useFetchDefs( "cintra_calculator_product_types", (r) => {
        const quantityFieldDef = buildProductDef({
            id: "quantity",
            values: {
                name: r.values.quantity_field_label,
                input_type: [{name: "Number"}],
                product_type: [{
                    id: r.id,
                    name: r.values.name,
                    type: "foreignid",
                }],
                product_sub_type: {
                    label: "Details",
                    name: "details",
                }
            },
        })
        const frequencyFieldDef = buildProductDef({
            id: "frequency",
            values: {
                name: "Frequency",
                input_type: [{name: "Dropdown"}],
                product_type: [{
                    id: r.id,
                    name: r.values.name,
                    type: "foreignid",
                }],
                product_sub_type: {
                    label: "Details",
                    name: "details",
                },
                input_values_table: r.values.quantity_frequency_values_table
            },
        })
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
        }
    }, "sort_order" );

    const productDefs = useFetchDefs("cintra_calculator_products", buildProductDef);

    const psqTypeDefs = useFetchDefs("cintra_calculator_psq_types", r => ({
        field: r.id,
        label: r.values.name,
        sort_order: r.values.sort_order,
        max_items: 1,
        quantity_field_label: null,
        input_display_type: "inline-table",
        quantity_field_type: null,
        quantity_frequency_values_table: null
    }), "sort_order" );

    const productPriceDefs = useFetchDefs("cintra_calculator_product_prices", (r) => ({
        field: r.id,
        label: r.values.name,
        price: r.values.price,
        bundle_price: r.values.bundle_price,
        product_value: r.values.product_value,
        minimum_quantity: r.values.minimum_quantity,
        maximum_quantity: r.values.maximum_quantity,
        monthly_standing_charge: r.values.monthly_standing_charge,
        product_field: !!getFirstValue("product_id", r) ? getFirstValue("product_id", r).id : null,
    }))

    const rawImpResources = useFetchDefs("cintra_calculator_psq_implementation_resources");
    const rawImpProducts  = useFetchDefs("cintra_calculator_psq_implementation_products");

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

    const [psqAccordions, setPSQAccordions] = useState([]);
    useEffect(() => {
        setPSQAccordions(psqTypeDefs.map((psqType) => {
            const output = { ...psqType };
            output.fields = psqProductDefs
                .filter((a) => a.product_type.id === psqType.field)
                .map((field) => {
                    let value = 0;
                    let defaultValue = 0;
                    let input_type = "Number"
                    let product_sub_type = {
                        name: "N/A"
                    }
                    return { ...field, value, product_sub_type, defaultValue, input_type };
                })
                .filter((f) => f !== null);
            return output;
        }));
    }, [psqTypeDefs, psqProductDefs]);

    const tablesToFetch = React.useMemo(() => {
        return [...productDefs, ...productTypeDefs]
            .map((p) => (p.input_values_table || p.quantity_frequency_values_table))
            .filter((tbl) => !!tbl)
    }, [productDefs, productTypeDefs] );
    const valueTables = useDynamicFetchDefs(tablesToFetch);

    const [productTypeAccordions, setProductTypeAccordions] = useState([]);
    useEffect(() => {
        setProductTypeAccordions(productTypeDefs.map((productType) => {
            const output = { ...productType };
            if (!!output.frequencyFieldDef) {
                output.frequencyFieldDef.values = valueTables[output.quantity_frequency_values_table] || null
            }
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
                            return "";
                    }
                    return { ...field, values, defaultValue };
                })
                .filter((f) => f !== null);
            return output;
        }));
    }, [productTypeDefs, productDefs, valueTables]);

    const [StandardImplementationDefs, setStandardImplementationDefs] = useState([]);

    useEffect(() => {
        setStandardImplementationDefs({
            "days": standardImplementationDaysDefs,
            "rates": standardImplementationRatesDefs,
        })
    }, [standardImplementationDaysDefs, standardImplementationRatesDefs]);

    const [planIdsByType, setPlanIdsByType] = useState({});
    useEffect(() => {
        const allAccords = [...productTypeAccordions, ...psqAccordions];
        if (allAccords.length === 0) return;

        const initialPlanIds = {};
        const initialSelected = {};
        const initialPSQSelected = {};

        const getDefaultFields = (pt) => pt.fields.map((f) => {
            let defaultValue = f.defaultValue
            switch (f.input_type) {
                case "Toggle":
                    defaultValue = false;
                    break;
                case "Number":
                    defaultValue = 0;
                    break;
                case "Text":
                    defaultValue = "";
                    break;
                case "Radio":
                case "Dropdown":
                    let values = valueTables[f.input_values_table];
                    defaultValue = values ? values[0].values : null;
                    if (!!defaultValue) {
                        return {
                            field: f.field,
                            label: defaultValue.label,
                            value: defaultValue.value,
                        }
                    }
                    break;
            }
            return {
                field: f.field,
                label: f.label,
                value: defaultValue,
            }
        });
        allAccords.forEach((pt) => {
            let initialValue = [];
            if (pt.input_display_type === "inline" || pt.input_display_type === "inline-table") {
                const newId = uuidv4();
                initialValue = [newId];
                const defaultFields = getDefaultFields(pt)
                initialSelected[pt.label] = [{ id: newId, fields: defaultFields }];
            }
            initialPlanIds[pt.label] = initialValue;
        });
        psqAccordions.forEach((pt) => {
            let initialValue = [];
            if (pt.input_display_type === "inline" || pt.input_display_type === "inline-table") {
                const newId = uuidv4();
                initialValue = [newId];
                const defaultFields = getDefaultFields(pt)
                initialPSQSelected[pt.label] = [{ id: newId, fields: defaultFields }];
            }
            initialPlanIds[pt.label] = initialValue;
        });
        setPlanIdsByType(initialPlanIds);
        setSelectedValues(initialSelected);
    }, [productTypeAccordions]);

    const addPlan = (productTypeName, planIdArg = null) => {
        const newId = planIdArg || uuidv4();
        console.log(`⚡ Plan created -> productType="${productTypeName}", planId="${newId}"`)
        setPlanIdsByType((prev) => {
            const next = { ...prev };
            const existing = Array.isArray(next[productTypeName]) ? next[productTypeName] : [];
            next[productTypeName] = [...existing, newId];
            return next;
        });
        return newId;
    };
    
    const editPlan = (productTypeName, planId) => {
        console.log({
            event: "editPlan Called",
            productTypeName, planId
        })
    }

    const clonePlan = (typeName, planId) => {
        const newId = uuidv4();
        const originalPlans = selectedValues[typeName] || [];
        const original = originalPlans.find((p) => p.id === planId);
        const copiedFields = original ? original.fields.map((f) => ({ ...f })) : [];
        setPlanIdsByType((prev) => ({
            ...prev,
            [typeName]: [...(prev[typeName] || []), newId],
        }));
        setSelectedValues((prev) => {
            const next = { ...prev };
            const existing = Array.isArray(next[typeName]) ? next[typeName] : [];
            next[typeName] = [...existing, { id: newId, fields: copiedFields }];
            return next;
        });
        console.log({
            event: "clonePlan -> new plan created",
            typeName,
            from: planId,
            newPlanId: newId,
        });
    };

    const deletePlan = (typeName, planId) => {
        setPlanIdsByType((prev) => ({
            ...prev,
            [typeName]: (prev[typeName] || []).filter((id) => id !== planId),
        }));
        setSelectedValues((prev) => {
            const next = { ...prev };
            if (Array.isArray(next[typeName])) {
                next[typeName] = next[typeName].filter((p) => p.id !== planId);
            }
            return next;
        });
        console.log({ event: "deletePlan -> removed", typeName, planId });
    };

    const plan_handler = {
        add: addPlan,
        edit: editPlan,
        clone: clonePlan,
        delete: deletePlan,
    }

    const [selectedValues, setSelectedValues] = useState({});
    const handler = (field, value, planId) => {
        const productType = field.product_type.name;
        console.log( `✏️ Plan updated -> planId="${planId}", field="${field.label}" (fieldId=${field.field}), newValue=${JSON.stringify(value)}`)

        if (planIdsByType[productType].indexOf(planId) == -1) {
            plan_handler.add(productType, planId)
        }

        setSelectedValues((prev) => {
            const next = { ...prev };
            const isQty = field.field == "quantity";
            const isFrequency = field.field == "frequency";

            if (!next[productType]) {
                next[productType] = [];
            }
            let planObj = next[productType].find((p) => p.id === planId);
            if (!planObj) {
                planObj = { id: planId, fields: [] };
                next[productType].push(planObj);
            }
            if (isQty || isFrequency) {
                planObj[`${field.field}_value`] = value
            } else {
                const idx = planObj.fields.findIndex((f) => f.field === field.field);
                if (idx > -1) {
                    planObj.fields[idx] = { ...planObj.fields[idx], value };
                } else {
                    planObj.fields.push({ field: field.field, label: field.label, value });
                }
            }
            return next;
        });
    };
    
    const [currentPage, setCurrentPage] = useState(1);
    const [quote, setQuote] = useState({});
    const [selectedPSQValues, setSelectedPSQValues] = useState({});
    useEffect(() => {
        let psqValues = {}
        psqTypeDefs.forEach(psqType => {
            psqValues[psqType.label] = [{
                fields: psqProductDefs.map(psqProduct => {
                    let output = {}
                    output.field = psqProduct.field
                    output.label = psqProduct.label
                    output.value = 0
                    return output
                })
            }]
        })
        // setSelectedPSQValues(psqValues)
        // console.log({psqProductDefs, selectedPSQValues})
    }, [psqTypeDefs, psqProductDefs])

    const psqHandler = (field, value, planId) => {
        console.log( `✏️ Plan updated -> planId="${planId}", field="${field.label}" (fieldId=${field.field}), newValue=${JSON.stringify(value)}`)
        setSelectedPSQValues((prev) => {
            const next = { ...prev };
            const isQty = field.field == "quantity";
            const isFrequency = field.field == "frequency";
            const productType = field.product_type.name;
            if (!next[productType]) {
                next[productType] = [];
            }
            let planObj = next[productType].find((p) => p.id === planId);
            if (!planObj) {
                planObj = { id: planId, fields: [] };
                next[productType].push(planObj);
            }
            if (isQty || isFrequency) {
                planObj[`${field.field}_value`] = value
            } else {
                const idx = planObj.fields.findIndex((f) => f.field === field.field);
                if (idx > -1) {
                    planObj.fields[idx] = { ...planObj.fields[idx], value };
                } else {
                    planObj.fields.push({ field: field.field, label: field.label, value });
                }
            }
            return next;
        });
    };

    useEffect(() => {
        setQuote(CalculateQuote(
            planIdsByType,
            selectedValues,
            selectedPSQValues,
            productPriceDefs,
            productTypeDefs,
            psqTypeDefs,
            psqProductDefs,
            RequiresPSQFee,
            StandardImplementationDefs,
        ))
        if (debug && debugQuote) {
            console.log("Quote Calculated: ", quote)
        }
    }, [planIdsByType, selectedValues, selectedPSQValues, productPriceDefs, productTypeDefs, psqTypeDefs, psqProductDefs]);

    const [RequiresPSQFee, setRequiresPSQFee] = useState(false);
    useEffect(() => {
        setRequiresPSQFee(checkPSQRequirements(selectedValues))
        if (debug && debugPlans) {
            console.log("Plans Update:", { planIdsByType, selectedValues, selectedPSQValues });
        }
    }, [planIdsByType, selectedValues, selectedPSQValues]);

    useEffect(() => {
        if (debug && debugPSQ) {
            console.log("PSQ Fee Required:", { RequiresPSQFee });
        }
    }, [RequiresPSQFee]);

    if (debug && debugProductDetails) {
        useEffect(() => {
            console.log("Product Details Update:", { productTypeAccordions, psqAccordions });
        }, [productTypeAccordions, psqAccordions]);
    }
    
    return (
        <Flex direction="column" gap="md">
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
                        <Button
                            // disabled
                            onClick={() => setCurrentPage(2)}
                        >
                            Calculate Implementation Fees
                        </Button>
                    </Flex>
                </>
            )}

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
                        <Button
                            variant="secondary"
                            onClick={() => setCurrentPage(1)}
                        >
                            Review Schedule
                        </Button>
                        <Button
                            // disabled
                            onClick={() => setCurrentPage(3)}
                        >
                            Next: Quote Sheet
                        </Button>
                    </Flex>
                </>
            )}

            {currentPage === 3 && (
                <>
                    <Heading>Quote Sheet</Heading>
                    <Flex justify="end" gap="small">
                        <Button
                            variant="secondary"
                            onClick={() => setCurrentPage(1)}
                        >
                            Review Schedule
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => setCurrentPage(2)}
                        >
                            Review Implementation Fee
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => { /* finalize */ }}
                        >
                            Finish
                        </Button>
                    </Flex>
                </>
            )}
        </Flex>
    );
};

export default Extension;
