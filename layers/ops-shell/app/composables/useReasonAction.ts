/**
 * A popup asking for a reason before an action (reject, revoke, cancel…), in the OpsFormModal style.
 * `ask({ title, label, submitLabel, run })` opens it; `run(reason)` is called on submit, and its Laravel field
 * errors show under the reason. Render it with <OpsReasonModal :action="reasonAction" />.
 */
export function useReasonAction() {
    const state = reactive({
        title: '',
        label: 'Reason',
        submitLabel: 'Confirm',
        required: true,
        run: null as null | ((reason: string) => Promise<unknown>),
    })
    const modal = useFormModal(() => ({ reason: '' }))

    function ask(options: { title: string; label?: string; submitLabel?: string; required?: boolean; run: (reason: string) => Promise<unknown> }) {
        Object.assign(state, { label: 'Reason', submitLabel: 'Confirm', required: true, ...options })
        modal.show()
    }
    async function submit(): Promise<boolean> {
        if (!state.run) return false
        const run = state.run
        return modal.submit((d) => run(d.reason))
    }

    return { state, form: modal.form, fieldError: modal.fieldError, ask, submit }
}
