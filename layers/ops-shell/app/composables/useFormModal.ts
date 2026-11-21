/**
 * The popup form's state, as in fleet-management (`vehicleForm`): `reactive({ open, saving, errors, data })`, with
 * `fieldError(key)` for the Laravel validation error of one field, `show(prefill)`, `close()`, and `submit(fn)` which
 * sets `saving`, keeps the 422 field errors, and closes on success.
 */
export function useFormModal<T extends Record<string, unknown>>(empty: () => T) {
    const form = reactive({ open: false, saving: false, errors: {}, error: null, data: empty() }) as {
        open: boolean
        saving: boolean
        errors: Record<string, string[]>
        error: string | null
        data: T
    }

    const fieldError = (key: string) => form.errors[key]?.[0] ?? null

    function show(prefill: Partial<T> = {}) {
        form.data = { ...empty(), ...prefill }
        form.errors = {}
        form.error = null
        form.open = true
    }
    function close() {
        if (!form.saving) form.open = false
    }
    async function submit(fn: (data: T) => Promise<unknown>): Promise<boolean> {
        form.saving = true
        form.errors = {}
        form.error = null
        try {
            await fn(form.data)
            form.saving = false
            close()
            return true
        } catch (e: unknown) {
            const body = (e as { data?: { errors?: Record<string, string[]>; message?: string; detail?: string } })?.data
            form.errors = body?.errors ?? {}
            // A field error shows under its field; anything else under the form.
            form.error = Object.keys(form.errors).length ? null : body?.detail ?? body?.message ?? 'Unable to save.'
            return false
        } finally {
            form.saving = false
        }
    }

    return { form, fieldError, show, close, submit }
}
