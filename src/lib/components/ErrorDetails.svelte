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

<div class="errdetails-rounded-lg errdetails-border errdetails-bg-card errdetails-p-4 errdetails-text-left errdetails-shadow-sm">
	<div class="errdetails-flex errdetails-flex-wrap errdetails-items-start errdetails-justify-between errdetails-gap-3">
		<div class="errdetails-min-w-0">
			<div class="errdetails-flex errdetails-flex-wrap errdetails-items-center errdetails-gap-2">
				{#if status != null}
					<span class="errdetails-inline-flex errdetails-items-center errdetails-rounded-md errdetails-bg-muted errdetails-px-2 errdetails-py-0-5 errdetails-text-xs errdetails-font-medium errdetails-text-foreground">
						{status}
					</span>
				{/if}
				<p class="errdetails-min-w-0 errdetails-wrap-break-word errdetails-text-sm errdetails-font-medium errdetails-text-foreground">{message}</p>
			</div>

			{#if requestId || errorId}
				<p class="errdetails-mt-1 errdetails-text-xs errdetails-text-muted">
					{#if requestId}<span class="errdetails-mr-3">Request: <code class="errdetails-font-mono">{requestId}</code></span>{/if}
					{#if errorId}<span>Error: <code class="errdetails-font-mono">{errorId}</code></span>{/if}
				</p>
			{/if}
		</div>

		{#if errorId}
			<button
				type="button"
				class="errdetails-shrink-0 errdetails-rounded-md errdetails-border errdetails-bg-background errdetails-px-3 errdetails-py-1 errdetails-text-xs errdetails-font-medium errdetails-hover-bg-muted"
				on:click={() => copy(errorId)}
			>
				Copy error ID
			</button>
		{/if}
	</div>

	{#if stack}
		<details class="errdetails-mt-3">
			<summary class="errdetails-cursor-pointer errdetails-text-xs errdetails-font-medium errdetails-text-muted errdetails-hover-text-foreground">
				Show details
			</summary>
			<pre
				class="errdetails-mt-2 errdetails-max-h-64 errdetails-overflow-auto errdetails-rounded-md errdetails-bg-muted errdetails-p-3 errdetails-text-xs errdetails-leading-relaxed errdetails-text-foreground"
				style="tab-size: 2"
			>{stack}</pre>
		</details>
	{/if}
</div>
