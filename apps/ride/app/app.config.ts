// Menu groups and order follow the sitemap, which copies today's admin menu (doc 09).
// Permissions follow doc 27's `<module>.<resource>.<action>` convention; doc 27 has no full
// catalogue yet, so resource names are derived from the path. TODO(api): check them against the seeder.
// Pricing and places moved to the admin app (Sitemap 4); the pages stay with TODO(removed-from-docs).
export default defineAppConfig({
    ops: {
    "app": "ride",
    "title": "Teeko",
    "badgeIcon": "i-bx-map",
    "locationInPath": false,
    "menu": [
        {
            "title": "Live",
            "items": [
                {
                    "label": "Overview",
                    "to": "/",
                    "icon": "i-bx-dashboard",
                    "permission": "ride.dashboard.read"
                },
                {
                    "label": "Requests",
                    "to": "/requests",
                    "icon": "i-bx-trip",
                    "permission": "ride.requests.read",
                    "countKey": "ride.requests"
                },
                {
                    "label": "Dispatch",
                    "to": "/dispatch",
                    "icon": "i-bx-send",
                    "permission": "ride.dispatch.read"
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
                    "permission": "ride.drivers.read"
                },
                {
                    "label": "Tiers",
                    "to": "/drivers/tiers",
                    "icon": "i-bx-medal-star-alt",
                    "permission": "ride.drivers_tiers.read"
                }
            ]
        },
        {
            "title": "Riders",
            "items": [
                {
                    "label": "Riders",
                    "to": "/riders",
                    "icon": "i-bx-user",
                    "permission": "ride.riders.read"
                }
            ]
        },
        {
            "title": "Scheduled rides",
            "items": [
                {
                    "label": "Scheduled rides",
                    "to": "/scheduled",
                    "icon": "i-bx-calendar",
                    "permission": "ride.scheduled.read"
                },
                {
                    "label": "Settings",
                    "to": "/settings/scheduled",
                    "icon": "i-bx-cog",
                    "permission": "ride.settings_scheduled.read"
                }
            ]
        },
        {
            "title": "Pickup queue",
            "items": [
                {
                    "label": "Pickup queue",
                    "to": "/pickup-queue",
                    "icon": "i-bx-car",
                    "permission": "ride.pickup_queue.read"
                },
                {
                    "label": "Queue screens",
                    "to": "/pickup-queue/screens",
                    "icon": "i-bx-tv",
                    "permission": "ride.pickup_queue_screens.read"
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
                    "permission": "ride.messaging_campaigns.read"
                },
                {
                    "label": "Templates",
                    "to": "/messaging/templates",
                    "icon": "i-bx-envelope",
                    "permission": "ride.messaging_templates.read"
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
                    "permission": "ride.reports.read"
                }
            ]
        }
    ]
},
})
