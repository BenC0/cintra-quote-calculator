export const debugPlanIdsByType = {
    "Quote Details": [ "60f9af54-4df3-4e50-bfd0-6e730db5a498" ],
    "Payroll": [ "43e0a901-9bd9-434f-85f5-9947eb76d5b7", "43e0a901-9bd9-434f-85f5-9947eb76d5c7" ],
    "CintraHR": [ "7be6c488-348c-4c7d-bcde-b75191f95622" ],
    "HR Outsourcing": [ "e463d2be-79a0-4d0a-896e-d10b9f8c4a83" ],
    "Capture Expense": [ "e18de862-4c26-4358-9b1d-d99401eb1949" ],
}

export const debugSelectedValues = {
    "Quote Details": [
        {
            "id": "60f9af54-4df3-4e50-bfd0-6e730db5a498",
            "fields": [
                {
                    "field": "241709571284",
                    "label": "Custom",
                    "value": "custom",
                    "price_table": []
                },
                {
                    "field": "241712266460",
                    "label": "Is this a public sector client?",
                    "value": true,
                    "price_table": []
                },
                {
                    "field": "243440416969",
                    "label": "Groups Insight",
                    "value": true,
                    "price_table": []
                },
                {
                    "field": "241712266465",
                    "label": "12 Months",
                    "value": 12,
                    "price_table": []
                },
                {
                    "field": "241731552473",
                    "label": "Is this an education client?",
                    "value": true,
                    "price_table": []
                }
            ]
        }
    ],
    "Payroll": [
        {
            "id": "43e0a901-9bd9-434f-85f5-9947eb76d5b7",
            "fields": [
                {
                    "field": "241706082523",
                    "label": "Cintra SaaS Payroll",
                    "value": true,
                    "price_table": [
                        {
                            "field": "242635939012",
                            "label": "Cintra SaaS Payroll: Band 0",
                            "price": 26.5,
                            "minimum_quantity": 0,
                            "maximum_quantity": 25,
                            "product_field": "241706082523"
                        },
                        {
                            "field": "242635939014",
                            "label": "Cintra SaaS Payroll: Band 2",
                            "price": 7.42,
                            "minimum_quantity": 51,
                            "maximum_quantity": 100,
                            "product_field": "241706082523"
                        },
                        {
                            "field": "242635939015",
                            "label": "Cintra SaaS Payroll: Band 4",
                            "price": 3.8902,
                            "minimum_quantity": 201,
                            "maximum_quantity": 500,
                            "product_field": "241706082523"
                        },
                        {
                            "field": "242635939016",
                            "label": "Cintra SaaS Payroll: Band 5",
                            "price": 3.5298,
                            "minimum_quantity": 501,
                            "maximum_quantity": 1000,
                            "product_field": "241706082523"
                        },
                        {
                            "field": "242635939017",
                            "label": "Cintra SaaS Payroll: Band 6",
                            "price": 3.18,
                            "minimum_quantity": 1001,
                            "maximum_quantity": 2000,
                            "product_field": "241706082523"
                        },
                        {
                            "field": "242635939018",
                            "label": "Cintra SaaS Payroll: Band 7",
                            "price": 3.18,
                            "minimum_quantity": 2001,
                            "maximum_quantity": 2500,
                            "product_field": "241706082523"
                        },
                        {
                            "field": "242635939019",
                            "label": "Cintra SaaS Payroll: Band 9",
                            "price": 2.332,
                            "minimum_quantity": 5001,
                            "maximum_quantity": 7500,
                            "product_field": "241706082523"
                        },
                        {
                            "field": "242635939020",
                            "label": "Cintra SaaS Payroll: Band 10",
                            "price": 2.12,
                            "minimum_quantity": 7501,
                            "maximum_quantity": 10000,
                            "product_field": "241706082523"
                        },
                        {
                            "field": "242647737532",
                            "label": "Cintra SaaS Payroll: Band 1",
                            "price": 13.78,
                            "minimum_quantity": 26,
                            "maximum_quantity": 50,
                            "product_field": "241706082523"
                        },
                        {
                            "field": "242647737533",
                            "label": "Cintra SaaS Payroll: Band 3",
                            "price": 4.2294,
                            "minimum_quantity": 101,
                            "maximum_quantity": 200,
                            "product_field": "241706082523"
                        },
                        {
                            "field": "242647737534",
                            "label": "Cintra SaaS Payroll: Band 8",
                            "price": 2.8196,
                            "minimum_quantity": 2501,
                            "maximum_quantity": 5000,
                            "product_field": "241706082523"
                        },
                        {
                            "field": "242647737535",
                            "label": "Cintra SaaS Payroll: Band 11",
                            "price": 1.908,
                            "minimum_quantity": 1001,
                            "maximum_quantity": 12500,
                            "product_field": "241706082523"
                        },
                        {
                            "field": "242647737536",
                            "label": "Cintra SaaS Payroll: Band 12",
                            "price": 1.802,
                            "minimum_quantity": 12501,
                            "maximum_quantity": 15000,
                            "product_field": "241706082523"
                        }
                    ]
                },
                {
                    "field": "241712266444",
                    "label": "Cintra Outsourced Payroll",
                    "value": false,
                    "price_table": []
                },
                {
                    "field": "242118906062",
                    "label": "Frequency",
                    "value": "lunar",
                    "price_table": []
                },
                {
                    "field": "241706082532",
                    "label": "Payrolled Benefits (Source Only)",
                    "value": 50,
                    "price_table": []
                },
                {
                    "field": "241709571262",
                    "label": "Holiday and Absence Management",
                    "value": true,
                    "price_table": []
                }
            ],
            "quantity_field_label": "Number of Employees",
            "quantity_field_type": "employees",
            "quantity_frequency_values_table": "cintra_calculator_payroll_frequency",
            "quantity_value": 50,
            "frequency_value": "weekly"
        },
        {
            "id": "43e0a901-9bd9-434f-85f5-9947eb76d5c7",
            "fields": [
                {
                    "field": "241706082523",
                    "label": "Cintra SaaS Payroll",
                    "value": true,
                    "price_table": [
                        {
                            "field": "242635939012",
                            "label": "Cintra SaaS Payroll: Band 0",
                            "price": 26.5,
                            "minimum_quantity": 0,
                            "maximum_quantity": 25,
                            "product_field": "241706082523"
                        },
                        {
                            "field": "242635939014",
                            "label": "Cintra SaaS Payroll: Band 2",
                            "price": 7.42,
                            "minimum_quantity": 51,
                            "maximum_quantity": 100,
                            "product_field": "241706082523"
                        },
                        {
                            "field": "242635939015",
                            "label": "Cintra SaaS Payroll: Band 4",
                            "price": 3.8902,
                            "minimum_quantity": 201,
                            "maximum_quantity": 500,
                            "product_field": "241706082523"
                        },
                        {
                            "field": "242635939016",
                            "label": "Cintra SaaS Payroll: Band 5",
                            "price": 3.5298,
                            "minimum_quantity": 501,
                            "maximum_quantity": 1000,
                            "product_field": "241706082523"
                        },
                        {
                            "field": "242635939017",
                            "label": "Cintra SaaS Payroll: Band 6",
                            "price": 3.18,
                            "minimum_quantity": 1001,
                            "maximum_quantity": 2000,
                            "product_field": "241706082523"
                        },
                        {
                            "field": "242635939018",
                            "label": "Cintra SaaS Payroll: Band 7",
                            "price": 3.18,
                            "minimum_quantity": 2001,
                            "maximum_quantity": 2500,
                            "product_field": "241706082523"
                        },
                        {
                            "field": "242635939019",
                            "label": "Cintra SaaS Payroll: Band 9",
                            "price": 2.332,
                            "minimum_quantity": 5001,
                            "maximum_quantity": 7500,
                            "product_field": "241706082523"
                        },
                        {
                            "field": "242635939020",
                            "label": "Cintra SaaS Payroll: Band 10",
                            "price": 2.12,
                            "minimum_quantity": 7501,
                            "maximum_quantity": 10000,
                            "product_field": "241706082523"
                        },
                        {
                            "field": "242647737532",
                            "label": "Cintra SaaS Payroll: Band 1",
                            "price": 13.78,
                            "minimum_quantity": 26,
                            "maximum_quantity": 50,
                            "product_field": "241706082523"
                        },
                        {
                            "field": "242647737533",
                            "label": "Cintra SaaS Payroll: Band 3",
                            "price": 4.2294,
                            "minimum_quantity": 101,
                            "maximum_quantity": 200,
                            "product_field": "241706082523"
                        },
                        {
                            "field": "242647737534",
                            "label": "Cintra SaaS Payroll: Band 8",
                            "price": 2.8196,
                            "minimum_quantity": 2501,
                            "maximum_quantity": 5000,
                            "product_field": "241706082523"
                        },
                        {
                            "field": "242647737535",
                            "label": "Cintra SaaS Payroll: Band 11",
                            "price": 1.908,
                            "minimum_quantity": 1001,
                            "maximum_quantity": 12500,
                            "product_field": "241706082523"
                        },
                        {
                            "field": "242647737536",
                            "label": "Cintra SaaS Payroll: Band 12",
                            "price": 1.802,
                            "minimum_quantity": 12501,
                            "maximum_quantity": 15000,
                            "product_field": "241706082523"
                        }
                    ]
                },
                {
                    "field": "241712266444",
                    "label": "Cintra Outsourced Payroll",
                    "value": false,
                    "price_table": []
                },
                {
                    "field": "242118906062",
                    "label": "Frequency",
                    "value": "lunar",
                    "price_table": []
                },
                {
                    "field": "241706082532",
                    "label": "Payrolled Benefits (Source Only)",
                    "value": 50,
                    "price_table": []
                },
                {
                    "field": "241709571262",
                    "label": "Holiday and Absence Management",
                    "value": true,
                    "price_table": []
                }
            ],
            "quantity_field_label": "Number of Employees",
            "quantity_field_type": "employees",
            "quantity_frequency_values_table": "cintra_calculator_payroll_frequency",
            "quantity_value": 80,
            "frequency_value": "fortnightly"
        }
    ],
    "CintraHR": [
        {
            "id": "7be6c488-348c-4c7d-bcde-b75191f95622",
            "fields": [
                {
                    "field": "241709571268",
                    "label": "HR Software",
                    "value": "professional",
                    "price_table": []
                }
            ],
            "quantity_field_label": "Quantity",
            "quantity_field_type": "quantity",
            "quantity_value": 50
        }
    ],
    "HR Outsourcing": [
        {
            "id": "e463d2be-79a0-4d0a-896e-d10b9f8c4a83",
            "fields": [
                {
                    "field": "241706083520",
                    "label": "HR Admin",
                    "value": true,
                    "price_table": []
                },
                {
                    "field": "241712266467",
                    "label": "HR Advice",
                    "value": true,
                    "price_table": []
                }
            ],
            "quantity_field_label": "Headcount",
            "quantity_field_type": "headcount",
            "quantity_value": 60
        }
    ],
    "Capture Expense": [
        {
            "id": "e18de862-4c26-4358-9b1d-d99401eb1949",
            "fields": [
                {
                    "field": "241709571288",
                    "label": "Expense Management Software ",
                    "value": "business",
                    "price_table": []
                },
                {
                    "field": "241706083522",
                    "label": "AI Module",
                    "value": true,
                    "price_table": []
                },
                {
                    "field": "241709571293",
                    "label": "Cards",
                    "value": true,
                    "price_table": []
                },
                {
                    "field": "241706083525",
                    "label": "Onboarding fee",
                    "value": false,
                    "price_table": []
                },
                {
                    "field": "241706083524",
                    "label": "Timesheets",
                    "value": true,
                    "price_table": []
                }
            ],
            "quantity_field_label": "Headcount",
            "quantity_field_type": "quantity",
            "quantity_value": 50
        }
    ]
}