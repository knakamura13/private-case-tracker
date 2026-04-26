<script lang="ts">
	let { open, onClose, maxWidth = 'max-w-3xl', children }: {
		open: boolean;
		onClose: () => void | Promise<void>;
		maxWidth?: string;
		children: import('svelte').Snippet;
	} = $props();

	let backdropEl: HTMLElement | undefined = $state();

	$effect(() => {
		if (open && backdropEl) {
			backdropEl.focus();
		}
	});
</script>

{#if open}
	<div
		bind:this={backdropEl}
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onclick={(e) => {
			if (e.target === e.currentTarget) onClose();
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') onClose();
		}}
	>
		<div class="max-h-[90vh] w-full {maxWidth} overflow-y-auto rounded-lg bg-card shadow-xl" role="document">
			{@render children()}
		</div>
	</div>
{/if}
