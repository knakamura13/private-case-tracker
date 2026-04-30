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
		class="quickadd-fixed quickadd-inset-0 quickadd-z-50 quickadd-bg-background-60 quickadd-p-4 quickadd-backdrop-blur-sm quickadd-flex {window.innerWidth < 768 ? 'quickadd-items-end quickadd-justify-center' : 'quickadd-items-start quickadd-justify-center quickadd-pt-24'}"
		role="dialog"
		aria-modal="true"
		aria-labelledby="quick-add-title"
		tabindex="-1"
		onkeydown={(e) => {
			if (e.key === 'Escape') open = false;
			trapTabKey(e);
		}}
	>
		<div class="quickadd-absolute quickadd-inset-0 quickadd-z-0 quickadd-cursor-default" aria-hidden="true" onclick={() => (open = false)}></div>
		<div bind:this={dialogEl} class="quickadd-relative quickadd-z-10 quickadd-w-full {window.innerWidth < 768 ? 'quickadd-max-h-85vh quickadd-rounded-t-lg' : 'quickadd-max-w-sm'} quickadd-overflow-hidden quickadd-rounded-lg quickadd-border quickadd-bg-card quickadd-shadow-xl" style="padding-bottom: env(safe-area-inset-bottom)">
			<div class="quickadd-flex quickadd-justify-between quickadd-px-4 quickadd-py-3 quickadd-border-b quickadd-border">
				<h2 id="quick-add-title" class="quickadd-text-sm quickadd-font-semibold">Quick create</h2>
				<button type="button" class="quickadd-rounded-md quickadd-p-1 quickadd-hover-bg-muted" aria-label="Close" onclick={() => (open = false)}>
					<X class="quickadd-icon-sm" />
				</button>
			</div>
			<ul class="quickadd-p-2">
				{#each actions as a (a.href)}
					<li>
						<button
							onclick={() => {
								open = false;
								goto(a.href);
							}}
							class="quickadd-w-full quickadd-rounded-md quickadd-px-3 quickadd-py-2 quickadd-text-left quickadd-text-sm quickadd-hover-bg-muted"
						>
							{a.label}
						</button>
					</li>
				{/each}
			</ul>
		</div>
	</div>
{/if}
