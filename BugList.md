# Bugs

## General
1. Qty value used for calcing quote is wrong, uses total headcount across all plans in payroll, producing weird values.
2. Quote seems to return slightly different figures when selecting weekly payroll options. I suspect this is related to decimal places / floating point precision.
3. Capture Expense Pricing - One Time Fee, value equals 12% of Estimated Monthly Charges, can be toggled on/off.
4. There are a bunch of conditional scenarios, for example, when a user has selected CintraHR, they need to remove Holiday & Absence, and Time Sheets from the Payrolls.

## Questions for Shuck 
1. How best to handle discount with standing charge?
   1. Currently signposting with some text below estimated monthly fee, will convert to it's own row after discussion.

## Add Product Type Panel
1. Qty value does not reset on adding a new plan, this leads to validation errors

## Inline plans
1. Preselection seems to cause some confusion when changing the selected value from the preselection.
2. Values aren't stored/repopulated on screen navigation

## Custom Products
1. WTF am I doing with these?

## PSQ
1. Cintra Cloud Training
   1. What dictates this? Provided spreadsheet has fixed values.
2. CintraHR Implementation - Fixed Price (Non-issue)
3. Sector - What if private and public?
   1. PSQ has private and public but prior we only have private and education?
4. Value differences due to formulas and rounding errors - can we get a non-forumala based list of exact values?