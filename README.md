# ttklia-web

The TTKLIA v2 web front end: Nuxt 4, npm workspaces, eight apps on three shared layers (doc 09, ADR 0002).

| Folder | What |
| --- | --- |
| `layers/base` | Nuxt UI theme (brand `#465fff`, Outfit, Boxicons, light and dark), API composables, `/me` permissions, `/bootstrap`, Reverb, i18n (en, ms, zh), error page |
| `layers/ops-shell` | The Fleet Management skeleton: `OpsLayout`, `OpsSidebar`, `OpsHeader`, `OpsBreadcrumb`, `OpsListPage`, `OpsDetailPage`, `OpsFormPage`, `OpsMetricCard`, `OpsChartCard`, `OpsListCard`, `OpsModal` |
| `layers/counter` | Counter layout, basket, payment flow, counter-agent client (`127.0.0.1:8090`); used by bus, taxi and the vendor till |
| `apps/public` | www.ttklia.com (SSR) |
| `apps/bus` | bus.ttklia.com/{location}: ops (Sitemap 2) and the bus counter |
| `apps/taxi` | taxi.ttklia.com/{location}: ops and the taxi counter (Sitemap 3) |
| `apps/fleet` | fleet.ttklia.com (Sitemap 3) |
| `apps/ride` | ride.ttklia.com (Sitemap 4) |
| `apps/admin` | admin.ttklia.com: global and finance (Sitemaps 1, 4) |
| `apps/operator` | operator.ttklia.com: the bus companies' portal (Sitemap 4, doc 27) |
| `apps/vendor` | vendor.ttklia.com/{outlet}: the POS till (`/pos`, full screen) and the vendor back office (Sitemap 6, doc 32) |
| `packages/api-client-ts` | Generated API types (`npm run generate:api`) |

## Run

```bash
npm install
cp apps/bus/.env.example apps/bus/.env
npm run dev:bus          # then open http://localhost:3000/klia2
npm run dev:all          # every app at once, each on its own port (list and ports: scripts/dev-all.mjs)
npm run dev:all -- bus taxi   # only some apps
npm run typecheck
npm run build            # all apps; or one: npm run build:bus
```

Each app builds into its own `apps/<app>/.output`.

With no `NUXT_PUBLIC_API_BASE` set, the staff apps run in preview: every menu item shows, and lists are empty.

## Rules

- Settings live only in `runtimeConfig` (doc 16, *Front-end config at scale*). Code holds no host or URL strings. SPA builds read `config.json` at start.
- Workspace name, logo, languages and features come from `GET /bootstrap`, not from config.
- Lists show empty typed data until the generated client exists (`TODO(api)`), never fake records.
- Colours: every app uses the fleet-management colour scheme, defined once in `layers/base/app/assets/css/theme.css` (surfaces `--app-*`, zinc neutrals, the full palette as `--gm-*`). The shell reads it through `--ops-*` tokens (`layers/ops-shell/app/assets/css/ops-theme.css`). Use colours by token, e.g. `bg-(--app-card)`, never fixed grey or hex classes.
- Primary colour: set per app as `--app-primary` in `apps/<app>/app/assets/css/theme.css`. Left empty, the shared default (`#465fff`) applies.
- Open questions are marked `TODO(pending: <id>)`, with the id from doc 30.

## Docs to read

`ttklia-platform-docs`: docs 09, 16 and 27, the Sitemap pages of the draw.io file, and ADR 0002.
