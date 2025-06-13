# Bugs

## General
1. ~~Bundle Pricing not working - HR Outsourcing~~

2. Quote seems to return slightly different figures when selecting weekly payroll options. I suspect this is related to decimal places / floating point precision.

3. Capture Expense Pricing - One Time Fee, value equals 12% of Estimated Monthly Charges, can be toggled on/off.

4. Occasional error with `find()` on initialisation

5. PSQ and "Normal" Product Types cannot currently share a label (name) value.

6. Quote Summary is no longer displaying anything.

7. There are a bunch of conditional scenarios, for example, when a user has selected CintraHR, they need to remove Holiday & Absence, and Time Sheets from the Payrolls.


## Add Product Type Panel
1. Qty value does not reset on adding a new plan, this leads to validation errors

## Inline plans
1. Preselection seems to cause some confusion when changing the selected value from the preselection.

## Custom Products
1. WTF am I doing with these?