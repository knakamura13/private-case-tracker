<script lang="ts">
	let {
		title,
		subtitle,
		children
	}: {
		title: string;
		subtitle?: string;
		children: import('svelte').Snippet;
	} = $props();
</script>

<main id="main" class="auth-shell">
	<div class="auth-shell-container">
		<div class="auth-shell-brand">
			<img src="/pwa/icon-192.png" alt="" class="auth-shell-logo" aria-hidden="true" />
			<span>Private Case Tracker</span>
		</div>
		<h1 class="auth-shell-title">{title}</h1>
		{#if subtitle}<p class="auth-shell-subtitle">{subtitle}</p>{/if}
		<div class="auth-shell-content">{@render children()}</div>
		<div class="auth-shell-footer">
			
		</div>
	</div>
</main>
