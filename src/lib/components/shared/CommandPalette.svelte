<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Search, X } from 'lucide-svelte';

	interface Result {
		type: string;
		id: string;
		title: string;
		description?: string;
		href: string;
	}

	let { open = $bindable(false) }: { open?: boolean } = $props();

	let query = $state('');
	let results = $state<Record<string, Result[]>>({});
	let loading = $state(false);
	let activeIndex = $state(0);
	let inputEl = $state<HTMLInputElement | null>(null);
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	let searchRequestId = $state(0);

	let dialogContentEl = $state<HTMLDivElement | null>(null);
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
		const container = dialogContentEl;
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

	/* eslint-disable security/detect-object-injection */
	const flat = $derived(Object.values(results).flat());
	const activeItem = $derived(flat[activeIndex]);
	/* eslint-enable security/detect-object-injection */

	$effect(() => {
		if (open) {
			lastActiveEl = document.activeElement as HTMLElement | null;
			setTimeout(() => inputEl?.focus(), 20);
		} else {
			lastActiveEl?.focus();
			query = '';
			results = {};
			activeIndex = 0;
		}
	});

	async function runSearch(q: string, requestId: number) {
		if (!q.trim()) {
			results = {};
			return;
		}
		loading = true;
		try {
			const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
			if (res.ok) {
				// Only update results if this is still the current request
				if (requestId === searchRequestId) {
					results = await res.json();
				}
			}
		} catch (err) {
			console.error('[search]', err);
		} finally {
			// Only set loading to false if this is still the current request
			if (requestId === searchRequestId) {
				loading = false;
			}
		}
	}

	function onInput() {
		if (debounceTimer) clearTimeout(debounceTimer);
		const q = query;
		searchRequestId++;
		const currentRequestId = searchRequestId;
		debounceTimer = setTimeout(() => runSearch(q, currentRequestId), 150);
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			open = false;
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			activeIndex = Math.min(activeIndex + 1, Math.max(flat.length - 1, 0));
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			activeIndex = Math.max(activeIndex - 1, 0);
		} else if (e.key === 'Enter') {
			/* eslint-disable-next-line security/detect-object-injection */
			const item = flat[activeIndex];
			if (item) {
				open = false;
				if (item.type === 'quicklink') {
					window.open(item.href, '_blank', 'noopener,noreferrer');
				} else {
					goto(item.href);
				}
			}
		}
	}

	onMount(() => {
		function onGlobalKey(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
				e.preventDefault();
				open = !open;
			}
		}
		window.addEventListener('keydown', onGlobalKey);
		return () => window.removeEventListener('keydown', onGlobalKey);
	});
</script>

{#if open}
	<div
		class="cmdpal-fixed cmdpal-inset-0 cmdpal-z-50 cmdpal-bg-background-60 cmdpal-p-4 cmdpal-backdrop-blur-sm cmdpal-flex {window.innerWidth < 768 ? 'cmdpal-items-end cmdpal-justify-center' : 'cmdpal-items-start cmdpal-justify-center cmdpal-pt-24'}"
		role="dialog"
		aria-modal="true"
		aria-label="Search"
		tabindex="-1"
		onkeydown={(e) => {
			if (e.key === 'Escape') open = false;
			trapTabKey(e);
		}}
	>
		<div class="cmdpal-absolute cmdpal-inset-0 cmdpal-z-0 cmdpal-cursor-default" aria-hidden="true" onclick={() => (open = false)}></div>
		<div bind:this={dialogContentEl} class="cmdpal-relative cmdpal-z-10 cmdpal-w-full {window.innerWidth < 768 ? 'cmdpal-max-h-85vh cmdpal-rounded-t-lg' : 'cmdpal-max-w-xl cmdpal-max-h-60vh'} cmdpal-overflow-hidden cmdpal-rounded-lg cmdpal-border cmdpal-bg-card cmdpal-shadow-xl" style="padding-bottom: env(safe-area-inset-bottom)">
			<div class="cmdpal-flex cmdpal-items-center cmdpal-gap-2 cmdpal-border-b cmdpal-px-3">
				<Search class="cmdpal-icon-sm cmdpal-text-muted" />
				<label class="cmdpal-sr-only" for="command-palette-input">Search</label>
				<input
					id="command-palette-input"
					bind:this={inputEl}
					bind:value={query}
					oninput={onInput}
					onkeydown={onKeydown}
					aria-controls="command-palette-results"
					aria-activedescendant={activeItem ? `cp-opt-${activeItem.type}-${activeItem.id}` : undefined}
					aria-autocomplete="list"
					placeholder="Search across tasks, forms, evidence, questions, notes, files…"
					class="cmdpal-h-12 cmdpal-w-full cmdpal-bg-transparent cmdpal-text-sm cmdpal-focus-visible-outline-none"
				/>
				<button class="cmdpal-rounded-md cmdpal-p-1 cmdpal-hover-bg-muted" aria-label="Close" onclick={() => (open = false)}>
					<X class="cmdpal-icon-sm" />
				</button>
			</div>
			<div class="cmdpal-max-h-60vh cmdpal-overflow-y-auto">
				{#if loading}
					<p class="cmdpal-p-6 cmdpal-text-center cmdpal-text-sm cmdpal-text-muted">Searching…</p>
				{:else if !query.trim()}
					<p class="cmdpal-p-6 cmdpal-text-center cmdpal-text-sm cmdpal-text-muted">Type to search your workspace.</p>
				{:else if flat.length === 0}
					<p class="cmdpal-p-6 cmdpal-text-center cmdpal-text-sm cmdpal-text-muted">No results for "{query}"</p>
				{:else}
					{#each Object.entries(results) as [group, items]}
						{#if items.length > 0}
							<div>
								<p class="cmdpal-bg-muted-60 cmdpal-px-3 cmdpal-py-1 cmdpal-text-xs cmdpal-font-medium cmdpal-uppercase cmdpal-tracking-wide cmdpal-text-muted">{group}</p>
								<ul id="command-palette-results" role="listbox" aria-label="Search results">
									{#each items as item, _i (item.type + item.id)}
										{@const globalIndex = flat.findIndex((f) => f.type === item.type && f.id === item.id)}
										{@const optionId = `cp-opt-${item.type}-${item.id}`}
										<li role="option" id={optionId} aria-selected={activeIndex === globalIndex}>
											<a
												href={item.href}
												target={item.type === 'quicklink' ? '_blank' : undefined}
												rel={item.type === 'quicklink' ? 'noopener noreferrer' : undefined}
												onclick={() => (open = false)}
												class="cmdpal-flex cmdpal-flex-col cmdpal-border-b cmdpal-border-50 cmdpal-px-3 cmdpal-py-2 cmdpal-text-sm cmdpal-hover-bg-muted {activeIndex === globalIndex ? 'cmdpal-bg-muted' : ''}"
											>
												<span class="cmdpal-font-medium">{item.title}</span>
												{#if item.description}
													<span class="cmdpal-truncate cmdpal-text-xs cmdpal-text-muted">{item.description}</span>
												{/if}
											</a>
										</li>
									{/each}
								</ul>
							</div>
						{/if}
					{/each}
				{/if}
			</div>
		</div>
	</div>
{/if}
