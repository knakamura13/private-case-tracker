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

	async function runSearch(q: string) {
		if (!q.trim()) {
			results = {};
			return;
		}
		loading = true;
		try {
			const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
			if (res.ok) {
				results = await res.json();
			}
		} catch (err) {
			console.error('[search]', err);
		} finally {
			loading = false;
		}
	}

	function onInput() {
		if (debounceTimer) clearTimeout(debounceTimer);
		const q = query;
		debounceTimer = setTimeout(() => runSearch(q), 150);
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
		class="fixed inset-0 z-50 flex items-start justify-center bg-background/60 p-4 pt-24 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		aria-label="Search"
		tabindex="-1"
		onkeydown={(e) => {
			if (e.key === 'Escape') open = false;
			trapTabKey(e);
		}}
	>
		<div class="absolute inset-0 z-0 cursor-default" aria-hidden="true" onclick={() => (open = false)}></div>
		<div bind:this={dialogContentEl} class="relative z-10 w-full max-w-xl overflow-hidden rounded-lg border border-border bg-card shadow-xl">
			<div class="flex items-center gap-2 border-b border-border px-3">
				<Search class="h-4 w-4 text-muted-foreground" />
				<label class="sr-only" for="command-palette-input">Search</label>
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
					class="h-12 w-full bg-transparent text-sm outline-none"
				/>
				<button class="rounded-md p-1 hover:bg-muted" aria-label="Close" onclick={() => (open = false)}>
					<X class="h-4 w-4" />
				</button>
			</div>
			<div class="max-h-[60vh] overflow-y-auto">
				{#if loading}
					<p class="p-6 text-center text-sm text-muted-foreground">Searching…</p>
				{:else if !query.trim()}
					<p class="p-6 text-center text-sm text-muted-foreground">Type to search your workspace.</p>
				{:else if flat.length === 0}
					<p class="p-6 text-center text-sm text-muted-foreground">No results for "{query}"</p>
				{:else}
					{#each Object.entries(results) as [group, items]}
						{#if items.length > 0}
							<div>
								<p class="bg-muted/60 px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{group}</p>
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
												class="flex flex-col border-b border-border/50 px-3 py-2 text-sm hover:bg-muted {activeIndex === globalIndex ? 'bg-muted' : ''}"
											>
												<span class="font-medium">{item.title}</span>
												{#if item.description}
													<span class="truncate text-xs text-muted-foreground">{item.description}</span>
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
