import React, { useState, useEffect, createContext, useContext } from "react";
import {
    Flex,
    Accordion,
    Text,
    PanelBody,
    PanelSection,
    PanelFooter,
    Button,
    Toggle,
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
    hubspot,
} from "@hubspot/ui-extensions";
import { v4 as uuidv4 } from 'uuid';

// Context to share HR Outsourcing product definitions
const HROutsourcingDefsContext = createContext([]);
export const useHROutsourcingDefs = () => useContext(HROutsourcingDefsContext);

// Hook to fetch HR Outsourcing product definitions
export const useFetchHROutsourcingProducts = (hubDbTableId) => {
    const [defs, setDefs] = useState([]);

    useEffect(() => {
        hubspot.serverless('get_table_rows', { parameters: { tableName: "cintra_calculator_hr_outsourcing_products" } })
            .then(response => {
                const rows = response.body.rows.map(row => ({
                    field: row.id,
                    label: row.values.name,
                    type: row.values.product_input_type.name,
                }));
                setDefs(rows);
            })
            .catch(console.warn);
    }, [hubDbTableId]);

    return defs;
};

// Component: renders inputs for each product definition
const ProductInputs = ({ formData, onInputChange, onToggleChange }) => {
    const defs = useHROutsourcingDefs();
    return (
        <PanelSection>
            <Text format={{ fontWeight: 'bold' }}>HR Outsourcing Products</Text>
            <Flex direction="column" gap="small">
                {defs.map(({ field, label, type }) => (
                    <Flex key={field} justify="between" align="center">
                        <Text>{label}</Text>
                        {type === 'toggle' ? (
                            <Toggle
                                name={field}
                                checked={formData[field]}
                                onChange={onToggleChange(field)}
                                textChecked="Yes"
                                textUnchecked="No"
                            />
                        ) : (
                            <StepperInput
                                name={field}
                                min={0}
                                value={formData[field]}
                                onChange={onInputChange(field)}
                            />
                        )}
                    </Flex>
                ))}
            </Flex>
        </PanelSection>
    );
};

// Form panel for adding/editing an HR Outsourcing entry
export const HROutsourcingForm = ({ isOpen, onClose, onSave, editingData }) => {
    const defs = useHROutsourcingDefs();
    const [data, setData] = useState(editingData);

    useEffect(() => setData(editingData), [editingData]);

    const onInputChange = field => value => setData(d => ({ ...d, [field]: value }));
    const onToggleChange = field => checked => setData(d => ({ ...d, [field]: checked }));

    // Validation: require at least one product selected
    const valid = defs.some(d => d.type === 'toggle' ? data[d.field] : data[d.field] > 0);

    return (
        <Panel
            id="hr_outsourcing_form"
            title={editingData?.id ? 'Edit HR Outsourcing' : 'Add HR Outsourcing'}
            isOpen={isOpen}
            onClose={onClose}
        >
            <PanelBody>
                <PanelSection flush>
                    <Flex direction="column" gap="small">
                        <Text format={{ fontWeight: 'bold' }}>HR Outsourcing (per Employee)</Text>
                        <Flex justify="between" align="center">
                            <Text>Number of Employees</Text>
                            <StepperInput
                                min={1}
                                value={data.numberOfEmployees}
                                onChange={onInputChange('numberOfEmployees')}
                            />
                        </Flex>
                        <Divider />
                    </Flex>
                </PanelSection>
                {defs.length > 0 && (
                    <ProductInputs
                        formData={data}
                        onInputChange={onInputChange}
                        onToggleChange={onToggleChange}
                    />
                )}
            </PanelBody>
            <PanelFooter>
                <Flex justify="end">
                    <Button
                        variant="primary"
                        onClick={() => onSave(data)}
                        disabled={!valid}
                    >
                        {editingData?.id ? 'Update HR Outsourcing' : 'Add HR Outsourcing'}
                    </Button>
                </Flex>
            </PanelFooter>
        </Panel>
    );
};

