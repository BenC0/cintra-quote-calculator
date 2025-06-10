import React from "react";
import {
    Divider,
    Text,
    Flex,
    Tile,
    Icon,
} from "@hubspot/ui-extensions";

const QuoteSummaryComponent = ({ allData = {}, supress_implementation_fee = true }) => {
    // Don't render if there's no data
    if (!allData || Object.keys(allData).length === 0) {
        return null;
    }

    // Extract counts and boolean flags
    const payrollCount = allData["Payroll"]?.length || 0;
    const hrOutsourcingCount = allData["HR Outsourcing"]?.length || 0;
    const customProductCount = allData["Custom Products"]?.length || 0;
    const hasCintraHR = (allData["CintraHR"]?.length || 0) > 0;
    const hasCaptureExpense = (allData["Capture Expense"]?.length || 0) > 0;
    let totalEmployees = 0
    allData["Payroll"]?.forEach(p => totalEmployees += p.numberOfEmployees)
    // Client Details is a single object
    const clientDetails = allData["ClientDetails"];

    // Destructure client details into individual flags
    const isPublicSector = clientDetails?.isPublicSector;
    const isEducation = clientDetails?.isEducation;
    const contractLength = clientDetails?.contractLength;
    const groupsInsight = clientDetails?.groupsInsight;
    const impFee = allData["Implementation Fees Total"] || 0

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
                {!supress_implementation_fee && impFee > 0 && (
                    <Tile>
                        <Text format={{ fontSize: 'md' }}>Total Implementation Charges</Text>
                        <Text format={{ fontWeight: 'bold', fontSize: 'md' }}>£{impFee.toFixed(2)}</Text>
                    </Tile>
                )}
            </Flex>
        </Flex>
    );
};

export { QuoteSummaryComponent };
