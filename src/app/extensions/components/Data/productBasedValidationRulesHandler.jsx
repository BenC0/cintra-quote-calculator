export const productBasedValidationRulesHandler = (productBasedValidationRulesDef, productDefs, selectedValues) => {
    const scopes = [...new Set(productBasedValidationRulesDef.map(r => r.scope))]

    let scopedRules = {}
    scopes.forEach(scope => {
        scopedRules[scope] = productBasedValidationRulesDef.filter(rule => rule.scope == scope)
        scopedRules[scope] = scopedRules[scope].map(rule => ({
            ...rule,
            productDef: productDefs.find(prod => prod.field == rule.product_id) || {label: "product"},
        }))
        scopedRules[scope] = scopedRules[scope].map(rule => ({
            ...rule,
            validationMessage: !!rule.product_value ? `${rule.productDef.label} is set to ${rule.product_value}` : `${rule.productDef.label} is added`
        }))
    })
    scopedRules.quote = scopedRules.quote.map(rule => {
        let isActive = false
        for (let plan in selectedValues) {
            if (!!selectedValues[plan]) {
                let planValues = selectedValues[plan]
                let condition = !!planValues[rule.product_id]
                if (!!rule.product_value) {
                    condition = condition && planValues[rule.product_id] == rule.product_value
                }
                if (condition) isActive = true
            }
        }
        return {
            ...rule,
            isActive
        }
    })
    return scopedRules
}