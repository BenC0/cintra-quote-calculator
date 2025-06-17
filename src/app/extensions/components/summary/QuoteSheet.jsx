import {
    Accordion,
    Flex,
    Table,
    TableBody,
    TableCell,
    TableFooter,
    Button,
    Icon,
    TableHead,
    TableHeader,
    TableRow,
} from "@hubspot/ui-extensions"
import { renderTableSummaries } from "../shared/renderTableSummaries"
import { toTitleCase } from "../shared/utils"

export const QuoteSheet = ({
    quote = {},
    productTypeAccordions = {},
    selectedValues = {},
    planIdsByType = {},
}) => {
    const conditions = [
        Object.keys(quote).length > 0,
    ]

    const Output = []

    if (conditions.every(a => !!a)) {

        productTypeAccordions.forEach(productType => {
            if (!productType.is_quote_details_type) {
                let accordionDetails = {
                    "title": productType.label,
                    "plans": []
                }
                const productTypePlans = planIdsByType[productType.label]
                const productTypeQuoteReference = quote["Details"][productType.label]
                
                if (!!productTypePlans && !!productTypeQuoteReference) {
                    productTypePlans.forEach((plan, idx) => {
                        const planValues = selectedValues[plan]
                        const planQuote = productTypeQuoteReference.find(a => a.planId == plan)
                        let headcount = planValues["quantity_value"]
                        if (!!!headcount || headcount < 1) {
                            headcount = 1
                        }
                        if (typeof headcount != "number") {
                            headcount = planValues["quantity_value"]
                        }

                        let planDetails = {
                            heading: `${productType.label} ${idx + 1}: ${headcount} ${toTitleCase(planValues["frequency_value"])} ${toTitleCase(planQuote["quantity_field_label"])}`,
                            rows: [],
                            coreProductMonthlyFee: 0,
                            addonProductMonthlyFee: 0,
                        }

                        for (let productKey in planValues) {
                            const productValue = planValues[productKey]
                            const productReference = productType.fields.find(a => a.field == productKey)
                            const productQuoteReference = planQuote.fields.find(a => a.field == productKey)
                            if (!!productReference && !!productQuoteReference && !!productValue) {
                                const isCoreProduct = productReference.product_sub_type.name == "core"
                                let qty = productValue
                                if (!!!qty || qty < 1) {
                                    qty = 1
                                }
                                if (typeof productValue != "number") {
                                    qty = headcount
                                }
                                if (isCoreProduct) {
                                    planDetails["coreProductMonthlyFee"] += productQuoteReference.estimated_monthly_fee
                                } else {
                                    planDetails["addonProductMonthlyFee"] += productQuoteReference.estimated_monthly_fee
                                }
                                // console.warn({
                                //     qty,
                                //     productValue,
                                //     productReference,
                                //     productQuoteReference,
                                // })
                                planDetails["rows"].push({
                                    name: productReference.label,
                                    pricingStructure: productReference.pricing_structure.name,
                                    unitPrice: productQuoteReference.adjusted_price,
                                    quantity: qty,
                                    discount: productQuoteReference.discount,
                                    estimatedMonthlyFee: productQuoteReference.estimated_monthly_fee,
                                })
                            }
                        }
                        accordionDetails["plans"].push(planDetails)
                    })
                }

                // Accordion details collected, time to generate.
                Output.push( <Accordion title={accordionDetails.title} defaultOpen>
                    <Flex direction="column" gap="sm">
                        {accordionDetails["plans"].map(accordion => (
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableHeader>{accordion.heading}</TableHeader>
                                        <TableHeader></TableHeader>
                                        <TableHeader></TableHeader>
                                        <TableHeader></TableHeader>
                                        <TableHeader>
                                            <Flex gap="sm" justify="end">
                                                <Button variant="transparent" >
                                                    <Icon name="edit"/> Edit
                                                </Button>
                                            </Flex>
                                        </TableHeader>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {accordion.rows.map(row => (
                                        <TableRow>
                                            <TableCell>{row.name}</TableCell>
                                            <TableCell align="center">{row.quantity}</TableCell>
                                            <TableCell align="center">£{Math.round(row.unitPrice * 100) / 100}</TableCell>
                                            <TableCell align="center">{row.discount}%</TableCell>
                                            <TableCell align="right">£{Math.round(row.estimatedMonthlyFee * 100) / 100}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    {accordion.coreProductMonthlyFee > 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4}>Estimated Core Product Charges</TableCell>
                                            <TableCell align="right">£{Math.round(accordion.coreProductMonthlyFee * 100) / 100}</TableCell>
                                        </TableRow>
                                    ) : <></>}
                                    {accordion.addonProductMonthlyFee > 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4}>Estimated Addon Product Charges</TableCell>
                                            <TableCell align="right">£{Math.round(accordion.addonProductMonthlyFee * 100) / 100}</TableCell>
                                        </TableRow>
                                    ) : <></>}
                                </TableFooter>
                            </Table>
                        ))}
                    </Flex>
                </Accordion>)
                console.log({
                    event: "Processed Summary Accordion",
                    accordionDetails,
                })
            }
        })

        console.log({
            quote,
            productTypeAccordions,
            selectedValues,
            planIdsByType,
        })
    }

    return Output
}