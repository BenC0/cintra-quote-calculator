import React, { useState, useEffect, createContext, useContext } from "react";
import {
    Flex,
    Accordion,
    Text,
    PanelBody,
    PanelSection,
    PanelFooter,
    Button,
    Divider,
    Panel,
    StepperInput,
    Table,
    TableHead,
    TableHeader,
    TableRow,
    TableBody,
    TableCell,
    Icon,
    ToggleGroup,
    hubspot,
} from "@hubspot/ui-extensions";
import { v4 as uuidv4 } from 'uuid';

// Context to share Capture Expense product definitions
const CaptureExpenseDefsContext = createContext([]);
export const useCaptureExpenseDefs = () => useContext(CaptureExpenseDefsContext);

// Hook to fetch Capture Expense product definitions
export const useFetchCaptureExpenseProducts = (hubDbTableId) => {
    const [defs, setDefs] = useState([]);
    useEffect(() => {
        hubspot.serverless('get_table_rows', { parameters: { tableName: "cintra_calculator_capture_expense_products" } })
            .then(response => {
                const rows = response.body.rows.map(row => ({
                    field: row.id,
                    label: row.values.name,
                }));
                setDefs(rows);
            })
            .catch(console.warn);
    }, [hubDbTableId]);
    return defs;
};

// ToggleGroup selector component
const ProductSelector = ({ formData, onSelect }) => {
    const defs = useCaptureExpenseDefs();
    const options = defs.map(({ field, label }) => ({ value: field, label }));
    return (
        <PanelSection>
            <ToggleGroup
                name="product"
                label="Expense Product"
                options={options}
                value={formData.product}
                onChange={onSelect}
                toggleType="radioButtonList"
                variant="default"
                required
            />
        </PanelSection>
    );
};

// Form panel for adding/editing a Capture Expense entry
export const CaptureExpenseForm = ({ isOpen, onClose, onSave, editingData }) => {
    const defs = useCaptureExpenseDefs();
    const [data, setData] = useState(editingData);

    useEffect(() => setData(editingData), [editingData]);
    const onInputChange = field => value => setData(d => ({ ...d, [field]: value }));
    const onSelect = value => setData(d => ({ ...d, product: value }));

    // Validation: product selected and headcount >=1
    const valid = Boolean(data.product) && data.numberOfEmployees > 0;

    return (
        <Panel
            id="capture_expense_form"
            title={editingData?.id ? 'Edit Capture Expense' : 'Add Capture Expense'}
            isOpen={isOpen}
            onClose={onClose}
        >
            <PanelBody>
                <PanelSection flush>
                    <Flex direction="column" gap="small">
                        <Text format={{ fontWeight: 'bold' }}>Capture Expense (per Active User)</Text>
                        <Flex justify="between" align="center">
                            <Text>Headcount</Text>
                            <StepperInput
                                min={1}
                                value={data.numberOfEmployees}
                                onChange={onInputChange('numberOfEmployees')}
                            />
                        </Flex>
                        <Divider />
                    </Flex>
                </PanelSection>
                <ProductSelector formData={data} onSelect={onSelect} />
            </PanelBody>
            <PanelFooter>
                <Flex justify="end">
                    <Button variant="primary" onClick={() => onSave(data)} disabled={!valid}>
                        {editingData?.id ? 'Update Capture Expense' : 'Add Capture Expense'}
                    </Button>
                </Flex>
            </PanelFooter>
        </Panel>
    );
};

// Row actions including inline edit, clone, and remove
const CaptureExpenseRowActions = ({ onEdit, onClone, onRemove, closeForm, onSave, editingIndex, items, defaultData }) => (
    <Flex justify="end" align="center" gap="sm">
        <Button
            variant="transparent"
            onClick={onEdit}
            overlay={
                <CaptureExpenseForm
                    isOpen
                    onClose={closeForm}
                    onSave={onSave}
                    editingData={editingIndex === null ? defaultData : items[editingIndex]}
                />
            }
        >
            <Icon name="edit" />
            Edit
        </Button>
        <Button variant="transparent" onClick={onClone}>
            <Icon name="copy" />
            Clone
        </Button>
        <Button variant="transparent" onClick={onRemove}>
            <Icon name="delete" />
            Remove
        </Button>
    </Flex>
);

