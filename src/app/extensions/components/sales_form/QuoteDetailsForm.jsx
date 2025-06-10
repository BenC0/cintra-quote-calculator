import React, { useState, useEffect, createContext, useContext } from "react";
import {
    hubspot,
    Divider,
    Text,
    Flex,
} from "@hubspot/ui-extensions";
import { QuoteComponentContainer } from "../shared/QuoteComponent"
import { PayrollContainer } from "./quote/PayrollComponents";
import { CintraHRContainer } from "./quote/CintraHRComponents";
import { HROutsourcingContainer } from "./quote/HROutsourcingComponents";
import { CaptureExpenseContainer } from "./quote/CaptureExpenseComponents";
import { CustomProductsContainer } from "./quote/CustomProductComponents";

const QuoteDetailsFormComponent = ({ actions, handler, allData }) => {   
    return ( 
        <>  
            <Flex direction="column" align="start" gap="md">
                <Text format={{ fontWeight: "bold" }}>Quote Details</Text>

                <QuoteComponentContainer
                    actions={actions}
                    initialItems={allData.Payroll || []}
                    onChange={handler}
                /> 
                <Divider />

                <PayrollContainer
                    actions={actions}
                    initialItems={allData.Payroll || []}
                    onChange={handler}
                /> 
                <Divider />

                <CintraHRContainer
                    actions={actions}
                    initialItems={allData.CintraHR || []}
                    onChange={handler}
                />
                <Divider />

                <HROutsourcingContainer
                    actions={actions}
                    initialItems={allData['HR Outsourcing'] || []}
                    onChange={handler}
                />
                <Divider />

                <CaptureExpenseContainer
                    actions={actions}
                    initialItems={allData['Capture Expense'] || []}
                    onChange={handler}
                />
                <Divider />

                <CustomProductsContainer
                    actions={actions}
                    initialItems={allData['Custom Products'] || []}
                    onChange={handler}
                />
                <Divider />
            </Flex>
        </>
    );
};

export { QuoteDetailsFormComponent };
