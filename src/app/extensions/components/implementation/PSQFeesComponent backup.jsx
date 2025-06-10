import React, { useState, useEffect, createContext, useContext } from "react";
import {
    Flex,
    Text,
    Button,
    StepperInput,
    Table,
    TableHead,
    TableHeader,
    TableRow,
    TableBody,
    TableCell,
    TableFooter,
    Accordion,
    Icon,
    hubspot,
} from "@hubspot/ui-extensions";

// Contexts for products and resources
const ProductDefsContext = createContext([]);
const ResourceDefsContext = createContext([]);
export const useProductDefs = () => useContext(ProductDefsContext);
export const useResourceDefs = () => useContext(ResourceDefsContext);

// Hook: fetch product definitions and merge resource details
export function useFetchProductDefs() {
    const [defs, setDefs] = useState([]);

    useEffect(() => {
        hubspot
            .serverless("get_table_rows", { parameters: { tableName: "cintra_calculator_psq_implementation_resources" } })
            .then((res) => {
                const resourceRows = res.body.rows.map((r) => ({
                    field: r.id,
                    label: r.values.name,
                    day_rate: r.values.day_rate,
                    hourly_rate: r.values.day_rate / 7,
                }));
                const resourceDict = {};
                resourceRows.forEach((row) => {
                    resourceDict[row.field] = row;
                });
                return resourceDict;
            })
            .then((resourceDict) =>
                hubspot.serverless("get_table_rows", { parameters: { tableName: "cintra_calculator_psq_implementation_products" } })
                    .then((res) => {
                        const rows = res.body.rows.map((r) => {
                            const resourceIds = r.values.resource.map((a) => a.id);
                            return {
                                field: r.id,
                                label: r.values.name,
                                type: r.values.task_type.name,
                                resource: resourceDict[resourceIds[0]],
                            };
                        });
                        setDefs(rows);
                    })
            )
            .catch(console.warn);
    }, []);

    return defs;
}

// Row actions: PSQ Fees
export const PSQFeesRowActions = ({ onEdit }) => (
    <Flex justify="end" align="center" gap="sm">
        <Button variant="transparent" onClick={onEdit}>
            <Icon name="edit" /> Edit
        </Button>
    </Flex>
);