// Row actions including inline edit, clone, and remove
const HROutsourcingRowActions = ({ onEdit, onClone, onRemove, closeForm, onSave, editingIndex, items, defaultData }) => (
    <Flex justify="end" align="center" gap="sm">
        <Button
            variant="transparent"
            onClick={onEdit}
            overlay={
                <HROutsourcingForm
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

// List display for HR Outsourcing entries
export const HROutsourcingList = ({ items, onEdit, onClone, onRemove, closeForm, onSave, editingIndex, defaultData, openForm }) => {
    const defs = useHROutsourcingDefs();
    return (
        <Accordion title="HR Outsourcing" defaultOpen>
            {items.length === 0 ? (
                <Text>No HR Outsourcing products have been added.</Text>
            ) : (
                items.map((item, idx) => (
                    <Table key={item.id}>
                        <TableHead>
                            <TableRow>
                                <TableHeader>
                                    HR Outsourcing {item.number}: {item.numberOfEmployees} Headcount
                                </TableHeader>
                                <TableHeader>
                                    <HROutsourcingRowActions
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
                            {defs
                                .filter(d => d.type === 'toggle' ? item[d.field] : item[d.field] > 0)
                                .map(d => (
                                    <TableRow key={`${item.id}-${d.field}`}>   
                                        <TableCell><Text>{d.label}</Text></TableCell>
                                        <TableCell align="right">
                                            {d.type === 'toggle' ? <Icon name="success"/> : <Text>{item[d.field]}</Text>}
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                ))
            )}
            <Flex>
                <Button
                    variant="secondary"
                    onClick={() => openForm(null)}
                    overlay={
                        <HROutsourcingForm
                            isOpen
                            onClose={closeForm}
                            onSave={onSave}
                            editingData={editingIndex === null ? defaultData : items[editingIndex]}
                        />
                    }
                >
                    Add HR Outsourcing
                </Button>
            </Flex>
        </Accordion>
    );
};

// Main container orchestrating HR Outsourcing state and actions
export const HROutsourcingContainer = ({ actions, initialItems = [], hubDbTableId, onChange }) => {
    const defs = useFetchHROutsourcingProducts(hubDbTableId);
    const [items, setItems] = useState(() =>
        initialItems.map((item, idx) => ({ ...item, number: idx + 1 }))
    );
    const [editingIndex, setEditingIndex] = useState(null);

    // Notify parent on items change
    useEffect(() => { if (onChange) onChange('HR Outsourcing', items); }, [items]);

    const openForm = idx => setEditingIndex(idx);
    const closeForm = () => actions.closeOverlay('hr_outsourcing_form');

    const onSave = data => {
        setItems(prev => {
            if (editingIndex === null) {
                return [...prev, { ...data, id: uuidv4(), number: prev.length + 1 }];
            }
            return prev.map((p, i) => (i === editingIndex ? { ...data, number: p.number } : p));
        });
        closeForm();
        setEditingIndex(null);
    };

    const onClone = idx => {
        setItems(prev => {
            const item = prev[idx];
            const clone = { ...JSON.parse(JSON.stringify(item)), id: uuidv4() };
            const updated = [...prev.slice(0, idx + 1), clone, ...prev.slice(idx + 1)];
            return updated.map((p, i) => ({ ...p, number: i + 1 }));
        });
    };

    const onRemove = idx => {
        closeForm();
        setItems(prev =>
            prev.filter((_, i) => i !== idx).map((p, i) => ({ ...p, number: i + 1 }))
        );
        setEditingIndex(null);
    };

    const defaultData = {
        id: null,
        numberOfEmployees: 1,
        ...defs.reduce((acc, { field, type }) => ({ ...acc, [field]: type === 'toggle' ? false : 0 }), {}),
    };

    return (
        <HROutsourcingDefsContext.Provider value={defs}>
            <Flex direction="column" gap="md">
                <HROutsourcingList
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
        </HROutsourcingDefsContext.Provider>
    );
};
