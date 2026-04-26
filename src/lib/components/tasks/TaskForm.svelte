<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import ErrorDetails from '$lib/components/ErrorDetails.svelte';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { Plus, X } from 'lucide-svelte';

	let {
		initial = {},
		members = [],
		submitLabel = 'Save',
		error,
		errorId,
		action,
		onenhance
	}: {
		initial?: Record<string, unknown>;
		members?: { id: string; name: string | null; email: string }[];
		submitLabel?: string;
		error?: string | null;
		errorId?: string | null;
		action?: string;
		onenhance?: SubmitFunction;
	} = $props();

	interface ChecklistItem {
		id: string;
		text: string;
		done: boolean;
	}

	let editableChecklist = $state<ChecklistItem[]>([]);
	let newChecklistText = $state('');
	let checklistJson = $derived(JSON.stringify(editableChecklist));

	$effect(() => {
		editableChecklist = (initial.checklist as ChecklistItem[])?.map((ci) => ({ ...ci })) ?? [];
	});

	function val(name: string, fallback = '') {
		const v = initial[name];
		if (v == null) return fallback;
		if (v instanceof Date) return v.toISOString().slice(0, 10);
		return String(v);
	}

	function addChecklistItem() {
		if (!newChecklistText.trim()) return;
		editableChecklist = [
			...editableChecklist,
			{ id: `ci-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, text: newChecklistText.trim(), done: false }
		];
		newChecklistText = '';
	}

	function removeChecklistItem(id: string) {
		editableChecklist = editableChecklist.filter((ci) => ci.id !== id);
	}

	function toggleChecklistItem(id: string) {
		editableChecklist = editableChecklist.map((ci) =>
			ci.id === id ? { ...ci, done: !ci.done } : ci
		);
	}
</script>

<form method="post" {action} use:enhance={onenhance} class="grid grid-cols-1 gap-4 md:grid-cols-2">
	<div class="md:col-span-2">
		<Label for="title">Title</Label>
		<Input id="title" name="title" required value={val('title')} />
	</div>
	<div class="md:col-span-2 flex flex-wrap items-center gap-2">
		<Badge>{val('status', 'TODO')}</Badge>
		<Badge variant="outline">{val('priority', 'MEDIUM')}</Badge>
	</div>
	<div class="md:col-span-2">
		<Label for="description">Description</Label>
		<Textarea id="description" name="description" rows={2} value={val('description')} />
	</div>
	<div>
		<Label for="status">Status</Label>
		<Select id="status" name="status" value={val('status', 'TODO')}>
			<option value="TODO">To Do</option>
			<option value="IN_PROGRESS">In Progress</option>
			<option value="DONE">Done</option>
		</Select>
	</div>
	<div>
		<Label for="priority">Priority</Label>
		<Select id="priority" name="priority" value={val('priority', 'MEDIUM')}>
			<option value="LOW">Low</option>
			<option value="MEDIUM">Medium</option>
			<option value="HIGH">High</option>
			<option value="CRITICAL">Critical</option>
		</Select>
	</div>
	<div>
		<Label for="ownerId">Owner</Label>
		<Select id="ownerId" name="ownerId" value={val('ownerId')}>
			<option value="">Unassigned</option>
			{#each members as m (m.id)}<option value={m.id}>{m.name ?? m.email}</option>{/each}
		</Select>
	</div>
	<div>
		<Label for="dueDate">Due date</Label>
		<Input id="dueDate" name="dueDate" type="date" value={val('dueDate')} />
	</div>
	<div class="md:col-span-2">
		<Label>Checklist</Label>
		<div class="mt-2 space-y-2">
			{#each editableChecklist as ci (ci.id)}
				<div class="flex items-center gap-2">
					<input
						type="checkbox"
						checked={ci.done}
						onchange={() => toggleChecklistItem(ci.id)}
						class="h-4 w-4 rounded border-border"
					/>
					<Input
						value={ci.text}
						oninput={(e) => {
							editableChecklist = editableChecklist.map((c) =>
								c.id === ci.id ? { ...c, text: e.currentTarget.value } : c
							);
						}}
						class="flex-1"
					/>
					<Button type="button" variant="ghost" size="sm" onclick={() => removeChecklistItem(ci.id)}>
						{#snippet children()}<X class="h-4 w-4" />{/snippet}
					</Button>
				</div>
			{/each}
			<div class="flex items-center gap-2">
				<Input
					bind:value={newChecklistText}
					placeholder="Add a checklist item..."
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							addChecklistItem();
						}
					}}
					class="flex-1"
				/>
				<Button type="button" variant="outline" size="sm" onclick={addChecklistItem}>
					{#snippet children()}<Plus class="h-4 w-4" /> Add{/snippet}
				</Button>
			</div>
		</div>
		<input type="hidden" name="checklist" value={checklistJson} />
	</div>
	{#if error}<div class="md:col-span-2"><ErrorDetails status={400} message={error} errorId={errorId ?? undefined} /></div>{/if}
	<div class="md:col-span-2 flex gap-2">
		<Button type="submit">{submitLabel}</Button>
		<Button type="button" variant="outline" onclick={() => history.back()}>Cancel</Button>
	</div>
</form>
