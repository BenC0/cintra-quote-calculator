export const get_price_band = (qtyVal, field, price_table) => {
    let output = {
        price: 0,
        monthly_standing_charge: 0
    }
    if (!!field.fieldValue) {
        if (price_table.length > 0) {
            let price_bands = []
            if (price_table.some(band => !!band.product_value)) {
                price_bands = price_table.filter(band => (band.minimum_quantity <= qtyVal) && (band.product_value == field.fieldValue))
            } else {
                price_bands = price_table.filter(band => (band.minimum_quantity <= qtyVal))
            }
            if (price_bands.length > 0) {
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
                if (releventProduct.requires_psq) {
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

    // Returning false during development until PSQ Implementation Fees funcitonality
    // is being developed.
    console.error(`PSQ Requirement Check: Returns "false" during this stage of development.`)
    return false
    return (
        multiple_service_quote
        || professional_service_quote_flagged
        || min_headcount_for_psq
    )
}

export const CalculateQuote = (
    planIdsByType,
    selectedValues,
    selectedPSQValues,
    productPriceDefs,
    productTypeDefs,
    psqTypeDefs,
    psqProductDefs,
    RequiresPSQFee,
    StandardImplementationDefs,
    productDefs,
    productTypeAccordions,
) => {
    const Quote = {
        "Details": {},
        "Implementation Fees": {},
        "Summary": {},
    }

    const ContractLengthFieldID = "241712266465"
    const EducationClientFieldID = "241731552473"
    const PublicSectorClientFieldID = "241712266460"
    const ContractLengthField = productDefs.find(product => product.field == ContractLengthFieldID)

    const conditions = [
        Object.keys(planIdsByType),
        Object.keys(StandardImplementationDefs),
        productTypeDefs,
        productPriceDefs,
        selectedValues,
        productDefs,
    ]
    if (conditions.some(a => a.length == 0)) return;

    
    const QuoteDetails = productTypeAccordions.find(a => a.is_quote_details_type)
    const quoteDetailsPlanID = planIdsByType[QuoteDetails.label]
    const quoteDetailsValues = selectedValues[quoteDetailsPlanID]
    
    const ContractLengthValue = quoteDetailsValues[ContractLengthFieldID]
    const ContractLengthValuesRef = QuoteDetails.fields.find(a => a.field == ContractLengthFieldID).values
    const SelectedContractLengthValues = ContractLengthValuesRef.find(a => a.values.value == ContractLengthValue)
    const SelectedContractLengthDiscount = !!SelectedContractLengthValues ? SelectedContractLengthValues.values.discount : 1

    const isEducationClientValue = quoteDetailsValues[EducationClientFieldID]
    const isPublicSectorClientValue = quoteDetailsValues[PublicSectorClientFieldID]

    let estimated_monthly_fee = 0
    let estimated_annual_fee = 0
    let estimated_implementation_fee = 0

    // console.log({
    //     event: "Calculating Quote",
    //     planIdsByType,
    //     selectedValues,
    //     selectedPSQValues,
    //     productPriceDefs,
    //     productTypeDefs,
    //     productDefs,
    //     psqTypeDefs,
    //     psqProductDefs,
    //     RequiresPSQFee,
    //     StandardImplementationDefs,
    // })

    const EducationModifier = isEducationClientValue ? 1.1: 1
    const PublicSectorModifier = isPublicSectorClientValue ? 1.15 : 1

    Quote["Details"]["Contract Config"] = {
        "Contract Length": ContractLengthValue,
        "Education Client": isEducationClientValue,
        "PublicSector Client": isPublicSectorClientValue,
    }

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
                
                if (Object.keys(selectedPlanValues).length > 0) {
                    let payroll_payslips_modifier = 1
                    let payroll_payslips_discount = 1
                    if (frequency_values_table.length > 0) {
                        let selectedFrequencyValue = frequency_values_table.find(a => a.value == selectedPlanValues.frequency_value)
                        if (!!selectedFrequencyValue) {
                            payroll_payslips_modifier = selectedFrequencyValue.payslips
                            payroll_payslips_discount = selectedFrequencyValue.discount
                        }
                        // console.log({
                        //     event: `Determining payslips modifier: ${planType}`,
                        //     selectedPlanValues,
                        //     frequency_values_table,
                        //     selectedFrequencyValue,
                        //     productTypeDefs,
                        //     payroll_payslips_modifier
                        // })
                    }

                    let selectedPlanQuote = {
                        quantity_field_label: quantity_field_label,
                        quantity_field_type: quantity_field_type,
                        fields: []
                    }

                    for (let fieldKey in selectedPlanValues) {
                        let fieldValue = selectedPlanValues[fieldKey]
                        let field = productDefs.find(a => a.field == fieldKey)
                        if (!!fieldValue && !!field) {
                            let output = field
                            let qty = selectedPlanValues.quantity_value

                            if (!!!qty || qty < 1) {
                                qty = 1
                            }
                            
                            if (typeof fieldValue == "boolean") {
                                qty = qty * payroll_payslips_modifier
                            }

                            output["fieldValue"] = fieldValue
                            output["price_table"] = productPriceDefs.filter(priceDef => priceDef.product_field == field.field)
                            output["price_band"] = get_price_band(qty, field, output["price_table"])
                            output["price"] = output["price_band"]["price"]
                            output["adjusted_price"] = output["price"] * payroll_payslips_discount * EducationModifier * PublicSectorModifier * SelectedContractLengthDiscount
                            output["monthly_standing_charge"] = output["price_band"]["monthly_standing_charge"] ?? 0
                            output["estimated_monthly_fee"] = (output["adjusted_price"] * qty) + output["monthly_standing_charge"]
                            output["estimated_annual_fee"] = (output["estimated_monthly_fee"] * 12)
                            selectedPlanQuote.fields.push(output)
                        }
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
                        if (!fieldKey.match(/(quantity|frequency)_value$/g)) {
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
                if (productType.standard_implementation_calculation_type == "default") {
                    if (service.plans != 0) {
                        let mod = service.plans > 1 ? 1.05 : 1
                        let days = 0
                        let daysRef = StandardImplementationDefs["days"].filter(dayRef => {
                            return (dayRef.product_id == serviceLabel)
                                && (dayRef.minimum_quantity <= total_headcount)
                        })
                        daysRef = daysRef.sort((a, b) => a.minimum_quantity - b.minimum_quantity)
                        if (daysRef.length > 0) {
                            daysRef = daysRef[daysRef.length - 1]
                            if (!!daysRef.days) {
                                days = daysRef.days
                            }
                        }
                        services[serviceLabel]["Implementation Days"] = days * mod
                        let lookupValue = null
                        if (containsStringOrBool(service["values"])) {
                            lookupValue = service["values"][0]
                        }
                        let ratesRef = StandardImplementationDefs["rates"].filter(rateRef => {
                            if (!!lookupValue) {
                                return !!rateRef.product_id
                                    && !!rateRef.product_value
                                    && lookupValue == rateRef.product_value
                                    && serviceLabel == rateRef.product_id
                            } else if (!!rateRef.product_id) {
                                return rateRef.minimum_quantity <= total_headcount
                                    && serviceLabel == rateRef.product_id
                            } else {
                                return rateRef.minimum_quantity <= total_headcount && !!!rateRef.product_id
                            }
                        })
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
                        console.log({relevantFees})
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
                totalImplementationDays += services[serviceLabel]["Implementation Days"]
                totalImplementationFee += services[serviceLabel]["Implementation Fee"]
            }

            productTypeImplementationFees[ptLabel] = {
                total_headcount,
                services,
                totalImplementationFee,
                totalImplementationDays,
            }

            estimated_implementation_fee += totalImplementationFee
        })

        Quote["Implementation Fees"] = productTypeImplementationFees
    }
    // if (RequiresPSQFee && relevantPsqTypes.length > 0) {
    //     Quote["Implementation Fees"][planType] = planIdsByType[planType].map(planId => {
    //         if (!!selectedPSQValues[planType]) {
    //             let selectedImplementationValues = selectedPSQValues[planType].filter(plan => plan.id == planId)
    //             if (selectedImplementationValues.length > 0) {
    //                 selectedImplementationValues = selectedImplementationValues[0]
    //                 selectedImplementationValues.fields = selectedImplementationValues.fields.map(field => {
    //                     let output = field
    //                     output["resource"] = psqProductDefs
    //                         .filter(p => p.field == output.field)
    //                         .map(field => field.resource)
    //                         .pop()
    //                     output["day_rate"] = output["resource"]?.day_rate ?? 0
    //                     output["hourly_rate"] = output["resource"]?.hourly_rate ?? 0
    //                     output["estimated_implementation_fee"] = output["hourly_rate"] * output["value"]
    //                     estimated_implementation_fee += output["estimated_implementation_fee"]
    //                     return output
    //                 })
    //                 return selectedImplementationValues
    //             }
    //         }
    //         return false
    //     }).pop()
    // } 

    Quote["Summary"] = {
        "Total Implementation Costs": estimated_implementation_fee,
        "Total Estimated Monthly Costs": estimated_monthly_fee,
        "Total Estimated Annual Costs": estimated_annual_fee,
        "Total Y1 Charges": estimated_implementation_fee + estimated_annual_fee,
    }
    return Quote
}