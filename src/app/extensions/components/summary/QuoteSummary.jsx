import React from "react";
import { Flex, Tile, Icon, Text } from "@hubspot/ui-extensions";

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
    productTypeAccordions = {},
    selectedValues = {},
    planIdsByType = {},
}) => {
    const tiles = generateTiles(
        quote,
        productTypeAccordions,
        selectedValues,
        planIdsByType,
    );

    if (tiles.length === 0) {
        return null;
    }

    return (
        <Flex direction="column" align="start" gap="md">
            <Text format={{ fontWeight: "bold", fontSize: "lg" }}>Quote Summary</Text>
            <Flex gap="small" wrap>
                {tiles}
            </Flex>
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
