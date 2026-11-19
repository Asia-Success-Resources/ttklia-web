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
          "permission": "vendor.pos.sell"
        },
        {
          "label": "Held",
          "to": "/pos/held",
          "permission": "vendor.pos.sell"
        },
        {
          "label": "Orders today",
          "to": "/pos/orders",
          "permission": "vendor.pos.sell"
        },
        {
          "label": "Shift",
          "to": "/pos/shift",
          "permission": "vendor.pos.sell"
        },
        {
          "label": "Lock",
          "to": "/pos/lock",
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
          "permission": "vendor.products.read"
        },
        {
          "label": "Categories",
          "to": "/products/categories",
          "permission": "vendor.products.read"
        },
        {
          "label": "Options",
          "to": "/products/options",
          "permission": "vendor.products.read"
        },
        {
          "label": "Import",
          "to": "/products/import",
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
          "permission": "vendor.stock.read"
        },
        {
          "label": "Receive",
          "to": "/stock/receive",
          "permission": "vendor.stock.write"
        },
        {
          "label": "Stock take",
          "to": "/stock/count",
          "permission": "vendor.stock.write"
        },
        {
          "label": "Movements",
          "to": "/stock/movements",
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
          "permission": "vendor.reports.read"
        },
        {
          "label": "Refunds",
          "to": "/refunds",
          "permission": "vendor.refunds.request"
        },
        {
          "label": "Reports",
          "to": "/reports",
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
          "permission": "vendor.statements.read"
        },
        {
          "label": "Payouts",
          "to": "/payouts",
          "permission": "vendor.statements.read"
        },
        {
          "label": "Invoices",
          "to": "/invoices",
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
          "permission": "vendor.staff.manage"
        },
        {
          "label": "Settings",
          "to": "/settings",
          "permission": "vendor.staff.manage"
        },
        {
          "label": "Devices",
          "to": "/settings/devices",
          "permission": "vendor.staff.manage"
        }
      ]
    }
  ]
},
})
