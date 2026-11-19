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
          "permission": "operator.dashboard.read"
        },
        {
          "label": "Manifests",
          "to": "/manifests",
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
          "permission": "operator.trips.read"
        },
        {
          "label": "Waybills",
          "to": "/waybills",
          "permission": "operator.waybills.read"
        },
        {
          "label": "Transfers",
          "to": "/transfers",
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
          "permission": "operator.buses.read"
        },
        {
          "label": "Drivers",
          "to": "/drivers",
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
          "permission": "operator.sales.read"
        },
        {
          "label": "Statements",
          "to": "/statements",
          "permission": "operator.statements.read"
        },
        {
          "label": "Charges",
          "to": "/charges",
          "permission": "operator.charges.read"
        },
        {
          "label": "Credit",
          "to": "/credit",
          "permission": "operator.credit.read"
        },
        {
          "label": "Invoices",
          "to": "/invoices",
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
          "permission": "operator.users.read"
        },
        {
          "label": "System",
          "to": "/system",
          "permission": "operator.system.read"
        }
      ]
    }
  ]
},
})
