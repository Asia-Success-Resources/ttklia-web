// Menu in the Global app's style: titled sections of plain links, each with an icon (no fold-open parents).
// Sections and order follow ttklia-v2 (app/Helpers/Helper.php getBusNavItems): dashboards first, Reports last.
// Permissions follow doc 27's `<module>.<resource>.<action>` convention; doc 27 has no full
// catalogue yet, so resource names are derived from the path. TODO(api): check them against the seeder.
// Form fields at ttklia-v2's size (its inputClass: h-11, rounded-lg, px-4 py-2.5, text-sm), as the counter staff
// know them; every input, select and select menu in the bus app uses it unless a size is given.
const v2Field = {
    variants: {
        size: {
            lg: { base: 'h-11 rounded-lg px-4 py-2.5 text-sm/5 gap-2', leading: 'ps-4', trailing: 'pe-4' },
        },
    },
    defaultVariants: { size: 'lg' as const },
}

export default defineAppConfig({
    ui: {
        input: v2Field,
        select: v2Field,
        selectMenu: v2Field,
    },
    ops: {
        "app": "bus",
        "title": "TTKLIA (Bus)",
        "badgeIcon": "i-bx-bus",
        // No location in the path (bus.ttklia.com/bookings): the location chosen on /choose-location or in the
        // workspace switcher is kept in a cookie (useSavedLocation, doc 16).
        "locationInPath": false,
        "savedLocationType": "bus_terminal",
        // List pages as ttklia-v2's generic index: search, Filter, Export, Import and Create on the title row.
        "v2ListHeader": true,
        "menu": [
            {
                "title": "Dashboard",
                "items": [
                    {
                        "label": "Dashboard",
                        "to": "/",
                        "icon": "i-bx-dashboard",
                        "permission": "bus.dashboard.read"
                    },
                    {
                        "label": "Sale Dashboard",
                        "to": "/sales",
                        "icon": "i-bx-chart-line",
                        "permission": "bus.sales.read"
                    },
                    {
                        "label": "Product Sale Dashboard",
                        "to": "/product-sales",
                        "icon": "i-bx-bar-chart",
                        "permission": "bus.product_sales.read"
                    },
                    {
                        "label": "Vendor Dashboard",
                        "to": "/vendors",
                        "icon": "i-bx-store",
                        "permission": "bus.vendors.read"
                    },
                    {
                        "label": "Manual Bus Entry Dashboard",
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
                        "permission": "bus.bookings.read",
                        "icon": "i-bx-receipt"
                    },
                    {
                        "label": "Refund Requests",
                        "to": "/refunds",
                        "permission": "bus.refunds.read",
                        "countKey": "bus.refunds",
                        "icon": "i-bx-undo"
                    },
                    {
                        "label": "Orders",
                        "to": "/orders",
                        "permission": "bus.orders.read",
                        "icon": "i-bx-cart"
                    },
                    {
                        "label": "Sessions",
                        "to": "/sessions",
                        "permission": "bus.sessions.read",
                        "icon": "i-bx-clock"
                    },
                    {
                        "label": "Tour Orders",
                        "to": "/tour-orders",
                        "permission": "bus.tour_orders.read",
                        "icon": "i-bx-map"
                    },
                    {
                        "label": "Products",
                        "to": "/products",
                        "permission": "bus.products.read",
                        "icon": "i-bx-package"
                    },
                    {
                        "label": "Walk-in Queue",
                        "to": "/walk-in-queue",
                        "permission": "bus.walk_in_queue.read",
                        "noTableYet": true,
                        "icon": "i-bx-walking"
                    },
                    {
                        "label": "VIP Cut Queue",
                        "to": "/vip-queue",
                        "permission": "bus.vip_queue.read",
                        "noTableYet": true,
                        "icon": "i-bx-crown"
                    }
                ]
            },
            {
                "title": "Scheduling",
                "items": [
                    {
                        "label": "Routes",
                        "to": "/routes",
                        "permission": "bus.routes.read",
                        "icon": "i-bx-trip"
                    },
                    {
                        "label": "Trips",
                        "to": "/trips",
                        "permission": "bus.trips.read",
                        "icon": "i-bx-bus"
                    },
                    {
                        "label": "Arrivals",
                        "to": "/arrivals",
                        "permission": "bus.arrivals.read",
                        "icon": "i-bx-arrow-to-bottom"
                    },
                    {
                        "label": "Platforms",
                        "to": "/platforms",
                        "permission": "bus.platforms.read",
                        "icon": "i-bx-grid"
                    }
                ]
            },
            {
                "title": "Bus Operators",
                "items": [
                    {
                        "label": "Companies",
                        "to": "/operators",
                        "permission": "bus.operators.read",
                        "icon": "i-bx-buildings"
                    },
                    {
                        "label": "System Providers",
                        "to": "/system-providers",
                        "permission": "bus.system_providers.read",
                        "icon": "i-bx-server"
                    },
                    {
                        "label": "Top-up Requests",
                        "to": "/top-up-requests",
                        "permission": "bus.top_up_requests.read",
                        "noTableYet": true,
                        "countKey": "bus.top-up-requests",
                        "icon": "i-bx-wallet-alt"
                    }
                ]
            },
            {
                "title": "Codes",
                "items": [
                    {
                        "label": "Booking Codes",
                        "to": "/codes/booking",
                        "permission": "bus.codes_booking.read",
                        "icon": "i-bx-barcode"
                    },
                    {
                        "label": "Exit Codes",
                        "to": "/codes/exit",
                        "permission": "bus.codes_exit.read",
                        "icon": "i-bx-arrow-out-up-square-half"
                    },
                    {
                        "label": "Master Codes",
                        "to": "/codes/master",
                        "permission": "bus.codes_master.read",
                        "icon": "i-bx-key"
                    },
                    {
                        "label": "Tour Codes",
                        "to": "/codes/tour",
                        "permission": "bus.codes_tour.read",
                        "icon": "i-bx-qr"
                    }
                ]
            },
            {
                "title": "Bus",
                "items": [
                    {
                        "label": "Bus Entries",
                        "to": "/buses/entries",
                        "permission": "bus.buses_entries.read",
                        "icon": "i-bx-enter"
                    },
                    {
                        "label": "Buses",
                        "to": "/buses",
                        "permission": "bus.buses.read",
                        "icon": "i-bx-van"
                    },
                    {
                        "label": "Seat Layouts",
                        "to": "/seat-layouts",
                        "permission": "bus.seat_layouts.read",
                        "icon": "i-bx-chair"
                    },
                    {
                        "label": "Bus Registration",
                        "to": "/buses/registrations",
                        "permission": "bus.buses_registrations.read",
                        "noTableYet": true,
                        "countKey": "bus.buses.registrations",
                        "icon": "i-bx-user-id-card"
                    }
                ]
            },
            {
                "title": "Access",
                "items": [
                    {
                        "label": "Gates",
                        "to": "/gates",
                        "permission": "bus.gates.read",
                        "icon": "i-bx-door-open"
                    },
                    {
                        "label": "Turnstiles",
                        "to": "/turnstiles",
                        "permission": "bus.turnstiles.read",
                        "icon": "i-bx-arrow-left-right"
                    }
                ]
            },
            {
                "title": "Logs",
                "items": [
                    {
                        "label": "Bus Entry Logs",
                        "to": "/logs/entries",
                        "permission": "bus.logs_entries.read",
                        "icon": "i-bx-list-ul"
                    },
                    {
                        "label": "Credit Logs",
                        "to": "/logs/credit",
                        "permission": "bus.logs_credit.read",
                        "icon": "i-bx-coins"
                    },
                    {
                        "label": "Print Logs",
                        "to": "/logs/prints",
                        "permission": "bus.logs_prints.read",
                        "noTableYet": true,
                        "icon": "i-bx-printer"
                    },
                    {
                        "label": "Security Logs",
                        "to": "/logs/security",
                        "permission": "bus.logs_security.read",
                        "icon": "i-bx-shield"
                    },
                    {
                        "label": "Customer Detail Export Logs",
                        "to": "/logs/customer-exports",
                        "permission": "bus.logs_customer_exports.read",
                        "icon": "i-bx-share"
                    }
                ]
            },
            {
                "title": "Configuration",
                "items": [
                    {
                        "label": "Counters",
                        "to": "/counters",
                        "permission": "bus.counters.read",
                        "icon": "i-bx-store"
                    },
                    {
                        "label": "Kiosks",
                        "to": "/kiosks",
                        "permission": "bus.kiosks.read",
                        "icon": "i-bx-tablet"
                    },
                    {
                        "label": "Displays",
                        "to": "/displays",
                        "permission": "bus.displays.read",
                        "icon": "i-bx-tv"
                    },
                    {
                        "label": "Offers",
                        "to": "/offers",
                        "permission": "bus.offers.read",
                        "icon": "i-bx-gift"
                    },
                    {
                        "label": "Ticket Types",
                        "to": "/ticket-types",
                        "permission": "bus.ticket_types.read",
                        "icon": "i-bx-price-tag"
                    },
                    {
                        "label": "Zones",
                        "to": "/zones",
                        "permission": "bus.zones.read",
                        "icon": "i-bx-layers"
                    },
                    {
                        "label": "Settings",
                        "to": "/settings",
                        "permission": "bus.settings.read",
                        "icon": "i-bx-cog"
                    },
                    {
                        "label": "Tours",
                        "to": "/tours",
                        "permission": "bus.tours.read",
                        "icon": "i-bx-map"
                    },
                    {
                        "label": "Tour Schedules",
                        "to": "/tour-schedules",
                        "permission": "bus.tour_schedules.read",
                        "noTableYet": true,
                        "icon": "i-bx-calendar"
                    },
                    {
                        "label": "Lucky Wheel",
                        "to": "/lucky-wheel",
                        "permission": "bus.lucky_wheel.read",
                        "noTableYet": true,
                        "icon": "i-bx-dice-5"
                    }
                ]
            },
            {
                "title": "People",
                "items": [
                    {
                        "label": "Customers",
                        "to": "/customers",
                        "permission": "bus.customers.read",
                        "icon": "i-bx-user-circle"
                    },
                    {
                        "label": "Staff Requests",
                        "to": "/staff-requests",
                        "permission": "bus.staff_requests.read",
                        "noTableYet": true,
                        "countKey": "bus.staff-requests",
                        "icon": "i-bx-user-plus"
                    }
                ]
            },
            {
                "title": "Finance",
                "items": [
                    {
                        "label": "Payments",
                        "to": "/finance/payments",
                        "permission": "bus.finance_payments.read",
                        "icon": "i-bx-credit-card"
                    },
                    {
                        "label": "Settlements",
                        "to": "/finance/settlements",
                        "permission": "bus.finance_settlements.read",
                        "icon": "i-bx-bank"
                    },
                    {
                        "label": "E-Invoices",
                        "to": "/finance/einvoices",
                        "permission": "bus.finance_einvoices.read",
                        "icon": "i-bx-receipt"
                    }
                ]
            },
            {
                "title": "Messaging",
                "items": [
                    {
                        "label": "Campaigns",
                        "to": "/messaging/campaigns",
                        "permission": "bus.messaging_campaigns.read",
                        "icon": "i-bx-megaphone"
                    },
                    {
                        "label": "Templates",
                        "to": "/messaging/templates",
                        "permission": "bus.messaging_templates.read",
                        "icon": "i-bx-file"
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
