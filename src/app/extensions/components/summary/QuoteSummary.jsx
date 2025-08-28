import React from "react";
import { Flex, Accordion, Icon, Text, Table, TableRow, TableCell, DescriptionList, DescriptionListItem, Tab, TableBody, TableHeader, TableHead, TableFooter, Divider } from "@hubspot/ui-extensions";
import { formatPrice, formatInt, reshapeArray } from "../shared/utils";

/**
 * QuoteSummaryComponent dynamically generates tiles based on productTypeDefs and selectedValues.
 *
 * Props:
 *  - productTypeDefs: Array<{
 *      label: string,
 *      input_display_type: string
 *    }>
 *  - selectedValues: {
 *      [productTypeLabel: string]: Array<{
 *        id: string,
 *        fields: Array<{ field: string; label: string; value: any }>
 *      }>
 *    }
 *  - supressImplementationFee: boolean
*/
const QuoteSummaryComponent = ({
    quote = {},
    productTypeAccordions = [],
    suppressImplementationFee = true,
    suppressQuoteFees = true,
    supressKeyDetails = false,
}) => {
    const conditions = [
        Object.keys(quote),
        productTypeAccordions
    ].map(cond => cond.length > 0)
    if (!conditions.every(a => !!a)) return null

    const keyDetails = {
        "Contract Length": {
            label: "Contract",
            count: `${quote["Summary"]["ContractLength"] ?? 0} Months`,
            type: "count",
            valid: !!quote["Summary"]["ContractLength"],
        },
        "Education Client": {
            label: "Education Client",
            count: quote["Summary"]["EducationClient"] ?? 0,
            type: "boolean",
            valid: !!quote["Summary"]["EducationClient"],
        },
        "PublicSector Client": {
            label: "Public Sector Client",
            count: quote["Summary"]["PublicSectorClient"] ?? 0,
            type: "boolean",
            valid: !!quote["Summary"]["PublicSectorClient"],
        },
        "Private Sector Client": {
            label: "Private Sector Client",
            count: quote["Implementation Fees"]["PSQ Config"]?.Sector?.private ?? 0,
            type: "boolean",
            valid: !!quote["Implementation Fees"]["PSQ Config"]?.Sector?.private ?? false,
        },
        "Payroll Headcount": {
            label: "Total Employees",
            count: formatInt(quote["Summary"]["PayrollHeadcount"] ?? 0),
            type: "count",
            valid: !!quote["Summary"]["PayrollHeadcount"],
        },
    }

    for (let productType in quote["Details"]) {
        if (productType !== "Quote Details") {
            let count = 0
            let type = "count"
            quote["Details"][productType].forEach(plan => {
                let confirmedPlanValidity = !!plan && !!plan.fields && plan.fields.length > 0
                if (confirmedPlanValidity) count += 1
            })
            let valid = !!count
            
            let accordion = productTypeAccordions.find(a => a.label == productType)
            if (!!accordion) {
                if (accordion.max_plans == 1) {
                    type = "boolean"
                }
            }
            keyDetails[productType] = { label: productType, count, type, valid }
        }
    }

    let costTableRows = []

    if (!!quote["Summary"]["Total Implementation Costs"] || quote["Summary"]["Total Implementation Costs"] == 0) {
        if (!suppressImplementationFee) {
            costTableRows.push(
                <TableRow>
                    <TableCell><Text> Total Implementation Costs </Text> </TableCell>
                    <TableCell align="right"><Text>{`£${formatPrice(quote["Summary"]["Total Implementation Costs"] ?? 0)}`}</Text></TableCell>
                </TableRow>
            )
        }
    }

    if (!suppressQuoteFees) {
        if (!!quote["Summary"]["Total Estimated Monthly Costs"] || quote["Summary"]["Total Estimated Monthly Costs"] == 0) {
            costTableRows.push(
                <TableRow>
                    <TableCell><Text> Total Estimated Monthly Costs </Text> </TableCell>
                    <TableCell align="right"><Text>{`£${formatPrice(quote["Summary"]["Total Estimated Monthly Costs"] ?? 0)}`}</Text></TableCell>
                </TableRow>
            )
        }
        if (!!quote["Summary"]["Total Estimated Annual Costs"] || quote["Summary"]["Total Estimated Annual Costs"] == 0) {
            costTableRows.push(
                <TableRow>
                    <TableCell><Text> Total Estimated Annual Costs </Text> </TableCell>
                    <TableCell align="right"><Text>{`£${formatPrice(quote["Summary"]["Total Estimated Annual Costs"] ?? 0)}`}</Text></TableCell>
                </TableRow>
            )
        }
    }

    let keyDetailsElements = []
    for (let detailKey in keyDetails) {
        if (!!keyDetails[detailKey].valid) {
            let details = keyDetails[detailKey]
            let measure = <Text format={{ fontWeight: "bold", fontSize: "small" }}>{details.count}</Text>
            if (details.type === "boolean") measure = <Icon name="success"/>
            keyDetailsElements.push({
                measure,
                label: details.label,
            })
        }
    }

    let costTable = null

    if (costTableRows.length > 0) {
        costTable = (
            <Table>
                <TableHead>
                    <TableRow>
                        <TableHeader>Total Overall Costs</TableHeader>
                        <TableHeader></TableHeader>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {costTableRows}
                </TableBody>
                {!suppressQuoteFees ? (
                    <TableFooter>
                        <TableRow>
                            <TableCell><Text format={{fontWeight: "bold"}}> Total Y1 Charges </Text> </TableCell>
                            <TableCell align="right"><Text format={{fontWeight: "bold"}}>{`£${formatPrice(quote["Summary"]["Total Y1 Charges"] ?? 0)}`}</Text></TableCell>
                        </TableRow>
                    </TableFooter>
                ) : <></>}
            </Table>
        )
    }

    return (
        <Accordion title="Quote Summary" defaultOpen>
            <Flex direction="column" align="stretch" gap="md">
                {!!supressKeyDetails ? <></> : (
                    <DescriptionList direction={"row"}>
                        {keyDetailsElements.map(detail => <DescriptionListItem label={detail.label}>{detail.measure}</DescriptionListItem>)}
                    </DescriptionList>
                )}
                {costTable}
            </Flex>
        </Accordion>
    );
};

export { QuoteSummaryComponent };
