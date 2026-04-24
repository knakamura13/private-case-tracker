<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import ErrorDetails from '$lib/components/ErrorDetails.svelte';
	import { PHASE_LABELS, PHASE_ORDER } from '$lib/constants/phases';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { Plus, X } from 'lucide-svelte';
	import { randomUUID } from 'node:crypto';

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

	interface SubTask {
		id: string;
		text: string;
		done: boolean;
	}

	let editableSubTasks = $state<SubTask[]>(
		(initial.subTasks as SubTask[])?.map((st) => ({ ...st })) ?? []
	);
	let newSubTaskText = $state('');

	function val(name: string, fallback = '') {
		const v = initial[name];
		if (v == null) return fallback;
		if (v instanceof Date) return v.toISOString().slice(0, 10);
		return String(v);
	}

	function addSubTask() {
		if (!newSubTaskText.trim()) return;
		editableSubTasks = [...editableSubTasks, { id: randomUUID(), text: newSubTaskText.trim(), done: false }];
		newSubTaskText = '';
	}

	function removeSubTask(id: string) {
		editableSubTasks = editableSubTasks.filter((st) => st.id !== id);
	}

	function toggleSubTask(id: string) {
		editableSubTasks = editableSubTasks.map((st) => (st.id === id ? { ...st, done: !st.done } : st));
	}
</script>

<form method="post" {action} use:enhance={onenhance} class="grid grid-cols-1 gap-4 md:grid-cols-2">
	<div class="md:col-span-2">
		<Label for="title">Title</Label>
		<Input id="title" name="title" required value={val('title')} />
	</div>
	<div class="md:col-span-2">
		<Label for="description">Description</Label>
		<Textarea id="description" name="description" rows={2} value={val('description')} />
	</div>
	<div>
		<Label for="phase">Phase</Label>
		<Select id="phase" name="phase" value={val('phase', 'PREPARATION')}>
			{#each PHASE_ORDER as p}<option value={p}>{PHASE_LABELS[p]}</option>{/each}
		</Select>
	</div>
	<div>
		<Label for="status">Status</Label>
		<Select id="status" name="status" value={val('status', 'PLANNED')}>
			<option value="PLANNED">Planned</option>
			<option value="IN_PROGRESS">In progress</option>
			<option value="DONE">Done</option>
			<option value="BLOCKED">Blocked</option>
			<option value="SKIPPED">Skipped</option>
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
		<Label for="notes">Notes</Label>
		<Textarea id="notes" name="notes" value={val('notes')} />
	</div>
	<div class="md:col-span-2">
		<Label>Sub-tasks</Label>
		<div class="mt-2 space-y-2">
			{#each editableSubTasks as st (st.id)}
				<div class="flex items-center gap-2">
					<input
						type="checkbox"
						checked={st.done}
						onchange={() => toggleSubTask(st.id)}
						class="h-4 w-4 rounded border-border"
					/>
					<Input
						value={st.text}
						oninput={(e) => {
							editableSubTasks = editableSubTasks.map((s) =>
								s.id === st.id ? { ...s, text: e.currentTarget.value } : s
							);
						}}
						class="flex-1"
					/>
					<Button type="button" variant="ghost" size="sm" onclick={() => removeSubTask(st.id)}>
						{#snippet children()}<X class="h-4 w-4" />{/snippet}
					</Button>
				</div>
			{/each}
			<div class="flex items-center gap-2">
				<Input
					bind:value={newSubTaskText}
					placeholder="Add a sub-task..."
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							addSubTask();
						}
					}}
					class="flex-1"
				/>
				<Button type="button" variant="outline" size="sm" onclick={addSubTask}>
					{#snippet children()}<Plus class="h-4 w-4" /> Add{/snippet}
				</Button>
			</div>
		</div>
		<input type="hidden" name="subTasks" value={JSON.stringify(editableSubTasks)} />
	</div>
	{#if error}<div class="md:col-span-2"><ErrorDetails status={400} message={error} errorId={errorId ?? undefined} /></div>{/if}
	<div class="md:col-span-2 flex gap-2">
		<Button type="submit">{submitLabel}</Button>
		<Button type="button" variant="outline" onclick={() => history.back()}>Cancel</Button>
	</div>
</form>
