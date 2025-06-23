import React, { useState } from "react";
import {
    Accordion,
    Flex,
    Table,
    TableBody,
    TableCell,
    TableFooter,
    Text,
    Button,
    Icon,
    TableHead,
    TableHeader,
    TableRow,
} from "@hubspot/ui-extensions"
import { renderTableSummaries } from "../shared/renderTableSummaries"
import { formatInt, formatPrice, toTitleCase } from "../shared/utils"
import { renderField } from "../shared/Inputs";

export const QuoteSheet = ({
    quote = {},
    productTypeAccordions = {},
    selectedValues = {},
    planIdsByType = {},
    QuoteDiscountValueHandler = {},
}) => {
    const conditions = [
        Object.keys(quote).length > 0,
    ]

    const Output = []
    const [discountEditing, setDiscountEditing] = useState({})
    const discountHandler = (id, value, action="add") => {
        if (action == "add") {
            setDiscountEditing(prev => ({
                ...prev,
                [id]: value
            }));
        } else if (action == "remove") {
            setDiscountEditing(prev => ({
                ...prev,
                [id]: null
            }));
        }
    }

    if (conditions.every(a => !!a)) {
        productTypeAccordions.forEach(productType => {
            if (!productType.is_quote_details_type) {
                let accordionDetails = {
                    "title": productType.label,
                    "plans": []
                }
                const productTypePlans = planIdsByType[productType.label]
                const productTypeQuoteReference = quote["Details"][productType.label]
                if (!!!productTypePlans || productTypePlans.length == 0) return null;
                
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

                                planDetails["rows"].push({
                                    field: productReference.field,
                                    name: productReference.label,
                                    pricingStructure: productReference.pricing_structure.name,
                                    unitPrice: productQuoteReference.adjusted_price,
                                    quantity: qty,
                                    input_type: "Number",
                                    discount: productQuoteReference.discount,
                                    estimatedMonthlyFee: productQuoteReference.estimated_monthly_fee,
                                    monthlyStandingCharge: productQuoteReference["monthly_standing_charge"],
                                    containsMonthlyStandingCharge: !!productQuoteReference["monthly_standing_charge"] && productQuoteReference["monthly_standing_charge"] > 0,
                                })
                            }
                        }
                        if (planDetails.rows.length > 0) accordionDetails["plans"].push(planDetails)
                    })
                }

                // Accordion details collected, time to generate.
                if (accordionDetails["plans"].length > 0) {
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
                                            <TableHeader></TableHeader>
                                            <TableHeader></TableHeader>
                                        </TableRow>
                                        <TableRow>
                                            <TableHeader align="left">Product Name</TableHeader>
                                            <TableHeader align="right">Quantity</TableHeader>
                                            <TableHeader align="right">Unit Price</TableHeader>
                                            <TableHeader align="right">Discount</TableHeader>
                                            <TableHeader align="right">Estimated Monthly Fee</TableHeader>
                                            <TableHeader align="center"></TableHeader>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {accordion.rows.map(row => (
                                            <TableRow>
                                                <TableCell>{row.name}</TableCell>
                                                <TableCell align="right">{row.quantity}</TableCell>
                                                <TableCell align="right">£{formatPrice(row.unitPrice)}</TableCell>
                                                {/* <TableCell align="right">{row.discount}%</TableCell> */}
                                                <TableCell align="right">
                                                    {(!!discountEditing[row.field] || discountEditing[row.field] === 0) ? (
                                                        renderField(row, (field, e, planId) => {
                                                            discountHandler(row.field, e, "add")
                                                        }, "PSQ", (!!discountEditing[row.field] || discountEditing[row.field] === 0) && typeof discountEditing[row.field] == "number" ? discountEditing[row.field] : row.discount, true, 100)
                                                    ) : `${row.discount}%` || `0%`}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {(!!discountEditing[row.field] || discountEditing[row.field] === 0) ? ("--"): <>£{formatPrice(row.estimatedMonthlyFee) || 0.00}</>}
                                                    {!!row.containsMonthlyStandingCharge && (<Text>(Includes Monthly Standing Charge | £{formatPrice(row.monthlyStandingCharge)})</Text>)}
                                                </TableCell>
                                                <TableCell>
                                                    {(!!discountEditing[row.field] || discountEditing[row.field] === 0) ? (
                                                        <Flex direction="column" align="stretch" gap="sm">
                                                            <Button
                                                                variant="primary"
                                                                onClick={_ => {
                                                                    QuoteDiscountValueHandler(row.field, discountEditing[row.field])
                                                                    discountHandler(row.field, null, "remove")
                                                                }}
                                                            >
                                                                <> <Icon name="success"/> Save </>
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                onClick={_ => {
                                                                    discountHandler(row.field, null, "remove")
                                                                }}
                                                            >
                                                                <> <Icon name="delete"/> Cancel </>
                                                            </Button>
                                                        </Flex>                                            
                                                    ) : (
                                                        <Button
                                                            variant="transparent"
                                                            onClick={_ => {
                                                                discountHandler(row.field, true, "add")
                                                            }}
                                                        >
                                                            <> <Icon name="edit"/> Edit </>
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                    <TableFooter>
                                        {accordion.coreProductMonthlyFee > 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4}>Estimated Core Product Charges</TableCell>
                                                <TableCell align="right">£{formatPrice(accordion.coreProductMonthlyFee)}</TableCell>
                                                <TableCell></TableCell>
                                            </TableRow>
                                        ) : <></>}
                                        {accordion.addonProductMonthlyFee > 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4}>Estimated Addon Product Charges</TableCell>
                                                <TableCell align="right">£{formatPrice(accordion.addonProductMonthlyFee)}</TableCell>
                                                <TableCell></TableCell>
                                            </TableRow>
                                        ) : <></>}
                                    </TableFooter>
                                </Table>
                            ))}
                        </Flex>
                    </Accordion>)
                }
            }
        })

        let impFees = quote["Implementation Fees"]
        let impFeeType = impFees["Implementation Type"]
        if (impFeeType == "PSQ") {
            let psqPlans = []
            let psqTables = []
            for (let key in impFees) {
                if (!!key.match(/^[0-9]*$/g)) psqPlans.push(impFees[key])
            }
            psqPlans.forEach(plan => {
                console.log(plan)
                psqTables.push(<Table>
                    <TableHead>
                        <TableRow>
                            <TableHeader>{plan.title} - Implementation Product</TableHeader>
                            <TableHeader>Units</TableHeader>
                            <TableHeader>Unit Price</TableHeader>
                            <TableHeader>Discount</TableHeader>
                            <TableHeader>Total Fee</TableHeader>
                            <TableHeader></TableHeader>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {plan.fields.map(row => (
                            ((row.discount + row.psqFee)> 0) ? (
                                <TableRow>
                                    <TableCell>{row.label}</TableCell>
                                    <TableCell>{formatInt(row.hoursBand.hours)}</TableCell>
                                    <TableCell>£{formatPrice(row.resource.hourly_rate)}</TableCell>
                                    <TableCell align="right">
                                        {(!!discountEditing[row.field] || discountEditing[row.field] === 0) ? (
                                            renderField(row, (field, e, planId) => {
                                                discountHandler(row.field, e, "add")
                                            }, "PSQ", (!!discountEditing[row.field] || discountEditing[row.field] === 0) && typeof discountEditing[row.field] == "number" ? discountEditing[row.field] : row.discount, true, 100)
                                        ) : `${row.discount || 0}%` || `0%`}
                                    </TableCell>
                                    <TableCell align="right">
                                        {(!!discountEditing[row.field] || discountEditing[row.field] === 0) ? ("--"): <>£{formatPrice(row.psqFee) || 0.00}</>}
                                    </TableCell>
                                    <TableCell>
                                        {(!!discountEditing[row.field] || discountEditing[row.field] === 0) ? (
                                            <Flex direction="column" align="stretch" gap="sm">
                                                <Button
                                                    variant="primary"
                                                    onClick={_ => {
                                                        QuoteDiscountValueHandler(row.field, discountEditing[row.field])
                                                        discountHandler(row.field, null, "remove")
                                                    }}
                                                >
                                                    <> <Icon name="success"/> Save </>
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    onClick={_ => {
                                                        discountHandler(row.field, null, "remove")
                                                    }}
                                                >
                                                    <> <Icon name="delete"/> Cancel </>
                                                </Button>
                                            </Flex>                                            
                                        ) : (
                                            <Button
                                                variant="transparent"
                                                onClick={_ => {
                                                    discountHandler(row.field, true, "add")
                                                }}
                                            >
                                                <> <Icon name="edit"/> Edit </>
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ) : <></>
                        ))}
                    </TableBody>
                </Table>)
            })
            Output.push( <Accordion title={"Professional Service Quote"} defaultOpen>
                <Flex direction="column" gap="sm">
                    {psqTables}
                </Flex>
            </Accordion>)
        } else {
            let stdRows = []
            for (let key in impFees) {
                let fee = impFees[key]
                for (let serviceKey in fee.services) {
                    let service = fee.services[serviceKey]
                    service["input_type"] = "Number"
                    stdRows.push(<TableRow>
                        <TableCell>{service.label}</TableCell>
                        <TableCell>{formatInt(service["Implementation Days"])}</TableCell>
                        <TableCell>£{formatPrice(service["Implementation Fee"] / service["Implementation Days"])}</TableCell>
                        <TableCell align="right">
                            {(!!discountEditing[service.field] || discountEditing[service.field] === 0) ? (
                                renderField(service, (field, e, planId) => {
                                    discountHandler(service.field, e, "add")
                                }, "PSQ", (!!discountEditing[service.field] || discountEditing[service.field] === 0) && typeof discountEditing[service.field] == "number" ? discountEditing[service.field] : service.discount, true, 100)
                            ) : `${service.discount}%` || `0%`}
                        </TableCell>
                        <TableCell align="right">
                            {(!!discountEditing[service.field] || discountEditing[service.field] === 0) ? ("--"): <>£{formatPrice(service["Implementation Fee"]) || 0.00}</>}
                        </TableCell>
                        <TableCell>
                            {(!!discountEditing[service.field] || discountEditing[service.field] === 0) ? (
                                <Flex direction="column" align="stretch" gap="sm">
                                    <Button
                                        variant="primary"
                                        onClick={_ => {
                                            QuoteDiscountValueHandler(service.field, discountEditing[service.field])
                                            discountHandler(service.field, null, "remove")
                                        }}
                                    >
                                        <> <Icon name="success"/> Save </>
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={_ => {
                                            discountHandler(service.field, null, "remove")
                                        }}
                                    >
                                        <> <Icon name="delete"/> Cancel </>
                                    </Button>
                                </Flex>                                            
                            ) : (
                                <Button
                                    variant="transparent"
                                    onClick={_ => {
                                        discountHandler(service.field, true, "add")
                                    }}
                                >
                                    <> <Icon name="edit"/> Edit </>
                                </Button>
                            )}
                        </TableCell>
                    </TableRow>)

                }
            }
            Output.push( <Accordion title={"Standard Implementation Fees"} defaultOpen>
                <Flex direction="column" gap="sm">
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableHeader>Implementation Product</TableHeader>
                                <TableHeader>Units</TableHeader>
                                <TableHeader>Unit Price</TableHeader>
                                <TableHeader>Discount</TableHeader>
                                <TableHeader>Total Fee</TableHeader>
                                <TableHeader></TableHeader>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {stdRows}
                        </TableBody>
                    </Table>
                </Flex>
            </Accordion>)
        }

    }

    return Output
}