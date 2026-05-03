import type { Action } from 'svelte/action';

/** Close menus/popovers when clicking outside the node. Uses capture phase. */
export const clickOutside: Action<HTMLElement, () => void> = (node, callback) => {
    const handleClick = (event: MouseEvent) => {
        if (node && !node.contains(event.target as Node) && !event.defaultPrevented) {
            callback();
        }
    };

    document.addEventListener('click', handleClick, true);

    return {
        update(newCallback: () => void) {
            callback = newCallback;
        },
        destroy() {
            document.removeEventListener('click', handleClick, true);
        }
    };
};
