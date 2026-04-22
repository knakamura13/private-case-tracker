<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Label from '$lib/components/ui/Label.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Disclaimer from '$lib/components/shared/Disclaimer.svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let mode = $state<'link' | 'upload'>('link');
	let uploading = $state(false);
	let uploadError = $state<string | null>(null);

	async function handleUpload(event: SubmitEvent) {
		event.preventDefault();
		uploading = true;
		uploadError = null;
		try {
			const fd = new FormData(event.currentTarget as HTMLFormElement);
			const file = fd.get('file') as File;
			if (!file || file.size === 0) throw new Error('Select a file to upload.');
			const body = {
				filename: file.name,
				contentType: file.type || 'application/octet-stream',
				sizeBytes: file.size,
				title: String(fd.get('title') ?? file.name),
				category: String(fd.get('category') ?? 'Other'),
				linkedTaskId: (fd.get('linkedTaskId') as string) || null,
				linkedFormId: (fd.get('linkedFormId') as string) || null,
				linkedEvidenceId: (fd.get('linkedEvidenceId') as string) || null,
				linkedAppointmentId: (fd.get('linkedAppointmentId') as string) || null
			};
			const res = await fetch('/api/files/upload-url', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to start upload');
			const { docId, uploadUrl } = await res.json();
			const put = await fetch(uploadUrl, {
				method: 'PUT',
				body: file,
				headers: { 'Content-Type': body.contentType }
			});
			if (!put.ok) throw new Error('Upload to storage failed');
			const done = await fetch(`/api/files/${docId}/complete`, { method: 'POST' });
			if (!done.ok) throw new Error('Upload finalize failed');
			await invalidateAll();
			await goto(`/documents/${docId}`);
		} catch (err) {
			uploadError = (err as Error).message;
		} finally {
			uploading = false;
		}
	}
</script>

<PageHeader title="Add document" description="Prefer a secure external link when possible. Uploads go to private object storage." />

<Disclaimer class="mb-4" />

<div class="mb-4 inline-flex rounded-md border border-border bg-muted/30 p-1 text-sm">
	<button class={`rounded px-3 py-1 ${mode === 'link' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`} onclick={() => (mode = 'link')}>Secure link</button>
	<button
		class={`rounded px-3 py-1 ${mode === 'upload' ? 'bg-card shadow-sm' : 'text-muted-foreground'} ${!data.uploadEnabled ? 'opacity-50' : ''}`}
		disabled={!data.uploadEnabled}
		title={data.uploadEnabled ? '' : 'Uploads disabled: configure S3 env vars'}
		onclick={() => (mode = 'upload')}
	>Upload file</button>
</div>

{#if mode === 'link'}
	<form method="post" class="grid grid-cols-1 gap-4 md:grid-cols-2">
		<div class="md:col-span-2">
			<Label for="title">Title</Label>
			<Input id="title" name="title" required />
		</div>
		<div>
			<Label for="category">Category</Label>
			<Select id="category" name="category" value="Other">
				{#each data.categories as c}<option value={c}>{c}</option>{/each}
			</Select>
		</div>
		<div class="md:col-span-2">
			<Label for="externalUrl">External URL</Label>
			<Input id="externalUrl" name="externalUrl" type="url" required placeholder="https://drive.google.com/..." />
		</div>
		<div>
			<Label for="linkedTaskId">Linked task</Label>
			<Select id="linkedTaskId" name="linkedTaskId" value="">
				<option value="">None</option>
				{#each data.links.tasks as t (t.id)}<option value={t.id}>{t.title}</option>{/each}
			</Select>
		</div>
		<div>
			<Label for="linkedFormId">Linked form</Label>
			<Select id="linkedFormId" name="linkedFormId" value="">
				<option value="">None</option>
				{#each data.links.forms as f (f.id)}<option value={f.id}>{f.code} — {f.name}</option>{/each}
			</Select>
		</div>
		<div>
			<Label for="linkedEvidenceId">Linked evidence</Label>
			<Select id="linkedEvidenceId" name="linkedEvidenceId" value="">
				<option value="">None</option>
				{#each data.links.evidence as e (e.id)}<option value={e.id}>{e.title}</option>{/each}
			</Select>
		</div>
		<div>
			<Label for="linkedAppointmentId">Linked appointment</Label>
			<Select id="linkedAppointmentId" name="linkedAppointmentId" value="">
				<option value="">None</option>
				{#each data.links.appointments as a (a.id)}<option value={a.id}>{a.title}</option>{/each}
			</Select>
		</div>
		<div class="md:col-span-2">
			<Label for="notes">Notes</Label>
			<Textarea id="notes" name="notes" />
		</div>
		{#if form?.error}<p class="md:col-span-2 text-sm text-destructive">{form.error}</p>{/if}
		<div class="md:col-span-2 flex gap-2">
			<Button type="submit">Save link</Button>
			<Button type="button" variant="outline" onclick={() => history.back()}>Cancel</Button>
		</div>
	</form>
{:else}
	<form class="grid grid-cols-1 gap-4 md:grid-cols-2" onsubmit={handleUpload}>
		<div class="md:col-span-2">
			<Label for="file">File</Label>
			<input id="file" name="file" type="file" required class="block w-full text-sm" />
			<p class="mt-1 text-xs text-muted-foreground">Max 50 MB. File is stored privately; access is mediated by this app.</p>
		</div>
		<div>
			<Label for="titleU">Title</Label>
			<Input id="titleU" name="title" required />
		</div>
		<div>
			<Label for="categoryU">Category</Label>
			<Select id="categoryU" name="category" value="Other">
				{#each data.categories as c}<option value={c}>{c}</option>{/each}
			</Select>
		</div>
		<div>
			<Label for="linkedTaskIdU">Linked task</Label>
			<Select id="linkedTaskIdU" name="linkedTaskId" value="">
				<option value="">None</option>
				{#each data.links.tasks as t (t.id)}<option value={t.id}>{t.title}</option>{/each}
			</Select>
		</div>
		<div>
			<Label for="linkedFormIdU">Linked form</Label>
			<Select id="linkedFormIdU" name="linkedFormId" value="">
				<option value="">None</option>
				{#each data.links.forms as f (f.id)}<option value={f.id}>{f.code} — {f.name}</option>{/each}
			</Select>
		</div>
		<div>
			<Label for="linkedEvidenceIdU">Linked evidence</Label>
			<Select id="linkedEvidenceIdU" name="linkedEvidenceId" value="">
				<option value="">None</option>
				{#each data.links.evidence as e (e.id)}<option value={e.id}>{e.title}</option>{/each}
			</Select>
		</div>
		<div>
			<Label for="linkedAppointmentIdU">Linked appointment</Label>
			<Select id="linkedAppointmentIdU" name="linkedAppointmentId" value="">
				<option value="">None</option>
				{#each data.links.appointments as a (a.id)}<option value={a.id}>{a.title}</option>{/each}
			</Select>
		</div>
		{#if uploadError}<p class="md:col-span-2 text-sm text-destructive">{uploadError}</p>{/if}
		<div class="md:col-span-2 flex gap-2">
			<Button type="submit" disabled={uploading}>{uploading ? 'Uploading…' : 'Upload file'}</Button>
			<Button type="button" variant="outline" onclick={() => history.back()}>Cancel</Button>
		</div>
	</form>
{/if}
