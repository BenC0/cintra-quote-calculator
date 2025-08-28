export const checkManagerApprovalRequired = (quote) => {
    const pHeadcount = quote?.Summary?.PayrollHeadcount ?? 0
    const pCount = quote?.Summary?.PayrollCount ?? 0
    const passedHeadcountThreshold = pHeadcount >= 2000
    const passedPayrollThreshold = pCount >= 8
    return passedHeadcountThreshold || passedPayrollThreshold
}