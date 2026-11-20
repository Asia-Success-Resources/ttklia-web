// Regenerates src/schema.d.ts from the API contract (ADR 0002, "Generated clients").
// Source, first found: $OPENAPI_FILE, ../ttklia-api/openapi.yaml (side-by-side checkout),
// then the docs pack's draft api/openapi.yaml until the API exports one.
import { existsSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const here = fileURLToPath(new URL('..', import.meta.url))
const candidates = [
    process.env.OPENAPI_FILE,
    resolve(here, '../../../ttklia-api/openapi.yaml'),
    resolve(here, '../../../ttklia-platform-docs/api/openapi.yaml'),
].filter(Boolean)

const source = candidates.find((file) => existsSync(file))
if (!source) {
    console.error('No openapi.yaml found. Tried:\n' + candidates.join('\n'))
    process.exit(1)
}
mkdirSync(resolve(here, 'src'), { recursive: true })
console.log(`Generating from ${source}`)
execFileSync('npx', ['openapi-typescript', source, '-o', resolve(here, 'src/schema.d.ts')], { stdio: 'inherit' })
