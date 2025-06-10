import React, { useState, useEffect } from "react";
import {
    Text,
    Flex,
    Icon,
    Table,
    TableBody,
    TableRow,
    TableCell,
    Tile,
    hubspot,
    Divider,
    TableFooter,
} from "@hubspot/ui-extensions";

const QuoteSummarySubTableComponent = ({ allData = {} }) => {
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
        <Flex direction="column" align="start" gap="md">
            <Text format={{ fontWeight: "bold", fontSize: "lg" }}>Quote Summary</Text>
            {/* Main product tiles */}
            <Flex gap="small" wrap>
                {isPublicSector && (
                    <Tile>
                        <Icon name="success" />
                        <Text format={{ fontSize: 'md' }}>Public Sector Client</Text>
                    </Tile>
                )}
                {isEducation && (
                    <Tile>
                        <Icon name="success" />
                        <Text format={{ fontSize: 'md' }}>Education Client</Text>
                    </Tile>
                )}
                {contractLength > 0 && (
                    <Tile>
                        <Text format={{ fontWeight: 'bold', fontSize: 'md' }}>{contractLength}</Text>
                        <Text format={{ fontSize: 'md' }}>Months</Text>
                    </Tile>
                )}
                {groupsInsight && (
                    <Tile>
                        <Icon name="success" />
                        <Text format={{ fontSize: 'md' }}>Groups Insight</Text>
                    </Tile>
                )}
                {totalEmployees > 0 && (
                    <Tile>
                        <Text format={{ fontWeight: 'bold', fontSize: 'md' }}>{totalEmployees}</Text>
                        <Text format={{ fontSize: 'md' }}>Total Employees</Text>
                    </Tile>
                )}
                {payrollCount > 0 && (
                    <Tile>
                        <Text format={{ fontWeight: 'bold', fontSize: 'md' }}>{payrollCount}</Text>
                        <Text format={{ fontSize: 'md' }}>Payrolls</Text>
                    </Tile>
                )}
                {hrOutsourcingCount > 0 && (
                    <Tile>
                        <Text format={{ fontWeight: 'bold', fontSize: 'md' }}>{hrOutsourcingCount}</Text>
                        <Text format={{ fontSize: 'md' }}>HR Outsourcing</Text>
                    </Tile>
                )}
                {hasCintraHR && (
                    <Tile>
                        <Icon name="success" />
                        <Text format={{ fontSize: 'md' }}>CintraHR</Text>
                    </Tile>
                )}
                {hasCaptureExpense && (
                    <Tile>
                        <Icon name="success" />
                        <Text format={{ fontSize: 'md' }}>Capture Expense</Text>
                    </Tile>
                )}
                {customProductCount > 0 && (
                    <Tile>
                        <Text format={{ fontWeight: 'bold', fontSize: 'md' }}>{customProductCount}</Text>
                        <Text format={{ fontSize: 'md' }}>Custom Products</Text>
                    </Tile>
                )}
                {impFee > 0 && (
                    <Tile>
                        <Text format={{ fontSize: 'md' }}>Total Implementation Charges</Text>
                        <Text format={{ fontWeight: 'bold', fontSize: 'md' }}>£{impFee.toFixed(2)}</Text>
                    </Tile>
                )}
            </Flex>
        </Flex>
    );
};

export { QuoteSummarySubTableComponent };