// List display component
export const CaptureExpenseList = ({ items, onEdit, onClone, onRemove, closeForm, onSave, editingIndex, defaultData, openForm }) => {
    const defs = useCaptureExpenseDefs();
    return (
        <Accordion title="Capture Expense" defaultOpen>
            {items.length === 0 ? (
                <Text>No expenses have been added.</Text>
            ) : (
                items.map((entry, idx) => {
                    const product = defs.find(pd => pd.field === entry.product);
                    return (
                        <Table key={entry.id}>
                            <TableHead>
                                <TableRow>
                                    <TableHeader>
                                        Capture Expense {entry.number}
                                    </TableHeader>
                                    <TableHeader>
                                        <CaptureExpenseRowActions
                                            onEdit={() => onEdit(idx)}
                                            onClone={() => onClone(idx)}
                                            onRemove={() => onRemove(idx)}
                                            closeForm={closeForm}
                                            onSave={onSave}
                                            editingIndex={editingIndex}
                                            items={items}
                                            defaultData={defaultData}
                                        />
                                    </TableHeader>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell>
                                        {product?.label || entry.product}
                                    </TableCell>
                                    <TableCell align="right">
                                        {entry.numberOfEmployees}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    );
                })
            )}
            <Flex>
                <Button
                    variant="secondary"
                    onClick={() => openForm(null)}
                    overlay={
                        <CaptureExpenseForm
                            isOpen
                            onClose={closeForm}
                            onSave={onSave}
                            editingData={editingIndex === null ? defaultData : items[editingIndex]}
                        />
                    }
                >
                    Add Expense
                </Button>
            </Flex>
        </Accordion>
    );
};

// Main container
export const CaptureExpenseContainer = ({ actions, initialItems = [], hubDbTableId, onChange }) => {
    const defs = useFetchCaptureExpenseProducts(hubDbTableId);
    const [items, setItems] = useState(() => initialItems.map((item, idx) => ({ ...item, number: idx + 1 })));
    const [editingIndex, setEditingIndex] = useState(null);

    useEffect(() => { if (onChange) onChange("Capture Expense", items); }, [items]);

    const openForm = idx => setEditingIndex(idx);
    const closeForm = () => actions.closeOverlay('capture_expense_form');

    const onSave = data => {
        setItems(prev => editingIndex === null
            ? [...prev, { ...data, id: uuidv4(), number: prev.length + 1 }]
            : prev.map((item, i) => i === editingIndex ? { ...data, number: item.number } : item)
        );
        closeForm();
        setEditingIndex(null);
    };

    const onClone = idx => {
        setItems(prev => {
            const copy = { ...JSON.parse(JSON.stringify(prev[idx])), id: uuidv4() };
            const combined = [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)];
            return combined.map((item, i) => ({ ...item, number: i + 1 }));
        });
    };

    const onRemove = idx => {
        closeForm();
        setItems(prev => prev.filter((_, i) => i !== idx).map((item, i) => ({ ...item, number: i + 1 })));
        setEditingIndex(null);
    };

    const defaultData = { id: null, numberOfEmployees: 1, product: '' };

    return (
        <CaptureExpenseDefsContext.Provider value={defs}>
            <Flex direction="column" gap="md">
                <CaptureExpenseList
                    items={items}
                    onEdit={openForm}
                    openForm={openForm}
                    onClone={onClone}
                    onRemove={onRemove}
                    closeForm={closeForm}
                    onSave={onSave}
                    editingIndex={editingIndex}
                    defaultData={defaultData}
                />
            </Flex>
        </CaptureExpenseDefsContext.Provider>
    );
};
