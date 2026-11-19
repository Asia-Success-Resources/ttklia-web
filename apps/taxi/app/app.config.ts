// Menu groups and order follow the sitemap, which copies today's admin menu (doc 09).
// Permissions follow doc 27's `<module>.<resource>.<action>` convention; doc 27 has no full
// catalogue yet, so resource names are derived from the path. TODO(api): check them against the seeder.
export default defineAppConfig({
  ops: {
  "app": "taxi",
  "title": "Taxi",
  "badgeIcon": "i-bx-taxi",
  "locationInPath": true,
  "menu": [
    {
      "title": "Dashboards",
      "items": [
        {
          "label": "Overview",
          "to": "/",
          "permission": "taxi.dashboard.read"
        },
        {
          "label": "Sales",
          "to": "/sales",
          "permission": "taxi.sales.read"
        },
        {
          "label": "Claims",
          "to": "/dashboards/claims",
          "permission": "taxi.dashboards_claims.read"
        },
        {
          "label": "Tickets",
          "to": "/dashboards/tickets",
          "permission": "taxi.dashboards_tickets.read"
        },
        {
          "label": "Lines",
          "to": "/dashboards/lines",
          "permission": "taxi.dashboards_lines.read"
        }
      ]
    },
    {
      "title": "Operations",
      "items": [
        {
          "label": "Bookings",
          "to": "/bookings",
          "permission": "taxi.bookings.read"
        },
        {
          "label": "Refunds",
          "to": "/refunds",
          "permission": "taxi.refunds.read",
          "countKey": "taxi.refunds"
        },
        {
          "label": "Tickets",
          "to": "/tickets",
          "permission": "taxi.tickets.read"
        },
        {
          "label": "Gates",
          "to": "/gates",
          "permission": "taxi.gates.read"
        },
        {
          "label": "Claims",
          "to": "/claims",
          "permission": "taxi.claims.read",
          "noTableYet": true
        },
        {
          "label": "Sessions",
          "to": "/sessions",
          "permission": "taxi.sessions.read"
        },
        {
          "label": "Otp",
          "to": "/otp",
          "permission": "taxi.otp.read",
          "noTableYet": true
        },
        {
          "label": "Driver selection",
          "to": "/driver-selection",
          "permission": "taxi.driver_selection.read"
        },
        {
          "label": "Driver location",
          "to": "/driver-location",
          "permission": "taxi.driver_location.read"
        }
      ]
    },
    {
      "title": "Configuration",
      "items": [
        {
          "label": "Counters",
          "to": "/counters",
          "permission": "taxi.counters.read"
        },
        {
          "label": "Kiosks",
          "to": "/kiosks",
          "permission": "taxi.kiosks.read"
        },
        {
          "label": "Locations",
          "to": "/locations",
          "permission": "taxi.locations.read"
        },
        {
          "label": "Vehicle types",
          "to": "/vehicle-types",
          "permission": "taxi.vehicle_types.read"
        },
        {
          "label": "Vehicles",
          "to": "/vehicles",
          "permission": "taxi.vehicles.read"
        },
        {
          "label": "Vests",
          "to": "/vests",
          "permission": "taxi.vests.read",
          "noTableYet": true
        },
        {
          "label": "Zones",
          "to": "/zones",
          "permission": "taxi.zones.read"
        },
        {
          "label": "Booking codes",
          "to": "/codes/booking",
          "permission": "taxi.codes_booking.read"
        },
        {
          "label": "Master codes",
          "to": "/codes/master",
          "permission": "taxi.codes_master.read"
        },
        {
          "label": "Integrations",
          "to": "/integrations",
          "permission": "taxi.integrations.read"
        }
      ]
    },
    {
      "title": "People",
      "items": [
        {
          "label": "Customers",
          "to": "/customers",
          "permission": "taxi.customers.read"
        },
        {
          "label": "Drivers",
          "to": "/drivers",
          "permission": "taxi.drivers.read"
        },
        {
          "label": "Drivers",
          "to": "/logs/drivers",
          "permission": "taxi.logs_drivers.read"
        }
      ]
    },
    {
      "title": "Logs",
      "items": [
        {
          "label": "Tickets",
          "to": "/logs/tickets",
          "permission": "taxi.logs_tickets.read"
        },
        {
          "label": "Prints",
          "to": "/logs/prints",
          "permission": "taxi.logs_prints.read",
          "noTableYet": true
        }
      ]
    },
    {
      "title": "Reports",
      "items": [
        {
          "label": "Reports",
          "to": "/reports",
          "permission": "taxi.reports.read"
        }
      ]
    },
    {
      "title": "Counter",
      "items": [
        {
          "label": "Open counter",
          "to": "/counter",
          "permission": "taxi.counter.read"
        }
      ]
    }
  ]
},
})
