import React from "react";
import { Flex, Tile, Icon, Text, Table, TableRow, TableCell, DescriptionList, DescriptionListItem, Tab, TableBody, TableHeader, TableHead, TableFooter } from "@hubspot/ui-extensions";
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
    type = "inline",
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
        "Payroll Headcount": {
            label: "Total Employees",
            count: formatInt(quote["Summary"]["PayrollHeadcount"] ?? 0),
            type: "count",
            valid: !!quote["Summary"]["PayrollHeadcount"],
        },
    }

    for (let productType in quote["Details"]) {
        let count = 0
        let type = "count"
        quote["Details"][productType].forEach(plan => {
            let confirmedPlanValidity = plan.fields.length > 0
            if (confirmedPlanValidity) count += 1
        })
        let valid = !!count
        
        let accordion = productTypeAccordions.find(a => a.label == productType)
        if (!!accordion) {
            if (accordion.max_items == 1) {
                type = "boolean"
            }
        }
        keyDetails[productType] = { label: productType, count, type, valid }
    }

    let costTableRows = []

    if (!!quote["Summary"]["Total Implementation Costs"]) {
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
        if (!!quote["Summary"]["Total Estimated Monthly Costs"]) {
            costTableRows.push(
                <TableRow>
                    <TableCell><Text> Total Estimated Monthly Costs </Text> </TableCell>
                    <TableCell align="right"><Text>{`£${formatPrice(quote["Summary"]["Total Estimated Monthly Costs"] ?? 0)}`}</Text></TableCell>
                </TableRow>
            )
        }
        if (!!quote["Summary"]["Total Estimated Annual Costs"]) {
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
                <TableFooter>
                    <TableRow>
                        <TableCell><Text format={{fontWeight: "bold"}}> Total Y1 Charges </Text> </TableCell>
                        <TableCell align="right"><Text format={{fontWeight: "bold"}}>{`£${formatPrice(quote["Summary"]["Total Y1 Charges"] ?? 0)}`}</Text></TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        )
    }

    console.log({
        event: "Generating QuoteSummaryComponent",
        keyDetails,
        quote,
        type,
        suppressImplementationFee,
        productTypeAccordions,
    })

    return (
        <Flex direction="column" align="stretch" gap="md">
            <Text format={{ fontWeight: "bold", fontSize: "lg" }}>Quote Summary</Text>
            {!!supressKeyDetails ? <></> : (
                <DescriptionList direction={"row"}>
                    {keyDetailsElements.map(detail => <DescriptionListItem label={detail.label}>{detail.measure}</DescriptionListItem>)}
                </DescriptionList>
            )}
            {costTable}
        </Flex>
    );
};

/**
 * Generates an array of <Tile> elements based on productTypeDefs and selectedValues.
 */
