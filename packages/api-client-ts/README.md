# @ttklia/api-client-ts

Generated TypeScript types for the TTKLIA API, used by the `base` layer with `openapi-fetch` (doc 09, ADR 0002, ADR 0004). **Never edit by hand.** It has not been generated yet.

## Generate

```bash
# from ttklia-web/
npm run generate:api
# or by hand:
npx openapi-typescript ../ttklia-api/openapi.yaml -o packages/api-client-ts/src/schema.d.ts
```

The script reads, in order:

1. `$OPENAPI_FILE`;
2. `../ttklia-api/openapi.yaml`, exported by Scramble on every merge to `main`;
3. `../ttklia-platform-docs/api/openapi.yaml`, the draft until the API exists.

CI fails if the committed client differs from the tagged `ttklia-api` contract (ADR 0002).
