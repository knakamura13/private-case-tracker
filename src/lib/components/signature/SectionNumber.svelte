<script lang="ts">
	import { cn } from '$lib/utils/cn';

	let {
		number,
		title,
		as: tag = 'h2',
		class: klass = ''
	}: {
		number: string | number;
		title?: string;
		as?: 'h1' | 'h2' | 'h3';
		class?: string;
	} = $props();
	
	const formattedNumber = String(number).padStart(2, '0');
</script>

<div class={cn("relative flex flex-col", klass)}>
	<div class="text-[120px] leading-none font-display font-bold text-muted opacity-20 dark:opacity-30 select-none absolute -top-5 -left-2 z-0 pointer-events-none tracking-tighter">
		{formattedNumber}
	</div>
	<div class="relative z-10 pt-10">
		{#if title}
			<svelte:element this={tag} class="text-3xl md:text-4xl font-display font-bold text-foreground">
				{title}
			</svelte:element>
		{/if}
	</div>
</div>
