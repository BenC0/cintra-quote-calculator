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
    Select,
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

// Context to share CintraHR product definitions
const CintraHRDefsContext = createContext([]);
export const useCintraHRDefs = () => useContext(CintraHRDefsContext);

// Hook to fetch CintraHR products
export const useFetchCintraHRProducts = (hubDbTableId) => {
    const [defs, setDefs] = useState([]);
    useEffect(() => {
        hubspot.serverless('get_table_rows', { parameters: { tableName: "cintra_calculator_cintrahr_products" } })
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

// Component: form panel for add/edit CintraHR entry
export const CintraHRForm = ({ isOpen, onClose, onSave, editingData }) => {
    const defs = useCintraHRDefs();
    const [formData, setFormData] = useState(editingData);
    useEffect(() => {
        setFormData(editingData);
    }, [editingData]);
    const handleChange = field => value => setFormData(fd => ({ ...fd, [field]: value }));

    return (
        <Panel
            id="cintrahr_form"
            title={editingData?.id ? 'Edit CintraHR Product' : 'Add CintraHR Product'}
            isOpen={isOpen}
            onClose={onClose}
        >
            <PanelBody>
                <PanelSection flush>
                    <Flex direction="column" gap="small">
                        <Text format={{ fontWeight: 'bold' }}>CintraHR Details</Text>
                        <Flex justify="between" align="center">
                            <Text>Product</Text>
                            <Select
                                name="product"
                                options={defs.map(d => ({ label: d.label, value: d.field }))}
                                value={formData.product}
                                onChange={e => handleChange('product')(e)}
                            />
                        </Flex>
                        <Flex justify="between" align="center">
                            <Text>Quantity</Text>
                            <StepperInput
                                min={1}
                                value={formData.quantity}
                                onChange={handleChange('quantity')}
                            />
                        </Flex>
                    </Flex>
                    <Divider />
                </PanelSection>
            </PanelBody>
            <PanelFooter>
                <Flex justify="end">
                    <Button variant="primary" onClick={() => onSave(formData)}>
                        {editingData?.id ? 'Update CintraHR Product' : 'Add CintraHR Product'}
                    </Button>
                </Flex>
            </PanelFooter>
        </Panel>
    );
};

// Component: row actions for each CintraHR entry
const CintraHRRowActions = ({ onEdit, onRemove, closeForm, handleSave, editingIndex, items, defaultData }) => (
    <Flex justify="end" align="center" gap="sm">
        <Button
            variant="transparent"
            onClick={onEdit}
            overlay={
                <CintraHRForm
                    isOpen={true}
                    onClose={closeForm}
                    onSave={handleSave}
                    editingData={editingIndex === null ? defaultData : items[editingIndex]}
                />
            }
        >
            <Icon name="edit" /> Edit
        </Button>
        <Button variant="transparent" onClick={onRemove}>
            <Icon name="delete" /> Remove
        </Button>
    </Flex>
);

// Component: table list of CintraHR entries
export const CintraHRList = ({
    items,
    onEdit,
    onRemove,
    closeForm,
    handleSave,
    editingIndex,
    defaultData,
    openForm,
}) => {
    const defs = useCintraHRDefs();
    return (
        <Accordion title="CintraHR Products" defaultOpen>
            {items.length === 0 ? (
                <>
                    <Text>No CintraHR Products have been added.</Text>
                    <Flex>
                        <Button
                            variant="secondary"
                            onClick={() => openForm(null)}
                            overlay={
                                <CintraHRForm
                                    isOpen={true}
                                    onClose={closeForm}
                                    onSave={handleSave}
                                    editingData={editingIndex === null ? defaultData : items[editingIndex]}
                                />
                            }
                        >
                            Add CintraHR Product
                        </Button>
                    </Flex>
                </>
            ) : (
                items.map((item, idx) => (
                    <Table key={item.id}>
                        <TableHead>
                            <TableRow>
                                <TableHeader>CintraHR</TableHeader>
                                <TableHeader>
                                    <CintraHRRowActions
                                        onEdit={() => onEdit(idx)}
                                        onRemove={() => onRemove(idx)}
                                        closeForm={closeForm}
                                        handleSave={handleSave}
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
                                    {defs.find(d => d.field === item.product)?.label || ''}
                                </TableCell>
                                <TableCell align="right">
                                    {item.quantity}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                ))
            )}
        </Accordion>
    );
};

// Main container for CintraHR component
export const CintraHRContainer = ({ actions, initialItems = [], hubDbTableId, onChange }) => {
    const defs = useFetchCintraHRProducts(hubDbTableId);
    const [items, setItems] = useState(() =>
        initialItems.map((item, idx) => ({ ...item, number: idx + 1 }))
    );
    const [editingIndex, setEditingIndex] = useState(null);

    useEffect(() => {
        if (onChange) onChange('CintraHR', items);
    }, [items]);

    const openForm = idx => setEditingIndex(idx);
    const closeForm = () => actions.closeOverlay('cintrahr_form');

    const handleSave = data => {
        setItems(prev => {
            if (editingIndex === null) {
                return [...prev, { ...data, id: uuidv4(), number: prev.length + 1 }];
            }
            return prev.map((p, i) =>
                i === editingIndex ? { ...data, number: p.number } : p
            );
        });
        closeForm();
        setEditingIndex(null);
    };

    const handleRemove = idx => {
        closeForm();
        setItems(prev =>
            prev
                .filter((_, i) => i !== idx)
                .map((p, i) => ({ ...p, number: i + 1 }))
        );
        setEditingIndex(null);
    };

    const defaultData = { id: null, product: defs[0]?.field || '', quantity: 1 };

    return (
        <CintraHRDefsContext.Provider value={defs}>
            <Flex direction="column" gap="md">
                <CintraHRList
                    items={items}
                    onEdit={openForm}
                    openForm={openForm}
                    onRemove={handleRemove}
                    closeForm={closeForm}
                    handleSave={handleSave}
                    editingIndex={editingIndex}
                    defaultData={defaultData}
                />
            </Flex>
        </CintraHRDefsContext.Provider>
    );
};
