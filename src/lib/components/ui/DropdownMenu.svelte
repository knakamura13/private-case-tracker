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

<div data-dropdown class="popover">
	{@render trigger()}
	{#if isOpen}
		<div class="popover-content" role="menu">
			{@render children()}
		</div>
	{/if}
</div>
