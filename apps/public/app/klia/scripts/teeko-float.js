// Copied from klia-bus resources/js/web/teeko-float.js; wrapped in a function so the Nuxt layout runs it once on the client.
export function initTeekoFloat() {
    // Draggable Teeko WhatsApp button. A drag moves it and snaps it back to the
    // right edge at the dropped height; a plain tap opens WhatsApp.

    const el = document.getElementById('teeko-ai-float');

    if (el) {
        let isDragging = false;
        let hasMoved = false;
        let offsetX;
        let offsetY;

        const point = (e) => (e.touches ? e.touches[0] : e);

        const resetPosition = () => {
            el.style.transition = 'none';
            el.style.left = '';
            el.style.top = '';
            el.style.right = '';
            el.style.bottom = '';
        };

        const startDrag = (e) => {
            isDragging = true;
            hasMoved = false;
            el.style.transition = 'none';
            const rect = el.getBoundingClientRect();
            offsetX = point(e).clientX - rect.left;
            offsetY = point(e).clientY - rect.top;
            if (!e.touches) {
                e.preventDefault(); // stop the mouse press from opening WhatsApp
            }
        };

        const drag = (e) => {
            if (!isDragging) {
                return;
            }
            hasMoved = true;
            const newLeft = point(e).clientX - offsetX;
            const newTop = point(e).clientY - offsetY;
            el.style.left = Math.min(Math.max(0, newLeft), window.innerWidth - el.offsetWidth) + 'px';
            el.style.top = Math.min(Math.max(0, newTop), window.innerHeight - el.offsetHeight) + 'px';
            el.style.right = 'auto';
            el.style.bottom = 'auto';
        };

        const endDrag = () => {
            if (!isDragging) {
                return;
            }
            isDragging = false;
            if (!hasMoved) {
                resetPosition();
                return;
            }
            // Snap back to the right edge, keep the vertical position.
            const currentTop = parseFloat(el.style.top || el.getBoundingClientRect().top);
            const clampedTop = Math.min(Math.max(0, currentTop), window.innerHeight - el.offsetHeight);
            el.style.transition = 'left 0.3s ease, right 0.3s ease';
            el.style.left = '';
            el.style.right = '20px';
            el.style.top = clampedTop + 'px';
            el.style.bottom = 'auto';
            setTimeout(() => { el.style.transition = ''; }, 300);
        };

        const cancel = () => {
            if (isDragging) {
                isDragging = false;
                hasMoved = false;
                resetPosition();
            }
        };

        el.addEventListener('mousedown', startDrag);
        el.addEventListener('touchstart', startDrag, { passive: false });
        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag, { passive: false });
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);

        window.addEventListener('pageshow', (e) => {
            if (e.persisted) {
                isDragging = false;
                hasMoved = false;
                resetPosition();
            }
        });
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                cancel();
            }
        });
        window.addEventListener('blur', cancel);

        // A drag must not open WhatsApp.
        el.addEventListener('click', (e) => {
            if (hasMoved) {
                e.preventDefault();
                e.stopImmediatePropagation();
            }
        }, true);
    }

}
