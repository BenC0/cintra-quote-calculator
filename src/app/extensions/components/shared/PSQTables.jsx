import React from "react";
import {
    Flex,
    Button,
    Text,
    Table,
    TableHead,
    TableHeader,
    Icon,
    TableRow,
    TableBody,
    TableCell,
    Accordion,
} from "@hubspot/ui-extensions";
import { ProductTypeFormPanel } from "./ProductTypeFormPanel";
import { formatPrice } from "./utils";

export const PSQTables = ({
    quote = {},
    psqAccordions = []
}) => {
    if (
        !!!quote
        || !!!quote["Implementation Fees"]
        || quote["Implementation Fees"]["Implementation Type"] != "PSQ"
    ) return null;

    const implementationTypeKeys = Object.keys(quote["Implementation Fees"]).filter(a => !!a.match(/^[0-9]*$/g))
    
    let tables = []

    psqAccordions.forEach(psqAccord => {
        let tasks = quote["Implementation Fees"][psqAccord.field]["fields"]
        tables.push(
            <Accordion title={psqAccord.label} defaultOpen>
                <Table key={psqAccord.field} marginBottom="md">
                    <TableHead>
                        <TableRow>
                            <TableHeader>Task</TableHeader>
                            <TableHeader>Resource</TableHeader>
                            <TableHeader align="center">Hours</TableHeader>
                            <TableHeader align="center">Rate</TableHeader>
                            <TableHeader align="center">Estimated Monthly Fees</TableHeader>
                            <TableHeader></TableHeader>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {!!tasks && tasks.map((task) => {
                            return (
                                <TableRow key={task.field}>
                                    <TableCell>{task.label || 0}</TableCell>
                                    <TableCell>{task.resource.label || 0}</TableCell>
                                    <TableCell align="center">{task.hoursBand.hours || 0}</TableCell>
                                    <TableCell align="center">£{formatPrice(task.resource.hourly_rate) || 0.00}</TableCell>
                                    <TableCell align="center">£{formatPrice(task.psqFee) || 0.00}</TableCell>
                                    <TableCell>
                                        <Button variant="transparent" >
                                            <Icon name="edit"/> Edit
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </Accordion>
        )
    })

    console.log({
        event: "Rendering PSQ Tables",
        quote,
        psqAccordions,
        implementationTypeKeys,
    })

    return <>
        {tables}
    </>
};