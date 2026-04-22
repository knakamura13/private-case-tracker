<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import NoteForm from '$lib/components/notes/NoteForm.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { Trash2 } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import { fmtDateTime } from '$lib/utils/dates';
	import type { ActionData, PageData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
	let editing = $state(false);
</script>

<PageHeader
	title={data.note.title}
	description={`Last edited ${fmtDateTime(data.note.updatedAt)} by ${data.note.author.name ?? data.note.author.email}`}
>
	{#snippet actions()}
		<Button variant="outline" onclick={() => (editing = !editing)}>{editing ? 'Cancel' : 'Edit'}</Button>
		<form method="post" action="?/delete" use:enhance>
			<Button type="submit" variant="destructive">
				{#snippet children()}<Trash2 class="h-4 w-4" /> Delete{/snippet}
			</Button>
		</form>
	{/snippet}
</PageHeader>

{#if editing}
	<form method="post" action="?/update" use:enhance={() => ({ update }) => update().then(() => { editing = false; })}>
		<NoteForm
			initial={{
				title: data.note.title,
				bodyMd: data.note.bodyMd,
				linkedTaskId: data.note.linkedTaskId,
				linkedFormId: data.note.linkedFormId,
				linkedEvidenceId: data.note.linkedEvidenceId,
				linkedAppointmentId: data.note.linkedAppointmentId
			}}
			links={data.links}
			submitLabel="Save changes"
			error={form?.error}
		/>
	</form>
{:else}
	<article class="prose prose-sm max-w-none rounded-lg border border-border bg-card p-5">
		<pre class="whitespace-pre-wrap font-sans leading-relaxed">{data.note.bodyMd}</pre>
	</article>
{/if}
