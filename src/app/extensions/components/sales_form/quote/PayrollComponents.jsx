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
import { v4 as uuidv4 } from "uuid";

// Contexts
const PayrollFrequenciesContext = createContext([]);
const ProductDefsContext = createContext([]);

export const usePayrollFrequencies = () => useContext(PayrollFrequenciesContext);
export const useProductDefs = () => useContext(ProductDefsContext);

// Fetch hooks
export function useFetchPayrollFrequencies(hubDbTableId) {
    const [data, setData] = useState([]);

    useEffect(() => {
        hubspot
        .serverless("get_table_rows", {
            parameters: { tableName: "cintra_calculator_payroll_frequency" },
        })
        .then((res) => {
            const rows = res.body.rows
            .map((r) => ({
                id: r.id,
                frequency: r.values.name,
                discount: r.values.discount,
                sort_order: r.values.sort_order,
            }))
            .sort((a, b) => b.sort_order - a.sort_order);

            setData(rows);
        })
        .catch(console.warn);
    }, [hubDbTableId]);

    return data;
}

export function useFetchProductDefs(hubDbTableId) {
    const [defs, setDefs] = useState([]);

    useEffect(() => {
        hubspot
        .serverless("get_table_rows", {
            parameters: { tableName: "cintra_calculator_payroll_products" },
        })
        .then((res) => {
            const rows = res.body.rows.map((r) => ({
                field: r.id,
                label: r.values.name,
                type: r.values.product_input_type.name,
                product_type: r.values.product_type.name,
            }));

            setDefs(rows);
        })
        .catch(console.warn);
    }, [hubDbTableId]);

    return defs;
}

// ProductInputs component
const ProductInputs = ({ formData, onInputChange, onToggleChange }) => {
    const defs = useProductDefs();
    const coreItems = defs.filter((d) => d.product_type === "core");
    const addonItems = defs.filter((d) => d.product_type === "add-on");

    return (
        <>
            <PanelSection>
                <Text format={{ fontWeight: "bold" }}>Core Payroll Products</Text>
                <Flex direction="column" gap="small">
                    {coreItems.map((d) => (
                        <Flex key={d.field} justify="between" align="center">
                            <Text>{d.label}</Text>
                            {d.type === "toggle" ? (
                                <Toggle
                                    checked={formData[d.field]}
                                    onChange={onToggleChange(d.field)}
                                    textChecked="Yes"
                                    textUnchecked="No"
                                />
                            ) : (
                                <StepperInput
                                    value={formData[d.field]}
                                    min={0}
                                    onChange={onInputChange(d.field)}
                                />
                            )}
                        </Flex>
                    ))}
                    <Divider />
                </Flex>
            </PanelSection>

            <PanelSection>
                <Text format={{ fontWeight: "bold" }}>Additional Payroll Products</Text>
                <Flex direction="column" gap="small">
                    {addonItems.map((d) => (
                        <Flex key={d.field} justify="between" align="center">
                            <Text>{d.label}</Text>
                            {d.type === "toggle" ? (
                                <Toggle
                                    checked={formData[d.field]}
                                    onChange={onToggleChange(d.field)}
                                    textChecked="Yes"
                                    textUnchecked="No"
                                />
                            ) : (
                                <StepperInput
                                    value={formData[d.field]}
                                    min={0}
                                    onChange={onInputChange(d.field)}
                                />
                            )}
                        </Flex>
                    ))}
                </Flex>
            </PanelSection>
        </>
    );
};

