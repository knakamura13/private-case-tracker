<script lang="ts">
	import Badge from '$lib/components/ui/Badge.svelte';
	import { fmtDate, isOverdue } from '$lib/utils/dates';
	import { cn } from '$lib/utils/cn';
	import { Calendar, User, Link as LinkIcon } from 'lucide-svelte';

	interface Task {
		id: string;
		title: string;
		description: string | null;
		status: string;
		priority: string;
		dueDate: Date | string | null;
		owner?: { name: string | null; email: string } | null;
		form?: { code: string } | null;
		evidence?: { title: string } | null;
		appointment?: { title: string } | null;
		checklist?: { done: boolean }[];
	}

	let { task, compact = false }: { task: Task; compact?: boolean } = $props();

	const priorityVariant = $derived(
		task.priority === 'CRITICAL'
			? 'destructive'
			: task.priority === 'HIGH'
				? 'warning'
				: task.priority === 'LOW'
					? 'secondary'
					: 'default'
	);

	const checklistDone = $derived(task.checklist?.filter((c) => c.done).length ?? 0);
	const checklistTotal = $derived(task.checklist?.length ?? 0);

	const overdue = $derived(task.dueDate ? isOverdue(task.dueDate) && task.status !== 'DONE' : false);
</script>

<a
	href={`/tasks/${task.id}`}
	class={cn(
		'block rounded-md border border-border bg-card p-3 text-sm shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/40',
		overdue && 'border-destructive/50'
	)}
>
	<div class="flex items-start justify-between gap-2">
		<p class="font-medium leading-tight">{task.title}</p>
		<Badge variant={priorityVariant}>{task.priority.toLowerCase()}</Badge>
	</div>
	{#if !compact && task.description}
		<p class="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
	{/if}
	<div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
		{#if task.dueDate}
			<span class={cn('inline-flex items-center gap-1', overdue && 'text-destructive')}>
				<Calendar class="h-3 w-3" />
				{fmtDate(task.dueDate)}
			</span>
		{/if}
		{#if task.owner}
			<span class="inline-flex items-center gap-1">
				<User class="h-3 w-3" />
				{task.owner.name ?? task.owner.email}
			</span>
		{/if}
		{#if task.form}
			<span class="inline-flex items-center gap-1"><LinkIcon class="h-3 w-3" />{task.form.code}</span>
		{/if}
		{#if task.evidence}
			<span class="inline-flex items-center gap-1"><LinkIcon class="h-3 w-3" />{task.evidence.title}</span>
		{/if}
		{#if task.appointment}
			<span class="inline-flex items-center gap-1"><LinkIcon class="h-3 w-3" />{task.appointment.title}</span>
		{/if}
		{#if checklistTotal > 0}
			<span>{checklistDone}/{checklistTotal} done</span>
		{/if}
	</div>
</a>