const generateTiles = (
    quote = {},
    productTypeAccordions = {},
    selectedValues = {},
    planIdsByType = {},
) => {
    const textFmt = { fontWeight: "demibold" }
    const tileItems = [];
    const conditions = [
        Object.keys(quote).length > 0,
    ]

    if (conditions.every(a => !!a)) {
        const QuoteDetails = productTypeAccordions.find(a => a.is_quote_details_type)

        // Public Sector Client
        let publicSectorClient = quote["Summary"]["PublicSectorClient"]
        if (!!publicSectorClient) {
            tileItems.push({
                value: <Icon name="success" />,
                label: "Public Sector Client",
            })
        }
        // Education Sector Client
        let educationClient = quote["Summary"]["EducationClient"]
        if (!!educationClient) {
            tileItems.push({
                value: <Icon name="success" />,
                label: "Education Client",
            })
        }
        // Contract Length
        let contractLength = quote["Summary"]["ContractLength"]
        if (!!contractLength) {
            tileItems.push({
                value: <Text format={textFmt}>{contractLength}</Text>,
                label: "Months",
            })
        }
        // Total Employees
        let total_headcount = quote["Summary"]["PayrollHeadcount"]
        if (!!total_headcount) {
            tileItems.push({
                value: <Text format={textFmt}>{total_headcount}</Text>,
                label: "Total Headcount",
            })
        }
        // Number of Plans in each product type
        let plansPerProductType = {}
        for (let type in planIdsByType) {
            if (type != QuoteDetails.label) {
                let plansWithValidSelectedValue = 0
                planIdsByType[type].forEach(plan => {
                    let containsValidSelectedValue = false
                    for (let fieldKey in selectedValues[plan]) {
                        if (!!selectedValues[plan][fieldKey] || selectedValues[plan][fieldKey] === 0) {
                            containsValidSelectedValue = true
                        }
                    }
                    if (containsValidSelectedValue) {
                        plansWithValidSelectedValue += 1
                    }
                })
                plansPerProductType[type] = plansWithValidSelectedValue
            }
        }
        for (let productType in plansPerProductType) {
            if (plansPerProductType[productType] != 0) {
                tileItems.push({
                    value: <Text format={textFmt}>{plansPerProductType[productType]}</Text>,
                    label: productType,
                })
            }
        }
    }

    return tileItems.map(item => (
        <Tile>
            <Flex direction="column">
                {item.value}
                <Text>{item.label}</Text>
            </Flex>
        </Tile>
    ))

    // Loop through each productType definition
    // productTypeDefs.forEach((typeDef) => {
    //   const typeName = typeDef.label;
    //   const displayType = typeDef.input_display_type;
    //   const plans = selectedValues[typeName] || [];

    //   if (displayType === "inline") {
    //     // For inline display, create a tile for each field in each plan
    //     plans.forEach((planObj) => {
    //       planObj.fields.forEach((fieldEntry) => {
    //         const key = `${typeName}-${planObj.id}-${fieldEntry.field}`;
    //         const value = fieldEntry.value;
    //         let iconName = null;
    //         let primaryText = null;

    //         // If boolean, show icon instead of text
    //         if (typeof value === "boolean") {
    //           iconName = value ? "success" : "remove";
    //         } else {
    //           primaryText = String(value);
    //         }

    //         const secondaryText = fieldEntry.label;

    //         tileItems.push({ key, iconName, primaryText, secondaryText });
    //       });
    //     });
    //   } else if (displayType === "table") {
    //     // For table display, create a single tile summarizing count of plans
    //     if (plans.length > 0) {
    //       const key = `${typeName}-count`;
    //       const primaryText = String(plans.length);
    //       const secondaryText = `${typeName} Plans`;

    //       tileItems.push({ key, iconName: null, primaryText, secondaryText });
    //     }
    //   }
    // });

    // Optionally, add implementation fee tile if not suppressed and exists
    // if (!supressImplementationFee) {
    //   const impPlans = selectedValues["Implementation Fees Total"] || [];
    //   if (impPlans.length > 0) {
    //     const impEntry = impPlans[0].fields.find(
    //       (x) => x.field === "implementationFeesTotal"
    //     );
    //     if (impEntry && typeof impEntry.value === "number") {
    //       const key = "implementationFee";
    //       const primaryText = `£${impEntry.value.toFixed(2)}`;
    //       const secondaryText = "Implementation Fee";

    //       tileItems.push({ key, iconName: null, primaryText, secondaryText });
    //     }
    //   }
    // }

    // return tileItems.map((item) => (
    //   <Tile key={item.key}>
    //     {item.iconName && <Icon name={item.iconName} />}
    //     {item.primaryText && (
    //       <Text format={{ fontWeight: "bold", fontSize: "md" }}>
    //         {item.primaryText}
    //       </Text>
    //     )}
    //     {item.secondaryText && (
    //       <Text format={{ fontSize: "md" }}>{item.secondaryText}</Text>
    //     )}
    //   </Tile>
    // ));
};

export { QuoteSummaryComponent };
