<script lang="ts">
	import { page } from '$app/stores';
	import ErrorDetails from '$lib/components/ErrorDetails.svelte';

	const row = ($page.data as any).row as {
		id: string;
		occurredAt: string | Date;
		source: string;
		status: number | null;
		route: string | null;
		method: string | null;
		message: string;
		stack: string | null;
		requestId: string | null;
		userAgent: string | null;
		context: unknown;
	};
</script>

<div class="mx-auto w-full max-w-4xl p-6">
	<a class="text-sm font-medium text-primary hover:underline" href="/settings/dev">← Back</a>

	<h1 class="mt-4 text-2xl font-semibold">Error</h1>
	<p class="mt-1 text-sm text-muted-foreground font-mono">{row.id}</p>

	<div class="mt-6">
		<ErrorDetails
			status={row.status ?? undefined}
			message={row.message}
			errorId={row.id}
			requestId={row.requestId ?? undefined}
			stack={row.stack ?? undefined}
		/>
	</div>

	<div class="mt-8 rounded-lg border border-border bg-card p-4">
		<h2 class="text-sm font-semibold">Context</h2>
		<pre class="mt-2 max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(row.context, null, 2)}</pre>
	</div>
</div>
