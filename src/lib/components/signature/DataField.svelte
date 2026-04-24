<script lang="ts">
	import { cn } from '$lib/utils/cn';

	let {
		label,
		value,
		class: klass = ''
	}: {
		label: string;
		value: string | number | null | undefined;
		class?: string;
	} = $props();
</script>

<div class={cn("flex flex-col gap-1", klass)}>
	<span class="text-sm text-muted-foreground">{label}</span>
	<span class="font-mono text-foreground">{value ?? '—'}</span>
</div>
