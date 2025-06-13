# Bugs

## General
1. ~~Plans shouldn't be added/updated until the button is clicked, so we need to refocus some of the current approach.~~
2. ~~Quotes are no longer calculating with new quoteReducer, needs integrating.~~
3. Quote Summary is no longer displaying anything.
4. Quote seems to return slightly different figures when selecting weekly payroll options.
   1. I suspect this is related to decimal places / floating point precision...
5. PSQ and "Normal" Product Types cannot currently share a label (name) value.

## Add Product Type Panel
1. Qty value does not reset on adding a new plan, this leads to validation errors
2. ~~HR Outsourcing causing a crash, cannot read props of undefined (reading 'fields')~~

## Inline plans
1. Preselection seems to cause some confusion when changing the selected value from the preselection.

## Custom Products
1. WTF am I doing with these?