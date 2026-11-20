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
                        "icon": "i-bx-dashboard",
                        "permission": "bus.dashboard.read"
                    },
                    {
                        "label": "Sales",
                        "to": "/sales",
                        "icon": "i-bx-chart-line",
                        "permission": "bus.sales.read"
                    },
                    {
                        "label": "Product sales",
                        "to": "/product-sales",
                        "icon": "i-bx-bar-chart",
                        "permission": "bus.product_sales.read"
                    },
                    {
                        "label": "Vendors",
                        "to": "/vendors",
                        "icon": "i-bx-store",
                        "permission": "bus.vendors.read"
                    },
                    {
                        "label": "Manual entries",
                        "to": "/manual-entries",
                        "icon": "i-bx-edit",
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
                        "icon": "i-bx-ticket",
                        "permission": "bus.bookings.read"
                    },
                    {
                        "label": "Refunds",
                        "to": "/refunds",
                        "icon": "i-bx-undo",
                        "permission": "bus.refunds.read",
                        "countKey": "bus.refunds"
                    },
                    {
                        "label": "Orders",
                        "to": "/orders",
                        "icon": "i-bx-cart",
                        "permission": "bus.orders.read"
                    },
                    {
                        "label": "Sessions",
                        "to": "/sessions",
                        "icon": "i-bx-stopwatch",
                        "permission": "bus.sessions.read"
                    },
                    {
                        "label": "Tour orders",
                        "to": "/tour-orders",
                        "icon": "i-bx-trip",
                        "permission": "bus.tour_orders.read"
                    },
                    {
                        "label": "Products",
                        "to": "/products",
                        "icon": "i-bx-package",
                        "permission": "bus.products.read"
                    },
                    {
                        "label": "Walk in queue",
                        "to": "/walk-in-queue",
                        "icon": "i-bx-queue",
                        "permission": "bus.walk_in_queue.read",
                        "noTableYet": true
                    },
                    {
                        "label": "VIP queue",
                        "to": "/vip-queue",
                        "icon": "i-bx-crown",
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
                        "icon": "i-bx-route",
                        "permission": "bus.routes.read"
                    },
                    {
                        "label": "Trips",
                        "to": "/trips",
                        "icon": "i-bx-bus",
                        "permission": "bus.trips.read"
                    },
                    {
                        "label": "Arrivals",
                        "to": "/arrivals",
                        "icon": "i-bx-flag-chequered",
                        "permission": "bus.arrivals.read"
                    },
                    {
                        "label": "Platforms",
                        "to": "/platforms",
                        "icon": "i-bx-grid",
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
                        "icon": "i-bx-business",
                        "permission": "bus.operators.read"
                    },
                    {
                        "label": "System providers",
                        "to": "/system-providers",
                        "icon": "i-bx-server",
                        "permission": "bus.system_providers.read"
                    },
                    {
                        "label": "Top up requests",
                        "to": "/top-up-requests",
                        "icon": "i-bx-coins",
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
                        "icon": "i-bx-qr",
                        "permission": "bus.codes_booking.read"
                    },
                    {
                        "label": "Exit codes",
                        "to": "/codes/exit",
                        "icon": "i-bx-door-open",
                        "permission": "bus.codes_exit.read"
                    },
                    {
                        "label": "Master codes",
                        "to": "/codes/master",
                        "icon": "i-bx-key",
                        "permission": "bus.codes_master.read"
                    },
                    {
                        "label": "Tour codes",
                        "to": "/codes/tour",
                        "icon": "i-bx-qr-scan",
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
                        "icon": "i-bx-cctv",
                        "permission": "bus.buses_entries.read"
                    },
                    {
                        "label": "Buses",
                        "to": "/buses",
                        "icon": "i-bx-school-bus",
                        "permission": "bus.buses.read"
                    },
                    {
                        "label": "Seat layouts",
                        "to": "/seat-layouts",
                        "icon": "i-bx-chair",
                        "permission": "bus.seat_layouts.read"
                    },
                    {
                        "label": "Registrations",
                        "to": "/buses/registrations",
                        "icon": "i-bx-clipboard-check",
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
                        "icon": "i-bx-traffic-barrier",
                        "permission": "bus.gates.read"
                    },
                    {
                        "label": "Turnstiles",
                        "to": "/turnstiles",
                        "icon": "i-bx-rotate-cw",
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
                        "icon": "i-bx-cog",
                        "permission": "bus.settings.read"
                    },
                    {
                        "label": "Counters",
                        "to": "/counters",
                        "icon": "i-bx-desktop",
                        "permission": "bus.counters.read"
                    },
                    {
                        "label": "Kiosks",
                        "to": "/kiosks",
                        "icon": "i-bx-tablet",
                        "permission": "bus.kiosks.read"
                    },
                    {
                        "label": "Displays",
                        "to": "/displays",
                        "icon": "i-bx-tv",
                        "permission": "bus.displays.read"
                    },
                    {
                        "label": "Offers",
                        "to": "/offers",
                        "icon": "i-bx-gift",
                        "permission": "bus.offers.read"
                    },
                    {
                        "label": "Ticket types",
                        "to": "/ticket-types",
                        "icon": "i-bx-tickets",
                        "permission": "bus.ticket_types.read"
                    },
                    {
                        "label": "Zones",
                        "to": "/zones",
                        "icon": "i-bx-layers",
                        "permission": "bus.zones.read"
                    },
                    {
                        "label": "Tours",
                        "to": "/tours",
                        "icon": "i-bx-map",
                        "permission": "bus.tours.read"
                    },
                    {
                        "label": "Tour schedules",
                        "to": "/tour-schedules",
                        "icon": "i-bx-calendar-alt",
                        "permission": "bus.tour_schedules.read",
                        "noTableYet": true
                    },
                    {
                        "label": "Lucky wheel",
                        "to": "/lucky-wheel",
                        "icon": "i-bx-color-wheel",
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
                        "icon": "i-bx-user-circle",
                        "permission": "bus.customers.read"
                    },
                    {
                        "label": "Staff requests",
                        "to": "/staff-requests",
                        "icon": "i-bx-user-check",
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
                        "icon": "i-bx-credit-card",
                        "permission": "bus.finance_payments.read"
                    },
                    {
                        "label": "Settlements",
                        "to": "/finance/settlements",
                        "icon": "i-bx-bank",
                        "permission": "bus.finance_settlements.read"
                    },
                    {
                        "label": "Einvoices",
                        "to": "/finance/einvoices",
                        "icon": "i-bx-receipt",
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
                        "icon": "i-bx-megaphone",
                        "permission": "bus.messaging_campaigns.read"
                    },
                    {
                        "label": "Templates",
                        "to": "/messaging/templates",
                        "icon": "i-bx-envelope",
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
                        "icon": "i-bx-list-ul",
                        "permission": "bus.logs_entries.read"
                    },
                    {
                        "label": "Credit",
                        "to": "/logs/credit",
                        "icon": "i-bx-coin",
                        "permission": "bus.logs_credit.read"
                    },
                    {
                        "label": "Prints",
                        "to": "/logs/prints",
                        "icon": "i-bx-printer",
                        "permission": "bus.logs_prints.read",
                        "noTableYet": true
                    },
                    {
                        "label": "Security",
                        "to": "/logs/security",
                        "icon": "i-bx-shield",
                        "permission": "bus.logs_security.read"
                    },
                    {
                        "label": "Customer exports",
                        "to": "/logs/customer-exports",
                        "icon": "i-bx-arrow-out-up-square-half",
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
                        "icon": "i-bx-file-report",
                        "permission": "bus.reports.read"
                    }
                ]
            }
        ]
    },
})
