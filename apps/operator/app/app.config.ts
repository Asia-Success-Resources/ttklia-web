// Menu groups and order follow the sitemap, which copies today's admin menu (doc 09).
// Permissions follow doc 27's `<module>.<resource>.<action>` convention; doc 27 has no full
// catalogue yet, so resource names are derived from the path. TODO(api): check them against the seeder.
export default defineAppConfig({
    ops: {
    "app": "operator",
    "title": "Operator portal",
    "badgeIcon": "i-bx-buildings",
    "locationInPath": false,
    "menu": [
        {
            "title": "Today",
            "items": [
                {
                    "label": "Today",
                    "to": "/",
                    "icon": "i-bx-calendar-event",
                    "permission": "operator.dashboard.read"
                },
                {
                    "label": "Manifests",
                    "to": "/manifests",
                    "icon": "i-bx-clipboard-detail",
                    "permission": "operator.manifests.read"
                }
            ]
        },
        {
            "title": "Trips",
            "items": [
                {
                    "label": "Trips",
                    "to": "/trips",
                    "icon": "i-bx-bus",
                    "permission": "operator.trips.read"
                },
                {
                    "label": "Waybills",
                    "to": "/waybills",
                    "icon": "i-bx-clipboard",
                    "permission": "operator.waybills.read"
                },
                {
                    "label": "Transfers",
                    "to": "/transfers",
                    "icon": "i-bx-arrow-right-left",
                    "permission": "operator.transfers.read"
                }
            ]
        },
        {
            "title": "Fleet",
            "items": [
                {
                    "label": "Buses",
                    "to": "/buses",
                    "icon": "i-bx-school-bus",
                    "permission": "operator.buses.read"
                },
                {
                    "label": "Drivers",
                    "to": "/drivers",
                    "icon": "i-bx-steering-wheel",
                    "permission": "operator.drivers.read"
                }
            ]
        },
        {
            "title": "Money",
            "items": [
                {
                    "label": "Sales",
                    "to": "/sales",
                    "icon": "i-bx-chart-line",
                    "permission": "operator.sales.read"
                },
                {
                    "label": "Statements",
                    "to": "/statements",
                    "icon": "i-bx-file-detail",
                    "permission": "operator.statements.read"
                },
                {
                    "label": "Charges",
                    "to": "/charges",
                    "icon": "i-bx-price-tag",
                    "permission": "operator.charges.read"
                },
                {
                    "label": "Credit",
                    "to": "/credit",
                    "icon": "i-bx-coin",
                    "permission": "operator.credit.read"
                },
                {
                    "label": "Invoices",
                    "to": "/invoices",
                    "icon": "i-bx-receipt",
                    "permission": "operator.invoices.read"
                }
            ]
        },
        {
            "title": "Company",
            "items": [
                {
                    "label": "Users",
                    "to": "/users",
                    "icon": "i-bx-group",
                    "permission": "operator.users.read"
                },
                {
                    "label": "System",
                    "to": "/system",
                    "icon": "i-bx-server",
                    "permission": "operator.system.read"
                }
            ]
        }
    ]
},
})
