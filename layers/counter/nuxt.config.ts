// Counter layer (doc 09): full screen, keyboard first, talks to the counter agent on the PC (doc 08).
// Used by bus, taxi and the vendor till (doc 09, doc 32). Expects the base layer to be extended by the app as well.
export default defineNuxtConfig({
    runtimeConfig: {
        public: {
            // NUXT_PUBLIC_AGENT_BASE: the local counter-agent, always 127.0.0.1 (doc 08, "Counter and kiosk agents").
            agentBase: '',
        },
    },
})
