import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'

/**
 * A last column with a ⋯ menu of what can be done to the row (approve, edit, revoke…). `items(row)` returns the
 * menu for that row; an empty list shows no button, so a row with nothing to do stays clean.
 */
export function actionsColumn<T>(items: (row: T) => DropdownMenuItem[]): TableColumn<T> {
    return {
        id: 'actions',
        header: '',
        meta: { class: { td: 'w-12 text-right' } },
        cell: ({ row }) => {
            const menu = items(row.original)
            if (!menu.length) return null
            return h(resolveComponent('UDropdownMenu'), { items: menu, content: { align: 'end' } }, () =>
                h(resolveComponent('UButton'), { icon: 'i-bx-dots-horizontal-rounded', color: 'neutral', variant: 'ghost', 'aria-label': 'Actions' }),
            )
        },
    }
}
