// Copied from klia-bus resources/js/web/site-header.js; wrapped in a function so the Nuxt layout runs it once on the client.
export function initSiteHeader() {
    // Sticky header line on scroll, and the mobile navigation sheet (slides in
    // from the right, traps focus, closes on Escape or backdrop click). Both live
    // outside #app, so they are plain DOM code.

    const header = document.querySelector('[data-site-header]');
    if (header) {
        const update = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
        update();
        window.addEventListener('scroll', update, { passive: true });
    }

    const sheet = document.getElementById('nav-sheet');
    const opener = document.querySelector('[data-sheet-open]');

    if (sheet && opener) {
        const focusable = () => Array.from(sheet.querySelectorAll('a[href], button:not([disabled])'));

        const close = () => {
            sheet.classList.remove('is-open');
            opener.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('no-scroll');
            const finish = () => { sheet.hidden = true; };
            const panel = sheet.querySelector('.nav-sheet__panel');
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !panel) {
                finish();
            } else {
                panel.addEventListener('transitionend', finish, { once: true });
                setTimeout(finish, 400);
            }
            opener.focus();
        };

        const open = () => {
            sheet.hidden = false;
            opener.setAttribute('aria-expanded', 'true');
            document.body.classList.add('no-scroll');
            // Next frame so the transform transition runs from the off-screen state.
            requestAnimationFrame(() => requestAnimationFrame(() => sheet.classList.add('is-open')));
            focusable()[0]?.focus();
        };

        opener.addEventListener('click', open);
        sheet.addEventListener('click', (event) => {
            if (event.target.closest('[data-sheet-close]')) {
                close();
            }
        });
        sheet.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                close();
                return;
            }
            if (event.key !== 'Tab') {
                return;
            }
            const items = focusable();
            const first = items[0];
            const last = items[items.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        });
        // Leaving the mobile breakpoint with the sheet open.
        window.matchMedia('(min-width: 992px)').addEventListener('change', (event) => {
            if (event.matches && !sheet.hidden) {
                close();
            }
        });
    }

}
