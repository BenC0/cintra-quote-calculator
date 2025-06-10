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
  productTypeDefs = [],
  selectedValues = {},
  supressImplementationFee = true,
}) => {
  const tiles = generateTiles(productTypeDefs, selectedValues, supressImplementationFee);

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
  productTypeDefs,
  selectedValues,
  supressImplementationFee
) => {
  const tileItems = [];

  // Loop through each productType definition
  productTypeDefs.forEach((typeDef) => {
    const typeName = typeDef.label;
    const displayType = typeDef.input_display_type;
    const plans = selectedValues[typeName] || [];

    if (displayType === "inline") {
      // For inline display, create a tile for each field in each plan
      plans.forEach((planObj) => {
        planObj.fields.forEach((fieldEntry) => {
          const key = `${typeName}-${planObj.id}-${fieldEntry.field}`;
          const value = fieldEntry.value;
          let iconName = null;
          let primaryText = null;

          // If boolean, show icon instead of text
          if (typeof value === "boolean") {
            iconName = value ? "success" : "remove";
          } else {
            primaryText = String(value);
          }

          const secondaryText = fieldEntry.label;

          tileItems.push({ key, iconName, primaryText, secondaryText });
        });
      });
    } else if (displayType === "table") {
      // For table display, create a single tile summarizing count of plans
      if (plans.length > 0) {
        const key = `${typeName}-count`;
        const primaryText = String(plans.length);
        const secondaryText = `${typeName} Plans`;

        tileItems.push({ key, iconName: null, primaryText, secondaryText });
      }
    }
  });

  // Optionally, add implementation fee tile if not suppressed and exists
  if (!supressImplementationFee) {
    const impPlans = selectedValues["Implementation Fees Total"] || [];
    if (impPlans.length > 0) {
      const impEntry = impPlans[0].fields.find(
        (x) => x.field === "implementationFeesTotal"
      );
      if (impEntry && typeof impEntry.value === "number") {
        const key = "implementationFee";
        const primaryText = `£${impEntry.value.toFixed(2)}`;
        const secondaryText = "Implementation Fee";

        tileItems.push({ key, iconName: null, primaryText, secondaryText });
      }
    }
  }

  return tileItems.map((item) => (
    <Tile key={item.key}>
      {item.iconName && <Icon name={item.iconName} />}
      {item.primaryText && (
        <Text format={{ fontWeight: "bold", fontSize: "md" }}>
          {item.primaryText}
        </Text>
      )}
      {item.secondaryText && (
        <Text format={{ fontSize: "md" }}>{item.secondaryText}</Text>
      )}
    </Tile>
  ));
};

export { QuoteSummaryComponent };
