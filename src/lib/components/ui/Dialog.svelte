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
		class="dialog-backdrop"
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
		<div class="dialog-content {maxWidth}" role="document" style="padding-bottom: env(safe-area-inset-bottom)">
			{@render children()}
		</div>
	</div>
{/if}
