// Menu groups and order follow the sitemap, which copies today's admin menu (doc 09).
// Permissions follow doc 27's `<module>.<resource>.<action>` convention; doc 27 has no full
// catalogue yet, so resource names are derived from the path. TODO(api): check them against the seeder.
// Pricing and places moved to the admin app (Sitemap 4); the pages stay with TODO(removed-from-docs).
export default defineAppConfig({
  ops: {
  "app": "ride",
  "title": "E-hailing",
  "badgeIcon": "i-bx-map",
  "locationInPath": false,
  "menu": [
    {
      "title": "Live",
      "items": [
        {
          "label": "Overview",
          "to": "/",
          "permission": "ride.dashboard.read"
        },
        {
          "label": "Requests",
          "to": "/requests",
          "permission": "ride.requests.read",
          "countKey": "ride.requests"
        },
        {
          "label": "Dispatch",
          "to": "/dispatch",
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
          "permission": "ride.drivers.read"
        },
        {
          "label": "Tiers",
          "to": "/drivers/tiers",
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
          "permission": "ride.riders.read"
        }
      ]
    },
    {
      "title": "Messaging",
      "items": [
        {
          "label": "Campaigns",
          "to": "/messaging/campaigns",
          "permission": "ride.messaging_campaigns.read"
        },
        {
          "label": "Templates",
          "to": "/messaging/templates",
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
          "permission": "ride.reports.read"
        }
      ]
    }
  ]
},
})
