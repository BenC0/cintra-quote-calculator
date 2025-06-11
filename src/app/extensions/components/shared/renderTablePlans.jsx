import React from "react";
import {
    Flex,
    Button,
    Text,
    Table,
    TableHead,
    TableHeader,
    Icon,
    TableRow,
    TableBody,
    TableCell,
} from "@hubspot/ui-extensions";
import { ProductTypeFormPanel } from "./ProductTypeFormPanel";

export const renderTablePlans = (
    productType,
    planIds,
    selectedValues,
    canAdd = false,
    actions,
    handler,
    plan_handler,
) => {
    const validPlanIds = planIds.filter(id => id != "temp")
    if (validPlanIds.length === 0) {
        return (
            <Text format={{ fontStyle: "italic" }}>
                No {productType.label} products added yet.
            </Text>
        );
    }


    return validPlanIds.map((planId) => {
        const selectedPlanValues = selectedValues[planId]
        if (Object.keys(selectedPlanValues).length == 0) return null;
        // console.log(`Rendering Table Plan for "${productType.label}"`, {productType, selectedValues, selectedPlanValues})

        const countValue = selectedPlanValues.quantity_value;
        const qtyLabel = productType.quantity_field_label;
        const frequencyLabel = ` ${selectedPlanValues.frequency_value || ""}`;
        const countHeaderText = `${qtyLabel}: ${countValue}${frequencyLabel}`;

        const excludedIds = new Set([ productType.count_field, productType.payslip_frequency_field, "" ]);
        const filteredFields = productType.fields.filter((field) => {
            if (excludedIds.has(field.field)) { return false }
            const cellEntry = selectedPlanValues[field.field];
            return !!cellEntry
        });

        return (
            <Table key={planId} marginBottom="md">
                <TableHead>
                    <TableRow>
                        <TableHeader>{countHeaderText}</TableHeader>
                        <TableHeader>
                            <Flex gap="sm" justify="end">
                                <Button
                                variant="transparent"
                                overlay={
                                    <ProductTypeFormPanel
                                        name={productType.label}
                                        productTypeId={productType.field}
                                        fields={productType.fields}
                                        quantity={productType.quantityFieldDef}
                                        quantity_value={selectedPlanValues.quantity_value}
                                        frequency={productType.frequencyFieldDef}
                                        frequency_value={selectedPlanValues.frequency_value}
                                        handler={handler}
                                        actions={actions}
                                        planId={planId}
                                        initialLookup={selectedPlanValues}
                                        onSubmit={(generatedId) => {
                                            plan_handler.edit(productType.label, generatedId);
                                        }}
                                    />
                                }
                                >
                                    <Icon name="edit"/> Edit
                                </Button>
                                {canAdd && (
                                    <Button
                                        variant="transparent"
                                        onClick={() => plan_handler.clone(productType.label, planId)}
                                    >
                                        <Icon name="copy"/> Clone
                                    </Button>
                                )}
                                <Button
                                    variant="transparent"
                                    onClick={() => plan_handler.delete(productType.label, planId)}
                                >
                                    <Icon name="delete"/> Remove
                                </Button>
                            </Flex>
                        </TableHeader>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {filteredFields.map((field) => {
                        const cell = selectedPlanValues[field.field];
                        return (
                            <TableRow key={field.field}>
                                <TableCell>{field.label}</TableCell>
                                <TableCell align="right"> {(typeof cell == "number" || typeof cell == "string") ? <Text>{cell}</Text> : !!cell ? <Icon name="success" /> : <Icon name="remove" />} </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        );
    });
};