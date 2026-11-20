import { readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

// Boxicons (https://boxicons.com, package @boxicons/core) as local Nuxt Icon collections.
// Read at build time from the package's SVG files; only the icons the code uses end up in each
// app's bundle (icon.clientBundle.scan in nuxt.config.ts). Nothing is fetched at run time.
//
// Names follow Boxicons' own classes without the `bx-` file prefix:
//   basic  `<i class="bx bx-sun">`   ->  i-bx-sun
//   filled `<i class="bxf bx-sun">`  ->  i-bxf-sun
//   brands `<i class="bxl bx-github">` -> i-bxl-github
// Look icons up at https://boxicons.com. Boxicons 3 renamed some 2.x icons (e.g. bx-log-out is gone).

interface IconSet {
    prefix: string
    width: number
    height: number
    icons: Record<string, { body: string }>
}

const PACKS = { bx: 'basic', bxf: 'filled', bxl: 'brands' } as const

function packDir(pack: string): string {
    const require = createRequire(import.meta.url)
    return join(dirname(require.resolve('@boxicons/core/package.json')), 'svg', pack)
}

function loadPack(prefix: keyof typeof PACKS): IconSet {
    const dir = packDir(PACKS[prefix])
    const icons: IconSet['icons'] = {}
    for (const file of readdirSync(dir)) {
        if (!file.endsWith('.svg')) continue
        const svg = readFileSync(join(dir, file), 'utf8')
        // Every Boxicons file is one 24×24 <svg> with plain paths inside. The paths set no fill, so
        // they are wrapped in fill="currentColor": the icon then takes the text colour, like the
        // Boxicons font does (and Nuxt Icon draws it as a mask, not a fixed black image).
        const paths = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim()
        if (paths) icons[file.slice(0, -4).replace(/^bx-/, '')] = { body: `<g fill="currentColor">${paths}</g>` }
    }
    return { prefix, width: 24, height: 24, icons }
}

export function boxiconsCollections(): IconSet[] {
    return (Object.keys(PACKS) as (keyof typeof PACKS)[]).map(loadPack)
}
