<script lang="ts">
    import { X } from 'lucide-svelte';
    import { goto } from '$app/navigation';

    let { open = $bindable(false) }: { open?: boolean } = $props();

    const actions = [
        { label: 'New question', href: '/questions/new' },
        { label: 'New milestone', href: '/timeline/new' }
    ];

    let dialogEl = $state<HTMLDivElement | null>(null);
    let lastActiveEl = $state<HTMLElement | null>(null);

    function getFocusable(container: HTMLElement): HTMLElement[] {
        const nodes = container.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        return Array.from(nodes).filter((el) => {
            const style = window.getComputedStyle(el);
            return style.display != 'none' && style.visibility != 'hidden';
        });
    }

    function trapTabKey(e: KeyboardEvent) {
        if (e.key !== 'Tab') return;
        const container = dialogEl;
        if (!container) return;
        const focusable = getFocusable(container);
        if (focusable.length === 0) return;
        const active = document.activeElement as HTMLElement | null;
        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;
        if (e.shiftKey) {
            if (!active || active === first || !container.contains(active)) {
                e.preventDefault();
                last.focus();
            }
        } else {
            if (!active || active === last || !container.contains(active)) {
                e.preventDefault();
                first.focus();
            }
        }
    }

    $effect(() => {
        if (open) {
            lastActiveEl = document.activeElement as HTMLElement | null;
            setTimeout(() => {
                const container = dialogEl;
                const first = container ? getFocusable(container)[0] : null;
                first?.focus();
            }, 0);
        } else {
            lastActiveEl?.focus();
        }
    });
</script>

{#if open}
    <div
        class="quickadd-backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-add-title"
        tabindex="-1"
        onkeydown={(e) => {
            if (e.key === 'Escape') open = false;
            trapTabKey(e);
        }}
    >
        <div class="quickadd-backdrop-hit" aria-hidden="true" onclick={() => (open = false)}></div>
        <div bind:this={dialogEl} class="quickadd-panel" style="padding-bottom: env(safe-area-inset-bottom)">
            <div class="quickadd-panel__header">
                <h2 id="quick-add-title" class="quickadd-panel__title">Quick create</h2>
                <button type="button" class="quickadd-panel__close" aria-label="Close" onclick={() => (open = false)}>
                    <X />
                </button>
            </div>
            <ul class="quickadd-panel__list">
                {#each actions as a (a.href)}
                    <li>
                        <button
                            onclick={() => {
                                open = false;
                                goto(a.href);
                            }}
                            class="quickadd-panel__action"
                        >
                            {a.label}
                        </button>
                    </li>
                {/each}
            </ul>
        </div>
    </div>
{/if}

<style>
    .quickadd-backdrop {
        position: fixed;
        inset: 0;
        z-index: 50;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding: 96px 16px 16px;
        background: rgba(26, 26, 24, 0.45);
        backdrop-filter: blur(4px);
        box-sizing: border-box;
    }

    @media (max-width: 767px) {
        .quickadd-backdrop {
            align-items: flex-end;
            padding: 0;
        }
    }

    .quickadd-backdrop-hit {
        position: absolute;
        inset: 0;
        z-index: 0;
        cursor: default;
    }

    .quickadd-panel {
        position: relative;
        z-index: 10;
        width: 100%;
        max-width: 24rem;
        overflow: hidden;
        border-radius: var(--r-md);
        border: 1px solid var(--hairline);
        background: var(--surface);
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
    }

    @media (max-width: 767px) {
        .quickadd-panel {
            max-width: none;
            border-radius: var(--r-md) var(--r-md) 0 0;
            max-height: 85vh;
        }
    }

    .quickadd-panel__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid var(--hairline);
    }

    .quickadd-panel__title {
        margin: 0;
        font-size: 13px;
        font-weight: 600;
        color: var(--ink);
        font-family: var(--font-ui);
    }

    .quickadd-panel__close {
        border: none;
        background: transparent;
        border-radius: var(--r-sm);
        padding: 4px;
        cursor: pointer;
        color: var(--ink-2);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .quickadd-panel__close:hover {
        background: var(--surface-2);
    }

    .quickadd-panel__close :global(svg) {
        width: 16px;
        height: 16px;
    }

    .quickadd-panel__list {
        list-style: none;
        margin: 0;
        padding: 8px;
    }

    .quickadd-panel__action {
        width: 100%;
        text-align: left;
        border: none;
        border-radius: var(--r-sm);
        padding: 8px 12px;
        font-size: 13px;
        background: transparent;
        color: var(--ink);
        cursor: pointer;
        font-family: var(--font-ui);
    }

    .quickadd-panel__action:hover {
        background: var(--surface-2);
    }
</style>
