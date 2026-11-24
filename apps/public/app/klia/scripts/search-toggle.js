// Copied from klia-bus resources/js/web/search-toggle.js; wrapped in a function so the Nuxt layout runs it once on the client.
export function initSearchToggle() {
    // Expands the folded search form on landing pages (phones). Delegated from the
    // document because the Vue app re-renders the markup inside #app.

    document.addEventListener('click', (event) => {
        const toggle = event.target.closest('[data-search-toggle]');
        if (!toggle) {
            return;
        }
        const target = document.getElementById(toggle.getAttribute('aria-controls'));
        const open = toggle.getAttribute('aria-expanded') !== 'true';
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        target?.classList.toggle('is-open', open);
    });

}
