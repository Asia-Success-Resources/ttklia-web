// Menu groups and order follow Sitemap 6 (doc 32). Permissions are doc 32's `vendor.*` names; where doc 32 names
// only a write or manage permission, the read one is derived from it. TODO(api): check them against the seeder.
// Vendor users hold roles with scope = organisation and see only their own outlets (doc 27).
export default defineAppConfig({
    ops: {
    "app": "vendor",
    "title": "Vendor",
    "badgeIcon": "i-bx-store",
    "locationInPath": true,
    "menu": [
        {
            "title": "Till",
            "items": [
                {
                    "label": "Till",
                    "to": "/pos",
                    "icon": "i-bx-calculator",
                    "permission": "vendor.pos.sell"
                },
                {
                    "label": "Held",
                    "to": "/pos/held",
                    "icon": "i-bx-pause-circle",
                    "permission": "vendor.pos.sell"
                },
                {
                    "label": "Orders today",
                    "to": "/pos/orders",
                    "icon": "i-bx-cart",
                    "permission": "vendor.pos.sell"
                },
                {
                    "label": "Shift",
                    "to": "/pos/shift",
                    "icon": "i-bx-stopwatch",
                    "permission": "vendor.pos.sell"
                },
                {
                    "label": "Lock",
                    "to": "/pos/lock",
                    "icon": "i-bx-lock",
                    "permission": "vendor.pos.sell"
                }
            ]
        },
        {
            "title": "Dashboard",
            "items": [
                {
                    "label": "Dashboard",
                    "to": "/",
                    "icon": "i-bx-dashboard",
                    "permission": "vendor.reports.read"
                }
            ]
        },
        {
            "title": "Products",
            "items": [
                {
                    "label": "Products",
                    "to": "/products",
                    "icon": "i-bx-package",
                    "permission": "vendor.products.read"
                },
                {
                    "label": "Categories",
                    "to": "/products/categories",
                    "icon": "i-bx-grid",
                    "permission": "vendor.products.read"
                },
                {
                    "label": "Options",
                    "to": "/products/options",
                    "icon": "i-bx-slider",
                    "permission": "vendor.products.read"
                },
                {
                    "label": "Import",
                    "to": "/products/import",
                    "icon": "i-bx-arrow-in-down-square-half",
                    "permission": "vendor.products.write"
                }
            ]
        },
        {
            "title": "Stock",
            "items": [
                {
                    "label": "Stock",
                    "to": "/stock",
                    "icon": "i-bx-box",
                    "permission": "vendor.stock.read"
                },
                {
                    "label": "Receive",
                    "to": "/stock/receive",
                    "icon": "i-bx-archive-arrow-down",
                    "permission": "vendor.stock.write"
                },
                {
                    "label": "Stock take",
                    "to": "/stock/count",
                    "icon": "i-bx-checklist",
                    "permission": "vendor.stock.write"
                },
                {
                    "label": "Movements",
                    "to": "/stock/movements",
                    "icon": "i-bx-swap-horizontal",
                    "permission": "vendor.stock.read"
                }
            ]
        },
        {
            "title": "Sales",
            "items": [
                {
                    "label": "Sales",
                    "to": "/sales",
                    "icon": "i-bx-chart-line",
                    "permission": "vendor.reports.read"
                },
                {
                    "label": "Refunds",
                    "to": "/refunds",
                    "icon": "i-bx-undo",
                    "permission": "vendor.refunds.request"
                },
                {
                    "label": "Reports",
                    "to": "/reports",
                    "icon": "i-bx-file-report",
                    "permission": "vendor.reports.read"
                }
            ]
        },
        {
            "title": "Money",
            "items": [
                {
                    "label": "Statements",
                    "to": "/statements",
                    "icon": "i-bx-file-detail",
                    "permission": "vendor.statements.read"
                },
                {
                    "label": "Payouts",
                    "to": "/payouts",
                    "icon": "i-bx-wallet",
                    "permission": "vendor.statements.read"
                },
                {
                    "label": "Invoices",
                    "to": "/invoices",
                    "icon": "i-bx-receipt",
                    "permission": "vendor.statements.read"
                }
            ]
        },
        {
            "title": "Team and outlet",
            "items": [
                {
                    "label": "Staff",
                    "to": "/staff",
                    "icon": "i-bx-group",
                    "permission": "vendor.staff.manage"
                },
                {
                    "label": "Settings",
                    "to": "/settings",
                    "icon": "i-bx-cog",
                    "permission": "vendor.staff.manage"
                },
                {
                    "label": "Devices",
                    "to": "/settings/devices",
                    "icon": "i-bx-devices",
                    "permission": "vendor.staff.manage"
                }
            ]
        }
    ]
},
})
