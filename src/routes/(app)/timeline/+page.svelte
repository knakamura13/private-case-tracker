<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import MarkdownRenderer from '$lib/components/shared/MarkdownRenderer.svelte';
	import { Plus } from 'lucide-svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { fmtDate } from '$lib/utils/dates';
	import { PHASE_ORDER, PHASE_LABELS, PHASE_DESCRIPTIONS } from '$lib/constants/phases';
	import { titleCase } from '$lib/utils/format';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();

	const grouped = $derived(
		PHASE_ORDER.map((p) => ({
			phase: p,
			items: data.milestones.filter((m) => m.phase === p)
		}))
	);

	function phaseProgress(items: { status: string }[]) {
		if (items.length === 0) return 0;
		const done = items.filter((i) => i.status === 'DONE' || i.status === 'SKIPPED').length;
		return Math.round((done / items.length) * 100);
	}

	function statusColor(s: string) {
		if (s === 'DONE') return 'bg-success border-success';
		if (s === 'IN_PROGRESS') return 'bg-warning border-warning';
		if (s === 'BLOCKED') return 'bg-destructive border-destructive';
		if (s === 'SKIPPED') return 'bg-secondary border-secondary';
		return 'border-border bg-card';
	}
</script>

<PageHeader title="Timeline" description="Case phases from preparation through final outcome." number="2">
	{#snippet actions()}
		<Button href="/timeline/new">
			{#snippet children()}<Plus class="h-4 w-4" /> New milestone{/snippet}
		</Button>
	{/snippet}
</PageHeader>

<div class="space-y-6">
	{#each grouped as g, _i (g.phase)}
		<section>
			<div class="mb-2 flex items-center justify-between">
				<div>
					<h2 class="text-base font-semibold">{PHASE_LABELS[g.phase]}</h2>
					<p class="text-xs text-muted-foreground">{PHASE_DESCRIPTIONS[g.phase]}</p>
				</div>
				<div class="flex items-center gap-2">
					{#if g.items.length > 0}
						<span class="text-xs text-muted-foreground">{phaseProgress(g.items)}% complete</span>
					{/if}
					<Button variant="ghost" size="sm" href={`/timeline/new?phase=${g.phase}`}>{#snippet children()}<Plus class="h-4 w-4" /> Add{/snippet}</Button>
				</div>
			</div>
			{#if g.items.length === 0}
				<Card class="p-4 text-sm text-muted-foreground">
					<span>No milestones in this phase yet.</span>
				</Card>
			{:else}
				<ol class="space-y-2">
					{#each g.items as m, i (m.id)}
						<li in:fly={{ y: 30, duration: 500, delay: i * 50 + 100, easing: cubicOut }}>
							<a href={`/timeline/${m.id}`}>
								<Card id={m.id} class="flex items-start gap-4 p-4 hover:border-primary/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 dark:hover:shadow-primary/10 hover:bg-card/90">
									<div class="mt-1 h-3 w-3 shrink-0 rounded-full border-2 {statusColor(m.status)}" title={titleCase(m.status)}></div>
									<div class="min-w-0 flex-1">
										<div class="flex items-center gap-2">
											<p class="truncate font-medium">{m.title}</p>
											<Badge variant="outline">{titleCase(m.priority)}</Badge>
										</div>
										{#if m.description}<MarkdownRenderer content={m.description} class="mt-1 text-sm text-muted-foreground prose prose-sm max-w-none" />{/if}
										<div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
											{#if m.dueDate}<span>Due {fmtDate(m.dueDate)}</span>{/if}
											{#if m.owner}<span>· {m.owner.name ?? m.owner.email}</span>{/if}
										</div>
									</div>
								</Card>
							</a>
						</li>
					{/each}
				</ol>
			{/if}
		</section>
	{/each}
</div>