// PayrollForm component
export const PayrollForm = ({ isOpen, onClose, onSave, editingData }) => {
    const defs = useProductDefs();
    const freqs = usePayrollFrequencies();
    const [data, setData] = useState(editingData);

    useEffect(() => {
        setData(editingData);
    }, [editingData]);

    const onInputChange = (field) => (value) =>
        setData((prev) => ({ ...prev, [field]: value }));
    const onToggleChange = (field) => (checked) =>
        setData((prev) => ({ ...prev, [field]: checked }));

    const hasCore = defs
        .filter((d) => d.product_type === "core")
        .some((d) => (d.type === "toggle" ? data[d.field] : data[d.field] > 0));

    const isValid = Boolean(data.frequency) && hasCore;

    return (
        <Panel
            id="payroll_form"
            title={editingData?.id ? "Edit Payroll" : "Add Payroll"}
            isOpen={isOpen}
            onClose={onClose}
        >
            <PanelBody>
                <PanelSection flush>
                    <Flex direction="column" gap="small">
                        <Text format={{ fontWeight: "bold" }}>Payroll Details</Text>
                        <Flex justify="between" align="center">
                            <Text>Number of Employees</Text>
                            <StepperInput
                                value={data.numberOfEmployees}
                                min={1}
                                onChange={onInputChange("numberOfEmployees")}
                            />
                        </Flex>
                        <Flex justify="between" align="center">
                            <Text>Frequency</Text>
                            <Select
                                options={freqs.map((f) => ({ label: f.frequency, value: f.frequency }))}
                                value={data.frequency}
                                onChange={(e) => onInputChange("frequency")(e)}
                            />
                        </Flex>
                    </Flex>
                    <Divider />
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
                    <Button variant="primary" onClick={() => onSave(data)} disabled={!isValid}>
                        {editingData?.id ? "Update Payroll" : "Add Payroll"}
                    </Button>
                </Flex>
            </PanelFooter>
        </Panel>
    );
};

// RowActions component
const RowActions = ({ onEdit, onClone, onRemove, closeForm, save, editingIndex, list, defaultData }) => (
    <Flex justify="end" align="center" gap="sm">
        <Button
            variant="transparent"
            onClick={onEdit}
            overlay={<PayrollForm isOpen onClose={closeForm} onSave={save} editingData={editingIndex === null ? defaultData : list[editingIndex]} />}
        >
            <Icon name="edit"/> 
            Edit
        </Button>
        {onClone && (<Button variant="transparent" onClick={onClone}> <Icon name="copy"/> Clone </Button>)}
        {onRemove && (<Button variant="transparent" onClick={onRemove}> <Icon name="delete"/> Remove </Button>)}
    </Flex>
);

