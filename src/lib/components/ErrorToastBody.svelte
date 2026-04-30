<script lang="ts">
	import ErrorDetails from '$lib/components/ErrorDetails.svelte';

	export let status: number | undefined = undefined;
	export let message: string;
	export let errorId: string | undefined = undefined;
	export let requestId: string | undefined = undefined;
	export let stack: string | undefined = undefined;
</script>

<div class="errtoast-min-w-320 errtoast-max-w-520">
	<ErrorDetails {status} {message} {errorId} {requestId} {stack} />
</div>
