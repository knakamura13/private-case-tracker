<script lang="ts">
	import { cn } from '$lib/utils/cn';

	let {
		class: klass = ''
	}: {
		class?: string;
	} = $props();
</script>

<div class={cn("hairline-divider", klass)} aria-hidden="true"></div>
