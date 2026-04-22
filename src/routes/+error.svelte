<script lang="ts">
	import { page } from '$app/stores';
</script>

<main class="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16 text-center">
	<p class="mb-2 text-sm font-medium text-muted-foreground">Error {$page.status}</p>
	<h1 class="mb-4 text-2xl font-semibold">{$page.error?.message ?? 'Something went wrong'}</h1>
	<p class="text-sm text-muted-foreground">
		This is a private organizational dashboard. If this error persists, let your workspace owner know.
	</p>
	<a href="/" class="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
		Go home
	</a>
</main>
