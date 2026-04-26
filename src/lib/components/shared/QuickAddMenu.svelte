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
		class="fixed inset-0 z-50 bg-background/60 p-4 backdrop-blur-sm {window.innerWidth < 768 ? 'flex items-end justify-center' : 'flex items-start justify-center pt-24'}"
		role="dialog"
		aria-modal="true"
		aria-labelledby="quick-add-title"
		tabindex="-1"
		onkeydown={(e) => {
			if (e.key === 'Escape') open = false;
			trapTabKey(e);
		}}
	>
		<div class="absolute inset-0 z-0 cursor-default" aria-hidden="true" onclick={() => (open = false)}></div>
		<div bind:this={dialogEl} class="relative z-10 w-full {window.innerWidth < 768 ? 'max-h-[85vh] rounded-t-lg' : 'max-w-sm'} overflow-hidden rounded-lg border border-border bg-card shadow-xl" style="padding-bottom: env(safe-area-inset-bottom)">
			<div class="flex items-center justify-between border-b border-border px-4 py-3">
				<h2 id="quick-add-title" class="text-sm font-semibold">Quick create</h2>
				<button type="button" class="rounded-md p-1 hover:bg-muted" aria-label="Close" onclick={() => (open = false)}>
					<X class="h-4 w-4" />
				</button>
			</div>
			<ul class="p-2">
				{#each actions as a (a.href)}
					<li>
						<button
							onclick={() => {
								open = false;
								goto(a.href);
							}}
							class="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
						>
							{a.label}
						</button>
					</li>
				{/each}
			</ul>
		</div>
	</div>
{/if}
