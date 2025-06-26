export const get_price_band = (qtyVal, fieldValue, price_table) => {
    let output = {
        price: 0,
        monthly_standing_charge: 0,
        band_price_is_percent: false,
        isFallback: true,
    }
    if (!!fieldValue) {
        if (price_table.length > 0) {
            let price_bands = []
            if (price_table.some(band => !!band.product_value)) {
                price_bands = price_table.filter(band => (band.minimum_quantity <= qtyVal) && (band.product_value == fieldValue))
            } else {
                price_bands = price_table.filter(band => (band.minimum_quantity <= qtyVal))
            }
            if (price_bands.length > 0) {
                price_bands = price_bands.sort((a, b) => a.minimum_quantity - b.minimum_quantity)
                output = price_bands[price_bands.length - 1]
            }
        }
    }
    return output
}

export const checkPSQRequirements = (selectedValues, productDefs, productTypeAccordions, planIdsByType) => {
    let validPayrolls = planIdsByType["Payroll"]
    if (!!validPayrolls) {
        validPayrolls = validPayrolls.filter(a => a != "temp")
    } else {
        validPayrolls = []
    }
    
    let total_headcount = 0
    let services = 0
    let payrolls = validPayrolls.length
    let psq_services = 0

    validPayrolls.forEach(payroll => {
        let selectedPayrollValues = selectedValues[payroll]
        total_headcount += selectedPayrollValues.quantity_value
        for (let serviceKey in selectedPayrollValues) {
            let releventProduct = productDefs.find(p => p.field == serviceKey)
            if (!!releventProduct) {
                if (releventProduct.requires_psq && !!selectedPayrollValues[serviceKey]) {
                    psq_services += 1
                }
                if (!!selectedPayrollValues[serviceKey]) {
                    services += 1
                }
            }
        }
    })

    let multiple_service_quote = services > payrolls
    let professional_service_quote_flagged = psq_services > 0
    let min_headcount_for_psq = total_headcount > 200
    const PSQRequired = multiple_service_quote
        || professional_service_quote_flagged
        || min_headcount_for_psq
        
    return PSQRequired
}

