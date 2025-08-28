import React, { useState, useEffect } from "react";
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
import { renderField } from "./Inputs";

export const renderInlineTablePlans = (
    productType,
    planIds,
    selectedValues,
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

    const [editing, setEditing] = useState(false)

    return planIds.map((planId) => {
        const selectedPlanValues = Array.isArray(selectedValues) ?
            selectedValues.find((p) => p.id === planId) || { fields: [] } :
            { fields: [] };

        return (
            <Table key={planId} marginBottom="md">
                <TableHead>
                    <TableRow>
                        <TableHeader>Tasks</TableHeader>
                        <TableHeader>
                            <Flex gap="sm" justify="end">
                                <Button
                                    variant="transparent"
                                    onClick={_ => setEditing(!editing)}
                                >
                                    <Icon name="edit"/> Edit
                                </Button>
                            </Flex>
                        </TableHeader>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {productType.fields.map((field) => {
                        const cell = selectedPlanValues.fields.find(a => a.field === field.field);
                        return (
                            <TableRow key={field.field}>
                                <TableCell>{field.label}</TableCell>
                                <TableCell  align="right">
                                    {editing ? (
                                        renderField(field, handler, planId, cell.value)
                                    ) : (
                                        cell ? String(cell.value) : "-"
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        );
    });
};