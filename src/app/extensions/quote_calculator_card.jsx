// 3rd party libraries/modules
import React, { useState, useEffect, useReducer, useRef, useCallback } from "react";
import { Divider, Button, hubspot, Flex, Heading, Alert } from "@hubspot/ui-extensions";
// Misc. utility functions
import { generateID } from "./components/Utils/generateID";
import { isEmptyArray } from "./components/Utils/isEmptyArray";
import { getFirstValue } from "./components/Utils/getFirstValue";
// HubSpot related functions
import { getDealProps } from "./components/HubSpot/getDealProps";
import { setLineItems } from "./components/HubSpot/setLineItems";
import { useFetchDefs } from "./components/HubSpot/useFetchDefs";
import { useGetQuotes } from "./components/HubSpot/useGetQuotes";
import { getCompanies } from "./components/HubSpot/getCompanies";
import { useCreateQuote } from "./components/HubSpot/useCreateQuote";
import { useUpdateQuote } from "./components/HubSpot/useUpdateQuote";
import { pushQuoteToContract } from "./components/HubSpot/pushQuoteToContract";
import { useDynamicFetchDefs } from "./components/HubSpot/useDynamicFetchDefs";
// Formatting related functions
import { formatInt } from "./components/Format/formatInt";
import { toTitleCase } from "./components/Format/toTitleCase";
import { formatPrice } from "./components/Format/formatPrice";
// UI related functions
import { PSQTables } from "./components/Render/PSQTables";
import { QuoteSheet } from "./components/Render/QuoteSheet";
import { QuoteSummaryComponent } from "./components/Render/QuoteSummary";
import { ProductTypeAccordion } from "./components/Render/ProductTypeAccordion";
// Data related functions
import { quoteReducer } from "./components/Data/quoteReducer";
import { productDefsHandler } from "./components/Data/productDefsHandler";
import { psqImpHoursHandler } from "./components/Data/psqImpHoursHandler";
import { psqTypeDefsHandler } from "./components/Data/psqTypeDefsHandler";
import { psqImpConfigHandler } from "./components/Data/psqImpConfigHandler";
import { productTypeDefsHandler } from "./components/Data/productTypeDefsHandler";
import { productPriceDefsHandler } from "./components/Data/productPriceDefsHandler";
import { productBasedValidationRulesDefHandler } from "./components/Data/productBasedValidationRulesDefHandler";
import { standardImplementationDaysDefsHandler } from "./components/Data/standardImplementationDaysDefsHandler";
import { standardImplementationRatesDefsHandler } from "./components/Data/standardImplementationRatesDefsHandler";
// Data/calculation related functions
import { CalculateQuote } from "./components/Calculate/Calculate";
import { checkIfManager } from "./components/Utils/checkIfManager";
import { checkPSQRequirements } from "./components/Calculate/checkPSQRequirements";
import { useQuoteUpdateQueue } from "./components/HubSpot/useQuoteUpdateQueue";
import { impResourceDictHandler } from "./components/Data/impResourceDictHandler";
import { psqProductDefsHandler } from "./components/Data/psqProductDefsHandler";
import { getTablesToFetch } from "./components/Data/getTablesToFetch";
import { productBasedValidationRulesHandler } from "./components/Data/ProductBasedValidationRulesHandler";
import { psqTypeDefsMap } from "./components/Data/psqTypeDefsMap";
import { productTypeAccordionsMap } from "./components/Data/productTypeAccordionsMap";
import { getDefaultFields } from "./components/Data/getDefaultFields";
import { planHandler } from "./components/Data/planHandler";

// Register the extension in the HubSpot CRM sidebar
hubspot.extend(({ context, actions }) => (
    <Extension
        context={context}
        actions={actions}
    />
));

