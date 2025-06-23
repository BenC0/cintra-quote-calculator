# Bugs

## User Interface Bugs
### High Priority
1. Standard Implementation Fee breaks Quote Sheet
2. Editing pre-existing plan has no Staging, it's live editing.
3. Custom Products aren't tested/used/accounted for.
### Low Priority
1. Quote Sheet Summary Tables are inconsistently aligned due to mixed use of Accordions. 
2. Clone no longer works
3. There are a bunch of conditional scenarios, for example, when a user has selected CintraHR, they need to remove Holiday & Absence, and Time Sheets from the Payrolls.

## Calculation Bugs
### High Priority
1. Capture Expense Pricing - One Time Fee, value equals 12% of Estimated Monthly Charges, can be toggled on/off.
### Low Priority
1. Qty value used for calcing quote is wrong, uses total headcount across all plans in payroll, producing weird values.
2. Quote seems to return slightly different figures when selecting weekly payroll options. I suspect this is related to decimal places / floating point precision.

## PSQ Bugs
### High Priority
1. Convert to using fixed hour rate instead of calculating based on day rate
2. PSQ CintraHR - Fixed Price
3. PSQ - Cintra Cloud Training - Provided spreadsheet has fixed values.
### Low Priority
1. Sector - What if private and public?