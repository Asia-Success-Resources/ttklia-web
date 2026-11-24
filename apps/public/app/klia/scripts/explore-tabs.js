// Tabs for server-rendered panels ([data-tabs] tablists), used by the home page
// "Explore TTKLIA" hub. Listeners are delegated from the document because the
// Vue app re-renders the markup inside #app when it mounts.

const tabsOf = (list) => Array.from(list.querySelectorAll('[role="tab"]'));

const positionUnderline = (list) => {
    const active = list.querySelector('[role="tab"][aria-selected="true"]');
    const underline = list.querySelector('.tabs__underline');
    if (!active || !underline) {
        return;
    }
    underline.style.transform = `translateX(${active.offsetLeft}px) scaleX(${active.offsetWidth})`;
    underline.style.opacity = '1';
};

const activate = (list, tab, focus = false) => {
    const tabs = tabsOf(list);
    tabs.forEach((other) => {
        const selected = other === tab;
        other.setAttribute('aria-selected', selected ? 'true' : 'false');
        other.tabIndex = selected ? 0 : -1;
        const panel = document.getElementById(other.getAttribute('aria-controls'));
        panel?.classList.toggle('is-active', selected);
    });
    if (focus) {
        tab.focus();
    }
    tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    positionUnderline(list);
};

const onClick = (event) => {
    const tab = event.target.closest('[data-tabs] [role="tab"]');
    if (tab) {
        activate(tab.closest('[data-tabs]'), tab);
    }
};

const onKeydown = (event) => {
    const tab = event.target.closest('[data-tabs] [role="tab"]');
    if (!tab) {
        return;
    }
    const list = tab.closest('[data-tabs]');
    const tabs = tabsOf(list);
    let index = tabs.indexOf(tab);
    switch (event.key) {
        case 'ArrowRight': index = (index + 1) % tabs.length; break;
        case 'ArrowLeft': index = (index - 1 + tabs.length) % tabs.length; break;
        case 'Home': index = 0; break;
        case 'End': index = tabs.length - 1; break;
        default: return;
    }
    event.preventDefault();
    activate(list, tabs[index], true);
};

export const initTabs = () => {
    document.querySelectorAll('[data-tabs]').forEach(positionUnderline);
};

// In the browser only (the module is also loaded by the server render).
if (typeof document !== 'undefined') {
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKeydown);
    window.addEventListener('resize', initTabs);
    document.fonts?.ready?.then(initTabs);
}
