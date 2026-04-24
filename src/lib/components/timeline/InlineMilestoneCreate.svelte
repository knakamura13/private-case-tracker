<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { X } from 'lucide-svelte';
	import { enhance } from '$app/forms';

	let {
		phase,
		onCancel
	}: {
		phase: string;
		onCancel: () => void;
	} = $props();

	let title = $state('');
	let isSubmitting = $state(false);
</script>

<form
	method="post"
	action="/timeline/new"
	use:enhance={() => {
		return async ({ formData }) => {
			formData.set('phase', phase);
			formData.set('title', title);
		};
	}}
	class="bg-muted/50 rounded-lg p-3"
>
	<input type="hidden" name="phase" value={phase} />
	<div class="flex items-center gap-2">
		<Input
			name="title"
			bind:value={title}
			placeholder="Add a milestone..."
			class="flex-1 h-9 text-sm"
			onkeydown={(e) => {
				if (e.key === 'Enter' && title.trim()) {
					e.currentTarget.form?.requestSubmit();
				}
			}}
			autofocus
		/>
		<Button
			type="submit"
			variant="default"
			size="sm"
			disabled={!title.trim() || isSubmitting}
			class="h-9"
		>
			Add card
		</Button>
		<Button type="button" variant="ghost" size="sm" onclick={onCancel} class="h-9 px-2">
			{#snippet children()}<X class="h-4 w-4" />{/snippet}
		</Button>
	</div>
</form>
