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
                    "icon": "i-bx-dashboard",
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
                    "icon": "i-bx-group",
                    "permission": "global.users.read"
                },
                {
                    "label": "Roles",
                    "to": "/global/roles",
                    "icon": "i-bx-shield-half",
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
                    "icon": "i-bx-user-circle",
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
                    "icon": "i-bx-buildings",
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
                    "icon": "i-bx-store",
                    "permission": "vendors.manage"
                },
                {
                    "label": "Live tills",
                    "to": "/global/vendors/live",
                    "icon": "i-bx-cart-check",
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
                    "icon": "i-bx-megaphone",
                    "permission": "global.settings_ads.read"
                },
                {
                    "label": "Kiosks",
                    "to": "/global/settings/kiosks",
                    "icon": "i-bx-tablet",
                    "permission": "global.settings_kiosks.read"
                },
                {
                    "label": "Domains",
                    "to": "/global/settings/domains",
                    "icon": "i-bx-globe-alt",
                    "permission": "global.settings_domains.read"
                },
                {
                    "label": "Languages",
                    "to": "/global/settings/languages",
                    "icon": "i-bx-translate",
                    "permission": "global.settings_languages.read"
                },
                {
                    "label": "Insurance",
                    "to": "/global/settings/insurance",
                    "icon": "i-bx-plus-shield",
                    "permission": "global.settings_insurance.read"
                },
                {
                    "label": "Referrals",
                    "to": "/global/settings/referrals",
                    "icon": "i-bx-share",
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
                    "icon": "i-bx-share",
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
                    "icon": "i-bx-note",
                    "permission": "global.privacy_notices.read"
                },
                {
                    "label": "Requests",
                    "to": "/global/privacy/requests",
                    "icon": "i-bx-clipboard-detail",
                    "permission": "global.privacy_requests.read",
                    "countKey": "admin.global.privacy.requests"
                },
                {
                    "label": "Incidents",
                    "to": "/global/privacy/incidents",
                    "icon": "i-bx-alert-shield",
                    "permission": "global.privacy_incidents.read"
                }
            ]
        },
        {
            "title": "Compliance",
            "items": [
                {
                    "label": "APAD reports",
                    "to": "/global/apad-reports",
                    "icon": "i-bx-envelope",
                    "permission": "bus.apad_reports.read"
                }
            ]
        },
        {
            "title": "Platform",
            "items": [
                {
                    "label": "Devices",
                    "to": "/global/devices",
                    "icon": "i-bx-devices",
                    "permission": "global.devices.read"
                },
                {
                    "label": "Audit log",
                    "to": "/global/audit-log",
                    "icon": "i-bx-history",
                    "permission": "global.audit_log.read"
                },
                {
                    "label": "Retention",
                    "to": "/global/retention",
                    "icon": "i-bx-archive",
                    "permission": "global.retention.read"
                },
                {
                    "label": "Suppressions",
                    "to": "/global/messaging/suppressions",
                    "icon": "i-bx-bell-slash",
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
                    "icon": "i-bx-book-content",
                    "permission": "finance.ledger.read"
                },
                {
                    "label": "Payments",
                    "to": "/finance/payments",
                    "icon": "i-bx-credit-card",
                    "permission": "finance.payments.read"
                },
                {
                    "label": "Refunds",
                    "to": "/finance/refunds",
                    "icon": "i-bx-undo",
                    "permission": "finance.refunds.read",
                    "countKey": "admin.finance.refunds"
                },
                {
                    "label": "Payouts",
                    "to": "/finance/payouts",
                    "icon": "i-bx-wallet",
                    "permission": "finance.payouts.read"
                },
                {
                    "label": "Settlements",
                    "to": "/finance/settlements",
                    "icon": "i-bx-bank",
                    "permission": "finance.settlements.read"
                },
                {
                    "label": "E-Invoices",
                    "to": "/finance/einvoices",
                    "icon": "i-bx-receipt",
                    "permission": "finance.einvoices.read"
                },
                {
                    "label": "Vendor statements",
                    "to": "/finance/vendor-statements",
                    "icon": "i-bx-file-detail",
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
                    "icon": "i-bx-layers",
                    "permission": "global.pricing_zones.read"
                },
                {
                    "label": "Fares",
                    "to": "/pricing/fares",
                    "icon": "i-bx-price-tag",
                    "permission": "global.pricing_fares.read"
                },
                {
                    "label": "Bus charges",
                    "to": "/pricing/bus-charges",
                    "icon": "i-bx-bus",
                    "permission": "global.pricing_bus_charges.read"
                },
                {
                    "label": "Promotions",
                    "to": "/pricing/promotions",
                    "icon": "i-bx-discount",
                    "permission": "global.pricing_promotions.read"
                },
                {
                    "label": "Places",
                    "to": "/places",
                    "icon": "i-bx-location-pin",
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
                    "icon": "i-bx-building",
                    "permission": "finance.organisations.read"
                }
            ]
        }
    ]
},
})
