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

<div class="settings-dev-container">
	<div class="settings-dev-header">
		<h1>Dev</h1>
		<p>Owner-only diagnostics and recent errors.</p>
	</div>

	<div class="settings-dev-stats">
		<div class="settings-dev-stat-card">
			<p class="settings-dev-stat-label">{data.processInfo.uptimeLabel}</p>
			<p class="settings-dev-stat-value">{data.processInfo.uptimeSec}s</p>
		</div>
		<div class="settings-dev-stat-card">
			<p class="settings-dev-stat-label">Node</p>
			<p class="settings-dev-stat-value">{data.processInfo.node}</p>
		</div>
		<div class="settings-dev-stat-card">
			<p class="settings-dev-stat-label">Commit SHA</p>
			<p class="settings-dev-stat-value">{data.processInfo.commitSha ?? '—'}</p>
		</div>
		<div class="settings-dev-stat-card">
			<p class="settings-dev-stat-label">DB latency</p>
			<p class="settings-dev-stat-value">{data.dbHealth.ok ? `${data.dbHealth.ms}ms` : 'down'}</p>
		</div>
	</div>

	<div class="settings-dev-mt-4">
		<a class="settings-dev-text-sm settings-dev-font-medium settings-dev-text-primary settings-dev-hover-underline" href={data.railwayProjectUrl} target="_blank" rel="noreferrer">
			Open Railway project logs
		</a>
	</div>

	<h2 class="settings-dev-errors-title">Recent errors</h2>
	<div class="settings-dev-errors-table">
		<table>
			<thead class="settings-dev-errors-thead">
				<tr>
					<th class="settings-dev-errors-th">Time</th>
					<th class="settings-dev-errors-th">Status</th>
					<th class="settings-dev-errors-th">Source</th>
					<th class="settings-dev-errors-th">Route</th>
					<th class="settings-dev-errors-th">Message</th>
					<th class="settings-dev-errors-th">Link</th>
				</tr>
			</thead>
			<tbody>
				{#if data.errorsLoadFailed}
					<tr><td class="settings-dev-errors-td settings-dev-text-muted" colspan="6">
						Could not load errors{data.dbHealth.ok ? '' : ' — database is unreachable'}.
					</td></tr>
				{:else if data.errors.length === 0}
					<tr><td class="settings-dev-errors-td settings-dev-text-muted" colspan="6">No errors logged yet.</td></tr>
				{:else}
					{#each data.errors as e (e.id)}
						<tr class="settings-dev-border-t">
							<td class="settings-dev-errors-td settings-dev-font-mono settings-dev-text-xs">{new Date(e.occurredAt).toLocaleString()}</td>
							<td class="settings-dev-errors-td">{e.status ?? '—'}</td>
							<td class="settings-dev-errors-td settings-dev-font-mono settings-dev-text-xs">{e.source}</td>
							<td class="settings-dev-errors-td settings-dev-font-mono settings-dev-text-xs">{e.route ?? '—'}</td>
							<td class="settings-dev-errors-td">
								<span class="settings-dev-errors-message">{e.message}</span>
							</td>
							<td class="settings-dev-errors-td">
								<a class="settings-dev-text-primary settings-dev-hover-underline" href={`/settings/dev/errors/${e.id}`}>View</a>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>
