<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { titleCase } from '$lib/utils/format';
	import { fmtDate } from '$lib/utils/dates';
	import { GripVertical } from 'lucide-svelte';

	let {
		task,
		onEdit
	}: {
		task: {
			id: string;
			title: string;
			description: string | null;
			status: string;
			priority: string;
			dueDate: string | null;
			owner: { id: string; name: string | null; email: string } | null;
			checklist?: Array<{ id: string; text: string; done: boolean }>;
		};
		onEdit?: (id: string) => void;
	} = $props();

	function statusColor(s: string) {
		if (s === 'DONE') return 'bg-success border-success';
		if (s === 'IN_PROGRESS') return 'bg-warning border-warning';
		return 'border-border bg-card';
	}
</script>

<Card
	class="group relative p-4 cursor-pointer hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/10 dark:hover:shadow-primary/20 hover:bg-card/90"
	onclick={() => onEdit && onEdit(task.id)}
>
	<div class="flex items-center gap-3">
		<GripVertical class="h-4 w-4 shrink-0 text-muted-foreground" />
		<div class="min-w-0 flex-1">
			<p class="line-clamp-2 font-medium">{task.title}</p>
			{#if task.priority !== 'MEDIUM'}
				<Badge variant="outline" class="shrink-0">{titleCase(task.priority)}</Badge>
			{/if}
			{#if task.description}
				<p class="mt-1 line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
			{/if}
			{#if task.checklist && task.checklist.length > 0}
				<div class="mt-2">
					<div class="mb-1 text-xs text-muted-foreground">
						{task.checklist.filter((ci) => ci.done).length}/{task.checklist.length} checklist items
					</div>
					<ul class="space-y-1">
						{#each task.checklist.slice(0, 3) as ci (ci.id)}
							<li class="flex items-center gap-2 text-sm">
								<input type="checkbox" checked={ci.done} disabled class="h-3.5 w-3.5 rounded border-border" />
								<span class={ci.done ? 'line-through text-muted-foreground' : ''}>{ci.text}</span>
							</li>
						{/each}
						{#if task.checklist.length > 3}
							<li class="text-xs text-muted-foreground">+{task.checklist.length - 3} more</li>
						{/if}
					</ul>
				</div>
			{/if}
			{#if task.dueDate || task.owner}
				<div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
					{#if task.dueDate}<span>Due {fmtDate(task.dueDate)}</span>{/if}
					{#if task.owner}<span>· {task.owner.name ?? task.owner.email}</span>{/if}
				</div>
			{/if}
		</div>
		<div class="h-2.5 w-2.5 shrink-0 rounded-full border-2 {statusColor(task.status)}" title={titleCase(task.status)}></div>
	</div>
</Card>
