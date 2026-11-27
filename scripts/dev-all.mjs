#!/usr/bin/env node
// Runs several app dev servers at once, each on its own port, with output prefixed by app name.
//
//   npm run dev:all              every app in APPS below
//   npm run dev:all -- bus taxi  only the apps named
//
// Ctrl+C stops them all.
//
// To add an app: add a line to APPS with its folder under apps/, a free port, and the path to open.

import { spawn } from 'node:child_process'

const APPS = [
    { name: 'admin', port: 3000, path: '/' },
    { name: 'bus', port: 3001, path: '/klia2' },
    { name: 'taxi', port: 3002, path: '/klia-taxi' },
    { name: 'fleet', port: 3003, path: '/' },
    { name: 'ride', port: 3005, path: '/' },
    { name: 'operator', port: 3006, path: '/' },
    { name: 'public', port: 3007, path: '/' },
    { name: 'vendor', port: 3004, path: '/' },
    { name: 'auth', port: 3008, path: '/' },
]

const COLOURS = [36, 33, 35, 32, 34, 91, 96, 93, 95, 92] // ANSI: cyan, yellow, magenta, green, blue, …
const colour = (i, text) => (process.stdout.isTTY ? `\x1b[${COLOURS[i % COLOURS.length]}m${text}\x1b[0m` : text)

const wanted = process.argv.slice(2)
const unknown = wanted.filter((name) => !APPS.some((app) => app.name === name))
if (unknown.length) {
    console.error(`Unknown app: ${unknown.join(', ')}. Known: ${APPS.map((app) => app.name).join(', ')}`)
    process.exit(1)
}
const apps = wanted.length ? APPS.filter((app) => wanted.includes(app.name)) : APPS

const width = Math.max(...apps.map((app) => app.name.length))
const children = []

console.log('Starting:')
apps.forEach((app, i) => console.log(`  ${colour(i, app.name.padEnd(width))}  http://localhost:${app.port}${app.path}`))
console.log('')

apps.forEach((app, i) => {
    const prefix = colour(i, `[${app.name.padEnd(width)}]`)
    // detached: each app gets its own process group, so stopping it also stops nuxt's child processes.
    const child = spawn('npm', ['run', 'dev', '-w', `apps/${app.name}`, '--', '--port', String(app.port)], {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: true,
        env: { ...process.env, FORCE_COLOR: '1' },
    })
    children.push(child)

    for (const stream of [child.stdout, child.stderr]) {
        let buffer = ''
        stream.on('data', (chunk) => {
            buffer += chunk
            const lines = buffer.split('\n')
            buffer = lines.pop()
            for (const line of lines) if (line.trim()) console.log(`${prefix} ${line}`)
        })
    }
    child.on('exit', (code) => console.log(`${prefix} stopped${code ? ` (exit ${code})` : ''}`))
})

let stopping = false
function stopAll() {
    if (stopping) return
    stopping = true
    for (const child of children) {
        try {
            process.kill(-child.pid, 'SIGTERM')
        } catch {
            // already stopped
        }
    }
    setTimeout(() => process.exit(0), 1500).unref()
}
process.on('SIGINT', stopAll)
process.on('SIGTERM', stopAll)
