<script lang="ts">
	import { page } from '$app/stores';

	type Row = {
		id: string;
		occurredAt: string | Date;
		source: string;
		status: number | null;
		route: string | null;
		method: string | null;
		message: string;
		requestId: string | null;
	};

	const data = $page.data as unknown as {
		errors: Row[];
		errorsLoadFailed: boolean;
		railwayProjectUrl: string;
		processInfo: {
			node: string;
			uptimeSec: number;
			uptimeLabel: string;
			commitSha: string | null;
			environment: string | null;
			serviceName: string | null;
		};
		dbHealth: { ok: boolean; ms: number };
	};
</script>

<div class="mx-auto w-full max-w-5xl p-6">
	<h1 class="text-2xl font-semibold">Dev</h1>
	<p class="mt-1 text-sm text-muted-foreground">Owner-only diagnostics and recent errors.</p>

	<div class="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
		<div class="rounded-lg border border-border bg-card p-4">
			<p class="text-xs text-muted-foreground">{data.processInfo.uptimeLabel}</p>
			<p class="mt-1 truncate font-mono text-sm">{data.processInfo.uptimeSec}s</p>
		</div>
		<div class="rounded-lg border border-border bg-card p-4">
			<p class="text-xs text-muted-foreground">Node</p>
			<p class="mt-1 truncate font-mono text-sm">{data.processInfo.node}</p>
		</div>
		<div class="rounded-lg border border-border bg-card p-4">
			<p class="text-xs text-muted-foreground">Commit SHA</p>
			<p class="mt-1 truncate font-mono text-sm">{data.processInfo.commitSha ?? '—'}</p>
		</div>
		<div class="rounded-lg border border-border bg-card p-4">
			<p class="text-xs text-muted-foreground">DB latency</p>
			<p class="mt-1 truncate font-mono text-sm">{data.dbHealth.ok ? `${data.dbHealth.ms}ms` : 'down'}</p>
		</div>
	</div>

	<div class="mt-4">
		<a class="text-sm font-medium text-primary hover:underline" href={data.railwayProjectUrl} target="_blank" rel="noreferrer">
			Open Railway project logs
		</a>
	</div>

	<h2 class="mt-10 text-lg font-semibold">Recent errors</h2>
	<div class="mt-3 overflow-hidden rounded-lg border border-border">
		<table class="w-full text-sm">
			<thead class="bg-muted/50 text-xs text-muted-foreground">
				<tr>
					<th class="px-3 py-2 text-left">Time</th>
					<th class="px-3 py-2 text-left">Status</th>
					<th class="px-3 py-2 text-left">Source</th>
					<th class="px-3 py-2 text-left">Route</th>
					<th class="px-3 py-2 text-left">Message</th>
					<th class="px-3 py-2 text-left">Link</th>
				</tr>
			</thead>
			<tbody>
				{#if data.errorsLoadFailed}
					<tr><td class="px-3 py-4 text-muted-foreground" colspan="6">
						Could not load errors{data.dbHealth.ok ? '' : ' — database is unreachable'}.
					</td></tr>
				{:else if data.errors.length === 0}
					<tr><td class="px-3 py-4 text-muted-foreground" colspan="6">No errors logged yet.</td></tr>
				{:else}
					{#each data.errors as e (e.id)}
						<tr class="border-t border-border">
							<td class="px-3 py-2 font-mono text-xs">{new Date(e.occurredAt).toLocaleString()}</td>
							<td class="px-3 py-2">{e.status ?? '—'}</td>
							<td class="px-3 py-2 font-mono text-xs">{e.source}</td>
							<td class="px-3 py-2 font-mono text-xs">{e.route ?? '—'}</td>
							<td class="px-3 py-2">
								<span class="line-clamp-2 wrap-break-word">{e.message}</span>
							</td>
							<td class="px-3 py-2">
								<a class="text-primary hover:underline" href={`/settings/dev/errors/${e.id}`}>View</a>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>
