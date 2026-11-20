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
