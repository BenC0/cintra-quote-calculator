# Bugs

## User Interface Bugs
### High Priority
1. Custom Products aren't tested/used/accounted for. 
### Low Priority
1. Clone occasionaly breaks.
2. Editing pre-existing plan has no Staging, it's live editing.
3. Preselecting default values for dropdowns not built in.
4. There are a bunch of conditional scenarios, for example, when a user has selected CintraHR, they need to remove Holiday & Absence, and Time Sheets from the Payrolls.

## Calculation Bugs
### High Priority
1. Capture Expense Pricing - One Time Fee, value equals 12% of Estimated Monthly Charges, can be toggled on/off.
2. Qty value used for calcing quote is wrong, uses total headcount across all plans in payroll, producing weird values.
3. Not fully accounting for Cintra Payroll Product in Implementation Fees (Standard, possibly PSQ as well)
### Low Priority
1. Quote seems to return slightly different figures when selecting weekly payroll options. I suspect this is related to decimal places / floating point precision.

## PSQ Bugs
### High Priority
1. PSQ CintraHR - Fixed Price, needs integrating
2. PSQ - Cintra Cloud Training - Provided spreadsheet has fixed values, needs integrating
3. Sector - Needs integrating
### Low Priority