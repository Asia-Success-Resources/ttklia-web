import type { Sen } from '../types/api'

/** sen → "RM 12.50" (doc 09; amounts always shown exactly as the API returns them). */
export function formatSen(sen: Sen | null | undefined): string {
    if (sen === null || sen === undefined) return '—'
    const negative = sen < 0
    const abs = Math.abs(Math.trunc(sen))
    const ringgit = Math.floor(abs / 100).toLocaleString('en-MY')
    const cents = String(abs % 100).padStart(2, '0')
    return `${negative ? '-' : ''}RM ${ringgit}.${cents}`
}

/**
 * A price set in a pricing table, in ringgit (ADR 0003, amendment of 21 Nov 2026: `_rm` columns) → "RM 12.50".
 * Turned into sen first, so a float like 0.1 + 0.2 never shows as RM 0.30000000000000004.
 */
export function formatRm(rm: number | null | undefined): string {
    if (rm === null || rm === undefined) return '—'
    return formatSen(Math.round(rm * 100))
}

/** A ringgit price as typed in a form ("12.5", "") → 12.5, or null when empty. */
export function rmInput(value: string | number | null | undefined): number | null {
    if (value === null || value === undefined || value === '') return null
    return Math.round(Number(value) * 100) / 100
}
