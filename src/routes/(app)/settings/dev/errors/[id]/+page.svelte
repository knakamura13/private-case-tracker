<script lang="ts">
    import { page } from '$app/state';
    import ErrorDetails from '$lib/components/ErrorDetails.svelte';

    const row = (
        page.data as unknown as {
            row: {
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
        }
    ).row as {
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

<div class="error-detail-container">
    <a class="settings-dev-text-sm settings-dev-font-medium settings-dev-text-primary settings-dev-hover-underline" href="/settings/dev"
        >← Back</a
    >

    <div class="error-detail-header">
        <h1>Error</h1>
        <p>{row.id}</p>
    </div>

    <div class="settings-dev-mt-4">
        <ErrorDetails
            status={row.status ?? undefined}
            message={row.message}
            errorId={row.id}
            requestId={row.requestId ?? undefined}
            stack={row.stack ?? undefined}
        />
    </div>

    <div class="error-detail-context">
        <h2>Context</h2>
        <pre>{JSON.stringify(row.context, null, 2)}</pre>
    </div>
</div>
