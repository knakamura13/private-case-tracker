<script lang="ts">
	import { cn } from '$lib/utils/cn';

	let {
		class: klass = ''
	}: {
		class?: string;
	} = $props();
</script>

<div class={cn("w-full h-px bg-border", klass)} aria-hidden="true"></div>
