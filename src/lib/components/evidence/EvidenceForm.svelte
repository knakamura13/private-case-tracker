<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { EVIDENCE_CATEGORIES } from '$lib/constants/categories';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';

	let {
		initial = {},
		submitLabel = 'Save',
		error,
		action,
		onenhance
	}: {
		initial?: Record<string, unknown>;
		submitLabel?: string;
		error?: string | null;
		action?: string;
		onenhance?: SubmitFunction;
	} = $props();

	/* eslint-disable security/detect-object-injection */
	function val(name: string, fallback = '') {
		const v = (initial as Record<string, unknown>)[name];
		if (v == null) return fallback;
		if (v instanceof Date) return v.toISOString().slice(0, 10);
		if (Array.isArray(v)) return v.join(', ');
		return String(v);
	}
	/* eslint-enable security/detect-object-injection */
	const includedInPacket = $derived(Boolean(initial.includedInPacket));
</script>

<form method="post" {action} use:enhance={onenhance} class="grid grid-cols-1 gap-4 md:grid-cols-2">
	<div class="md:col-span-2">
		<Label for="title">Title</Label>
		<Input id="title" name="title" required value={val('title')} />
	</div>
	<div>
		<Label for="type">Category</Label>
		<Select id="type" name="type" value={val('type', 'Other')}>
			{#each EVIDENCE_CATEGORIES as c}<option value={c}>{c}</option>{/each}
		</Select>
	</div>
	<div>
		<Label for="status">Status</Label>
		<Select id="status" name="status" value={val('status', 'COLLECTED')}>
			<option value="COLLECTED">Collected</option>
			<option value="NEEDS_SCAN">Needs scan</option>
			<option value="NEEDS_TRANSLATION">Needs translation</option>
			<option value="NEEDS_BETTER_COPY">Needs better copy</option>
			<option value="READY">Ready</option>
		</Select>
	</div>
	<div>
		<Label for="dateStart">Date start</Label>
		<Input id="dateStart" name="dateStart" type="date" value={val('dateStart')} />
	</div>
	<div>
		<Label for="dateEnd">Date end</Label>
		<Input id="dateEnd" name="dateEnd" type="date" value={val('dateEnd')} />
	</div>
	<div class="md:col-span-2">
		<Label for="peopleInvolved">People involved (comma-separated)</Label>
		<Input id="peopleInvolved" name="peopleInvolved" value={val('peopleInvolved')} />
	</div>
	<div class="md:col-span-2">
		<Label for="description">Description</Label>
		<Textarea id="description" name="description" value={val('description')} />
	</div>
	<div class="md:col-span-2">
		<Label for="significance">Significance</Label>
		<Textarea id="significance" name="significance" value={val('significance')} rows={2} />
	</div>
	<div>
		<Label for="confidenceScore">Confidence (1–5)</Label>
		<Input id="confidenceScore" name="confidenceScore" type="number" min="1" max="5" value={val('confidenceScore', '3')} />
	</div>
	<div class="flex items-end gap-2">
		<label class="inline-flex items-center gap-2 text-sm">
			<input type="checkbox" name="includedInPacket" checked={includedInPacket} />
			Included in packet
		</label>
	</div>
	<div class="md:col-span-2">
		<Label for="notes">Notes</Label>
		<Textarea id="notes" name="notes" value={val('notes')} />
	</div>
	{#if error}<p class="md:col-span-2 text-sm text-destructive">{error}</p>{/if}
	<div class="md:col-span-2 flex gap-2">
		<Button type="submit">{submitLabel}</Button>
		<Button type="button" variant="outline" onclick={() => history.back()}>Cancel</Button>
	</div>
</form>
