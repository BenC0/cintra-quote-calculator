import React, { useState, useEffect, createContext, useContext } from "react";
import { Divider, Button, hubspot, Flex, Accordion, } from "@hubspot/ui-extensions";
import { QuoteSheetComponent } from "./components/summary/QuoteSheet";
import { QuoteSummaryComponent } from "./components/summary/QuoteSummary";
import { PSQFeesContainer } from "./components/implementation/PSQFeesComponent";
import { QuoteSummaryTableComponent } from "./components/summary/QuoteSummaryTable";
import { QuoteDetailsFormComponent } from "./components/sales_form/QuoteDetailsForm";
import { ClientDetailsFormComponent } from "./components/sales_form/ClientDetailsForm";
import { QuoteSummarySubTableComponent } from "./components/summary/QuoteSummarySubTable";
import { ProductTypeAccordion } from "./components/sales_form/quote/ProductTypeAccordion";

function useFetchDefs(tableName, transformation = e => e, sort_key = null) {
    const [defs, setDefs] = useState([]);

    useEffect(() => {
        hubspot
        .serverless("get_table_rows", {
            parameters: { tableName },
        })
        .then((res) => {
            let rows = res.body.rows.map((r) => transformation(r));
            if (!!sort_key) {
                rows = rows.sort((a, b) => a[sort_key] - b[sort_key])
            }
            setDefs(rows);
        })
        .catch(console.warn);
    }, [tableName]);

    return defs;
}

// Register the extension in HubSpot CRM sidebar
hubspot.extend(({ context, runServerlessFunction, actions }) => (
    <Extension
        context={context}
        runServerless={runServerlessFunction}
        actions={actions}
    />
));

const ProductDefsContext = createContext([]);
const useProductDefs = () => useContext(ProductDefsContext);
const ProductTypeDefsContext = createContext([]);
const useProductTypeDefs = () => useContext(ProductTypeDefsContext);

