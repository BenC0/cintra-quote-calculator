import { renderToggle } from "./renderToggle"
import { renderDropDown } from "./renderDropDown"
import { renderNumber } from "./renderNumber"
import { renderTextInput } from "./renderTextInput"

export const renderField = (field, handler, planId, existingValue, supressLabel = false, max_value = null, activePlanLevelRules = []) => {
    const rulesExcludingCurrentField = activePlanLevelRules.filter(rule => !!rule.excluded_products.find(product => product.id == field.field))
    switch (field.input_type) {
        case "Toggle":
            return renderToggle(field, handler, planId, existingValue, supressLabel, rulesExcludingCurrentField)
        case "Number":
            return renderNumber(field, handler, planId, existingValue, supressLabel, max_value, rulesExcludingCurrentField)
        case "Radio":
            break;
        case "Dropdown":
            return renderDropDown(field, handler, planId, existingValue, supressLabel, rulesExcludingCurrentField)
        case "Text":
            return renderTextInput(field, handler, planId, existingValue, supressLabel, rulesExcludingCurrentField)
        default:
            return null;
    }
}