<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import MarkdownRenderer from '$lib/components/shared/MarkdownRenderer.svelte';
	import MilestoneCreateModal from '$lib/components/timeline/MilestoneCreateModal.svelte';
	import MilestoneEditModal from '$lib/components/timeline/MilestoneEditModal.svelte';
	import { Plus, MapPin } from 'lucide-svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { fmtDate } from '$lib/utils/dates';
	import { PHASE_ORDER, PHASE_LABELS, PHASE_DESCRIPTIONS } from '$lib/constants/phases';
	import { titleCase } from '$lib/utils/format';
	import { page } from '$app/stores';
	import { invalidateAll } from '$app/navigation';
	import { showSuccessToast } from '$lib/stores/toast';
	import type { PageData } from './$types';
	import type { MilestoneItem } from '$lib/server/dynamo/types';

	interface TimelinePageData extends PageData {
		members: { id: string; name: string | null; email: string }[];
	}

	let { data, form }: { data: TimelinePageData; form: { error?: string; errorId?: string } } = $props();

	let showCreateModal = $state(false);
	let defaultPhase = $state<string | undefined>(undefined);
	let editingMilestone = $state<{ id: string } | null>(null);

	$effect(() => {
		const editParam = $page.url.searchParams.get('edit');
		if (editParam && !editingMilestone) {
			editingMilestone = { id: editParam };
		} else if (!editParam && editingMilestone) {
			editingMilestone = null;
		}
		// Keep modal open if there's a form error
		if (form?.error && !showCreateModal) {
			showCreateModal = true;
		}
	});

	function updateUrl(id: string | null) {
		const url = new URL(window.location.href);
		if (id) {
			url.searchParams.set('edit', id);
		} else {
			url.searchParams.delete('edit');
		}
		window.history.replaceState({}, '', url.toString());
	}

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

	function generateGoogleMapsUrl(address: string | null | undefined) {
		if (!address?.trim()) return '#';
		const query = encodeURIComponent(address.trim());
		return `https://www.google.com/maps/search/?api=1&query=${query}`;
	}
</script>

<PageHeader title="Timeline" description="Case phases from preparation through final outcome." number="02" />

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
					<Button variant="ghost" size="sm" onclick={() => { defaultPhase = g.phase; showCreateModal = true; }}>{#snippet children()}<Plus class="h-4 w-4" /> Add{/snippet}</Button>
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
							<button
								type="button"
								onclick={(e) => {
									e.currentTarget.blur();
									editingMilestone = { id: m.id };
									updateUrl(m.id);
								}}
								class="w-full text-left"
							>
								<Card id={m.id} class="flex items-start gap-4 p-4 hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/10 dark:hover:shadow-primary/20 hover:bg-card/90">
									<div class="mt-1 h-3 w-3 shrink-0 rounded-full border-2 {statusColor(m.status)}" title={titleCase(m.status)}></div>
									<div class="min-w-0 flex-1">
										<div class="flex items-start gap-2">
											<p class="line-clamp-2 font-medium">{m.title}</p>
											{#if m.priority !== 'MEDIUM'}
												<Badge variant="outline" class="shrink-0">{titleCase(m.priority)}</Badge>
											{/if}
										</div>
										{#if m.description}<MarkdownRenderer content={m.description} class="mt-1 text-sm text-muted-foreground prose prose-sm max-w-none" />{/if}
										{#if m.subTasks && m.subTasks.length > 0}
											<div class="mt-2">
												<div class="mb-1 text-xs text-muted-foreground">
													{m.subTasks.filter((st) => st.done).length}/{m.subTasks.length} subtasks
												</div>
												<ul class="space-y-1">
													{#each m.subTasks as st (st.id)}
														<li class="flex items-center gap-2 text-sm">
															<input type="checkbox" checked={st.done} disabled class="h-3.5 w-3.5 rounded border-border" />
															<span class={st.done ? 'line-through text-muted-foreground' : ''}>{st.text}</span>
														</li>
													{/each}
												</ul>
											</div>
										{/if}
										<div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
											{#if m.dueDate}<span>Due {fmtDate(m.dueDate)}</span>{/if}
											{#if (m as MilestoneItem).location}<span>· <a href={generateGoogleMapsUrl((m as MilestoneItem).location)} target="_blank" rel="noopener noreferrer" class="flex items-center gap-1 hover:text-primary"><MapPin class="h-3 w-3" /> {(m as MilestoneItem).location}</a></span>{/if}
											{#if m.owner}<span>· {m.owner.name ?? m.owner.email}</span>{/if}
										</div>
									</div>
								</Card>
							</button>
						</li>
					{/each}
				</ol>
			{/if}
		</section>
	{/each}
</div>

{#if editingMilestone}
	{@const milestone = data.milestones.find((m) => m.id === editingMilestone?.id)}
	{#if milestone}
		<MilestoneEditModal
			open={true}
			onClose={async () => {
				editingMilestone = null;
				updateUrl(null);
			}}
			action="?/update"
			deleteAction="?/delete"
			onenhance={({ formData, cancel }: { formData: FormData; cancel: () => void }) => {
				return async () => {
					const response = await fetch('?/update', { method: 'POST', body: formData });
					if (response.ok) {
						await invalidateAll();
						showSuccessToast('Milestone updated successfully');
					} else {
						cancel();
					}
				};
			}}
			members={data.members}
			initial={{
				id: milestone.id,
				title: milestone.title,
				description: milestone.description,
				phase: milestone.phase,
				status: milestone.status,
				priority: milestone.priority,
				owner: milestone.owner,
				dueDate: milestone.dueDate,
				notes: (milestone as { notes?: string }).notes,
				subTasks: milestone.subTasks,
				location: (milestone as MilestoneItem).location
			}}
			error={form?.error}
			errorId={form?.errorId}
		/>
	{/if}
{/if}

{#if showCreateModal}
	<MilestoneCreateModal
		open={true}
		onClose={() => {
			showCreateModal = false;
			defaultPhase = undefined;
		}}
		action="?/create"
		members={data.members}
		defaultPhase={defaultPhase}
		error={form?.error}
		errorId={form?.errorId}
	/>
{/if}
