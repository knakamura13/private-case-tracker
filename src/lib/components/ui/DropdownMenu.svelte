<script lang="ts">
	let { isOpen = false, onClose, children, trigger }: { isOpen?: boolean; onClose?: () => void; children: import('svelte').Snippet; trigger: import('svelte').Snippet } = $props();

	function close() {
		onClose?.();
	}

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('[data-dropdown]')) {
			close();
		}
	}
</script>

<svelte:window on:click={handleClickOutside} />

<div data-dropdown class="relative">
	{@render trigger()}
	{#if isOpen}
		<div
			class="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-border bg-background p-1 shadow-md"
			role="menu"
		>
			{@render children()}
		</div>
	{/if}
</div>
