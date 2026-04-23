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

	const flat = $derived(Object.values(results).flat());

	$effect(() => {
		if (open) {
			setTimeout(() => inputEl?.focus(), 20);
		} else {
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
	<div class="fixed inset-0 z-50 flex items-start justify-center bg-background/60 p-4 pt-24 backdrop-blur-sm" role="dialog" aria-modal="true">
		<button class="absolute inset-0 z-0 cursor-default" aria-label="Close" onclick={() => (open = false)}></button>
		<div class="relative z-10 w-full max-w-xl overflow-hidden rounded-lg border border-border bg-card shadow-xl">
			<div class="flex items-center gap-2 border-b border-border px-3">
				<Search class="h-4 w-4 text-muted-foreground" />
				<input
					bind:this={inputEl}
					bind:value={query}
					oninput={onInput}
					onkeydown={onKeydown}
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
								<ul>
									{#each items as item, i (item.type + item.id)}
										{@const globalIndex = flat.findIndex((f) => f.type === item.type && f.id === item.id)}
										<li>
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
