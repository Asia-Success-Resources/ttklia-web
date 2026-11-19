/** Load workspace details from `GET /bootstrap` at start (doc 16, step 3). Skipped when no API is configured. */
export default defineNuxtPlugin({
  name: 'ttklia-bootstrap',
  dependsOn: ['ttklia-config'],
  async setup() {
    if (!useRuntimeConfig().public.apiBase) return
    await useBootstrap().load()
  },
})
