<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import ErrorDetails from '$lib/components/ErrorDetails.svelte';
	import { PHASE_LABELS, PHASE_ORDER } from '$lib/constants/phases';
	import { enhance } from '$app/forms';
	import { X, Plus, Check, Calendar, Tag, List, Paperclip, MapPin, Trash2 } from 'lucide-svelte';
	import { fmtDate } from '$lib/utils/dates';

	let {
		open = false,
		onClose,
		initial = {},
		members = [],
		error,
		errorId,
		action,
		onenhance,
		deleteAction
	}: {
		open: boolean;
		onClose: () => void;
		initial?: Record<string, unknown>;
		members?: { id: string; name: string | null; email: string }[];
		error?: string | null;
		errorId?: string | null;
		action?: string;
		onenhance?: (params: { formData: FormData; cancel: () => void }) => void;
		deleteAction?: string;
	} = $props();

	interface SubTask {
		id: string;
		text: string;
		done: boolean;
	}

	let editableSubTasks = $state<SubTask[]>([]);
	let newSubTaskText = $state('');
	let subTasksJson = $derived(JSON.stringify(editableSubTasks));

	$effect(() => {
		editableSubTasks = (initial.subTasks as SubTask[])?.map((st) => ({ ...st })) ?? [];
	});

	function val(name: string, fallback = '') {
		const v = initial[name];
		if (v == null) return fallback;
		if (v instanceof Date) return v.toISOString().slice(0, 10);
		return String(v);
	}

	function addSubTask() {
		if (!newSubTaskText.trim()) return;
		editableSubTasks = [...editableSubTasks, { id: crypto.randomUUID(), text: newSubTaskText.trim(), done: false }];
		newSubTaskText = '';
	}

	function _removeSubTask(id: string) {
		editableSubTasks = editableSubTasks.filter((st) => st.id !== id);
	}

	function toggleSubTask(id: string) {
		editableSubTasks = editableSubTasks.map((st) => (st.id === id ? { ...st, done: !st.done } : st));
	}

	function checklistProgress() {
		if (editableSubTasks.length === 0) return 0;
		const done = editableSubTasks.filter((st) => st.done).length;
		return Math.round((done / editableSubTasks.length) * 100);
	}

	function isDueSoon(dueDate: string | null) {
		if (!dueDate) return false;
		const due = new Date(dueDate);
		const now = new Date();
		const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
		return diffDays >= 0 && diffDays <= 3;
	}

	function ownerInitial(owner: unknown) {
		const o = owner as { name?: string; email?: string };
		return o?.name?.[0] || o?.email?.[0] || 'U';
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onclick={onClose}
		onkeydown={(e) => {
			if (e.key === 'Escape') onClose();
		}}
	>
		<!-- eslint-disable-next-line svelte/a11y-no-noninteractive-element-interactions -->
		<div
			class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-card shadow-xl"
			role="document"
			onclick={(e) => e.stopPropagation()}
		>
			<form method="post" {action} use:enhance={onenhance} class="flex flex-col">
				<!-- Header -->
				<div class="flex items-start justify-between border-b border-border p-4">
					<div class="flex flex-1 items-start gap-3">
						<Check class="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
						<Input
							name="title"
							value={val('title')}
							class="flex-1 border-none bg-transparent p-0 text-lg font-semibold focus-visible:ring-0 focus-visible:ring-offset-0"
							placeholder="Title"
						/>
					</div>
					<Button type="button" variant="ghost" size="sm" onclick={onClose} class="shrink-0">
						{#snippet children()}<X class="h-5 w-5" />{/snippet}
					</Button>
				</div>

				<!-- Main Content -->
				<div class="flex flex-col gap-4 p-4 md:flex-row">
					<!-- Left Column -->
					<div class="flex-1 space-y-4">
						<!-- Actions Bar -->
						<div class="flex flex-wrap gap-2">
							<Button type="button" variant="outline" size="sm">
								{#snippet children()}<Plus class="h-4 w-4" /> Add{/snippet}
							</Button>
							<Button type="button" variant="outline" size="sm">
								{#snippet children()}<Tag class="h-4 w-4" /> Labels{/snippet}
							</Button>
							<Button type="button" variant="outline" size="sm">
								{#snippet children()}<List class="h-4 w-4" /> Checklist{/snippet}
							</Button>
							<Button type="button" variant="outline" size="sm">
								{#snippet children()}<Paperclip class="h-4 w-4" /> Attachment{/snippet}
							</Button>
							<Button type="button" variant="outline" size="sm">
								{#snippet children()}<MapPin class="h-4 w-4" /> Location{/snippet}
							</Button>
						</div>

						<!-- Members -->
						<div class="flex items-center gap-2">
							{#if initial.owner}
								<div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
									{ownerInitial(initial.owner)}
								</div>
							{/if}
							<Button type="button" variant="ghost" size="sm" class="h-8 w-8 rounded-full p-0">
								{#snippet children()}<Plus class="h-4 w-4" />{/snippet}
							</Button>
						</div>

						<!-- Due Date -->
						{#if val('dueDate')}
							<div class="flex items-center gap-2">
								<Calendar class="h-4 w-4 text-muted-foreground" />
								<span class="text-sm">{fmtDate(val('dueDate'))}</span>
								{#if isDueSoon(val('dueDate'))}
									<Badge variant="outline" class="text-xs">Due soon</Badge>
								{/if}
							</div>
						{/if}

						<!-- Description -->
						<div>
							<Textarea
								name="description"
								placeholder="Add a more detailed description..."
								value={val('description')}
								rows={3}
								class="resize-none"
							/>
						</div>

						<!-- Checklist -->
						{#if editableSubTasks.length > 0}
							<Card class="p-3">
								<div class="mb-2 flex items-center justify-between">
									<span class="text-sm font-medium">Checklist</span>
									<Button type="button" variant="ghost" size="sm" class="h-6 text-xs text-destructive">
										Delete
									</Button>
								</div>
								<div class="mb-3 h-1.5 w-full rounded-full bg-muted">
									<div class="h-1.5 rounded-full bg-primary transition-all" style="width: {checklistProgress()}%"></div>
								</div>
								<div class="space-y-2">
									{#each editableSubTasks as st (st.id)}
										<div class="flex items-start gap-2">
											<input
												type="checkbox"
												checked={st.done}
												onchange={() => toggleSubTask(st.id)}
												class="mt-0.5 h-4 w-4 rounded border-border"
											/>
											<span class={st.done ? 'line-through text-muted-foreground' : 'text-sm'}>{st.text}</span>
										</div>
									{/each}
								</div>
								<div class="mt-2 flex items-center gap-2">
									<Input
										bind:value={newSubTaskText}
										placeholder="Add an item"
										onkeydown={(e) => {
											if (e.key === 'Enter') {
												e.preventDefault();
												addSubTask();
											}
										}}
										class="h-8 text-sm"
									/>
									<Button type="button" variant="ghost" size="sm" onclick={addSubTask} class="h-8">
										{#snippet children()}<Plus class="h-4 w-4" />{/snippet}
									</Button>
								</div>
							</Card>
						{/if}
					</div>

					<!-- Right Column - Settings -->
					<div class="w-full space-y-4 md:w-64">
						<Card class="p-3 space-y-3">
							<div>
								<label for="phase" class="mb-1 block text-xs font-medium text-muted-foreground">Phase</label>
								<Select id="phase" name="phase" value={val('phase', 'PREPARATION')} class="text-sm">
									{#each PHASE_ORDER as p}<option value={p}>{PHASE_LABELS[p]}</option>{/each}
								</Select>
							</div>
							<div>
								<label for="status" class="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
								<Select id="status" name="status" value={val('status', 'PLANNED')} class="text-sm">
									<option value="PLANNED">Planned</option>
									<option value="IN_PROGRESS">In progress</option>
									<option value="DONE">Done</option>
									<option value="BLOCKED">Blocked</option>
									<option value="SKIPPED">Skipped</option>
								</Select>
							</div>
							<div>
								<label for="priority" class="mb-1 block text-xs font-medium text-muted-foreground">Priority</label>
								<Select id="priority" name="priority" value={val('priority', 'MEDIUM')} class="text-sm">
									<option value="LOW">Low</option>
									<option value="MEDIUM">Medium</option>
									<option value="HIGH">High</option>
									<option value="CRITICAL">Critical</option>
								</Select>
							</div>
							<div>
								<label for="ownerId" class="mb-1 block text-xs font-medium text-muted-foreground">Owner</label>
								<Select id="ownerId" name="ownerId" value={val('ownerId')} class="text-sm">
									<option value="">Unassigned</option>
									{#each members as m (m.id)}<option value={m.id}>{m.name ?? m.email}</option>{/each}
								</Select>
							</div>
							<div>
								<label for="dueDate" class="mb-1 block text-xs font-medium text-muted-foreground">Due date</label>
								<Input id="dueDate" name="dueDate" type="date" value={val('dueDate')} class="text-sm" />
							</div>
							<div>
								<label for="notes" class="mb-1 block text-xs font-medium text-muted-foreground">Notes</label>
								<Textarea id="notes" name="notes" value={val('notes')} rows={3} class="text-sm resize-none" />
							</div>
						</Card>
					</div>
				</div>

				<!-- Footer -->
				<div class="border-t border-border p-4">
					{#if error}<ErrorDetails status={400} message={error} errorId={errorId ?? undefined} />{/if}
					<input type="hidden" name="subTasks" value={subTasksJson} />
					<input type="hidden" name="id" value={val('id')} />
					<div class="flex justify-between gap-2">
						{#if deleteAction}
							<Button type="button" variant="destructive" onclick={async () => {
								const formData = new FormData();
								formData.append('id', val('id'));
								await fetch(deleteAction, { method: 'POST', body: formData });
								window.location.href = '/timeline';
							}}>
								{#snippet children()}<Trash2 class="h-4 w-4" /> Delete{/snippet}
							</Button>
						{/if}
						<div class="flex gap-2 ml-auto">
							<Button type="submit">Save</Button>
						</div>
					</div>
				</div>
			</form>
		</div>
	</div>
{/if}
