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
    if (planIds.length === 0) {
        return (
            <Text format={{ fontStyle: "italic" }}>
                No {productType.label} products added yet.
            </Text>
        );
    }


    return planIds.map((planId) => {
        const selectedPlanValues = Array.isArray(selectedValues) ?
            selectedValues.find((p) => p.id === planId) || { fields: [] } :
            { fields: [] };

        const countValue = selectedPlanValues.quantity_value;
        const qtyLabel = selectedPlanValues.quantity_field_label;
        const frequencyLabel = ` ${selectedPlanValues.frequency_value || ""}`;
        const countHeaderText = `${qtyLabel}: ${countValue}${frequencyLabel}`;

        const excludedIds = new Set([ productType.count_field, productType.payslip_frequency_field, ]);
        const filteredFields = productType.fields.filter((field) => {
            if (excludedIds.has(field.field)) { return false }
            const cellEntry = selectedPlanValues.fields.find(a => a.field === field.field);
            return ( cellEntry != null && cellEntry.value !== "" && cellEntry.value != null && cellEntry.value != false );
        });

        return (
            <Table key={planId} marginBottom="md">
                <TableHead>
                    <TableRow>
                        <TableHeader>{countHeaderText}</TableHeader>
                        <TableHeader>
                            <Flex gap="sm">
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
                                        initialValues={selectedPlanValues.fields}
                                        onSubmit={(generatedId) => {
                                            plan_handler.edit(productType.label, generatedId);
                                        }}
                                        selectedPlanValues={selectedPlanValues}
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
                        const cell = selectedPlanValues.fields.find(a => a.field === field.field);
                        return (
                            <TableRow key={field.field}>
                                <TableCell>{field.label}</TableCell>
                                <TableCell> {cell ? <Icon name="success" /> : <Icon name="remove" />} </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        );
    });
};