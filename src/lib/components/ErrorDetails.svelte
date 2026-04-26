<script lang="ts">
	export let status: number | undefined = undefined;
	export let message: string;
	export let errorId: string | undefined = undefined;
	export let requestId: string | undefined = undefined;
	export let stack: string | undefined = undefined;

	async function copy(text: string) {
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			// ignore
		}
	}
</script>

<div class="rounded-lg border border-border bg-card p-4 text-left shadow-sm">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div class="min-w-0">
			<div class="flex flex-wrap items-center gap-2">
				{#if status != null}
					<span class="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
						{status}
					</span>
				{/if}
				<p class="min-w-0 wrap-break-word text-sm font-medium text-foreground">{message}</p>
			</div>

			{#if requestId || errorId}
				<p class="mt-1 text-xs text-muted-foreground">
					{#if requestId}<span class="mr-3">Request: <code class="font-mono">{requestId}</code></span>{/if}
					{#if errorId}<span>Error: <code class="font-mono">{errorId}</code></span>{/if}
				</p>
			{/if}
		</div>

		{#if errorId}
			<button
				type="button"
				class="shrink-0 rounded-md border border-border bg-background px-3 py-1 text-xs font-medium hover:bg-muted"
				on:click={() => copy(errorId)}
			>
				Copy error ID
			</button>
		{/if}
	</div>

	{#if stack}
		<details class="mt-3">
			<summary class="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
				Show details
			</summary>
			<pre
				class="mt-2 max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs leading-relaxed text-foreground"
				style="tab-size: 2"
			>{stack}</pre>
		</details>
	{/if}
</div>
