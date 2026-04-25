<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { X } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import { onDestroy } from 'svelte';

	let {
		phase,
		onCancel
	}: {
		phase: string;
		onCancel: () => void;
	} = $props();

	let title = $state('');
	let isSubmitting = $state(false);
	let containerElement: HTMLDivElement | undefined;

	function handleClickOutside(event: MouseEvent) {
		if (containerElement && !containerElement.contains(event.target as Node)) {
			onCancel();
		}
	}

	function handleEscapeKey(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onCancel();
		}
	}

	// Clean up event listeners on unmount
	onDestroy(() => {
		window.removeEventListener('click', handleClickOutside);
		window.removeEventListener('keydown', handleEscapeKey);
	});

	// Add event listeners when component mounts
	$effect(() => {
		window.addEventListener('click', handleClickOutside);
		window.addEventListener('keydown', handleEscapeKey);
		return () => {
			window.removeEventListener('click', handleClickOutside);
			window.removeEventListener('keydown', handleEscapeKey);
		};
	});
</script>

<div
	bind:this={containerElement}
	class="bg-muted/50 rounded-lg p-3"
	role="region"
	aria-label="Create milestone"
>
	<form
		method="post"
		action="/timeline/new"
		use:enhance={() => {
			return async ({ formData, update }) => {
				formData.set('phase', phase);
				formData.set('title', title);
				isSubmitting = true;
				try {
					await update();
					// Server redirects to /timeline#{id} on success, which will reload the page
					// Clear the form since the redirect will handle the UI update
					title = '';
					onCancel();
				} catch (error) {
					console.error('Failed to create milestone:', error);
					// Keep the form open on error so user can retry
				} finally {
					isSubmitting = false;
				}
			};
		}}
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
</div>
