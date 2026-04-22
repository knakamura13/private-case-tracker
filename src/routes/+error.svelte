<script lang="ts">
	import { page } from '$app/stores';
	import ErrorDetails from '$lib/components/ErrorDetails.svelte';
</script>

<main class="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
	<div class="mb-6 text-center">
		<p class="mb-2 text-sm font-medium text-muted-foreground">Error {$page.status}</p>
		<p class="text-sm text-muted-foreground">
			This is a private organizational dashboard. If this error persists, let your workspace owner know.
		</p>
	</div>

	<ErrorDetails
		status={$page.status}
		message={$page.error?.message ?? 'Something went wrong'}
		errorId={$page.error?.errorId}
		requestId={$page.error?.requestId}
		stack={$page.error?.stack}
	/>

	<div class="mt-6 text-center">
		<a href="/" class="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
			Go home
		</a>
	</div>
</main>
