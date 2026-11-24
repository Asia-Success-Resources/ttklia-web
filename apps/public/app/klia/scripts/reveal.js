// Fades sections in as they enter the viewport, once. Children of a
// [data-reveal-group] are staggered by 60ms. Skipped entirely under
// prefers-reduced-motion, where everything is simply visible.

const STAGGER_MS = 60;

export const initReveal = () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = document.querySelectorAll('[data-reveal]:not(.is-revealed)');

    if (reduced || !('IntersectionObserver' in window)) {
        targets.forEach((el) => el.classList.add('is-revealed'));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }
            const el = entry.target;
            const group = el.parentElement?.closest('[data-reveal-group]');
            if (group) {
                const index = Array.from(group.querySelectorAll('[data-reveal]')).indexOf(el);
                el.style.transitionDelay = `${Math.max(0, index) * STAGGER_MS}ms`;
            }
            el.classList.add('is-revealed');
            observer.unobserve(el);
        });
    }, { threshold: 0.15 });

    targets.forEach((el) => {
        // Already on screen at load: leave it visible rather than hide it and fade it back in.
        if (el.getBoundingClientRect().top < window.innerHeight) {
            el.classList.add('is-revealed');
            return;
        }
        el.classList.add('will-reveal');
        observer.observe(el);
    });
};
