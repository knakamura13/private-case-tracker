/**
 * Globally syncs native `title` tooltips on every element that carries the
 * `truncate` CSS class.  The tooltip is only set when the element's text
 * is actually clipped (scrollWidth > offsetWidth), so it never shows
 * redundant tooltips when there is enough space.
 *
 * Call `initTruncateTitles()` once inside an `onMount` in the root layout.
 * A MutationObserver handles all subsequent DOM mutations (SvelteKit
 * navigations, reactive renders, modals opening, etc.).
 */

function syncElement(el: HTMLElement) {
    const overflowing = el.scrollWidth > el.offsetWidth;
    const text = el.textContent?.trim() ?? '';
    if (overflowing && text) {
        if (el.title !== text) el.title = text;
    } else if (!overflowing && el.title) {
        el.removeAttribute('title');
    }
}

function syncAll(root: Element | Document = document) {
    (root instanceof Document ? root : (root.ownerDocument ?? document)).querySelectorAll<HTMLElement>('.truncate').forEach(syncElement);
    // Also check the root itself if it's an element with truncate
    if (root instanceof HTMLElement && root.classList.contains('truncate')) {
        syncElement(root);
    }
}

export function initTruncateTitles(): () => void {
    syncAll();

    const mo = new MutationObserver((mutations) => {
        for (const m of mutations) {
            if (m.type === 'childList') {
                m.addedNodes.forEach((n) => {
                    if (n instanceof Element) syncAll(n);
                });
            } else if (m.type === 'characterData' || m.type === 'attributes') {
                const el = m.target instanceof Element ? m.target : m.target.parentElement;
                if (el instanceof HTMLElement && el.classList.contains('truncate')) syncElement(el);
            }
        }
    });

    mo.observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['class']
    });

    // Re-sync on resize so tooltips appear/disappear as the viewport changes
    const onResize = () => syncAll();
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
        mo.disconnect();
        window.removeEventListener('resize', onResize);
    };
}
