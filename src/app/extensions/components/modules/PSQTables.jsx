import { useState } from "react";
import {
    Flex,
    Button,
    Table,
    TableHead,
    TableHeader,
    Icon,
    TableRow,
    TableBody,
    TableCell,
    Accordion,
} from "@hubspot/ui-extensions";
import { formatPrice, formatToMaxTwoDecimal } from "./utils";
import { renderField } from "./Inputs";

export const PSQTables = ({
    quote = {},
    psqAccordions = [],
    PSQImplementationCustomHours = {},
    PSQHandler = _ => null
}) => {
    if (
        !!!quote
        || !!!quote["Implementation Fees"]
        || quote["Implementation Fees"]["Implementation Type"] != "PSQ"
    ) return null;

    const implementationTypeKeys = Object.keys(quote["Implementation Fees"]).filter(a => !!a.match(/^[0-9]*$/g))
    const [tasksEditing, setTasksEditing] = useState({})
    const taskHandler = (id, value, action="add") => {
        if (action == "add") {
            setTasksEditing(prev => ({
                ...prev,
                [id]: value
            }));
        } else if (action == "remove") {
            setTasksEditing(prev => ({
                ...prev,
                [id]: null
            }));
        }
    }
    
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
                            <TableHeader align="center">Total Fees</TableHeader>
                            <TableHeader></TableHeader>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {!!tasks && tasks.map((task) => {
                            return (
                                <TableRow key={task.field}>
                                    <TableCell>{task.label || 0}</TableCell>
                                    <TableCell>{task.resource.label || 0}</TableCell>
                                    <TableCell align="center">
                                        {(!!tasksEditing[task.field] || tasksEditing[task.field] === 0) ? (
                                            renderField(task, (field, e, planId) => {
                                                taskHandler(task.field, e, "add")
                                            }, "PSQ", (!!tasksEditing[task.field] || tasksEditing[task.field] === 0) && typeof tasksEditing[task.field] == "number" ? tasksEditing[task.field] : formatToMaxTwoDecimal(task.hoursBand.hours), true)
                                        ) : formatToMaxTwoDecimal(task.hoursBand.hours) || 0}
                                    </TableCell>
                                    <TableCell align="center">£{formatPrice(task.resource.hourly_rate) || 0.00}</TableCell>
                                    <TableCell align="center">
                                        {(!!tasksEditing[task.field] || tasksEditing[task.field] === 0) ? ("--"): <>£{formatPrice(task.psqFee) || 0.00}</>}
                                    </TableCell>
                                    <TableCell>
                                        {(!!tasksEditing[task.field] || tasksEditing[task.field] === 0) ? (
                                            <Flex direction="column" align="stretch" gap="sm">
                                                <Button
                                                    variant="primary"
                                                    onClick={_ => {
                                                        PSQHandler(task.field, tasksEditing[task.field])
                                                        taskHandler(task.field, null, "remove")
                                                    }}
                                                >
                                                    <Icon name="success"/>
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    onClick={_ => {
                                                        taskHandler(task.field, null, "remove")
                                                    }}
                                                >
                                                    <Icon name="delete"/>
                                                </Button>
                                            </Flex>                                            
                                        ) : (
                                            <Button
                                                variant="transparent"
                                                onClick={_ => {
                                                    taskHandler(task.field, true, "add")
                                                }}
                                            >
                                                <Icon name="edit"/>
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </Accordion>
        )
    })

    return <>
        {tables}
    </>
};