// Main extension component
const Extension = ({ context, actions }) => {
    // Debug flags for console logging various parts of state and logic
    const debug = false;
    const debugValues = false;
    const debugPlans = false;
    const debugQuote = false;
    const versionLabel = "Cintra Quote Calculator: v0.18.3"

    // Initial state for the quote, managed by useReducer
    const initialState = {
        plansById       : {}, 
        planIdsByType   : {}, 
        selectedValues  : {}, 
    };

    // Boolean Flags
    const valuesInitialised = useRef(false);
    const FirstRun = useRef(false);
    const [isManager, setIsManager] = useState(false);
    const [managerApproval, setManagerApproval] = useState(false);
    const [RequiresPSQFee, setRequiresPSQFee] = useState(false);
    const [QuoteSubmitted, setQuoteSubmitted] = useState(false);
    const [QuoteSubmitting, setQuoteSubmitting] = useState(false);

    // Page Flag: 1=Quote Details, 2=PSQ Details, 3=Quote Sheet
    const [currentPage, setCurrentPage] = useState(1);

    // Deal Associated Information
    const [DealId, setDealId] = useState(null);
    const [dealProps, setDealProps] = useState(null);
    const [dealCompanies, setDealCompanies] = useState(null);

    // Quote Associated Information
    const [quote, setQuote] = useState({});
    const [ExistingQuote, setExistingQuote] = useState(null);
    const [quoteCustomRates, setquoteCustomRates] = useState({});
    const [quoteDiscountValues, setquoteDiscountValues] = useState({});
    const [PSQImplementationCustomHours, setPSQImplementationCustomHours] = useState({});
    const [{
        plansById,
        planIdsByType,
        selectedValues
    }, dispatch ] = useReducer(quoteReducer, initialState);
    
    // Functional information
    const [psqAccordions, setPSQAccordions] = useState([]);
    const [productTypeAccordions, setProductTypeAccordions] = useState([]);
    const [StandardImplementationDefs, setStandardImplementationDefs] = useState({});
    const [productBasedValidationRules, setProductBasedValidationRules] = useState([]);
    
    // On first run only:
    // - Check if user is a manager
    // - Log the version label to the console
    // - Get and set the Deal ID from the context object
    // - Sets console time if debug = true
    useEffect(() => {
        // Prevent running more than once
        if (FirstRun.current) return;
        FirstRun.current = true
        if (!!debug) { console.time(versionLabel) }
        console.log(versionLabel)
        setIsManager(prev => checkIfManager(context))
        setDealId(prev => context.crm.objectId)
    }, [])

    // Once DealID has a value:
    // - Get and set associated company information
    // - Get and set associated deal information
    useEffect(() => {
        if (!!DealId) {
            getCompanies(DealId).then(result => {
                setDealCompanies(result.body.companies)
            })
            getDealProps(DealId).then(result => {
                setDealProps(result)
            })
        }
    }, [DealId])

    
    // Setup quote queue function for updates
    // debounces updates to 500ms to reduce liklihood of table write errors in HubSpot.
    const updateQuote = useUpdateQuote();
    const enqueueUpdate = useQuoteUpdateQueue(updateQuote, 500);
    
    // ------------------------- Rendering -------------------------

    // ------------------------- Data Definitions -------------------------
    // Fetch standard implementation day/rate definitions with transformation
    const standardImplementationDaysDefs = useFetchDefs( "cintra_calculator_implementation_product_days", standardImplementationDaysDefsHandler );
    const standardImplementationRatesDefs = useFetchDefs( "cintra_calculator_implementation_rates", standardImplementationRatesDefsHandler );

    // Fetch definitions for product types
    const productTypeDefs = useFetchDefs( "cintra_calculator_product_types", productTypeDefsHandler, "sort_order" );
    // Fetch product definitions
    const productDefs = useFetchDefs("cintra_calculator_products", productDefsHandler);
    // Fetch product price definitions
    const productPriceDefs = useFetchDefs( "cintra_calculator_product_prices", productPriceDefsHandler );

    // Fetch PSQ (Professional Services & Quality) type definitions
    const psqTypeDefs = useFetchDefs( "cintra_calculator_psq_types", psqTypeDefsHandler, "sort_order" );
    const psqPayrollMultiplerReference = useFetchDefs( "cintra_calculator_psq_payroll_multiplier_reference", r => r.values, "number_of_payrolls" )
    // Fetch raw PSQ implementation resources and products
    const rawImpResources = useFetchDefs("cintra_calculator_psq_implementation_resources");
    const rawImpProducts  = useFetchDefs("cintra_calculator_psq_implementation_products");
    const psqImpConfig  = useFetchDefs("cintra_calculator_psq_implementation_config", psqImpConfigHandler);
    const psqImpHours  = useFetchDefs("cintra_calculator_psq_implementation_hours", psqImpHoursHandler);

    // Build a lookup dictionary for PSQ resources (rates)
    const impResourceDict = React.useMemo(() => impResourceDictHandler(rawImpResources), [rawImpResources]);
    
    // Build PSQ product definitions by enriching each with its associated resource data
    const psqProductDefs = React.useMemo(() => psqProductDefsHandler(rawImpProducts, impResourceDict), [rawImpProducts, impResourceDict]);

    // Identify all value tables needed for dropdown/radio inputs
    const tablesToFetch = React.useMemo(() => getTablesToFetch(productDefs, productTypeDefs), [productDefs, productTypeDefs]);
    // Fetch those value tables dynamically for dropdowns and radio groups
    const valueTables = useDynamicFetchDefs(tablesToFetch);

    
    const productBasedValidationRulesDef = useFetchDefs( "cintra_calculator_product_based_validation_rules", productBasedValidationRulesDefHandler );
    useEffect(() => {
        if (!( isEmptyArray(productBasedValidationRulesDef) || isEmptyArray(productDefs) )) {
            setProductBasedValidationRules(prev => productBasedValidationRulesHandler(productBasedValidationRulesDef, productDefs, selectedValues))
        }
    }, [productBasedValidationRulesDef, productDefs, selectedValues])

    // ------------------------- State for Accordions -------------------------

    // PSQ accordion sections state
    useEffect(() => {
        // Initialize PSQ accordions once types and products are loaded
        setPSQAccordions(_ => psqTypeDefsMap(psqTypeDefs, psqProductDefs))
    }, [psqTypeDefs, psqProductDefs]);

    // Product-type accordion sections state
    useEffect(() => {
        // Initialize product-type accordions once definitions and tables are ready
        if ( productTypeDefs.length > 0 && productDefs.length > 0 && Object.keys(valueTables).length ) {
            if (!!debug) console.count("Initialising Product Type Accoridons")
            setProductTypeAccordions(_ => productTypeAccordionsMap(productTypeDefs, productDefs, valueTables));
        }
    }, [productTypeDefs, productDefs, valueTables]);

    // Standard implementation definitions state
    useEffect(() => {
        // Group day- and rate-definitions into one object for CalculateQuote
        setStandardImplementationDefs({
            days: standardImplementationDaysDefs,
            rates: standardImplementationRatesDefs,
        });
    }, [standardImplementationDaysDefs, standardImplementationRatesDefs]);

    // ------------------------- Initial Plan Setup -------------------------
    const plansInitialised = useRef(false);
    useEffect(() => {
        // Don't re-run
        if (plansInitialised.current) return;
        if (productTypeAccordions.length === 0) return;
        if (debug) console.count("Initial Plan Setup");
        plansInitialised.current = true

        // Initialise one plan for each accordion of inline or inline-table type
        productTypeAccordions.forEach((pt) => {
            const needsInline = pt.input_display_type === "inline" || pt.input_display_type === "inline-table";
            if (needsInline) {
                const planId = planHandler.add(dispatch, pt.label);
                getDefaultFields(pt, valueTables).forEach((field) => {
                    dispatch({
                        type: "UPDATE_SELECTED_VALUE",
                        payload: {
                            planId,
                            fieldKey: field.field,
                            value: field.value,
                        },
                    });
                })
            }
        });
    }, [productTypeAccordions, valueTables]);

    // Custom Value Handlers
    const PSQHandler = (fieldID, value) => { setPSQImplementationCustomHours(prev => ({ ...prev, [fieldID]: value })) }
    const QuoteDiscountValueHandler = (fieldID, value) => { setquoteDiscountValues(prev => ({ ...prev, [fieldID]: value })) }
    const quoteCustomRatesHandler = (fieldID, value) => { setquoteCustomRates(prev => ({ ...prev, [fieldID]: value })) }



    // ------------------------- Field Change Handlers -------------------------

    const handler = (field, value, planId) => {
        const productType = field.product_type.name;
        // If this is a "brand new" planId for that type, dispatch ADD_PLAN
        if (!planIdsByType[productType]?.includes(planId)) {
            dispatch({
                type: 'ADD_PLAN',
                payload: { plan: { id: planId, type: productType, initialValues: {} } }
            });
        }
        const isQtyOrFreq = field.field === "quantity" || field.field === "frequency";
        const fieldKey = isQtyOrFreq ? `${field.field}_value` : field.field;
        dispatch({
            type: "UPDATE_SELECTED_VALUE",
            payload: {
                planId,
                fieldKey,
                value,
            },
        });
    };


    // ------------------------- Quote Calculation -------------------------
    
    useEffect(() => {
        if (!!DealId && !ExistingQuote) {
            useGetQuotes(DealId)
            .then(rows => {
                if (!!rows && rows.length > 0) {
                    let latestQuote = rows[0]
                    setExistingQuote(latestQuote)
                } else {
                    useCreateQuote({deal: DealId, name: "Test"})
                    .then(rows => setExistingQuote(rows))
                }
            })
        }
    }, [DealId])

    // Recalculate quote whenever inputs change
    useEffect(() => {
        if (!!DealId && !!ExistingQuote) {
            const needsFee = checkPSQRequirements(selectedValues, productDefs, productTypeAccordions, planIdsByType);
            setRequiresPSQFee(needsFee);
            const result = CalculateQuote({
                planIdsByType: planIdsByType,
                selectedValues: selectedValues,
                productPriceDefs: productPriceDefs,
                productTypeDefs: productTypeDefs,
                RequiresPSQFee: needsFee,
                StandardImplementationDefs: StandardImplementationDefs,
                productDefs: productDefs,
                productTypeAccordions: productTypeAccordions,
                psqAccordions: psqAccordions,
                psqImpHours: psqImpHours,
                psqImpConfig: psqImpConfig,
                PSQImplementationCustomHours: PSQImplementationCustomHours,
                quoteDiscountValues: quoteDiscountValues,
                quoteCustomRates: quoteCustomRates,
                QUOTE_ID: ExistingQuote.id,
                psqPayrollMultiplerReference: psqPayrollMultiplerReference,
            });
            setQuote(result);
            if (!!result && !!result["Summary"]["Total Y1 Charges"]) {
                enqueueUpdate({
                    deal: DealId,
                    quote_id: ExistingQuote.id,
                    name: "Test",
                    selected_values: JSON.stringify(selectedValues),
                    submitted: 0,
                    line_items: result["Line Item Mapping"]
                })
            }
            if ((debug && debugQuote) && !!result) console.log({
                event: "Quote Calculated",
                result,
            });
        }
    }, [planIdsByType, selectedValues, productPriceDefs, productTypeDefs, RequiresPSQFee, StandardImplementationDefs, productDefs, productTypeAccordions, psqAccordions, PSQImplementationCustomHours, quoteDiscountValues, quoteCustomRates, DealId, ExistingQuote]);

    const progressToImplementation = () => {
        if (RequiresPSQFee) {
            setCurrentPage(2)
        } else {
            setCurrentPage(3)
        }
    }

    useEffect(() => {
        if (
            Object.keys(plansById).length > 0 &&
            Object.keys(planIdsByType).length > 0 &&
            Object.keys(selectedValues).length > 0
        ) {
            if (debug) {
                console.warn({
                    event: "Debug Log",
                    plansById,
                    planIdsByType,
                    selectedValues,
                });
                console.timeEnd(versionLabel)
            }
        }
    }, [plansById, planIdsByType, selectedValues]);

    useEffect(() => {
        let conditions = [
            Object.keys(StandardImplementationDefs).length > 0,
            Object.keys(productPriceDefs).length > 0,
            Object.keys(psqAccordions).length > 0,
            Object.keys(productTypeAccordions).length > 0,
            Object.keys(plansById).length > 0,
            Object.keys(valueTables).length > 0,
            plansInitialised.current,
            !valuesInitialised.current,
            !!DealId,
            !!ExistingQuote
        ]
        if (conditions.every(a => !!a)) {
            valuesInitialised.current = true
            resetForm(plansById, productTypeAccordions, valueTables)
            if (!!debugValues || (!!ExistingQuote && !!ExistingQuote.values.selected_values)) {
                let preLoadedValues = null
                try {
                    if (!!ExistingQuote && !!ExistingQuote.values.selected_values) {
                        preLoadedValues = JSON.parse(ExistingQuote.values.selected_values)
                    }
                } catch (error) {
                    return null;
                }
                if (!preLoadedValues) {
                    return null;
                }
                for (let planKey in preLoadedValues) {
                    let products = preLoadedValues[planKey]
                    let productKeys = Object.keys(products)
                    let dynamicProductKeys = productKeys.filter(key => !key.match(/_value/g))
                    let productType = null
                    let productTypeMapping = []
                    dynamicProductKeys.forEach(productKey => {
                        productTypeMapping.push(
                            productTypeAccordions.find(pt => {
                                let firstMatchingField = pt.fields.find(field => field.field == productKey)
                                return !!firstMatchingField
                            })
                        )
                    })

                    if (productTypeMapping.length > 0) {
                        productType = productTypeMapping[0]
                    }

                    if (!!productType) {
                        let usablePlanKey = planKey
                        if (productType.input_display_type == "inline") {
                            for (let knownPlanKey in plansById) {
                                if (productType.label == plansById[knownPlanKey].type) {
                                    usablePlanKey = knownPlanKey
                                }
                            }
                        }
                        let productFieldValuePairs = []
                        for (let productKey in products) {
                            let value = products[productKey]
                            let productField = productType.fields.find(field => field.field == productKey)
                            if (!!productKey.match(/^quantity_value$/g)) {
                                productField = productType["quantityFieldDef"] 
                            } else if (!!productKey.match(/^frequency_value$/g)) {
                                productField = productType["frequencyFieldDef"] 
                            }
                            if (!!productField) {
                                productFieldValuePairs.push({ productField, value })
                            } else {
                                console.error({
                                    event: "Product Field Not Found",
                                    productType,
                                    productKey,
                                })
                            }
                        }
                        
                        dispatch({
                            type: 'ADD_PLAN',
                            payload: { plan: { id: usablePlanKey, type: productType.label } }
                        });

                        productFieldValuePairs.forEach((pairing) => {
                            let fieldKey = pairing.productField.field
                            if (!!fieldKey.match(/^(quantity|frequency)$/g) && !fieldKey.match(/^_value$/g)) {
                                fieldKey = `${fieldKey}_value`
                            }
                            dispatch({
                                type: "UPDATE_SELECTED_VALUE",
                                payload: {
                                    planId: usablePlanKey,
                                    fieldKey,
                                    value: pairing.value,
                                },
                            });
                        })
                    }
                }
            }
        }
    }, [ StandardImplementationDefs, productPriceDefs, psqAccordions, productTypeAccordions, plansInitialised, valueTables, plansById, DealId, ExistingQuote ]);

    const resetForm = (plansById, productTypeAccordions, valueTables) => {
        for (let planKey in plansById) {
            let plan = plansById[planKey]
            let planProductType = productTypeAccordions.find(pt => pt.label == plan.type)
            if (planProductType.input_display_type == "inline") {
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
                            defaultValue = !!vals ? vals.find(v => !!v.values.default) : null
                            if (!!defaultValue) {
                                defaultValue = defaultValue.values.value
                            } else if (!!vals) {
                                defaultValue = vals[0].values.value
                            }
                            break;
                    }
                    return { field: f.field, label: f.label, value: defaultValue };
                });

                getDefaultFields(planProductType).forEach((field) => {
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
    const submitQuote = (DealId, ExistingQuote, selectedValues, quote, productTypeAccordions, dealCompanies, dealProps) => {
        setQuoteSubmitting(prev => true)
        const now = new Date();
        const monthYear = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        const jsonOutput = {
            "details": {
                "ClientName": dealCompanies?.name ?? "", // Associated company name
                "CreateDate": monthYear, // "Today" date
                "ClientFullName": dealCompanies?.client_full_name ?? "", // Associated company
                "ClientLegalName": dealCompanies?.client_legal_name ?? "", // Associated company
                "CompanyNumber": dealCompanies?.companies_house_number ?? "", // Associated company
                "RegisteredAddress": dealCompanies?.registered_address ?? "", // Associated company
                "ContractLength": `${quote["Summary"]["ContractLength"]} Months`,
                "EstGoLive": dealProps?.provisional_go_live_date ?? "" // Deal record - provisional_go_live_date
            },
            "tables": []
        }
        let targetPTs = productTypeAccordions.filter(pt => !pt.is_quote_details_type).sort((a, b) => a.sort_order - b.sort_order)

        targetPTs.forEach(pt => {
            let relevantPlans = quote["Details"][pt.label]
            !!relevantPlans && relevantPlans.forEach((plan, idx) => {
                const planValues = selectedValues[plan.planId]
                let planName = `\n${pt.label}`
                if (relevantPlans.length > 1) {
                    planName = `${planName} ${idx + 1}`
                }
                let shortPlanName = planName
                let planDetails = ""
                let freqDetails = ""
                if (!!planValues.quantity_value && !!planValues.frequency_value && !!pt.quantity_field_label) {
                    planDetails = `${planValues.quantity_value} ${pt.quantity_field_label}`
                    freqDetails = `${toTitleCase(planValues.frequency_value)} Frequency`
                    planName = `${planName}: ${planDetails}`
                }
                
                plan.fields.length > 0 && jsonOutput["tables"].push({
                    "name": `${planName}`,
                    "shortName": `${shortPlanName}`,
                    "details": `\n${planDetails}`,
                    "frequency": `\n${freqDetails}`,
                    "TotalFees": `£${formatPrice(plan.estimated_monthly_fee)}`,
                    "Type": `Product`,
                    "rows": plan.fields.map(field => {
                        let label = field.label
                        let fieldValue = planValues[field.field]
                        if (typeof fieldValue == "string") {
                            label = `${field.label}: ${planValues[field.field]}`
                        }

                        return {
                            "ProductType": label,
                            "PricingStructure": `${field?.pricing_structure ?? ""}`,
                            "Quantity": `${formatInt(field.qty)}`,
                            "UnitPrice": `£${formatPrice(field.adjusted_price)}`,
                            "TotalFee": `£${formatPrice(field.estimated_monthly_fee)}`
                        }
                    })
                })
            })
        })

        
        let impFees = quote["Implementation Fees"]
        if (impFees["Implementation Type"] == "PSQ") {
            let psqPlans = []
            let serviceRows = []
            for (let key in impFees) {
                if (!!key.match(/^[0-9]*$/g)) psqPlans.push(impFees[key])
            }
            psqPlans.forEach(plan => {
                let validFields = plan.fields.filter(field => (field.psqFee + field.discount) > 0)
                let totalFee = 0
                if (validFields.length > 0) {
                    validFields.forEach(service => {
                        totalFee += service["psqFee"]
                        serviceRows.push(
                        {
                            "ProductType": `${service.label}`,
                            "PricingStructure": `One Time Fee`,
                            "Quantity": `${formatInt(service["hoursBand"]["hours"])}`,
                            "UnitPrice": `£${formatPrice(service["adjusted_hourly_rate"])}`,
                            "TotalFee": `£${formatPrice(service["psqFee"])}`
                        })
                    })
                }
                jsonOutput["tables"].push({
                    "name": `${plan.title}`,
                    "TotalFees": `£${formatPrice(totalFee)}`,
                    "Type": `Implementation`,
                    "rows": serviceRows
                })
            })

        } else {
            let serviceRows = []
            let totalImplementationFee = 0
            for (let key in impFees) {
                let fee = impFees[key]
                if (!!fee.services) {
                    totalImplementationFee += fee.totalImplementationFee
                    Object.keys(fee.services).forEach(serviceKey => {
                        let service = fee.services[serviceKey]
                        serviceRows.push(
                        {
                            "ProductType": `${service.label}`,
                            "PricingStructure": `One Time Fee`,
                            "Quantity": `${formatInt(service["Implementation Days"])}`,
                            "UnitPrice": `£${formatPrice(service["Implementation Unit Price"])}`,
                            "TotalFee": `£${formatPrice(service["Implementation Fee"])}`
                        })
                    })
                }
            }
            jsonOutput["tables"].push({
                "name": `\nImplementation Fees`,
                "TotalFees": `£${formatPrice(totalImplementationFee)}`,
                "Type": `Implementation`,
                "rows": serviceRows
            })
        }

        jsonOutput["tables"].push({
            "name": "\nTotal Overall Costs",
            "TotalFees": `£${formatPrice(quote["Summary"]["Total Y1 Charges"])}`,
            "Type": "Summary",
            "rows": [
                {
                    "ProductType": "Total Estimated Monthly Charges",
                    "PricingStructure": "",
                    "Quantity": "",
                    "UnitPrice": "",
                    "TotalFee": `£${formatPrice(quote["Summary"]["Total Estimated Monthly Costs"])}`
                },
                {
                    "ProductType": "Total Estimated Annual Charges",
                    "PricingStructure": "",
                    "Quantity":"",
                    "UnitPrice": "",
                    "TotalFee": `£${formatPrice(quote["Summary"]["Total Estimated Annual Costs"])}`
                },
                {
                    "ProductType": "Total Implementation Charges",
                    "PricingStructure": "",
                    "Quantity": "",
                    "UnitPrice": "",
                    "TotalFee": `£${formatPrice(quote["Summary"]["Total Implementation Costs"])}`
                }
            ]
        })

        let htmlTables = jsonOutput.tables.map(table => {
            return  `<table> <tr> <td>${table.name}</td> </tr> </table>`
        })

        jsonOutput["htmlTables"] = htmlTables
        
        const p = {
            deal: DealId,
            quote_id: ExistingQuote.id,
            name: "Test",
            selected_values: JSON.stringify(selectedValues),
            submitted: 1,
            line_items: quote["Line Item Mapping"],
            jsonOutput: jsonOutput
        }

        console.log({jsonOutput})

        enqueueUpdate(p)
        .then(result => { return pushQuoteToContract(p) })
        .then(result => { return setLineItems(p) })
        .then(result => {
            setQuoteSubmitting(prev => false)
            setQuoteSubmitted(prev => true)
            return true
        })
        .catch(console.warn)
    }

    useEffect(_ => {
        const pHeadcount = quote?.Summary?.PayrollHeadcount ?? 0
        const pCount = quote?.Summary?.PayrollCount ?? 0
        const passedHeadcountThreshold = pHeadcount >= 2000
        const passedPayrollThreshold = pCount >= 8
        setManagerApproval(prev => passedHeadcountThreshold || passedPayrollThreshold)
    }, [managerApproval, quote, isManager])

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
                                selectedValues={selectedValues}
                                handler={handler}
                                planHandler={planHandler}
                                productBasedValidationRules={productBasedValidationRules}
                                dispatch={dispatch}
                            />
                            <Divider />
                        </React.Fragment>
                    ))}

                    <QuoteSummaryComponent
                        quote={quote}
                        productTypeAccordions={productTypeAccordions}
                    />

                    { !!managerApproval && (
                        <Alert title="Manage Approval Required" variant={!!isManager ? "info" : "warning"}>
                            Manager approval is required for this quote. This quote can only be submitted by managers.
                        </Alert>
                    )}

                    <Flex justify="end">
                        <Button onClick={() => progressToImplementation()}>
                            { RequiresPSQFee ?  "Calculate Implementation Fees" : "Next: Quote Sheet" }
                        </Button>
                    </Flex>
                </>
            )}

            {/* Page 2: PSQ details */}
            {currentPage === 2 && (
                <>
                    <Heading>PSQ Details</Heading>

                    <QuoteSummaryComponent
                        quote={quote}
                        productTypeAccordions={productTypeAccordions}
                        suppressImplementationFee = {false}
                    />

                    <PSQTables
                        quote = {quote}
                        psqAccordions = {psqAccordions}
                        PSQImplementationCustomHours = {PSQImplementationCustomHours}
                        PSQHandler = {PSQHandler}
                    />

                    <QuoteSummaryComponent
                        quote={quote}
                        productTypeAccordions={productTypeAccordions}
                        suppressImplementationFee = {false}
                    />
                    
                    { !!managerApproval && (
                        <Alert title="Manage Approval Required" variant={!!isManager ? "info" : "warning"}>
                            Manager approval is required for this quote. This quote can only be submitted by managers.
                        </Alert>
                    )}

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

                    <QuoteSummaryComponent
                        quote={quote}
                        productTypeAccordions={productTypeAccordions}
                        suppressImplementationFee = {false}
                        suppressQuoteFees = {false}
                    />

                    <QuoteSheet
                        quote={quote}
                        selectedValues={selectedValues}
                        planIdsByType={planIdsByType}
                        productTypeAccordions={productTypeAccordions}
                        quoteDiscountValues={quoteDiscountValues}
                        QuoteDiscountValueHandler={QuoteDiscountValueHandler}
                        quoteCustomRatesHandler={quoteCustomRatesHandler}
                        disableEdit = {QuoteSubmitting || QuoteSubmitted}
                        isManager = {isManager}
                    />

                    <QuoteSummaryComponent
                        quote={quote}
                        productTypeAccordions={productTypeAccordions}
                        suppressImplementationFee = {false}
                        suppressQuoteFees = {false}
                        supressKeyDetails = {true}
                    />
                    
                    { !!managerApproval && (
                        <Alert title="Manage Approval Required" variant={!!isManager ? "info" : "danger"}>
                            Manager approval is required for this quote. This quote can only be submitted by managers.
                        </Alert>
                    )}

                    <Flex justify="end" gap="small">
                        <Button
                            variant="destructive"
                            onClick={() => {
                                resetForm(plansById, productTypeAccordions, valueTables)
                                setCurrentPage(1)
                            }}
                            disabled={QuoteSubmitting || QuoteSubmitted}
                        >
                            Reset Form
                        </Button>
                        <Button variant="secondary" onClick={() => setCurrentPage(1)} disabled={QuoteSubmitting || QuoteSubmitted}>
                            Review Schedule
                        </Button>
                        {RequiresPSQFee && (
                            <Button variant="secondary" onClick={() => setCurrentPage(2)} disabled={QuoteSubmitting || QuoteSubmitted}>
                                Review Implementation Fee
                            </Button>
                        )}
                        <Button variant="primary" onClick={() => submitQuote(DealId, ExistingQuote, selectedValues, quote, productTypeAccordions, dealCompanies, dealProps)} disabled={!isManager && (!!managerApproval || QuoteSubmitting || QuoteSubmitted)}>
                            { QuoteSubmitted ? "Quote Submitted" : QuoteSubmitting ? "Submitting Quote" : "Submit Quote" }
                        </Button>
                    </Flex>
                </>
            )}
        </Flex>
    );
};

export default Extension;