export const CalculateQuote = ({
    planIdsByType = {},
    selectedValues = {},
    productPriceDefs = [],
    productTypeDefs = [],
    RequiresPSQFee = false,
    StandardImplementationDefs = {},
    productDefs = [],
    productTypeAccordions = [],
    psqAccordions= [],
    psqImpHours = [],
    psqImpConfig = [],
    PSQImplementationCustomHours = {},
    quoteDiscountValues = {},
}) => {
    const Quote = {
        "Details": {},
        "Implementation Fees": {},
        "Summary": {},
    }

    const conditions = [
        Object.keys(planIdsByType),
        Object.keys(StandardImplementationDefs),
        Object.keys(selectedValues),
        productTypeDefs,
        productPriceDefs,
        productDefs,
        productTypeAccordions,
    ]
    if (conditions.some(a => a.length == 0)) return;
    
    const PayrollDetails = productTypeAccordions.find(a => a.is_payroll_product_type)
    const payrollDetailsPlanIDs = planIdsByType[PayrollDetails.label]

    const QuoteDetails = productTypeAccordions.find(a => a.is_quote_details_type)
    const quoteDetailsPlanID = planIdsByType[QuoteDetails.label]
    const quoteDetailsValues = selectedValues[quoteDetailsPlanID]

    const ContractLengthField = productDefs.find(product => !!product.is_contract_length_field)
    const EducationClientField = productDefs.find(product => !!product.is_education_client_field)
    const PublicSectorClientField = productDefs.find(product => !!product.is_public_sector_client_field)
    
    const ContractLengthFieldID = ContractLengthField.field
    const EducationClientFieldID = EducationClientField.field
    const PublicSectorClientFieldID = PublicSectorClientField.field

    if ([
        ContractLengthFieldID,
        EducationClientFieldID,
        PublicSectorClientFieldID,
    ].some(a => !!!a)) {
        return Quote
    }
    
    const ContractLengthValue = quoteDetailsValues[ContractLengthFieldID]
    const ContractLengthValuesRef = QuoteDetails.fields.find(a => a.field == ContractLengthFieldID).values
    const SelectedContractLengthValues = ContractLengthValuesRef?.find(a => a.values.value == ContractLengthValue) ?? null
    const SelectedContractLengthDiscount = !!SelectedContractLengthValues ? SelectedContractLengthValues.values.discount : 1

    const isEducationClientValue = quoteDetailsValues[EducationClientFieldID]
    const isPublicSectorClientValue = quoteDetailsValues[PublicSectorClientFieldID]

    let estimated_monthly_fee = 0
    let estimated_annual_fee = 0
    let estimated_implementation_fee = 0

    const EducationModifier = isEducationClientValue ? 1.1: 1
    const PublicSectorModifier = isPublicSectorClientValue ? 1.15 : 1

    Quote["Summary"]["ContractLength"] = ContractLengthValue
    Quote["Summary"]["EducationClient"] = isEducationClientValue
    Quote["Summary"]["PublicSectorClient"] = isPublicSectorClientValue
    Quote["Summary"]["PayrollHeadcount"] = 0


    for (let planType in planIdsByType) {
        let estimated_plan_monthly_fee = 0
        let estimated_plan_annual_fee = 0
        let relevantProductTypes = productTypeDefs.filter(ptd => ptd.label == planType)
        if (relevantProductTypes.length > 0) {
            let quantity_field_label = relevantProductTypes[0].quantity_field_label
            let quantity_field_type = relevantProductTypes[0].quantity_field_type
            let frequencyFieldDef = relevantProductTypes[0].frequencyFieldDef
            let frequency_values_table = frequencyFieldDef.values || []
            frequency_values_table = frequency_values_table.map(freq => freq.values)

            if (!!quantity_field_type) {
                quantity_field_type = quantity_field_type.name
            }
            Quote["Details"][planType] = planIdsByType[planType].map(planId => {
                if (planId == "temp") return;
                let selectedPlanValues = selectedValues[planId] ?? {}
                if (planType == PayrollDetails.label) {
                    Quote["Summary"]["PayrollHeadcount"] += selectedPlanValues.quantity_value
                }
                
                if (Object.keys(selectedPlanValues).length > 0) {
                    let payroll_payslips_modifier = 1
                    let payroll_payslips_discount = 1
                    if (frequency_values_table.length > 0) {
                        let selectedFrequencyValue = frequency_values_table.find(a => a.value == selectedPlanValues.frequency_value)
                        if (!!selectedFrequencyValue) {
                            payroll_payslips_modifier = selectedFrequencyValue.payslips
                            payroll_payslips_discount = selectedFrequencyValue.discount
                        }
                    }

                    const selectedPlanQuote = {
                        planId,
                        quantity_field_label: quantity_field_label,
                        quantity_field_type: quantity_field_type,
                        fields: []
                    }

                    for (let fieldKey in selectedPlanValues) {
                        let fieldValue = selectedPlanValues[fieldKey]
                        let field = productDefs.find(a => a.field == fieldKey)
                        if (!!fieldValue && !!field) {
                            let output = {...field}
                            let discount = quoteDiscountValues[field.field]
                            output["discount"] = 0
                            if (!!discount) output["discount"] = discount
                            let qty = selectedPlanValues.quantity_value

                            if (!!!qty || qty < 1) {
                                qty = 1
                            }
                            
                            qty = qty * payroll_payslips_modifier

                            output["price_table"] = productPriceDefs.filter(priceDef => priceDef.product_field == field.field)
                            output["price_band"] = get_price_band(qty, fieldValue, output["price_table"])
                            if (field.pricing_structure.name == "Minimum Active Users") {
                                qty = output["price_band"]["minimum_quantity"]
                            }

                            let useBundlePrice = false

                            if (!!output["price_band"]["bundle_price"]) {
                                let bundleAccordion = productTypeAccordions.find(a => a.label == planType)
                                if (!!bundleAccordion) {
                                    let bundleRequiredFields = bundleAccordion.fields
                                    let fieldValues = bundleRequiredFields.map(field => !!selectedPlanValues[field.field])
                                    useBundlePrice = fieldValues.every(a => !!a)
                                }
                            }
                                
                            if (useBundlePrice) {
                                output["price"] = output["price_band"]["bundle_price"]
                            } else {
                                output["price"] = output["price_band"]["price"]
                            }
                            
                            output["adjusted_price"] = output["price"] * payroll_payslips_discount * EducationModifier * PublicSectorModifier * SelectedContractLengthDiscount

                            output["qty"] = qty
                            output["payroll_payslips_discount"] = payroll_payslips_discount
                            output["EducationModifier"] = EducationModifier
                            output["PublicSectorModifier"] = PublicSectorModifier
                            output["SelectedContractLengthDiscount"] = SelectedContractLengthDiscount
                            
                            output["monthly_standing_charge"] = output["price_band"]["monthly_standing_charge"] ?? 0

                            output["estimated_monthly_fee"] = ((output["adjusted_price"] * output["qty"]) + output["monthly_standing_charge"])

                            if (output["discount"] > 0) {
                                output["estimated_monthly_fee"] -= output["estimated_monthly_fee"] * (output["discount"] / 100)
                            }
                            // TODO: How best to display monthly standing charge?
                            // output["adjusted_price"] += output["monthly_standing_charge"]
                            output["estimated_annual_fee"] = (output["estimated_monthly_fee"] * 12)
                            selectedPlanQuote["fields"] = [...selectedPlanQuote["fields"], output]
                        }
                    }
                    let fieldsWithPctPrice = selectedPlanQuote.fields.filter(field => !!field.price_band.band_price_is_percent)
                    if (fieldsWithPctPrice.length > 0) {
                        let nonPctFields = selectedPlanQuote.fields.filter(field => !field.price_band.band_price_is_percent)
                        let nonPctFieldsEstimatedMonthlyFee = nonPctFields.reduce((a, b) => a + b["estimated_monthly_fee"], 0)                        
                        selectedPlanQuote.fields = selectedPlanQuote.fields.map(field => {
                            let matchingField = fieldsWithPctPrice.find(pctField => field.field == pctField.field)
                            if (!!matchingField) {
                                let pct = field.price / 100
                                let estimated_monthly_fee = nonPctFieldsEstimatedMonthlyFee * pct
                                return {
                                    ...field,
                                    adjusted_price: estimated_monthly_fee / field.qty,
                                    estimated_monthly_fee,
                                    estimated_annual_fee: estimated_monthly_fee * 12
                                } 
                            }
                            return field
                        })
                    }

                    selectedPlanQuote["estimated_monthly_fee"] = selectedPlanQuote.fields.reduce((a, b) => a + b["estimated_monthly_fee"], 0)
                    selectedPlanQuote["estimated_annual_fee"] = (selectedPlanQuote["estimated_monthly_fee"] * 12)
                    estimated_plan_monthly_fee += selectedPlanQuote["estimated_monthly_fee"]
                    estimated_plan_annual_fee += selectedPlanQuote["estimated_annual_fee"]
                    return selectedPlanQuote
                }
                return false
            })
            estimated_monthly_fee += estimated_plan_monthly_fee
            estimated_annual_fee += estimated_plan_annual_fee
        }
    }

    if (!RequiresPSQFee) {
        const containsStringOrBool = arr => arr.some(item => typeof item === 'string');
        let productTypeImplementationFees = {}

        productTypeDefs.forEach(productType => {
            let total_headcount = 0
            let ptLabel = productType.label
            let totalImplementationDays = 0
            let totalImplementationFee = 0
            let relevantPlans = planIdsByType[ptLabel] || []
            relevantPlans = relevantPlans.filter(a => a != "temp")
            let relevantSelectedValues = relevantPlans.map(plan => selectedValues[plan])
            let services = {}

            if (relevantSelectedValues.length > 0) {
                total_headcount += relevantSelectedValues.reduce((t, a) => {
                    let q = a.quantity_value
                    if (!!!q) {
                        for (let key in a) {
                            if (!!a[key]) q = 1
                        }
                    }
                    if (!!!q) {
                        q = 0
                    }
                    return t + q
                }, 0)
                let pd = [...productDefs, productType.quantityFieldDef, productType.frequencyFieldDef]
                relevantSelectedValues.forEach(plan => {
                    for (let fieldKey in plan) {
                        if ( !fieldKey.match(/(quantity|frequency)_value$/g) && !!plan[fieldKey]) {
                            let fieldValue = plan[fieldKey]
                            let field = pd.find(a => a.field == fieldKey)
                            let val = Number(fieldValue)
                            if (isNaN(val)) {
                                val = 1
                            }
                            val = Math.min(val, 1)
                            if (!!services[fieldKey]) {
                                services[fieldKey]["plans"] += val
                                services[fieldKey]["values"].push(fieldValue)
                            } else {
                                services[fieldKey] = {
                                    "plans": val,
                                    "label": field.label,
                                    "values": [fieldValue]
                                }
                            }
                        }
                    }
                })
            }

            for (let serviceLabel in services) {
                let service = services[serviceLabel]
                services[serviceLabel]["Implementation Fee"] = 0
                services[serviceLabel]["Implementation Days"] = 0
                services[serviceLabel]["field"] = `implementation_${serviceLabel}`
                services[serviceLabel]["discount"] = 0
                let qdv = quoteDiscountValues[services[serviceLabel]["field"]]
                if (!!qdv) services[serviceLabel]["discount"] = qdv

                if (productType.standard_implementation_calculation_type == "default") {
                    if (service.plans != 0) {
                        let lookupValue = service["values"][0]
                        let mod = service.plans > 1 ? 1.05 : 1
                        let days = 0
                        let daysRef = StandardImplementationDefs["days"].filter(dayRef => {
                            if (!!dayRef.product_value) {
                                return (dayRef.product_id == serviceLabel)
                                    && (dayRef.minimum_quantity <= total_headcount)
                                    && (lookupValue == dayRef.product_value)
                            } else {
                                return (dayRef.product_id == serviceLabel)
                                    && (dayRef.minimum_quantity <= total_headcount)
                            }
                        })
                        daysRef = daysRef.sort((a, b) => a.minimum_quantity - b.minimum_quantity)
                        if (daysRef.length > 0) {
                            daysRef = daysRef[daysRef.length - 1]
                            if (!!daysRef.days) {
                                days = daysRef.days
                            }
                        }
                        services[serviceLabel]["Implementation Days"] = days * mod
                        let ratesRef = StandardImplementationDefs["rates"].filter(rateRef => {
                            // 1. Does the rate have a product ID and does it match the serviceLabel?
                            if (!!rateRef.product_id && rateRef.product_id === serviceLabel) {
                                // 2. Does the rate have a product value?
                                if (!!rateRef.product_value) {
                                    return rateRef.minimum_quantity <= total_headcount
                                        && serviceLabel == rateRef.product_id
                                        && lookupValue == rateRef.product_value
                                } else {
                                    return rateRef.minimum_quantity <= total_headcount
                                        && serviceLabel == rateRef.product_id
                                }
                            } else {
                                return rateRef.minimum_quantity <= total_headcount
                                    && !!!rateRef.product_id
                            }
                        })
                        const ratesRefContainsIDRef = ratesRef.some(ref => !!ref.product_id)
                        if (ratesRefContainsIDRef) {
                            ratesRef = ratesRef.filter(rateRef => {
                                return !!rateRef.product_value
                            })
                        }
                        ratesRef = ratesRef.sort((a, b) => a.minimum_quantity - b.minimum_quantity)
                        if (ratesRef.length > 0) {
                            ratesRef = ratesRef[ratesRef.length - 1]
                            if (!!ratesRef.fixed_price && services[serviceLabel]["Implementation Days"] > 0) {
                                services[serviceLabel]["Implementation Fee"] = ratesRef.price
                            } else {
                                services[serviceLabel]["Implementation Fee"] = ratesRef.price * services[serviceLabel]["Implementation Days"]
                            }
                        }
                    }
                } else if (
                    productType.standard_implementation_calculation_type == "first_month_fee"
                    && !!productType.standard_implementation_calculation_product
                ) {
                    let relevantFees = Quote["Details"][ptLabel]
                    if (!!relevantFees) {
                        relevantFees = relevantFees.filter(a => !!a)
                    }
                    if (!!relevantFees && relevantFees.length > 0) {
                        let fee = 0
                        relevantFees.forEach(relevantFee => {
                            let rs = relevantFee.fields.filter(field => ((field.field == productType.standard_implementation_calculation_product) && (field.field == serviceLabel)))
                            if (rs.length > 0) {
                                fee += rs[0].estimated_monthly_fee
                            }
                        })
                        services[serviceLabel]["Implementation Fee"] = fee
                        services[serviceLabel]["Implementation Days"] = 1
                    }
                }

                if (services[serviceLabel]["discount"] > 0) {
                    services[serviceLabel]["Implementation Fee"] -= services[serviceLabel]["Implementation Fee"] * (services[serviceLabel]["discount"] / 100)
                }

                totalImplementationDays += services[serviceLabel]["Implementation Days"]
                totalImplementationFee += services[serviceLabel]["Implementation Fee"]
            }

            if (Object.keys(services).length > 0 && totalImplementationDays > 0) {
                productTypeImplementationFees[ptLabel] = {
                    total_headcount,
                    services,
                    totalImplementationFee,
                    totalImplementationDays,
                }
                estimated_implementation_fee += totalImplementationFee
            }
        })

        Quote["Implementation Fees"] = productTypeImplementationFees
    } else if (RequiresPSQFee) {

        let validPlanIdsByType = {}
        for (let key in planIdsByType) {
            validPlanIdsByType[key] = planIdsByType[key].filter(a => a != "temp")
        }

        let validPayrolls = validPlanIdsByType["Payroll"]
        let validCintraHR = validPlanIdsByType["CintraHR"] || []
        validCintraHR = validCintraHR.pop()
        let cintraHRValue = !!validCintraHR ? selectedValues[validCintraHR] : {quantity_value: 0}

        let psqConfig = {
            CustomHours: PSQImplementationCustomHours,
        }
        psqConfig["Headcount"] = Quote["Summary"]["PayrollHeadcount"]
        psqConfig["Payrolls"] = validPayrolls.length
        psqConfig["Cintra Payroll Product"] = null

        psqImpConfig.forEach(c => {
            psqConfig[c.id] = null
            let productValue = c.product_value
            let productReferences = c.product_references

            productReferences.forEach(fieldKey => {
                for (let planKey in selectedValues) {
                    if (!!!psqConfig[c.id]) {
                        let condition = false
                        if (!!productValue) {
                            condition = !!selectedValues[planKey][fieldKey] && selectedValues[planKey][fieldKey] === productValue
                        } else {
                            condition = !!selectedValues[planKey][fieldKey]
                        }
                        if (condition) {
                            psqConfig[c.id] = selectedValues[planKey][fieldKey]
                        } else {
                            psqConfig[c.id] = false
                        }
                    }
                }
            })
        })

        // // Value used in product hours calculation for most PSQ Tasks, but not all
        psqConfig["Sector"] = {
            public: !!quoteDetailsValues[PublicSectorClientFieldID],
            education: !!quoteDetailsValues[EducationClientFieldID],
        }
        
        // validPayrolls.forEach(payroll => {
        //     let selectedPayrollValues = selectedValues[payroll]
        //     if (selectedPayrollValues["241706082523"] == "source" || psqConfig["Cintra Payroll Product"] == "source") {
        //         psqConfig["Cintra Payroll Product"] = "source"
        //     } else {
        //         psqConfig["Cintra Payroll Product"] = selectedPayrollValues["241706082523"]
        //     }
        // })
        
        Quote["Implementation Fees"]["PSQ Config"] = psqConfig

        psqAccordions.forEach(psqAccord => {
            Quote["Implementation Fees"][psqAccord.field] = {
                title: psqAccord.label,
                fields: psqAccord.fields.map(field => {
                    let hoursBand = {hours: 0}
                    let psqFee = 0
                    let discount = 0
                    if (!!quoteDiscountValues[field.field]) discount = quoteDiscountValues[field.field]
                    let associatedConfigValue = null 
                    field.psq_config_reference.forEach(configField => {
                        if (!!psqConfig[configField]) {
                            associatedConfigValue = psqConfig[configField]
                        }
                    })
                    if (!!associatedConfigValue) {
                        hoursBand = psqImpHours.filter(h => {
                            if (!!h.product_value) {
                                return h.minimum_quantity <= psqConfig["Headcount"] 
                                    && h.psq_product_id.indexOf(field.field) > -1
                                    && h.product_value == associatedConfigValue
                            } else {
                                return h.minimum_quantity <= psqConfig["Headcount"] 
                                    && h.psq_product_id.indexOf(field.field) > -1
                            }
                        })
                        if (hoursBand.length > 0) {
                            hoursBand = hoursBand.sort((a, b) => a.minimum_quantity - b.minimum_quantity)
                            hoursBand = hoursBand.pop()
                        }
                    }
                    if (!!psqConfig["CustomHours"][field.field] || psqConfig["CustomHours"][field.field] === 0) {
                        hoursBand = {
                            hours: psqConfig["CustomHours"][field.field]
                        }
                    }
                    
                    if (!!hoursBand.hours && !isNaN(hoursBand.hours)) {
                        psqFee = hoursBand.hours * (field.resource.hourly_rate || 0)
                    }

                    if (discount > 0) {
                        psqFee -= psqFee * (discount / 100)
                    }

                    if (isNaN(psqFee)) console.error({
                        event: "PSQ Fee is NaN",
                        hours: hoursBand.hours,
                        hourly_rate: (field.resource.hourly_rate || 0),
                    })
                    
                    estimated_implementation_fee += psqFee
                    return {
                        ...field,
                        associatedConfigValue,
                        hoursBand,
                        discount,
                        psqFee,
                    }
                }),
            }
        })
    }

    Quote["Implementation Fees"]["Implementation Type"] = !!RequiresPSQFee ? "PSQ" : "Standard" 
    Quote["Summary"]["Total Implementation Costs"] = estimated_implementation_fee
    Quote["Summary"]["Total Estimated Monthly Costs"] = estimated_monthly_fee
    Quote["Summary"]["Total Estimated Annual Costs"] = estimated_annual_fee
    Quote["Summary"]["Total Y1 Charges"] = estimated_implementation_fee + estimated_annual_fee
    
    return Quote
}