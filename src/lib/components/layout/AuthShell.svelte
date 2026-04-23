<script lang="ts">
	import { ShieldCheck } from 'lucide-svelte';
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

<main id="main" class="relative min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
	<div class="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
		<div class="mb-6 flex items-center gap-2 text-sm font-medium text-muted-foreground">
			<ShieldCheck class="h-4 w-4 text-primary" />
			<span>Private Case Tracker</span>
		</div>
		<h1 class="text-2xl font-semibold">{title}</h1>
		{#if subtitle}<p class="mt-1 text-sm text-muted-foreground">{subtitle}</p>{/if}
		<div class="mt-8">{@render children()}</div>
		<div class="mt-8">
			
		</div>
	</div>
</main>
