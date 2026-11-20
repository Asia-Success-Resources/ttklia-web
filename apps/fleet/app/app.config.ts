// Menu groups and order follow the sitemap, which copies today's admin menu (doc 09).
// Permissions follow doc 27's `<module>.<resource>.<action>` convention; doc 27 has no full
// catalogue yet, so resource names are derived from the path. TODO(api): check them against the seeder.
export default defineAppConfig({
    ops: {
        "app": "fleet",
        "title": "Fleet Management",
        "badgeIcon": "i-bx-car",
        "locationInPath": false,
        "menu": [
                {
                        "title": "Today",
                        "items": [
                                {
                                        "label": "Today",
                                        "to": "/",
                                        "icon": "i-bx-calendar-event",
                                        "permission": "fleet.dashboard.read"
                                },
                                {
                                        "label": "Drivers today",
                                        "to": "/drivers/today",
                                        "icon": "i-bx-user-check",
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
                                "icon": "i-bx-car",
                                "permission": "fleet.limo.read"
                                },
                                {
                                "label": "Inbox",
                                "to": "/limo/inbox",
                                "icon": "i-bx-inbox",
                                "permission": "fleet.limo_inbox.read",
                                "countKey": "fleet.limo.inbox"
                                },
                                {
                                "label": "Changes",
                                "to": "/limo/changes",
                                "icon": "i-bx-git-compare",
                                "permission": "fleet.limo_changes.read",
                                "countKey": "fleet.limo.changes"
                                },
                                {
                                "label": "Pending",
                                "to": "/limo/pending",
                                "icon": "i-bx-hourglass",
                                "permission": "fleet.limo_pending.read"
                                },
                                {
                                "label": "Transferred",
                                "to": "/limo/transferred",
                                "icon": "i-bx-arrow-right-left",
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
                        "icon": "i-bx-bus",
                        "permission": "fleet.van_trips.read"
                        },
                        {
                        "label": "Routes",
                        "to": "/van/routes",
                        "icon": "i-bx-route",
                        "permission": "fleet.van_routes.read"
                        },
                        {
                        "label": "Rosters",
                        "to": "/van/rosters",
                        "icon": "i-bx-calendar-detail",
                        "permission": "fleet.van_rosters.read"
                        },
                        {
                        "label": "Seats",
                        "to": "/van/seats",
                        "icon": "i-bx-chair",
                        "permission": "fleet.van_seats.read"
                        },
                        {
                        "label": "Fuel",
                        "to": "/van/fuel",
                        "icon": "i-bx-petrol-pump",
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
                        "icon": "i-bx-car-key",
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
                        "icon": "i-bx-steering-wheel",
                        "permission": "fleet.drivers.read"
                        },
                        {
                        "label": "Drivers expiry",
                        "to": "/drivers/expiry",
                        "icon": "i-bx-alarm-exclamation",
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
                        "icon": "i-bx-truck",
                        "permission": "fleet.vehicles.read"
                        },
                        {
                        "label": "Issues",
                        "to": "/vehicles/issues",
                        "icon": "i-bx-badge-exclamation",
                        "permission": "fleet.vehicles_issues.read"
                        },
                        {
                        "label": "Maintenance",
                        "to": "/vehicles/maintenance",
                        "icon": "i-bx-spanner",
                        "permission": "fleet.vehicles_maintenance.read"
                        },
                        {
                        "label": "Tracking",
                        "to": "/vehicles/tracking",
                        "icon": "i-bx-radar",
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
                        "icon": "i-bx-briefcase",
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
                        "icon": "i-bx-layers",
                        "permission": "fleet.zones.read"
                        },
                        {
                        "label": "Places",
                        "to": "/places",
                        "icon": "i-bx-location-pin",
                        "permission": "fleet.places.read"
                        },
                        {
                        "label": "Fuel rates",
                        "to": "/fuel-rates",
                        "icon": "i-bx-dollar-circle",
                        "permission": "fleet.fuel_rates.read"
                        },
                        {
                        "label": "Toll rates",
                        "to": "/toll-rates",
                        "icon": "i-bx-road",
                        "permission": "fleet.toll_rates.read"
                        },
                        {
                        "label": "Notifications",
                        "to": "/settings/notifications",
                        "icon": "i-bx-bell",
                        "permission": "fleet.settings_notifications.read"
                        },
                        {
                        "label": "Settings",
                        "to": "/settings",
                        "icon": "i-bx-cog",
                        "permission": "fleet.settings.read"
                        }
                ]
                },
                {
                "title": "Reports",
                "items": [
                        {
                        "label": "GGM daily",
                        "to": "/reports/ggm-daily",
                        "icon": "i-bx-calendar-check",
                        "permission": "fleet.reports_ggm_daily.read"
                        },
                        {
                        "label": "Limo",
                        "to": "/reports/limo",
                        "icon": "i-bx-chart-line",
                        "permission": "fleet.reports_limo.read"
                        },
                        {
                        "label": "Drivers",
                        "to": "/reports/drivers",
                        "icon": "i-bx-chart-bar-rows",
                        "permission": "fleet.reports_drivers.read"
                        }
                ]
                }
        ]
        },
})
