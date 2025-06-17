# Bugs

## General
1. Monthly standing charge not displayed on quote sheet, how best to handle?
   1. Display as own row
2. Qty value used for calcing quote is wrong, uses total headcount across all plans in payroll, producing weird values.
3. Quote seems to return slightly different figures when selecting weekly payroll options. I suspect this is related to decimal places / floating point precision.
4. Capture Expense Pricing - One Time Fee, value equals 12% of Estimated Monthly Charges, can be toggled on/off.
5. PSQ and "Normal" Product Types cannot currently share a label (name) value.
6. There are a bunch of conditional scenarios, for example, when a user has selected CintraHR, they need to remove Holiday & Absence, and Time Sheets from the Payrolls.

## Add Product Type Panel
1. Qty value does not reset on adding a new plan, this leads to validation errors

## Inline plans
1. Preselection seems to cause some confusion when changing the selected value from the preselection.
2. Values aren't stored/repopulated on screen navigation

## Custom Products
1. WTF am I doing with these?