// Menu groups and order follow the sitemap, which copies today's admin menu (doc 09).
// Permissions follow doc 27's `<module>.<resource>.<action>` convention; doc 27 has no full
// catalogue yet, so resource names are derived from the path. TODO(api): check them against the seeder.
export default defineAppConfig({
  ops: {
    "app": "fleet",
    "title": "Global Marque",
    "badgeIcon": "i-bx-car",
    "locationInPath": false,
    "menu": [
        {
            "title": "Today",
            "items": [
                {
                    "label": "Today",
                    "to": "/",
                    "permission": "fleet.dashboard.read"
                },
                {
                    "label": "Drivers today",
                    "to": "/drivers/today",
                    "permission": "fleet.drivers_today.read"
                }
            ]
        },
        {
            "title": "Limo",
            "items": [
                {
                "label": "Limo",
                "to": "/limo",
                "permission": "fleet.limo.read"
                },
                {
                "label": "Inbox",
                "to": "/limo/inbox",
                "permission": "fleet.limo_inbox.read",
                "countKey": "fleet.limo.inbox"
                },
                {
                "label": "Changes",
                "to": "/limo/changes",
                "permission": "fleet.limo_changes.read",
                "countKey": "fleet.limo.changes"
                },
                {
                "label": "Pending",
                "to": "/limo/pending",
                "permission": "fleet.limo_pending.read"
                },
                {
                "label": "Transferred",
                "to": "/limo/transferred",
                "permission": "fleet.limo_transferred.read"
                }
            ]
        },
        {
        "title": "Van",
        "items": [
            {
            "label": "Trips",
            "to": "/van/trips",
            "permission": "fleet.van_trips.read"
            },
            {
            "label": "Routes",
            "to": "/van/routes",
            "permission": "fleet.van_routes.read"
            },
            {
            "label": "Rosters",
            "to": "/van/rosters",
            "permission": "fleet.van_rosters.read"
            },
            {
            "label": "Seats",
            "to": "/van/seats",
            "permission": "fleet.van_seats.read"
            },
            {
            "label": "Fuel",
            "to": "/van/fuel",
            "permission": "fleet.van_fuel.read"
            }
        ]
        },
        {
        "title": "Rentals",
        "items": [
            {
            "label": "Rentals",
            "to": "/rentals",
            "permission": "fleet.rentals.read"
            }
        ]
        },
        {
        "title": "Drivers",
        "items": [
            {
            "label": "Drivers",
            "to": "/drivers",
            "permission": "fleet.drivers.read"
            },
            {
            "label": "Drivers expiry",
            "to": "/drivers/expiry",
            "permission": "fleet.drivers_expiry.read"
            }
        ]
        },
        {
        "title": "Vehicles",
        "items": [
            {
            "label": "Vehicles",
            "to": "/vehicles",
            "permission": "fleet.vehicles.read"
            },
            {
            "label": "Issues",
            "to": "/vehicles/issues",
            "permission": "fleet.vehicles_issues.read"
            },
            {
            "label": "Maintenance",
            "to": "/vehicles/maintenance",
            "permission": "fleet.vehicles_maintenance.read"
            },
            {
            "label": "Tracking",
            "to": "/vehicles/tracking",
            "permission": "fleet.vehicles_tracking.read"
            }
        ]
        },
        {
        "title": "Clients",
        "items": [
            {
            "label": "Clients",
            "to": "/clients",
            "permission": "fleet.clients.read"
            }
        ]
        },
        {
        "title": "Configuration",
        "items": [
            {
            "label": "Zones",
            "to": "/zones",
            "permission": "fleet.zones.read"
            },
            {
            "label": "Places",
            "to": "/places",
            "permission": "fleet.places.read"
            },
            {
            "label": "Fuel rates",
            "to": "/fuel-rates",
            "permission": "fleet.fuel_rates.read"
            },
            {
            "label": "Toll rates",
            "to": "/toll-rates",
            "permission": "fleet.toll_rates.read"
            },
            {
            "label": "Notifications",
            "to": "/settings/notifications",
            "permission": "fleet.settings_notifications.read"
            },
            {
            "label": "Settings",
            "to": "/settings",
            "permission": "fleet.settings.read"
            }
        ]
        },
        {
        "title": "Reports",
        "items": [
            {
            "label": "Ggm daily",
            "to": "/reports/ggm-daily",
            "permission": "fleet.reports_ggm_daily.read"
            },
            {
            "label": "Limo",
            "to": "/reports/limo",
            "permission": "fleet.reports_limo.read"
            },
            {
            "label": "Drivers",
            "to": "/reports/drivers",
            "permission": "fleet.reports_drivers.read"
            }
        ]
        }
    ]
    },
})
