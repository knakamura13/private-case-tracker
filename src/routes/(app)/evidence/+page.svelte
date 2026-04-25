<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import { enhance } from '$app/forms';
	import { Plus, Minus, Pencil, Check, X } from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data, form }: { data: PageData; form: { error?: string } } = $props();

	let editingCategory = $state<string | null>(null);
	let editTarget = $state(0);

	function startEdit(category: string, currentTarget: number) {
		editingCategory = category;
		editTarget = currentTarget;
	}

	function cancelEdit() {
		editingCategory = null;
	}
</script>

<PageHeader title="Evidence" description="Track evidence collection progress by category." number="4" />

{#if form?.error}
	<Card class="mb-4 border-destructive/50 bg-destructive/10 p-4 text-destructive">
		{form.error}
	</Card>
{/if}

<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
	{#each data.categories as cat}
		<Card class="p-4">
			<div class="mb-3 flex items-center justify-between">
				<h3 class="font-semibold">{cat.category}</h3>
				{#if editingCategory === cat.category}
					<form
						method="post"
						action="?/updateTarget"
						class="flex items-center gap-1"
						use:enhance={() => {
							return async ({ result, update }) => {
								await update({ reset: false });
								if (result.type !== 'failure') cancelEdit();
							};
						}}
					>
						<input type="hidden" name="category" value={cat.category} />
						<span class="text-sm text-muted-foreground">Target:</span>
						<input
							type="number"
							name="target"
							bind:value={editTarget}
							min="0"
							max="99"
							class="w-12 rounded border border-border bg-background px-2 py-1 text-center text-sm focus:outline-none focus:ring-1 focus:ring-ring"
							onkeydown={(e) => { if (e.key === 'Escape') cancelEdit(); }}
						/>
						<button type="submit" class="text-success hover:text-success/80" aria-label="Save">
							<Check class="h-4 w-4" />
						</button>
						<button type="button" class="text-muted-foreground hover:text-foreground" aria-label="Cancel" onclick={cancelEdit}>
							<X class="h-4 w-4" />
						</button>
					</form>
				{:else}
					<button
						type="button"
						class="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
						aria-label="Edit target for {cat.category}"
						onclick={() => startEdit(cat.category, cat.targetCount)}
					>
						<span>Target: {cat.targetCount}</span>
						<Pencil class="h-3 w-3" />
					</button>
				{/if}
			</div>
			<div class="mb-4">
				<div class="mb-2 flex items-center justify-between text-sm">
					<span class="text-muted-foreground">Collected</span>
					<span class="font-mono text-lg font-semibold">{cat.currentCount}</span>
				</div>
				<div class="h-2 overflow-hidden rounded bg-muted">
					<div
						class="h-full bg-primary transition-all"
						style:width={`${Math.min(100, cat.targetCount > 0 ? (cat.currentCount / cat.targetCount) * 100 : cat.currentCount > 0 ? 100 : 0)}%`}
					></div>
				</div>
			</div>
			<div class="flex items-center justify-between">
				<form method="post" action="?/adjustCount" class="flex gap-2" use:enhance>
					<input type="hidden" name="category" value={cat.category} />
					<input type="hidden" name="delta" value="-1" />
					<button
						type="submit"
						class="rounded-md border border-border p-2 hover:bg-muted disabled:opacity-50"
						disabled={cat.currentCount === 0}
						aria-label="Decrease {cat.category} count"
					>
						<Minus class="h-4 w-4" />
					</button>
				</form>
				<form method="post" action="?/adjustCount" class="flex gap-2" use:enhance>
					<input type="hidden" name="category" value={cat.category} />
					<input type="hidden" name="delta" value="1" />
					<button
						type="submit"
						class="rounded-md border border-border p-2 hover:bg-muted"
						aria-label="Increase {cat.category} count"
					>
						<Plus class="h-4 w-4" />
					</button>
				</form>
			</div>
		</Card>
	{/each}
</div>