// Container: PSQ Fees
export const PSQFeesContainer = ({ actions, initialItems = {}, onChange }) => {
    const defs = useFetchProductDefs();

    // State for hours/units per product
    const [quantities, setQuantities] = useState({});
    // State for edit mode per table
    const [editingTables, setEditingTables] = useState({});
    // State for saved quantities per table
    const [savedQuantities, setSavedQuantities] = useState({});

    // Prepopulate only on initial load (when defs first available)
    useEffect(() => {
        if (defs.length > 0) {
            const initQtys = {};
            const initSaved = {};
            ['Payroll', 'H&A', 'Other'].forEach((title) => {
                const items = itemsForTable(title, defs);
                const tableSaved = {};
                items.forEach((def) => {
                    const qty = initialItems[title]?.[def.field] || 0;
                    tableSaved[def.field] = qty;
                    initQtys[def.field] = qty;
                });
                initSaved[title] = tableSaved;
            });
            setQuantities(initQtys);
            setSavedQuantities(initSaved);
        }
        // only run once when defs changes from empty to loaded
    }, [defs]);

    const handleQuantityChange = (field) => (value) => {
        setQuantities((prev) => ({ ...prev, [field]: value }));
    };

    const itemsForTable = (title, definitions = defs) => {
        switch (title) {
            case 'Payroll': return definitions.filter((d) => d.type === 'payroll');
            case 'H&A': return definitions.filter((d) => d.type === 'h_and_a');
            case 'Other': return definitions.filter((d) => d.type === 'other');
            default: return [];
        }
    };

    const totalFees = React.useMemo(() =>
        Object.entries(quantities).reduce((acc, [field, qty]) => {
            const def = defs.find((d) => d.field === field);
            if (def) acc[field] = qty * def.resource.hourly_rate;
            return acc;
        }, {}), [quantities, defs]
    );

    // Compute and set total implementation fee
    const implementationTotal = React.useMemo(() =>
        ['Payroll','H&A','Other'].reduce((sum, title) => (
            sum + itemsForTable(title).reduce((st, def) => st + (totalFees[def.field] || 0), 0)
        ), 0)
    ,[totalFees, defs]
    );
    useEffect(() => {
        if (onChange) onChange('Implementation Fees Total', implementationTotal);
    }, [implementationTotal]);

    const handleEdit = (title) => () => {
        const current = savedQuantities[title] || {};
        setEditingTables((prev) => ({ ...prev, [title]: true }));
        if (!Object.keys(current).length) {
            const init = itemsForTable(title).reduce((acc, def) => ({ ...acc, [def.field]: quantities[def.field] || 0 }), {});
            setSavedQuantities((prev) => ({ ...prev, [title]: init }));
        }
    };

    const handleSave = (title) => () => {
        const saved = itemsForTable(title).reduce((acc, def) => ({ ...acc, [def.field]: quantities[def.field] || 0 }), {});
        setSavedQuantities((prev) => ({ ...prev, [title]: saved }));
        setEditingTables((prev) => ({ ...prev, [title]: false }));
        if (onChange) onChange("Implementation Fees", saved);
    };

    const handleDiscard = (title) => () => {
        const revert = savedQuantities[title] || {};
        setQuantities((prev) => ({ ...prev, ...revert }));
        setEditingTables((prev) => ({ ...prev, [title]: false }));
    };

    const renderTable = (title) => {
        const items = itemsForTable(title);
        const isEditing = !!editingTables[title];
        const itemsToRender = isEditing ? items : items.filter((def) => (quantities[def.field] || 0) > 0);
        const tableTotal = items.reduce((sum, def) => sum + (totalFees[def.field] || 0), 0);

        if (!isEditing && !itemsToRender.length) {
            return (
                <Flex direction="column" align="center" gap="sm" key={title}>
                    <Text>No tasks have been added for {title}.</Text>
                    <Button variant="primary" onClick={handleEdit(title)}>Add Tasks</Button>
                </Flex>
            );
        }

        return (
            <Table key={title}>
                <TableHead>
                    <TableRow>
                        <TableHeader>{`${title} Tasks`}</TableHeader>
                        <TableHeader />
                        <TableHeader />
                        {isEditing ? (
                            <>
                                <TableHeader>
                                    <Button variant="transparent" onClick={handleSave(title)}><Icon name="success" /> Save Changes</Button>
                                </TableHeader>
                                <TableHeader>
                                    <Button variant="transparent" onClick={handleDiscard(title)}><Icon name="remove" /> Discard Changes</Button>
                                </TableHeader>
                            </>                            
                        ) : (
                            <>
                                <TableHeader />
                                <TableHeader>
                                    <PSQFeesRowActions onEdit={handleEdit(title)} />
                                </TableHeader>
                            </>
                        )}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {itemsToRender.map((def, idx) => {
                        const qty = quantities[def.field] || 0;
                        const fee = totalFees[def.field] || 0;
                        return (
                            <TableRow key={def.field}>
                                <TableCell>{idx===0&&<Text variant="label">Product</Text>}<Text>{def.label}</Text></TableCell>
                                <TableCell>{idx===0&&<Text variant="label">Resource</Text>}<Text>{def.resource.label}</Text></TableCell>
                                <TableCell>
                                    {idx===0&&<Text variant="label">Hours / Units</Text>}
                                    {isEditing ? <StepperInput min={0} value={qty} onChange={handleQuantityChange(def.field)} /> : <Text>{qty}</Text>}
                                </TableCell>
                                <TableCell align="right">{idx===0&&<Text variant="label">Rate</Text>}<Text>£{def.resource.hourly_rate.toFixed(2)}</Text></TableCell>
                                <TableCell align="right">{idx===0&&<Text variant="label">Total Fee</Text>}<Text>£{fee.toFixed(2)}</Text></TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={4}><Text variant="label">{`Total ${title} Task Implementation Charges`}</Text></TableCell>
                        <TableCell align="right"><Text>£{tableTotal.toFixed(2)}</Text></TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        );
    };

    return (
        <Accordion title="Implementation Fees" defaultOpen>
            <Flex direction="column" gap="large">
                {['Payroll','H&A','Other'].map(renderTable)}
            </Flex>
        </Accordion>
    );
};
