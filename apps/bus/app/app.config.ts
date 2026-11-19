// Menu groups and order follow the sitemap, which copies today's admin menu (doc 09).
// Permissions follow doc 27's `<module>.<resource>.<action>` convention; doc 27 has no full
// catalogue yet, so resource names are derived from the path. TODO(api): check them against the seeder.
export default defineAppConfig({
  ops: {
  "app": "bus",
  "title": "TTKLIA (Bus)",
  "badgeIcon": "i-bx-bus",
  "locationInPath": true,
  "menu": [
    {
      "title": "Dashboards",
      "items": [
        {
          "label": "Overview",
          "to": "/",
          "permission": "bus.dashboard.read"
        },
        {
          "label": "Sales",
          "to": "/sales",
          "permission": "bus.sales.read"
        },
        {
          "label": "Product sales",
          "to": "/product-sales",
          "permission": "bus.product_sales.read"
        },
        {
          "label": "Vendors",
          "to": "/vendors",
          "permission": "bus.vendors.read"
        },
        {
          "label": "Manual entries",
          "to": "/manual-entries",
          "permission": "bus.manual_entries.read"
        }
      ]
    },
    {
      "title": "Operations",
      "items": [
        {
          "label": "Bookings",
          "to": "/bookings",
          "permission": "bus.bookings.read"
        },
        {
          "label": "Refunds",
          "to": "/refunds",
          "permission": "bus.refunds.read",
          "countKey": "bus.refunds"
        },
        {
          "label": "Orders",
          "to": "/orders",
          "permission": "bus.orders.read"
        },
        {
          "label": "Sessions",
          "to": "/sessions",
          "permission": "bus.sessions.read"
        },
        {
          "label": "Tour orders",
          "to": "/tour-orders",
          "permission": "bus.tour_orders.read"
        },
        {
          "label": "Products",
          "to": "/products",
          "permission": "bus.products.read"
        },
        {
          "label": "Walk in queue",
          "to": "/walk-in-queue",
          "permission": "bus.walk_in_queue.read",
          "noTableYet": true
        },
        {
          "label": "Vip queue",
          "to": "/vip-queue",
          "permission": "bus.vip_queue.read",
          "noTableYet": true
        }
      ]
    },
    {
      "title": "Scheduling",
      "items": [
        {
          "label": "Routes",
          "to": "/routes",
          "permission": "bus.routes.read"
        },
        {
          "label": "Trips",
          "to": "/trips",
          "permission": "bus.trips.read"
        },
        {
          "label": "Arrivals",
          "to": "/arrivals",
          "permission": "bus.arrivals.read"
        },
        {
          "label": "Platforms",
          "to": "/platforms",
          "permission": "bus.platforms.read"
        }
      ]
    },
    {
      "title": "Bus operators",
      "items": [
        {
          "label": "Operators",
          "to": "/operators",
          "permission": "bus.operators.read"
        },
        {
          "label": "System providers",
          "to": "/system-providers",
          "permission": "bus.system_providers.read"
        },
        {
          "label": "Top up requests",
          "to": "/top-up-requests",
          "permission": "bus.top_up_requests.read",
          "noTableYet": true,
          "countKey": "bus.top-up-requests"
        }
      ]
    },
    {
      "title": "Codes",
      "items": [
        {
          "label": "Booking codes",
          "to": "/codes/booking",
          "permission": "bus.codes_booking.read"
        },
        {
          "label": "Exit codes",
          "to": "/codes/exit",
          "permission": "bus.codes_exit.read"
        },
        {
          "label": "Master codes",
          "to": "/codes/master",
          "permission": "bus.codes_master.read"
        },
        {
          "label": "Tour codes",
          "to": "/codes/tour",
          "permission": "bus.codes_tour.read"
        }
      ]
    },
    {
      "title": "Buses",
      "items": [
        {
          "label": "Entries",
          "to": "/buses/entries",
          "permission": "bus.buses_entries.read"
        },
        {
          "label": "Buses",
          "to": "/buses",
          "permission": "bus.buses.read"
        },
        {
          "label": "Seat layouts",
          "to": "/seat-layouts",
          "permission": "bus.seat_layouts.read"
        },
        {
          "label": "Registrations",
          "to": "/buses/registrations",
          "permission": "bus.buses_registrations.read",
          "noTableYet": true,
          "countKey": "bus.buses.registrations"
        }
      ]
    },
    {
      "title": "Access",
      "items": [
        {
          "label": "Gates",
          "to": "/gates",
          "permission": "bus.gates.read"
        },
        {
          "label": "Turnstiles",
          "to": "/turnstiles",
          "permission": "bus.turnstiles.read"
        }
      ]
    },
    {
      "title": "Configuration",
      "items": [
        {
          "label": "Settings",
          "to": "/settings",
          "permission": "bus.settings.read"
        },
        {
          "label": "Counters",
          "to": "/counters",
          "permission": "bus.counters.read"
        },
        {
          "label": "Kiosks",
          "to": "/kiosks",
          "permission": "bus.kiosks.read"
        },
        {
          "label": "Displays",
          "to": "/displays",
          "permission": "bus.displays.read"
        },
        {
          "label": "Offers",
          "to": "/offers",
          "permission": "bus.offers.read"
        },
        {
          "label": "Ticket types",
          "to": "/ticket-types",
          "permission": "bus.ticket_types.read"
        },
        {
          "label": "Zones",
          "to": "/zones",
          "permission": "bus.zones.read"
        },
        {
          "label": "Tours",
          "to": "/tours",
          "permission": "bus.tours.read"
        },
        {
          "label": "Tour schedules",
          "to": "/tour-schedules",
          "permission": "bus.tour_schedules.read",
          "noTableYet": true
        },
        {
          "label": "Lucky wheel",
          "to": "/lucky-wheel",
          "permission": "bus.lucky_wheel.read",
          "noTableYet": true
        }
      ]
    },
    {
      "title": "People",
      "items": [
        {
          "label": "Customers",
          "to": "/customers",
          "permission": "bus.customers.read"
        },
        {
          "label": "Staff requests",
          "to": "/staff-requests",
          "permission": "bus.staff_requests.read",
          "noTableYet": true,
          "countKey": "bus.staff-requests"
        }
      ]
    },
    {
      "title": "Finance",
      "items": [
        {
          "label": "Payments",
          "to": "/finance/payments",
          "permission": "bus.finance_payments.read"
        },
        {
          "label": "Settlements",
          "to": "/finance/settlements",
          "permission": "bus.finance_settlements.read"
        },
        {
          "label": "Einvoices",
          "to": "/finance/einvoices",
          "permission": "bus.finance_einvoices.read"
        }
      ]
    },
    {
      "title": "Messaging",
      "items": [
        {
          "label": "Campaigns",
          "to": "/messaging/campaigns",
          "permission": "bus.messaging_campaigns.read"
        },
        {
          "label": "Templates",
          "to": "/messaging/templates",
          "permission": "bus.messaging_templates.read"
        }
      ]
    },
    {
      "title": "Logs",
      "items": [
        {
          "label": "Entries",
          "to": "/logs/entries",
          "permission": "bus.logs_entries.read"
        },
        {
          "label": "Credit",
          "to": "/logs/credit",
          "permission": "bus.logs_credit.read"
        },
        {
          "label": "Prints",
          "to": "/logs/prints",
          "permission": "bus.logs_prints.read",
          "noTableYet": true
        },
        {
          "label": "Security",
          "to": "/logs/security",
          "permission": "bus.logs_security.read"
        },
        {
          "label": "Customer exports",
          "to": "/logs/customer-exports",
          "permission": "bus.logs_customer_exports.read"
        }
      ]
    },
    {
      "title": "Reports",
      "items": [
        {
          "label": "Reports",
          "to": "/reports",
          "permission": "bus.reports.read"
        }
      ]
    },
    {
      "title": "Counter",
      "items": [
        {
          "label": "Open counter",
          "to": "/counter",
          "permission": "bus.counter.read"
        }
      ]
    }
  ]
},
})
