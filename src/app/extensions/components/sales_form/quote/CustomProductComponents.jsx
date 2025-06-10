import React, { useState, useEffect } from "react";
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
    Input,
} from "@hubspot/ui-extensions";
import { v4 as uuidv4 } from 'uuid';

// Form panel for adding/editing a Custom Product entry
export const CustomProductsForm = ({ isOpen, onClose, onSave, editingData }) => {
    const [formData, setFormData] = useState(editingData);

    useEffect(() => {
        setFormData(editingData);
    }, [editingData]);

    const handleChange = field => value => setFormData(fd => ({ ...fd, [field]: value }));

    // Validation: require a name, quantity >=1, listPrice >= 0
    const isValid = Boolean(formData.productName) && formData.quantity >= 1 && formData.listPrice >= 0;

    return (
        <Panel
            id="custom_products_form"
            title={editingData?.id ? 'Edit Custom Product' : 'Add Custom Product'}
            isOpen={isOpen}
            onClose={onClose}
        >
            <PanelBody>
                <PanelSection>
                    <Text format={{ fontWeight: 'bold' }}>Product Name</Text>
                    <Input
                        name="productName"
                        value={formData.productName}
                        onChange={evt => handleChange('productName')(evt)}
                        placeholder="Enter product name"
                    />
                </PanelSection>
                <Divider />
                <PanelSection>
                    <Text format={{ fontWeight: 'bold' }}>Quantity</Text>
                    <StepperInput
                        name="quantity"
                        min={1}
                        value={formData.quantity}
                        stepSize={1}
                        onChange={handleChange('quantity')}
                    />
                </PanelSection>
                <Divider />
                <PanelSection>
                    <Text format={{ fontWeight: 'bold' }}>List Price</Text>
                    <StepperInput
                        name="listPrice"
                        min={0}
                        value={formData.listPrice}
                        stepSize={1}
                        onChange={handleChange('listPrice')}
                    />
                </PanelSection>
            </PanelBody>
            <PanelFooter>
                <Flex justify="end">
                    <Button variant="primary" onClick={() => onSave(formData)} disabled={!isValid}>
                        {editingData?.id ? 'Update Custom Product' : 'Add Custom Product'}
                    </Button>
                </Flex>
            </PanelFooter>
        </Panel>
    );
};

// Row actions for each custom product entry
const CustomProductsRowActions = ({ onEdit, onClone, onRemove, closeForm, handleSave, editingIndex, items, defaultData }) => (
    <Flex justify="end" align="center" gap="sm">
        <Button
            variant="transparent"
            onClick={onEdit}
            overlay={
                <CustomProductsForm
                    isOpen={true}
                    onClose={closeForm}
                    onSave={handleSave}
                    editingData={editingIndex === null ? defaultData : items[editingIndex]}
                />
            }
        >
            <Icon name="edit"/> Edit
        </Button>
        <Button variant="transparent" onClick={onClone}>
            <Icon name="copy"/> Clone
        </Button>
        <Button variant="transparent" onClick={onRemove}>
            <Icon name="delete"/> Remove
        </Button>
    </Flex>
);

// List display for Custom Products entries
export const CustomProductsList = ({ items, onEdit, onClone, onRemove, closeForm, handleSave, editingIndex, defaultData, openForm }) => (
    <Accordion title="Custom Products" defaultOpen>
        {items.length === 0 ? (
            <Text>No custom products added.</Text>
        ) : (
            items.map((entry, idx) => (
                <Table key={entry.id}>
                    <TableBody>
                        <TableRow>
                            <TableCell>
                                <Text format={{ fontWeight: 'demibold' }}> Custom Product {entry.number} </Text>
                            </TableCell>
                            <TableCell colSpan={3}>
                                <CustomProductsRowActions
                                    onEdit={() => onEdit(idx)}
                                    onClone={() => onClone(idx)}
                                    onRemove={() => onRemove(idx)}
                                    closeForm={closeForm}
                                    handleSave={handleSave}
                                    editingIndex={editingIndex}
                                    items={items}
                                    defaultData={defaultData}
                                />
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell align="left"> Name </TableCell>
                            <TableCell align="right"> List Price </TableCell>
                            <TableCell align="right"> Quantity </TableCell>
                            <TableCell align="right"> Estimated Monthly Fees </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell align="left"> {entry.productName} </TableCell>
                            <TableCell align="right"> £{entry.listPrice} </TableCell>
                            <TableCell align="right"> {entry.quantity} </TableCell>
                            <TableCell align="right"> £{entry.listPrice * entry.quantity} </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            ))
        )}
        <Flex>
            <Button
                variant="secondary"
                onClick={() => openForm(null)}
                overlay={
                    <CustomProductsForm
                        isOpen={true}
                        onClose={closeForm}
                        onSave={handleSave}
                        editingData={editingIndex === null ? defaultData : items[editingIndex]}
                    />
                }
            >
                Add Custom Product
            </Button>
        </Flex>
    </Accordion>
);

// Container orchestrating Custom Products state and actions
export const CustomProductsContainer = ({ actions, initialItems = [], onChange }) => {
    const [items, setItems] = useState(() =>
        initialItems.map((item, idx) => ({ ...item, number: idx + 1 }))
    );
    const [editingIndex, setEditingIndex] = useState(null);

    // Notify parent on changes
    useEffect(() => { if (onChange) onChange("Custom Products", items); }, [items]);

    const openForm = idx => setEditingIndex(idx);
    const closeForm = () => actions.closeOverlay('custom_products_form');

    const handleSave = data => {
        setItems(prev => {
            if (editingIndex === null) {
                return [...prev, { ...data, id: uuidv4(), number: prev.length + 1 }];
            }
            return prev.map((item, i) => (i === editingIndex ? { ...data, number: item.number } : item));
        });
        closeForm();
        setEditingIndex(null);
    };

    const handleClone = idx => {
        setItems(prev => {
            const item = prev[idx];
            const clone = { ...JSON.parse(JSON.stringify(item)), id: uuidv4() };
            const updated = [...prev.slice(0, idx + 1), clone, ...prev.slice(idx + 1)];
            return updated.map((p, i) => ({ ...p, number: i + 1 }));
        });
    };

    const handleRemove = idx => {
        closeForm();
        setItems(prev =>
            prev.filter((_, i) => i !== idx).map((p, i) => ({ ...p, number: i + 1 }))
        );
        setEditingIndex(null);
    };

    // Default template for new entries
    const defaultData = { id: null, productName: "", quantity: 1, listPrice: 0 };

    return (
        <Flex direction="column" gap="md">
            <CustomProductsList
                items={items}
                onEdit={openForm}
                onClone={handleClone}
                onRemove={handleRemove}
                closeForm={closeForm}
                handleSave={handleSave}
                editingIndex={editingIndex}
                defaultData={defaultData}
                openForm={openForm}
            />
        </Flex>
    );
};
