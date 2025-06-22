# Bugs

## Calculation Bugs
1. Qty value used for calcing quote is wrong, uses total headcount across all plans in payroll, producing weird values.
2. Quote seems to return slightly different figures when selecting weekly payroll options. I suspect this is related to decimal places / floating point precision.
3. Capture Expense Pricing - One Time Fee, value equals 12% of Estimated Monthly Charges, can be toggled on/off.

## PSQ Bugs
1. Sector - What if private and public?
2. PSQ CintraHR - Fixed Price
3. PSQ - Cintra Cloud Training - Provided spreadsheet has fixed values.
4. Value differences due to formulas and rounding errors - can we get a non-forumala based list of exact values?

## User Interface Bugs
1. Add Product Type Panel - Qty value does not reset on adding a new plan, this leads to validation errors

## Questions for Shuck 
1. How best to handle discount with standing charge?
   1. Currently signposting with some text below estimated monthly fee, will convert to it's own row after discussion.

## General
1. There are a bunch of conditional scenarios, for example, when a user has selected CintraHR, they need to remove Holiday & Absence, and Time Sheets from the Payrolls.
2. Custom Products aren't tested/used/accounted for.