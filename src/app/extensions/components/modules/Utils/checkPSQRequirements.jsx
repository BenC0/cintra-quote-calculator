export const checkPSQRequirements = (selectedValues, productDefs, productTypeAccordions, planIdsByType) => {
    const PayrollDetails = productTypeAccordions.find(a => a.is_payroll_product_type)
    let validPayrolls = []
    if (!!PayrollDetails && !!planIdsByType[PayrollDetails.label]) {
        validPayrolls = planIdsByType[PayrollDetails.label].filter(a => a != "temp")
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