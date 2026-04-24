<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import FormForm from '$lib/components/forms/FormForm.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import { Trash2 } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import { fmtDate } from '$lib/utils/dates';
	import { titleCase } from '$lib/utils/format';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let editing = $state(false);
	let revealed = $state<string | null>(null);
	let items = $state<
		{
			label: string;
			required: boolean;
			done: boolean;
			satisfiedByEvidenceId: string | null;
			satisfiedByFileId: string | null;
		}[]
	>([]);
	$effect(() => {
		items = data.form.supportingItems.map((s) => ({
			label: s.label,
			required: s.required,
			done: s.done,
			satisfiedByEvidenceId: s.satisfiedByEvidenceId,
			satisfiedByFileId: s.satisfiedByFileId
		}));
	});
	let newLabel = $state('');

	$effect(() => {
		const r = form as { revealed?: string } | null;
		if (r?.revealed !== undefined) revealed = r.revealed ?? null;
	});

	function addItem() {
		const t = newLabel.trim();
		if (!t) return;
		items = [
			...items,
			{ label: t, required: true, done: false, satisfiedByEvidenceId: null, satisfiedByFileId: null }
		];
		newLabel = '';
	}
</script>

<PageHeader title={`${data.form.code} — ${data.form.name}`} description={data.form.purpose ?? undefined}>
	{#snippet actions()}
		<Badge>{titleCase(data.form.filingStatus)}</Badge>
		<Button variant="outline" onclick={() => (editing = !editing)}>
			{editing ? 'Cancel' : 'Edit'}
		</Button>
		<form method="post" action="?/delete" use:enhance>
			<Button type="submit" variant="destructive">
				{#snippet children()}<Trash2 class="h-4 w-4" /> Delete{/snippet}
			</Button>
		</form>
	{/snippet}
</PageHeader>

{#if editing}
	<FormForm
		action="?/update"
		onenhance={() => async ({ update }) => {
			await update();
			editing = false;
		}}
		initial={{
			code: data.form.code,
			name: data.form.name,
			purpose: data.form.purpose,
			filingStatus: data.form.filingStatus,
			plannedFilingDate: data.form.plannedFilingDate,
			actualFilingDate: data.form.actualFilingDate,
			notes: data.form.notes
		}}
		submitLabel="Save changes"
		error={form?.error}
	/>
{:else}
	<div class="grid gap-6 md:grid-cols-3">
		<Card class="p-4 text-sm md:col-span-1">
			<h2 class="mb-2 font-semibold">Filing details</h2>
			<dl class="space-y-2 text-muted-foreground">
				<div><dt class="text-xs uppercase">Planned</dt><dd>{fmtDate(data.form.plannedFilingDate)}</dd></div>
				<div><dt class="text-xs uppercase">Actual</dt><dd>{fmtDate(data.form.actualFilingDate)}</dd></div>
				{#if data.form.receiptMask}
					<div>
						<dt class="text-xs uppercase">Receipt</dt>
						<dd class="flex items-center gap-2">
							<span class="font-mono text-foreground">
								{revealed ?? data.form.receiptMask}
							</span>
							{#if revealed}
								<button type="button" onclick={() => (revealed = null)} class="text-xs underline">Hide</button>
							{:else}
								<form method="post" action="?/reveal" use:enhance>
									<button type="submit" class="text-xs underline">Reveal</button>
								</form>
							{/if}
						</dd>
					</div>
				{/if}
				{#if data.form.notes}<div><dt class="text-xs uppercase">Notes</dt><dd class="whitespace-pre-wrap">{data.form.notes}</dd></div>{/if}
			</dl>
		</Card>
		<Card class="p-4 md:col-span-2">
			<h2 class="mb-3 font-semibold">Supporting items</h2>
			<form method="post" action="?/supporting" use:enhance class="space-y-2">
				{#each items as item, i}
					<div class="grid grid-cols-1 gap-2 rounded-md border border-border p-2 sm:grid-cols-[1fr_auto_auto_1fr_1fr_auto]">
						<input type="hidden" name={`items[${i}][label]`} value={item.label} />
						<span class="self-center px-2 text-sm">{item.label}</span>
						<label class="flex items-center gap-1 px-2 text-xs">
							<input type="checkbox" name={`items[${i}][required]`} checked={item.required} onchange={(e) => { const row = items[i]; if (row) row.required = (e.currentTarget as HTMLInputElement).checked; }} />
							required
						</label>
						<label class="flex items-center gap-1 px-2 text-xs">
							<input type="checkbox" name={`items[${i}][done]`} checked={item.done} onchange={(e) => { const row = items[i]; if (row) row.done = (e.currentTarget as HTMLInputElement).checked; }} />
							done
						</label>
						<Select name={`items[${i}][satisfiedByEvidenceId]`} value={item.satisfiedByEvidenceId ?? ''}>
							<option value="">No evidence link</option>
							{#each data.evidence as ev (ev.id)}<option value={ev.id}>{ev.title}</option>{/each}
						</Select>
						<Select name={`items[${i}][satisfiedByFileId]`} value={item.satisfiedByFileId ?? ''}>
							<option value="">No file link</option>
							{#each data.files as f (f.id)}<option value={f.id}>{f.title}</option>{/each}
						</Select>
						<button type="button" class="text-xs text-destructive" onclick={() => (items = items.filter((_, idx) => idx !== i))}>Remove</button>
					</div>
				{/each}
				<div class="flex items-center gap-2">
					<Input placeholder="Add a supporting item (e.g. Marriage certificate)" bind:value={newLabel} />
					<Button type="button" variant="outline" onclick={addItem}>Add</Button>
				</div>
				<Button type="submit" size="sm">Save supporting items</Button>
			</form>
		</Card>
	</div>
{/if}
