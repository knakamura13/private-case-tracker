<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import MarkdownEditor from '$lib/components/shared/MarkdownEditor.svelte';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';

	let {
		initial = {},
		links = { tasks: [], forms: [], evidence: [] },
		submitLabel = 'Save',
		error,
		action,
		onenhance
	}: {
		initial?: Record<string, unknown>;
		links?: {
			tasks: { id: string; title: string }[];
			forms: { id: string; code: string; name: string }[];
			evidence: { id: string; title: string }[];
		};
		submitLabel?: string;
		error?: string | null;
		action?: string;
		onenhance?: SubmitFunction;
	} = $props();

	function val(name: string, fallback = '') {
		const v = initial[name];
		if (v == null) return fallback;
		return String(v);
	}

	let body = $state(val('bodyMd'));
</script>

<form method="post" {action} use:enhance={onenhance} class="space-y-4">
	<div>
		<Label for="title">Title</Label>
		<Input id="title" name="title" required value={val('title')} />
	</div>
	<div>
		<Label for="bodyMd">Body</Label>
		<MarkdownEditor bind:value={body} />
	</div>
	<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
		<div>
			<Label for="linkedTaskId">Linked task</Label>
			<Select id="linkedTaskId" name="linkedTaskId" value={val('linkedTaskId')}>
				<option value="">None</option>
				{#each links.tasks as t (t.id)}<option value={t.id}>{t.title}</option>{/each}
			</Select>
		</div>
		<div>
			<Label for="linkedFormId">Linked form</Label>
			<Select id="linkedFormId" name="linkedFormId" value={val('linkedFormId')}>
				<option value="">None</option>
				{#each links.forms as f (f.id)}<option value={f.id}>{f.code} — {f.name}</option>{/each}
			</Select>
		</div>
		<div>
			<Label for="linkedEvidenceId">Linked evidence</Label>
			<Select id="linkedEvidenceId" name="linkedEvidenceId" value={val('linkedEvidenceId')}>
				<option value="">None</option>
				{#each links.evidence as e (e.id)}<option value={e.id}>{e.title}</option>{/each}
			</Select>
		</div>
	</div>
	{#if error}<p class="text-sm text-destructive">{error}</p>{/if}
	<div class="flex gap-2">
		<Button type="submit">{submitLabel}</Button>
		<Button type="button" variant="outline" onclick={() => history.back()}>Cancel</Button>
	</div>
</form>
