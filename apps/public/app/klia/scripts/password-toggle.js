// Show / hide toggle for password inputs on the Blade auth pages (reset,
// confirm). Called after the Vue app mounts, because mounting replaces the
// server-rendered nodes inside #app and would drop listeners bound earlier.
export const initPasswordToggles = () => {
    document.querySelectorAll('[data-password-field]').forEach((field) => {
        const input = field.querySelector('input');
        const toggle = field.querySelector('[data-password-toggle]');
        if (!input || !toggle || toggle.dataset.bound) {
            return;
        }
        toggle.dataset.bound = '1';
        const eye = toggle.querySelector('[data-eye]');
        const eyeOff = toggle.querySelector('[data-eye-off]');
        const showLabel = toggle.getAttribute('aria-label');

        toggle.addEventListener('click', () => {
            const show = input.type === 'password';
            input.type = show ? 'text' : 'password';
            toggle.setAttribute('aria-pressed', show ? 'true' : 'false');
            toggle.setAttribute('aria-label', show ? toggle.dataset.hideLabel || showLabel : showLabel);
            eye?.classList.toggle('d-none', show);
            eyeOff?.classList.toggle('d-none', !show);
            input.focus({ preventScroll: true });
        });
    });
};