// Main Extension component managing a 3‑page wizard
const Extension = ({ context, runServerless, actions }) => {
    const get_first_value = (name, ob) => ob["values"][name][0];
    // Initialize QuoteData as an empty object when the component mounts
    // const productTypeDefs = useFetchDefs("cintra_calculator_product_types", r => console.log(r))
    const productTypeDefs = useFetchDefs("cintra_calculator_product_types", r => ({
        field: r.id,
        label: r.values.name,
        sort_order: r.values.sort_order,
        input_display_type: r.values.input_display_type.name,
    }), "sort_order");
    
    // const productDefs = useFetchDefs("cintra_calculator_products", r => console.log(r))
    const productDefs = useFetchDefs("cintra_calculator_products", r => ({
        field: r.id,
        label: r.values.name,
        input_values_table: r.input_values_table,
        input_type: get_first_value("input_type", r).name,
        pricing_structure: get_first_value("pricing_structure", r),
        product_type: get_first_value("product_type", r),
        product_sub_type: r.values.product_sub_type,
    }));
    const [valueTables, setValueTables] = useState({});
    useEffect(() => {
        let filtered = productDefs.filter(a => !!a["input_values_table"])
        console.warn({productDefs, filtered})
        setValueTables(filtered.map(f => useFetchDefs(f, r => r)))
    }, productDefs)

    const TESTING = true
    const TESTINGPAGE = 1
    const default_data = {
        "241712266462": {
            "241712266460": false,
            "241731552473": false,
            "241712266465": null,
            "241712266463": false,
            "241709571284": false,
        },
        "Implementation Fees": {
            "Payroll": {},
            "H&A": {},
            "Other": {},
        }
    }
    const test_data = {
        "241712266462": {
            "241712266460": true,
            "241731552473": true,
            "241712266465": 36,
            "241712266463": false,
            "241709571284": true,
        },
        "241712266439": [
            {
                "id": "a27cb33e-a0a3-4305-851e-58461336b48a",
                "numberOfEmployees": 50,
                "frequency": "Lunar",
                "products": [
                    { id: "240079361245", value: false },
                    { id: "240079361246", value: false },
                    { id: "240117745880", value: true },
                    { id: "240117745881", value: false },
                    { id: "240117745882", value: false },
                    { id: "240117745883", value: false },
                    { id: "240117745884", value: 50 },
                    { id: "240117745885", value: 0 },
                    { id: "240117745886", value: false },
                ],
                "number": 1
            },
            {
                "id": "a27cb33e-a0a3-4305-851e-58461336b48a",
                "numberOfEmployees": 150,
                "frequency": "Monthly",
                "products": [
                    { id: "240079361245", value: false },
                    { id: "240079361246", value: false },
                    { id: "240117745880", value: false },
                    { id: "240117745881", value: true },
                    { id: "240117745882", value: true },
                    { id: "240117745883", value: true },
                    { id: "240117745884", value: 75 },
                    { id: "240117745885", value: 75 },
                    { id: "240117745886", value: true },
                ],
                "number": 1
            }
        ],
        "241712266440": [{
            "id": "fa2267e1-5197-45ba-bc8f-f725e88101c5",
            "product": "240117744884",
            "quantity": 1,
            "number": 1
        }],
        "241706082530": [{
            "id": "8d86fd90-3c4e-4199-81d0-5d99ec68df1c",
            "numberOfEmployees": 1,
            "240117745887": true,
            "240117745888": false,
            "number": 1
        }],
        "241712266441": [{
            "id": "81b08f98-0815-4dc5-b889-2a96916b4d09",
            "numberOfEmployees": 1,
            "product": "240117745900",
            "number": 1
        }],
        "Custom Products": [{
            "id": "80c753bc-4162-43be-9488-78a972602829",
            "productName": "dfsafsdf",
            "quantity": 2,
            "listPrice": 4,
            "number": 1
        }],
        "Implementation Fees": {
            "H&A": {
                "240613931250": 2,
                "240613931251": 0,
                "240613931252": 0,
                "240613931253": 0,
                "240613931254": 0
            },
            "Other": {
                "240613931255": 1,
                "240613931256": 0,
                "240613931257": 0,
                "240613932218": 0,
                "240614280390": 1,
                "240614280391": 0
            },
            "Payroll": {
                "240613931240": 0,
                "240613931241": 1,
                "240613931242": 0,
                "240613931243": 0,
                "240613931244": 3,
                "240613931245": 0,
                "240613931246": 1,
                "240613931247": 0,
                "240613931248": 0,
                "240613931249": 0
            }
        }
    }
    // aggregated data from child components, with defaults for ClientDetails
    const [allData, setAllData] = useState(TESTING ? test_data : default_data);
    // current page: 1=QuoteDetails, 2=Implementation Fees, 3=Quote Sheet
    const [currentPage, setCurrentPage] = useState(TESTINGPAGE);
    const [productTypeAccordions, setProductTypeAccordions] = useState([]);

    // generic handler merges updates by source
    const handler = (source, updatedItems) => {
        setAllData(prev => {
            const next = { ...prev, [source]: updatedItems };
            console.log('allData updated:', next);
            return next;
        });
    };

    useEffect(() => {
        // console.warn({productTypeDefs, productDefs, allData})
        setProductTypeAccordions(productTypeDefs.map(productType => {
            let output = productType
            output["fields"] = productDefs.filter(a => a["product_type"]["id"] == productType["field"])
            // Todo: get and store values here.
            output["fields"] = output["fields"].map(field => {
                let values = null
                switch (field.input_type) {
                    case "Toggle":
                        values = {
                            active: "On",
                            inactive: "Off"
                        }
                        break;
                        case "Number":
                            values = {
                                min: 0,
                            }
                            break;
                        case "Radio":
                        case "Dropdown":
                            values = null
                            break;
                    default:
                        return null;
                }
                field["values"] = values
                return field
            })
            // console.warn({output})
            return output
        }))
        // console.warn({productTypeAccordions})
    }, [productTypeDefs, productDefs, allData]);

    // readiness check to enable calculate button
    const isPage1Ready =
        allData.ClientDetails &&
        Array.isArray(allData['Payroll']) && allData['Payroll'].length > 0;

    return (
        <Flex direction="column" gap="md">
            {currentPage === 1 && (
                <>  {/* Page 1: initial quote details */}
                    {productTypeAccordions.map((productType, i) => (
                        <ProductTypeAccordion productType={productType} />                
                    ))}
                    {/* <ClientDetailsFormComponent
                        formData={allData.ClientDetails}
                        onChange={handler}
                    />
                    <Divider />
                    <QuoteDetailsFormComponent
                        actions={actions}
                        handler={handler}
                        allData={allData}
                    />
                    <QuoteSummaryComponent allData={allData} /> */}
                    <Flex justify="end">
                        <Button
                            disabled={!isPage1Ready}
                            onClick={() => setCurrentPage(2)}
                        >
                            Calculate Implementation Fees
                        </Button>
                    </Flex>
                </>
            )}

            {currentPage === 2 && (
                <>  {/* Page 2: Implementation Fee (placeholder) */}
                    <QuoteSummaryTableComponent allData={allData} />
                    {/* Implementation Fee content to be added later */}
                    <PSQFeesContainer
                        onChange={handler}
                        initialItems={allData["Implementation Fees"]}
                    />
                    <QuoteSummaryComponent
                        allData={allData}
                        supress_implementation_fee={false}
                    />
                    <Flex justify="end" gap="small">
                        <Button variant="secondary" onClick={() => setCurrentPage(1)}>
                            Review Schedule
                        </Button>
                        <Button onClick={() => setCurrentPage(3)}>
                            Next: Quote Sheet
                        </Button>
                    </Flex>
                </>
            )}

            {currentPage === 3 && (
                <>  {/* Page 3: Quote Sheet summary (placeholder) */}
                    <QuoteSheetComponent
                        allData={allData}
                        actions={actions}
                    />
                    {/* Quote Sheet content to be added later */}
                    <Flex justify="end" gap="small">
                        <Button variant="secondary" onClick={() => setCurrentPage(1)}>
                            Review Schedule
                        </Button>
                        <Button variant="secondary" onClick={() => setCurrentPage(2)}>
                            Review Implementation Fee
                        </Button>
                        <Button variant="primary" onClick={() => { /* finalize or export */ }}>
                            Finish
                        </Button>
                    </Flex>
                </>
            )}
        </Flex>
    );
};

export default Extension;
