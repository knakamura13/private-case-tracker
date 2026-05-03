<script lang="ts">
    import { page } from '$app/stores';
    import ErrorDetails from '$lib/components/ErrorDetails.svelte';
</script>

<main class="error-mx-auto error-flex error-min-h-screen error-max-w-2xl error-flex-col error-justify-center error-px-6 error-py-16">
    <div class="error-mb-6 error-text-center">
        <p class="error-mb-2 error-text-sm error-font-medium error-text-muted">Error {$page.status}</p>
        <p class="error-text-sm error-text-muted">
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

    <div class="error-mt-6 error-text-center">
        <a
            href="/"
            class="error-inline-block error-rounded-md error-bg-primary error-px-4 error-py-2 error-text-sm error-font-medium error-text-primary-foreground"
        >
            Go home
        </a>
    </div>
</main>
