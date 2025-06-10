export const get_price_band = (selectedPlanValues, field, price_table) => {
    let output = {
        price: 0,
        monthly_standing_charge: 0
    }
    let qtyVal = selectedPlanValues.quantity_value ?? 1
    if (price_table.length > 0) {
        let price_bands = []
        if (price_table.some(band => !!band.product_value)) {
            price_bands = price_table.filter(band => (band.minimum_quantity <= qtyVal) && (band.product_value == field.value))
        } else {
            price_bands = price_table.filter(band => (band.minimum_quantity <= qtyVal))
        }
        if (price_bands.length > 0) {
            output = price_bands[price_bands.length - 1]
        }
    }
    return output
}

export const checkPSQRequirements = (selectedValues) => {
    return false
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
) => {
    const Quote = {
        "Details": {},
        "Implementation Fees": {},
        "Summary": {},
    }

    let estimated_monthly_fee = 0
    let estimated_annual_fee = 0
    let estimated_implementation_fee = 0
    for (let planType in planIdsByType) {
        let estimated_plan_monthly_fee = 0
        let estimated_plan_annual_fee = 0
        // Not implementation fee
        let relevantProductTypes = productTypeDefs.filter(ptd => ptd.label == planType)
        // is implementation fee
        let relevantPsqTypes = psqTypeDefs.filter(ptd => ptd.label == planType)
        if (relevantProductTypes.length > 0) {
            let quantity_field_label = relevantProductTypes[0].quantity_field_label
            let quantity_field_type = relevantProductTypes[0].quantity_field_type
            let quantity_frequency_values_table = relevantProductTypes[0].quantity_frequency_values_table
            if (!!quantity_field_type) {
                quantity_field_type = quantity_field_type.name
            }
            Quote["Details"][planType] = planIdsByType[planType].map(planId => {
                let selectedPlanValues = selectedValues[planType]?.filter(plan => plan.id == planId) ?? []
                if (selectedPlanValues.length > 0) {
                    selectedPlanValues = selectedPlanValues[0]
                    selectedPlanValues.quantity_field_label = quantity_field_label
                    selectedPlanValues.quantity_field_type = quantity_field_type
                    selectedPlanValues.quantity_frequency_values_table = quantity_frequency_values_table
                    selectedPlanValues.fields.map(field => {
                        let output = field
                        output["price_table"] = productPriceDefs.filter(priceDef => priceDef.product_field == field.field)
                        output["price_band"] = get_price_band(selectedPlanValues, field, output["price_table"])
                        output["price"] = output["price_band"]["price"]
                        output["monthly_standing_charge"] = output["price_band"]["monthly_standing_charge"] ?? 0
                        output["estimated_monthly_fee"] = (output["price"] * (selectedPlanValues.quantity_value ?? 0)) + output["monthly_standing_charge"]
                        output["estimated_annual_fee"] = (output["estimated_monthly_fee"] * 12)
                        return output
                    })
                    selectedPlanValues["estimated_monthly_fee"] = selectedPlanValues.fields.reduce((a, b) => a + b["estimated_monthly_fee"], 0)
                    selectedPlanValues["estimated_annual_fee"] = (selectedPlanValues["estimated_monthly_fee"] * 12)
                    estimated_plan_monthly_fee += selectedPlanValues["estimated_monthly_fee"]
                    estimated_plan_annual_fee += selectedPlanValues["estimated_annual_fee"]
                    return selectedPlanValues
                }
                return false
            })
            estimated_monthly_fee += estimated_plan_monthly_fee
            estimated_annual_fee += estimated_plan_annual_fee
            
        }
    }

    if (!RequiresPSQFee) {
        const containsString = arr => arr.some(item => typeof item === 'string');
        let productTypeImplementationFees = {}

        productTypeDefs.forEach(productType => {
            let total_headcount = 0
            let ptLabel = productType.label
            let totalImplementationDays = 0
            let totalImplementationFee = 0
            let relevantSelectedValues = selectedValues[ptLabel]

            let services = {}
            if (!!relevantSelectedValues) {
                total_headcount += relevantSelectedValues.reduce((t, a) => t + a.quantity_value, 0)
                relevantSelectedValues.forEach(plans => {
                    plans.fields.forEach(field => {
                        let val = Number(field.value)
                        if (isNaN(val)) {
                            val = 1
                        }
                        val = Math.min(val, 1)
                        if (!!services[field.field]) {
                            services[field.field]["plans"] += val
                            services[field.field]["values"].push(field.value)
                        } else {
                            services[field.field] = {
                                "plans": val,
                                "label": field.label,
                                "values": [field.value]
                            }
                        }
                    })
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
                        if (containsString(service["values"])) {
                            lookupValue = service["values"][0]
                        }
                        let ratesRef = StandardImplementationDefs["rates"].filter(rateRef => {
                            if (!!lookupValue) {
                                return !!rateRef.product_id
                                    && !!rateRef.product_value
                                    && lookupValue == rateRef.product_value
                                    && serviceLabel == rateRef.product_id
                            } else {
                                return rateRef.minimum_quantity < total_headcount
                            }
                        })
                        ratesRef = ratesRef.sort((a, b) => a.minimum_quantity - b.minimum_quantity)
                        if (ratesRef.length > 0) {
                            ratesRef = ratesRef[ratesRef.length - 1]
                            if (!!ratesRef.fixed_price) {
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
    }
    return Quote
}