import React, { useState, useEffect } from "react";
import {
    Text,
    Flex,
    Icon,
    Table,
    TableBody,
    TableRow,
    TableCell,
    hubspot,
    Divider,
    TableFooter,
} from "@hubspot/ui-extensions";

const QuoteSummaryTableComponent = ({ allData = {} }) => {
    // Don't render if there's no data
    if (!allData || Object.keys(allData).length === 0) {
        return null;
    }

    // Fetch product definitions for payroll products
    const [productDefs, setProductDefs] = useState([]);
    useEffect(() => {
        hubspot
            .serverless("get_table_rows", { parameters: { tableName: "cintra_calculator_payroll_products" } })
            .then((res) => {
                const defs = res.body.rows.map((r) => ({
                    field: r.id,
                    label: r.values.name,
                    type: r.values.product_input_type.name,
                    product_type: r.values.product_type.name,
                }));
                setProductDefs(defs);
            })
            .catch(console.warn);
    }, []);

    // Extract counts and boolean flags
    const payrollList = allData["Payroll"] || [];
    const payrollCount = payrollList.length;
    const hrOutsourcingCount = allData["HR Outsourcing"]?.length || 0;
    const customProductCount = allData["Custom Products"]?.length || 0;
    const hasCintraHR = (allData["CintraHR"]?.length || 0) > 0;
    const hasCaptureExpense = (allData["Capture Expense"]?.length || 0) > 0;
    const impFee = allData["Implementation Fees Total"] || 0

    // Build summary of payroll products
    let product_maps = [];
    payrollList.forEach((p) => {
        p.products.forEach((prod) => {
            const def = productDefs.find((d) => d.field === prod.id);
            product_maps.push({
                id: prod.id,
                label: def?.label || prod.id,
                type: def?.type || "",
                product_type: def?.product_type || "",
                value: prod.value,
            });
        });
    });
    
    const implementationCalculated = false

    // Total employees
    let totalEmployees = 0;
    payrollList.forEach((p) => (totalEmployees += p.numberOfEmployees));

    // Client Details
    const clientDetails = allData["ClientDetails"] || {};
    const { isPublicSector, isEducation, contractLength, groupsInsight, customInterface } = clientDetails;
    let sector = []
    if (isPublicSector) {
        sector.push("Public")
    }
    if (isEducation) {
        sector.push("Education")
    }
    if (sector.length == 0) {
        sector.push("N/A")
    }
    sector = sector.join(", ")
    
    let interfaceType = "Standard"
    if (customInterface) {
        interfaceType = "Custom"
    }

    let cintraPayrollProducts = product_maps.filter(a => a.product_type == "core" && a.value)
    cintraPayrollProducts = cintraPayrollProducts.map(a => a.label, "")
    cintraPayrollProducts = [...new Set(cintraPayrollProducts)].join(", ")

    let holidayAndAbscenses = product_maps.filter(a => a.label == "Holiday and Absence Management" && a.value)
    let timeSheets = product_maps.filter(a => a.label == "Time Sheets - Self Service" && a.value)

    // If nothing to display
    if (
        payrollCount === 0 &&
        hrOutsourcingCount === 0 &&
        customProductCount === 0 &&
        !hasCintraHR &&
        !hasCaptureExpense &&
        !isPublicSector &&
        !isEducation &&
        !contractLength &&
        !groupsInsight
    ) {
        return null;
    }

    return (
        <Flex direction="column" align="stretch" gap="md">
            <Text format={{ fontWeight: "bold", fontSize: "lg" }}>Quote Summary</Text>
            <Table>
                <TableBody>
                    <TableRow>
                        <TableCell><Text format={{ fontSize: "md", fontWeight: "regular" }}>Cintra Payroll {cintraPayrollProducts.length > 1 ? "Products" : "Product"}</Text></TableCell>
                        <TableCell align="right">
                            <Text format={{ fontWeight: "bold", fontSize: "md" }}>{cintraPayrollProducts}</Text>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell><Text format={{ fontSize: "md", fontWeight: "regular" }}>Sector</Text></TableCell>
                        <TableCell align="right">
                            <Text format={{ fontWeight: "bold", fontSize: "md" }}>{sector}</Text>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell><Text format={{ fontSize: "md", fontWeight: "regular" }}>Payrolls</Text></TableCell>
                        <TableCell align="right"><Text format={{ fontWeight: "bold", fontSize: "md" }}>{payrollCount}</Text></TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell><Text format={{ fontSize: "md", fontWeight: "regular" }}>Headcount</Text></TableCell>
                        <TableCell align="right">
                            <Text format={{ fontWeight: "bold", fontSize: "md" }}>{totalEmployees}</Text>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell><Text format={{ fontSize: "md", fontWeight: "regular" }}>Holidays & Absence</Text></TableCell>
                        <TableCell align="right">
                            {holidayAndAbscenses.length > 0 ? <Icon name="success" /> : <Icon name="remove" />}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell><Text format={{ fontSize: "md", fontWeight: "regular" }}>Timesheets</Text></TableCell>
                        <TableCell align="right">
                            {timeSheets.length > 0 ? <Icon name="success" /> : <Icon name="remove" />}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell><Text format={{ fontSize: "md", fontWeight: "regular" }}>CintraHR</Text></TableCell>
                        <TableCell align="right">
                            {hasCintraHR ? <Icon name="success" /> : <Icon name="remove" />}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell><Text format={{ fontSize: "md", fontWeight: "regular" }}>Cintra Groups</Text></TableCell>
                        <TableCell align="right">
                            {groupsInsight ? <Icon name="success" /> : <Icon name="remove" />}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell><Text format={{ fontSize: "md", fontWeight: "regular" }}>Capture Expense</Text></TableCell>
                        <TableCell align="right">
                            {hasCaptureExpense ? <Icon name="success" /> : <Icon name="remove" />}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell><Text format={{ fontSize: "md", fontWeight: "regular" }}>Interface</Text></TableCell>
                        <TableCell align="right"><Text format={{ fontSize: "md", fontWeight: "bold" }}>{interfaceType}</Text></TableCell>
                    </TableRow>
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell><Text format={{ fontSize: "md", fontWeight: "bold" }}>Total Implementation Charges</Text></TableCell>
                        { impFee != 0 ? (
                            <TableCell align="right"><Text format={{ fontSize: "md", fontWeight: "bold" }}>£{impFee.toFixed(2)}</Text></TableCell>
                        ) : (
                            <TableCell align="right">
                                <Icon name="question" />
                            </TableCell>
                        ) }
                    </TableRow>
                </TableFooter>
            </Table>
            <Divider />
        </Flex>
    );
};

export { QuoteSummaryTableComponent };
