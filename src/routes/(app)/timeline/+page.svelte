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
	import { getPageNumber } from '$lib/constants/navigation';
	import { invalidateAll, goto } from '$app/navigation';
	import { showSuccessToast } from '$lib/stores/toast';
	import type { PageData } from './$types';
	import type { MilestoneItem } from '$lib/server/dynamo/types';

	interface TimelinePageData extends PageData {
		members: { id: string; name: string | null; email: string }[];
	}

	let { data, form }: { data: TimelinePageData; form: { error?: string; errorId?: string } } = $props();

	let showCreateModal = $state(false);
	let defaultPhase = $state<string | undefined>(undefined);

	const editParam = $derived($page.url.searchParams.get('edit'));
	const editingMilestone = $derived(
		editParam && data.milestones.some((m) => m.id === editParam)
			? { id: editParam }
			: null
	);

	async function updateUrl(id: string | null) {
		const url = new URL(window.location.href);
		if (id) {
			url.searchParams.set('edit', id);
		} else {
			url.searchParams.delete('edit');
		}
		await goto(url.toString(), { replaceState: true, noScroll: true });
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

<PageHeader title="Timeline" description="Case phases from preparation through final outcome." number={getPageNumber('/timeline')} />

<div class="timeline-container">
	{#each grouped as g, _i (g.phase)}
		<section class="timeline-phase">
			<div class="timeline-phase-header">
				<div>
					<h2 class="timeline-phase-title">{PHASE_LABELS[g.phase]}</h2>
					<p class="timeline-phase-description">{PHASE_DESCRIPTIONS[g.phase]}</p>
				</div>
				<div class="timeline-phase-actions">
					{#if g.items.length > 0}
						<span class="timeline-text-xs timeline-text-muted">{phaseProgress(g.items)}% complete</span>
					{/if}
					<Button variant="ghost" size="sm" onclick={() => { defaultPhase = g.phase; showCreateModal = true; }}>{#snippet children()}<Plus class="timeline-icon-sm" /> Add{/snippet}</Button>
				</div>
			</div>
			{#if g.items.length === 0}
				<Card class="timeline-p-4 timeline-text-sm timeline-text-muted">
					<span>No milestones in this phase yet.</span>
				</Card>
			{:else}
				<ol class="timeline-milestone-list">
					{#each g.items as m, i (m.id)}
						<li in:fly={{ y: 30, duration: 500, delay: i * 50 + 100, easing: cubicOut }}>
							<button
								type="button"
								onclick={async (e) => {
									e.currentTarget.blur();
									await updateUrl(m.id);
								}}
								class="timeline-w-full timeline-text-left"
							>
								<Card id={m.id} class="timeline-milestone-card">
									<div class="timeline-status-indicator {statusColor(m.status)}" title={titleCase(m.status)}></div>
									<div class="timeline-milestone-content">
										<div class="timeline-milestone-header">
											<p class="timeline-milestone-title">{m.title}</p>
											{#if m.priority !== 'MEDIUM'}
												<Badge variant="outline" class="timeline-shrink-0">{titleCase(m.priority)}</Badge>
											{/if}
										</div>
										{#if m.description}<MarkdownRenderer content={m.description} class="timeline-mt-1 timeline-text-sm timeline-text-muted timeline-prose-sm timeline-max-w-none" />{/if}
										{#if m.subTasks && m.subTasks.length > 0}
											<div class="timeline-mt-2">
												<div class="timeline-mb-1 timeline-text-xs timeline-text-muted">
													{m.subTasks.filter((st) => st.done).length}/{m.subTasks.length} subtasks
												</div>
												<ul class="timeline-subtask-list">
													{#each m.subTasks as st (st.id)}
														<li class="timeline-subtask-item">
															<input type="checkbox" checked={st.done} disabled class="timeline-checkbox" />
															<span class={st.done ? 'timeline-line-through timeline-text-muted' : ''}>{st.text}</span>
														</li>
													{/each}
												</ul>
											</div>
										{/if}
										<div class="timeline-milestone-meta">
											{#if m.dueDate}<span>Due {fmtDate(m.dueDate)}</span>{/if}
											{#if (m as MilestoneItem).location}<span>· <a href={generateGoogleMapsUrl((m as MilestoneItem).location)} target="_blank" rel="noopener noreferrer" class="timeline-flex timeline-items-center timeline-gap-1 timeline-hover-primary"><MapPin class="timeline-icon-xs" /> {(m as MilestoneItem).location}</a></span>{/if}
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
				await updateUrl(null);
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
		onenhance={() => {
			return async ({ result }: { result: { type: string } }) => {
				if (result.type === 'success') {
					showCreateModal = false;
					defaultPhase = undefined;
				}
			};
		}}
	/>
{/if}
