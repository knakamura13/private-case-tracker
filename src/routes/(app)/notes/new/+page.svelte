<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import NoteForm from '$lib/components/notes/NoteForm.svelte';
	import type { ActionData, PageData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<PageHeader title="New note" />
<NoteForm links={data.links} submitLabel="Save note" error={form?.error} />
