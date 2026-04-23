<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import QuestionForm from '$lib/components/questions/QuestionForm.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import { Trash2, ExternalLink } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import { fmtDate } from '$lib/utils/dates';
	import { titleCase } from '$lib/utils/format';
	import type { ActionData, PageData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
	let editing = $state(false);
</script>

<PageHeader title="Question">
	{#snippet actions()}
		<Badge>{titleCase(data.question.status)}</Badge>
		<Badge variant="outline">{titleCase(data.question.sourceType)}</Badge>
		<Button variant="outline" onclick={() => (editing = !editing)}>{editing ? 'Cancel' : 'Edit'}</Button>
		<form method="post" action="?/delete" use:enhance>
			<Button type="submit" variant="destructive">
				{#snippet children()}<Trash2 class="h-4 w-4" /> Delete{/snippet}
			</Button>
		</form>
	{/snippet}
</PageHeader>

{#if editing}
	<QuestionForm
		action="?/update"
		onenhance={() => async ({ update }) => {
			await update();
			editing = false;
		}}
		initial={{
			question: data.question.question,
			category: data.question.category,
			priority: data.question.priority,
			status: data.question.status,
			answer: data.question.answer,
			sourceType: data.question.sourceType,
			citationUrl: data.question.citationUrl,
			answeredAt: data.question.answeredAt
		}}
		submitLabel="Save changes"
		error={form?.error}
	/>
{:else}
	<Card class="mb-4 p-4">
		<h2 class="text-lg font-semibold">{data.question.question}</h2>
		{#if data.question.category}
			<p class="mt-1 text-xs uppercase text-muted-foreground">{data.question.category}</p>
		{/if}
	</Card>
	<Card class="p-4 text-sm">
		<h3 class="mb-2 font-semibold">Answer</h3>
		{#if data.question.answer}
			<p class="whitespace-pre-wrap text-muted-foreground">{data.question.answer}</p>
		{:else}
			<p class="text-muted-foreground italic">No answer yet.</p>
		{/if}
		{#if data.question.citationUrl}
			<a href={data.question.citationUrl} target="_blank" rel="noreferrer noopener" class="mt-3 inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline">
				<ExternalLink class="h-3 w-3" /> Source
			</a>
		{/if}
		{#if data.question.answeredAt}
			<p class="mt-2 text-xs text-muted-foreground">Answered {fmtDate(data.question.answeredAt)}</p>
		{/if}
	</Card>
{/if}
