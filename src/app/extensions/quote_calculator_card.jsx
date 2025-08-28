// 3rd party libraries/modules
import React, { useState, useEffect, useReducer, useRef, useCallback } from "react";
import { Divider, Button, hubspot, Flex, Heading, Alert } from "@hubspot/ui-extensions";
// Misc. utility functions
import { isEmptyArray } from "./components/Utils/isEmptyArray";
import { resetForm } from "./components/Utils/resetForm";
// HubSpot related functions
import { getDealProps } from "./components/HubSpot/getDealProps";
import { useFetchDefs } from "./components/HubSpot/useFetchDefs";
import { useGetQuotes } from "./components/HubSpot/useGetQuotes";
import { getCompanies } from "./components/HubSpot/getCompanies";
import { useCreateQuote } from "./components/HubSpot/useCreateQuote";
import { useUpdateQuote } from "./components/HubSpot/useUpdateQuote";
import { useDynamicFetchDefs } from "./components/HubSpot/useDynamicFetchDefs";
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
import { submitQuote } from "./components/Data/submitQuote";
import { checkManagerApprovalRequired } from "./components/Utils/checkManagerApprovalRequired";

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
    const [managerApprovalRequired, setManagerApprovalRequired] = useState(false);
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
    const [{
        plansById,
        planIdsByType,
        selectedValues,
        customPrices,
        customDiscounts,
        customPSQUnits,
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

    useEffect(() => {
        if (!!DealId && !ExistingQuote) {
            useGetQuotes(DealId)
            .then(rows => {
                if (!!rows && rows.length > 0) {
                    setExistingQuote(rows[0])
                } else {
                    useCreateQuote({deal: DealId, name: "Test"})
                    .then(rows => setExistingQuote(rows))
                }
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
    const PSQHandler = (planId, fieldID, value) => {
        dispatch({
            type: "UPDATE_CUSTOM_PSQ_UNIT",
            payload: {
                planId,
                fieldKey: fieldID,
                value: value,
            },
        });
    }
    const quoteDiscountValueHandler = (planId, fieldID, value) => {
        dispatch({
            type: "UPDATE_CUSTOM_DISCOUNT",
            payload: {
                planId,
                fieldKey: fieldID,
                value: value,
            },
        });
    }
    const quoteCustomRatesHandler = (planId, fieldID, value) => {
        dispatch({
            type: "UPDATE_CUSTOM_PRICE",
            payload: {
                planId,
                fieldKey: fieldID,
                value: value,
            },
        });
    }

    // ------------------------- Field Change Handlers -------------------------
    const fieldHandler = (field, value, planId) => {
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
                customPSQUnits: customPSQUnits,
                customDiscounts: customDiscounts,
                customPrices: customPrices,
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
            if ((debug && debugQuote) && !!result) console.log({ event: "Quote Calculated", result });
        }
    }, [planIdsByType, selectedValues, productPriceDefs, productTypeDefs, RequiresPSQFee, StandardImplementationDefs, productDefs, productTypeAccordions, psqAccordions, customPSQUnits, customDiscounts, customPrices, DealId, ExistingQuote]);

    const progressToImplementation = () => {
        if (RequiresPSQFee) {
            setCurrentPage(2)
        } else {
            setCurrentPage(3)
        }
    }

    // Initialise quote with stored values
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
            resetForm(dispatch, plansById, productTypeAccordions, valueTables)
            if (!!ExistingQuote && !!ExistingQuote.values.selected_values) {
                let preLoadedValues = null
                let cancel = false
                try {
                    if (!!ExistingQuote && !!ExistingQuote.values.selected_values) {
                        preLoadedValues = JSON.parse(ExistingQuote.values.selected_values)
                    }
                } catch (error) {
                    cancel = true
                }
                if (!preLoadedValues || cancel) {
                    return null;
                }
                for (let planKey in preLoadedValues) {
                    let products = preLoadedValues[planKey]
                    let dynamicProductKeys = Object.keys(products).filter(key => !key.match(/_value/g))
                    let productType = null
                    let productTypeMapping = []
                    dynamicProductKeys.forEach(productKey => {
                        productTypeMapping.push( productTypeAccordions.find(pt => !!pt.fields.find(field => field.field == productKey)) )
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

    useEffect(_ => {
        setManagerApprovalRequired(prev => checkManagerApprovalRequired(quote))
    }, [quote])

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
                                fieldHandler={fieldHandler}
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

                    { !!managerApprovalRequired && (
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
                        customPSQUnits = {customPSQUnits}
                        PSQHandler = {PSQHandler}
                    />

                    <QuoteSummaryComponent
                        quote={quote}
                        productTypeAccordions={productTypeAccordions}
                        suppressImplementationFee = {false}
                    />
                    
                    { !!managerApprovalRequired && (
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
                        customDiscounts={customDiscounts}
                        quoteDiscountValueHandler={quoteDiscountValueHandler}
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
                    
                    { !!managerApprovalRequired && (
                        <Alert title="Manage Approval Required" variant={!!isManager ? "info" : "danger"}>
                            Manager approval is required for this quote. This quote can only be submitted by managers.
                        </Alert>
                    )}

                    <Flex justify="end" gap="small">
                        <Button
                            variant="destructive"
                            onClick={() => {
                                resetForm(dispatch, plansById, productTypeAccordions, valueTables)
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
                        <Button variant="primary" onClick={() => {
                            setQuoteSubmitting(prev => true)
                            submitQuote(
                                enqueueUpdate,
                                DealId,
                                ExistingQuote,
                                selectedValues,
                                quote,
                                productTypeAccordions,
                                dealCompanies,
                                dealProps,
                                _ => {
                                    setQuoteSubmitting(prev => false)
                                    setQuoteSubmitted(prev => true)
                                }
                            )
                        }} disabled={!isManager && (!!managerApprovalRequired || QuoteSubmitting || QuoteSubmitted)}>
                            { QuoteSubmitted ? "Quote Submitted" : QuoteSubmitting ? "Submitting Quote" : "Submit Quote" }
                        </Button>
                    </Flex>
                </>
            )}
        </Flex>
    );
};

export default Extension;