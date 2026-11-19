// Menu groups and order follow the sitemap, which copies today's admin menu (doc 09).
// Permissions follow doc 27's `<module>.<resource>.<action>` convention; doc 27 has no full
// catalogue yet, so resource names are derived from the path. TODO(api): check them against the seeder.
export default defineAppConfig({
  ops: {
  "app": "admin",
  "title": "Global",
  "badgeIcon": "i-bx-globe",
  "locationInPath": false,
  "menu": [
    {
      "title": "Dashboard",
      "items": [
        {
          "label": "Dashboard",
          "to": "/global",
          "permission": "global.dashboard.read"
        }
      ]
    },
    {
      "title": "Users",
      "items": [
        {
          "label": "Users",
          "to": "/global/users",
          "permission": "global.users.read"
        },
        {
          "label": "Roles",
          "to": "/global/roles",
          "permission": "global.roles.read"
        }
      ]
    },
    {
      "title": "Customers",
      "items": [
        {
          "label": "Customers",
          "to": "/global/customers",
          "permission": "global.customers.read"
        }
      ]
    },
    {
      "title": "Workspaces",
      "items": [
        {
          "label": "Workspaces",
          "to": "/global/workspaces",
          "permission": "global.workspaces.read"
        }
      ]
    },
    {
      "title": "Vendors",
      "items": [
        {
          "label": "Vendors",
          "to": "/global/vendors",
          "permission": "vendors.manage"
        },
        {
          "label": "Live tills",
          "to": "/global/vendors/live",
          "permission": "vendors.manage"
        }
      ]
    },
    {
      "title": "Settings",
      "items": [
        {
          "label": "Ads",
          "to": "/global/settings/ads",
          "permission": "global.settings_ads.read"
        },
        {
          "label": "Kiosks",
          "to": "/global/settings/kiosks",
          "permission": "global.settings_kiosks.read"
        },
        {
          "label": "Domains",
          "to": "/global/settings/domains",
          "permission": "global.settings_domains.read"
        },
        {
          "label": "Languages",
          "to": "/global/settings/languages",
          "permission": "global.settings_languages.read"
        },
        {
          "label": "Insurance",
          "to": "/global/settings/insurance",
          "permission": "global.settings_insurance.read"
        },
        {
          "label": "Referrals",
          "to": "/global/settings/referrals",
          "permission": "global.settings_referrals.read"
        }
      ]
    },
    {
      "title": "Referrals",
      "items": [
        {
          "label": "Referrals",
          "to": "/global/referrals",
          "permission": "global.referrals.read"
        }
      ]
    },
    {
      "title": "Privacy (DPO)",
      "items": [
        {
          "label": "Notices",
          "to": "/global/privacy/notices",
          "permission": "global.privacy_notices.read"
        },
        {
          "label": "Requests",
          "to": "/global/privacy/requests",
          "permission": "global.privacy_requests.read",
          "countKey": "admin.global.privacy.requests"
        },
        {
          "label": "Incidents",
          "to": "/global/privacy/incidents",
          "permission": "global.privacy_incidents.read"
        }
      ]
    },
    {
      "title": "Platform",
      "items": [
        {
          "label": "Devices",
          "to": "/global/devices",
          "permission": "global.devices.read"
        },
        {
          "label": "Audit log",
          "to": "/global/audit-log",
          "permission": "global.audit_log.read"
        },
        {
          "label": "Retention",
          "to": "/global/retention",
          "permission": "global.retention.read"
        },
        {
          "label": "Suppressions",
          "to": "/global/messaging/suppressions",
          "permission": "global.messaging_suppressions.read"
        }
      ]
    },
    {
      "title": "Money",
      "items": [
        {
          "label": "Ledger",
          "to": "/finance",
          "permission": "finance.ledger.read"
        },
        {
          "label": "Payments",
          "to": "/finance/payments",
          "permission": "finance.payments.read"
        },
        {
          "label": "Refunds",
          "to": "/finance/refunds",
          "permission": "finance.refunds.read",
          "countKey": "admin.finance.refunds"
        },
        {
          "label": "Payouts",
          "to": "/finance/payouts",
          "permission": "finance.payouts.read"
        },
        {
          "label": "Settlements",
          "to": "/finance/settlements",
          "permission": "finance.settlements.read"
        },
        {
          "label": "Einvoices",
          "to": "/finance/einvoices",
          "permission": "finance.einvoices.read"
        },
        {
          "label": "Vendor statements",
          "to": "/finance/vendor-statements",
          "permission": "vendors.statements.approve"
        }
      ]
    },
    {
      "title": "Pricing and places",
      "items": [
        {
          "label": "Zones",
          "to": "/pricing/zones",
          "permission": "global.pricing_zones.read"
        },
        {
          "label": "Fares",
          "to": "/pricing/fares",
          "permission": "global.pricing_fares.read"
        },
        {
          "label": "Promotions",
          "to": "/pricing/promotions",
          "permission": "global.pricing_promotions.read"
        },
        {
          "label": "Places",
          "to": "/places",
          "permission": "global.places.read"
        }
      ]
    },
    {
      "title": "Organisations",
      "items": [
        {
          "label": "Organisations",
          "to": "/finance/organisations",
          "permission": "finance.organisations.read"
        }
      ]
    }
  ]
},
})
