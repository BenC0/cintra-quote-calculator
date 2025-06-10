import React, { useState, useEffect } from "react";
import { Flex, Text, Button, StepperInput } from "@hubspot/ui-extensions";

/**
 * PSQFeesComponent stub: manages quantities and computes a single implementation fee total.
 *
 * Props:
 *  - productDefs: Array<{
 *      field: string,
 *      label: string,
 *      product_type: string,
 *      resource: { hourly_rate: number }
 *    }>
 *  - onChange: (fieldName: string, value: number) => void
 *
 * This stub dynamically derives tables from `product_type` values.
 */
const PSQFeesComponent = ({ productDefs = [], onChange = () => {} }) => {
  // quantities[field] stores current quantity for each product field
  const [quantities, setQuantities] = useState({});
  // savedQuantities for each product_type
  const [savedQuantities, setSavedQuantities] = useState({});
  // editingTables[taskType] toggles edit mode dynamically
  const [editingTables, setEditingTables] = useState({});

  // Whenever quantities change, recompute total and notify parent
  useEffect(() => {
    const total = Object.entries(quantities).reduce((sum, [field, qty]) => {
      const def = productDefs.find((d) => d.field === field);
      if (def && def.resource && typeof def.resource.hourly_rate === "number") {
        return sum + qty * def.resource.hourly_rate;
      }
      return sum;
    }, 0);
    onChange("Implementation Fees Total", total);
  }, [quantities, productDefs, onChange]);

  // Derive unique task types from productDefs
  const taskTypes = Array.from(
    new Set(productDefs.map((d) => d.product_type))
  );

  // Handler to toggle “edit” mode for a given taskType
  const startEdit = (taskType) => {
    setEditingTables((prev) => ({ ...prev, [taskType]: true }));
    // backup current quantities for this taskType
    const defsForType = productDefs.filter((d) => d.product_type === taskType);
    const backup = {};
    defsForType.forEach((def) => {
      backup[def.field] = quantities[def.field] || 0;
    });
    setSavedQuantities((prev) => ({ ...prev, [taskType]: backup }));
  };

  // Cancel edits: restore from savedQuantities
  const discardEdit = (taskType) => {
    const backup = savedQuantities[taskType] || {};
    setQuantities((prev) => ({ ...prev, ...backup }));
    setEditingTables((prev) => ({ ...prev, [taskType]: false }));
  };

  // Save edits: exit edit mode
  const saveEdit = (taskType) => {
    setEditingTables((prev) => ({ ...prev, [taskType]: false }));
  };

  // Change handler for a specific product field
  const handleQuantityChange = (field) => (newQty) => {
    setQuantities((prev) => ({ ...prev, [field]: newQty }));
  };

  return (
    <Flex direction="column" gap="md">
      {taskTypes.map((taskType) => (
        <Flex key={taskType} direction="column" gap="sm">
          <Flex align="center" gap="small">
            <Text format={{ fontWeight: "bold", fontSize: "md" }}>
              {taskType.toUpperCase()} Implementation
            </Text>
            {editingTables[taskType] ? (
              <>
                <Button onClick={() => saveEdit(taskType)}>Save</Button>
                <Button
                  variant="destructive"
                  onClick={() => discardEdit(taskType)}
                >
                  Discard
                </Button>
              </>
            ) : (
              <Button onClick={() => startEdit(taskType)}>Edit</Button>
            )}
          </Flex>

          {/* Render products matching this taskType */}
          {productDefs
            .filter((d) => d.product_type === taskType)
            .map((def) => {
              const currentQty = quantities[def.field] || 0;
              return (
                <Flex key={def.field} align="center" gap="small">
                  <Text format={{ fontSize: "md" }}>{def.label}</Text>
                  {editingTables[taskType] ? (
                    <StepperInput
                      name={def.field}
                      value={currentQty}
                      onChange={(e) =>
                        handleQuantityChange(def.field)(
                          Number(e.target.value)
                        )
                      }
                      min={0}
                    />
                  ) : (
                    <Text format={{ fontSize: "md" }}>
                      Qty: {currentQty}
                    </Text>
                  )}
                </Flex>
              );
            })}
        </Flex>
      ))}
    </Flex>
  );
};

export { PSQFeesComponent };
