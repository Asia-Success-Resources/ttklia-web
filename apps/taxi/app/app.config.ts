// Menu in the Global app's style: titled sections of plain links, each with an icon (no fold-open parents).
// Sections and order follow ttklia-v2 (app/Helpers/Helper.php getTaxiNavItems): dashboards first, Reports last.
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
                "title": "Dashboard",
                "items": [
                    {
                        "label": "Dashboard",
                        "to": "/",
                        "icon": "i-bx-dashboard",
                        "permission": "taxi.dashboard.read"
                    },
                    {
                        "label": "Sale Dashboard",
                        "to": "/sales",
                        "icon": "i-bx-chart-line",
                        "permission": "taxi.sales.read"
                    }
                ]
            },
            {
                "title": "Operations",
                "items": [
                    {
                        "label": "Bookings",
                        "to": "/bookings",
                        "permission": "taxi.bookings.read",
                        "icon": "i-bx-receipt"
                    },
                    {
                        "label": "Refund Requests",
                        "to": "/refunds",
                        "permission": "taxi.refunds.read",
                        "countKey": "taxi.refunds",
                        "icon": "i-bx-undo"
                    },
                    {
                        "label": "Chees",
                        "to": "/tickets",
                        "permission": "taxi.tickets.read",
                        "icon": "i-bx-ticket"
                    },
                    {
                        "label": "Claims",
                        "to": "/claims",
                        "permission": "taxi.claims.read",
                        "noTableYet": true,
                        "icon": "i-bx-clipboard"
                    },
                    {
                        "label": "Sessions",
                        "to": "/sessions",
                        "permission": "taxi.sessions.read",
                        "icon": "i-bx-clock"
                    },
                    {
                        "label": "Generate OTP",
                        "to": "/otp",
                        "permission": "taxi.otp.read",
                        "noTableYet": true,
                        "icon": "i-bx-lock"
                    },
                    {
                        "label": "Driver Selection",
                        "to": "/driver-selection",
                        "permission": "taxi.driver_selection.read",
                        "icon": "i-bx-user-check"
                    },
                    {
                        "label": "Driver Location",
                        "to": "/driver-location",
                        "permission": "taxi.driver_location.read",
                        "icon": "i-bx-pin"
                    },
                    {
                        "label": "Gates",
                        "to": "/gates",
                        "permission": "taxi.gates.read",
                        "icon": "i-bx-door-open"
                    }
                ]
            },
            {
                "title": "Operations Dashboard",
                "items": [
                    {
                        "label": "Claims Dashboard",
                        "to": "/dashboards/claims",
                        "permission": "taxi.dashboards_claims.read",
                        "icon": "i-bx-pie-chart"
                    },
                    {
                        "label": "Chee Dashboard",
                        "to": "/dashboards/tickets",
                        "permission": "taxi.dashboards_tickets.read",
                        "icon": "i-bx-bar-chart"
                    },
                    {
                        "label": "Line Dashboard",
                        "to": "/dashboards/lines",
                        "permission": "taxi.dashboards_lines.read",
                        "icon": "i-bx-chart-line"
                    }
                ]
            },
            {
                "title": "Configuration",
                "items": [
                    {
                        "label": "Counters",
                        "to": "/counters",
                        "permission": "taxi.counters.read",
                        "icon": "i-bx-store"
                    },
                    {
                        "label": "Kiosks",
                        "to": "/kiosks",
                        "permission": "taxi.kiosks.read",
                        "icon": "i-bx-tablet"
                    },
                    {
                        "label": "Locations",
                        "to": "/locations",
                        "permission": "taxi.locations.read",
                        "icon": "i-bx-location-pin"
                    },
                    {
                        "label": "Vehicle Types",
                        "to": "/vehicle-types",
                        "permission": "taxi.vehicle_types.read",
                        "icon": "i-bx-shapes"
                    },
                    {
                        "label": "Vehicles",
                        "to": "/vehicles",
                        "permission": "taxi.vehicles.read",
                        "icon": "i-bx-car"
                    },
                    {
                        "label": "Vests",
                        "to": "/vests",
                        "permission": "taxi.vests.read",
                        "noTableYet": true,
                        "icon": "i-bx-t-shirt"
                    },
                    {
                        "label": "Zones",
                        "to": "/zones",
                        "permission": "taxi.zones.read",
                        "icon": "i-bx-layers"
                    },
                    {
                        "label": "Booking Codes",
                        "to": "/codes/booking",
                        "permission": "taxi.codes_booking.read",
                        "icon": "i-bx-barcode"
                    },
                    {
                        "label": "Master Codes",
                        "to": "/codes/master",
                        "permission": "taxi.codes_master.read",
                        "icon": "i-bx-key"
                    },
                    {
                        "label": "Integrations",
                        "to": "/integrations",
                        "permission": "taxi.integrations.read",
                        "icon": "i-bx-plug-connect"
                    },
                    {
                        "label": "Print Logs",
                        "to": "/logs/prints",
                        "permission": "taxi.logs_prints.read",
                        "noTableYet": true,
                        "icon": "i-bx-printer"
                    }
                ]
            },
            {
                "title": "People",
                "items": [
                    {
                        "label": "Customers",
                        "to": "/customers",
                        "permission": "taxi.customers.read",
                        "icon": "i-bx-user-circle"
                    },
                    {
                        "label": "Drivers",
                        "to": "/drivers",
                        "permission": "taxi.drivers.read",
                        "icon": "i-bx-user-id-card"
                    },
                    {
                        "label": "Driver Logs",
                        "to": "/logs/drivers",
                        "permission": "taxi.logs_drivers.read",
                        "icon": "i-bx-history"
                    }
                ]
            },
            {
                "title": "Logs",
                "items": [
                    {
                        "label": "Chee Action Logs",
                        "to": "/logs/tickets",
                        "permission": "taxi.logs_tickets.read",
                        "icon": "i-bx-list-ul"
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
                "title": "Open Counter",
                "items": [
                    {
                        "label": "Open Counter",
                        "to": "/counter",
                        "icon": "i-bx-store-alt-2",
                        "permission": "taxi.counter.read"
                    }
                ]
            }
        ]
},
})
