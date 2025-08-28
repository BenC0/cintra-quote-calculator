import { formatPrice } from "../Format/formatPrice";
import { formatInt } from "../Format/formatInt";
import { toTitleCase } from "../Format/toTitleCase";

import { pushQuoteToContract } from "../HubSpot/pushQuoteToContract";
import { setLineItems } from "../HubSpot/setLineItems";

export const submitQuote = (enqueueUpdate, DealId, ExistingQuote, selectedValues, quote, productTypeAccordions, dealCompanies, dealProps, callback) => {
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
    .then(callback)
    .catch(console.warn)
}