// PayrollList component
export const PayrollList = ({ list, onEdit, onClone, onRemove, closeForm, save, editingIndex, defaultData, open }) => {
    const defs = useProductDefs();

    return (
        <Accordion title="Payrolls" defaultOpen>
            {list.length === 0 ? (
                <Text>No Payroll products have been added.</Text>
            ) : (
                list.map((p, i) => (
                    <Table key={p.id}>
                        <TableHead>
                            <TableRow>
                                <TableHeader>Payroll {p.number}: {p.numberOfEmployees} {p.frequency} Employees</TableHeader>
                                <TableHeader>
                                    <RowActions
                                        onEdit={() => onEdit(i)}
                                        onClone={() => onClone(i)}
                                        onRemove={() => onRemove(i)}
                                        closeForm={closeForm}
                                        save={save}
                                        editingIndex={editingIndex}
                                        list={list}
                                        defaultData={defaultData}
                                    />
                                </TableHeader>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {defs.filter((d) => (d.type === 'toggle' ? p[d.field] : p[d.field] > 0))
                                .map((d) => (
                                <TableRow key={`${p.id}-${d.field}`}>                  
                                    <TableCell>{d.label}</TableCell>
                                    <TableCell align="right"> {d.type === 'toggle' ? <Icon name="success" /> : p[d.field]} </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ))
            )}
            <Flex>
                <Button
                    variant="secondary"
                    onClick={() => open(null)}
                    overlay={<PayrollForm isOpen onClose={closeForm} onSave={save} editingData={editingIndex === null ? defaultData : list[editingIndex]} />}
                >
                Add Payroll
                </Button>
            </Flex>
        </Accordion>
    );
};

// PayrollSummary component
export const PayrollSummary = ({ list, onEdit, closeForm, save, editingIndex, defaultData, open }) => {
    const defs = useProductDefs();

    const unit_price = 0 
    const quantity = 0
    const discount = 0 
    const estimated_monthly_fee = 0 

    return (
        <Accordion title="Payrolls" defaultOpen>
            {list.length === 0 ? (
                <Text>No Payroll products have been added.</Text>
            ) : (
                list.map((p, i) => (
                    <Table key={p.id}>
                        <TableHead>
                            <TableRow>
                                <TableHeader>Payroll {p.number}: {p.numberOfEmployees} {p.frequency} Employees</TableHeader>
                                <TableHeader>
                                    <RowActions
                                        onEdit={() => onEdit(i)}
                                        closeForm={closeForm}
                                        save={save}
                                        editingIndex={editingIndex}
                                        list={list}
                                        defaultData={defaultData}
                                    />
                                </TableHeader>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {defs.filter((d) => (d.type === 'toggle' ? p[d.field] : p[d.field] > 0))
                                .map((d) => (
                                    <TableRow key={`${p.id}-${d.field}`}>                  
                                        <TableCell>{d.label}</TableCell>
                                        <TableCell align="right"> {d.type === 'toggle' ? <Icon name="success" /> : p[d.field]} </TableCell>
                                    </TableRow>
                                ))
                            }
                        </TableBody>
                    </Table>
                ))
            )}
            <Flex>
                <Button
                    variant="secondary"
                    onClick={() => open(null)}
                    overlay={<PayrollForm isOpen onClose={closeForm} onSave={save} editingData={editingIndex === null ? defaultData : list[editingIndex]} />}
                >
                Add Payroll
                </Button>
            </Flex>
        </Accordion>
    );
};

// PayrollContainer component
export const PayrollContainer = ({ actions, initialItems = [], summary=false, hubDbTableId, onChange }) => {
    const defs = useFetchProductDefs(hubDbTableId);
    const freqs = useFetchPayrollFrequencies(hubDbTableId);

    // Helper to build nested product list for output
    const buildOutput = (flatList) => flatList.map((item) => ({
        id: item.id,
        numberOfEmployees: item.numberOfEmployees,
        frequency: item.frequency,
        number: item.number,
        products: defs.map((d) => ({ id: d.field, name: d.label, value: item[d.field] })),
    }));

    // Flatten incoming initialItems for internal state
    const flattenItem = (item, idx) => {
        const flat = { id: item.id, numberOfEmployees: item.numberOfEmployees, frequency: item.frequency, number: idx + 1 };
        item.products.forEach((p) => {
            flat[p.id] = p.value;
        });
        return flat;
    };

    const [list, setList] = useState(() => initialItems.map(flattenItem));
    const [editIdx, setEditIdx] = useState(null);

    const open = (idx) => setEditIdx(idx);
    const close = () => actions.closeOverlay("payroll_form");

    const save = (data) => {
        setList((prev) => {
            const newList =
                editIdx === null ?
                [...prev, { ...data, id: uuidv4(), number: prev.length + 1 }] :
                prev.map((p, i) => (i === editIdx ? { ...data, number: p.number } : p));
            onChange && onChange("Payroll", buildOutput(newList));
            return newList;
        });
        close();
        setEditIdx(null);
    };

    const clone = (idx) => setList((prev) => {
        const itemToClone = prev[idx];
        const cloned = { ...JSON.parse(JSON.stringify(itemToClone)), id: uuidv4() };
        const newList = [...prev.slice(0, idx + 1), cloned, ...prev.slice(idx + 1)];
        newList.forEach((p, i) => (p.number = i + 1));
        onChange && onChange("Payroll", buildOutput(newList));
        return newList;
    });

    const remove = (idx) => {
        close();
        setList((prev) => {
            const newList = prev.filter((_, i) => i !== idx).map((p, i) => ({ ...p, number: i + 1 }));
            onChange && onChange("Payroll", buildOutput(newList));
            return newList;
        });
        setEditIdx(null);
    };

    const defaultData = { id: null, numberOfEmployees: 1, frequency: "", products: defs.map((d) => ({ id: d.field, name: d.label, value: d.type === "toggle" ? false : 0 })) };

    return (
        <PayrollFrequenciesContext.Provider value={freqs}>
            <ProductDefsContext.Provider value={defs}>
                <Flex direction="column" gap="md">
                    { summary ? (
                        <PayrollSummary
                            list={list}
                            onEdit={open}
                            open={open}
                            save={save}
                            editingIndex={editIdx}
                            defaultData={defaultData}
                        />
                    ) : (
                        <PayrollList
                            list={list}
                            onEdit={open}
                            open={open}
                            onClone={clone}
                            onRemove={remove}
                            closeForm={close}
                            save={save}
                            editingIndex={editIdx}
                            defaultData={defaultData}
                        />
                    )}
                </Flex>
            </ProductDefsContext.Provider>
        </PayrollFrequenciesContext.Provider>
    );
};
