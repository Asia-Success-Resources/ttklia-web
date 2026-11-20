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
                    "icon": "i-bx-dashboard",
                    "permission": "taxi.dashboard.read"
                },
                {
                    "label": "Sales",
                    "to": "/sales",
                    "icon": "i-bx-chart-line",
                    "permission": "taxi.sales.read"
                },
                {
                    "label": "Claims",
                    "to": "/dashboards/claims",
                    "icon": "i-bx-pie-chart",
                    "permission": "taxi.dashboards_claims.read"
                },
                {
                    "label": "Tickets",
                    "to": "/dashboards/tickets",
                    "icon": "i-bx-bar-chart",
                    "permission": "taxi.dashboards_tickets.read"
                },
                {
                    "label": "Lines",
                    "to": "/dashboards/lines",
                    "icon": "i-bx-chart-bar-rows",
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
                    "icon": "i-bx-ticket",
                    "permission": "taxi.bookings.read"
                },
                {
                    "label": "Refunds",
                    "to": "/refunds",
                    "icon": "i-bx-undo",
                    "permission": "taxi.refunds.read",
                    "countKey": "taxi.refunds"
                },
                {
                    "label": "Tickets",
                    "to": "/tickets",
                    "icon": "i-bx-tickets",
                    "permission": "taxi.tickets.read"
                },
                {
                    "label": "Gates",
                    "to": "/gates",
                    "icon": "i-bx-traffic-barrier",
                    "permission": "taxi.gates.read"
                },
                {
                    "label": "Claims",
                    "to": "/claims",
                    "icon": "i-bx-wallet-note",
                    "permission": "taxi.claims.read",
                    "noTableYet": true
                },
                {
                    "label": "Sessions",
                    "to": "/sessions",
                    "icon": "i-bx-stopwatch",
                    "permission": "taxi.sessions.read"
                },
                {
                    "label": "Otp",
                    "to": "/otp",
                    "icon": "i-bx-mobile",
                    "permission": "taxi.otp.read",
                    "noTableYet": true
                },
                {
                    "label": "Driver selection",
                    "to": "/driver-selection",
                    "icon": "i-bx-user-check",
                    "permission": "taxi.driver_selection.read"
                },
                {
                    "label": "Driver location",
                    "to": "/driver-location",
                    "icon": "i-bx-radar",
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
                    "icon": "i-bx-desktop",
                    "permission": "taxi.counters.read"
                },
                {
                    "label": "Kiosks",
                    "to": "/kiosks",
                    "icon": "i-bx-tablet",
                    "permission": "taxi.kiosks.read"
                },
                {
                    "label": "Locations",
                    "to": "/locations",
                    "icon": "i-bx-map",
                    "permission": "taxi.locations.read"
                },
                {
                    "label": "Vehicle types",
                    "to": "/vehicle-types",
                    "icon": "i-bx-taxi",
                    "permission": "taxi.vehicle_types.read"
                },
                {
                    "label": "Vehicles",
                    "to": "/vehicles",
                    "icon": "i-bx-truck",
                    "permission": "taxi.vehicles.read"
                },
                {
                    "label": "Vests",
                    "to": "/vests",
                    "icon": "i-bx-badge",
                    "permission": "taxi.vests.read",
                    "noTableYet": true
                },
                {
                    "label": "Zones",
                    "to": "/zones",
                    "icon": "i-bx-layers",
                    "permission": "taxi.zones.read"
                },
                {
                    "label": "Booking codes",
                    "to": "/codes/booking",
                    "icon": "i-bx-qr",
                    "permission": "taxi.codes_booking.read"
                },
                {
                    "label": "Master codes",
                    "to": "/codes/master",
                    "icon": "i-bx-key",
                    "permission": "taxi.codes_master.read"
                },
                {
                    "label": "Integrations",
                    "to": "/integrations",
                    "icon": "i-bx-plug-connect",
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
                    "icon": "i-bx-user-circle",
                    "permission": "taxi.customers.read"
                },
                {
                    "label": "Drivers",
                    "to": "/drivers",
                    "icon": "i-bx-steering-wheel",
                    "permission": "taxi.drivers.read"
                },
                {
                    "label": "Drivers",
                    "to": "/logs/drivers",
                    "icon": "i-bx-steering-wheel",
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
                    "icon": "i-bx-list-ul",
                    "permission": "taxi.logs_tickets.read"
                },
                {
                    "label": "Prints",
                    "to": "/logs/prints",
                    "icon": "i-bx-printer",
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
                    "icon": "i-bx-file-report",
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
                    "icon": "i-bx-store-alt-2",
                    "permission": "taxi.counter.read"
                }
            ]
        }
    ]
},
})
