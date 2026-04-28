<script lang="ts">
	/* eslint-disable svelte/valid-compile */
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils/cn';

	let {
		class: klass = '',
		value = $bindable(''),
		error = false,
		...rest
	}: HTMLInputAttributes & { class?: string; error?: boolean } = $props();
	/* eslint-enable svelte/valid-compile */

	const inputClass = $derived(cn('input', error && 'input-error', klass));
</script>

<input bind:value class={inputClass} {...rest} />
