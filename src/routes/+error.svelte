<script lang="ts">
    import { page } from '$app/state';
    import ErrorDetails from '$lib/components/ErrorDetails.svelte';
</script>

<main class="error-page">
    <div class="error-page__intro">
        <p class="error-page__status">Error {page.status}</p>
    </div>

    <ErrorDetails
        status={page.status}
        message={page.error?.message ?? 'Something went wrong'}
        errorId={page.error?.errorId}
        requestId={page.error?.requestId}
        stack={page.error?.stack}
    />

    <div class="error-page__actions">
        <a class="error-page__home" href="/">Go home</a>
    </div>
</main>

<style>
    .error-page {
        margin: 0 auto;
        display: flex;
        min-height: 100vh;
        max-width: 42rem;
        flex-direction: column;
        justify-content: center;
        padding: 64px 24px;
        box-sizing: border-box;
    }

    .error-page__intro {
        margin-bottom: 24px;
        text-align: center;
    }

    .error-page__status {
        margin: 0 0 8px;
        font-size: 13px;
        font-weight: 600;
        color: var(--ink-3);
    }

    .error-page__hint {
        margin: 0;
        font-size: 13px;
        color: var(--ink-3);
        line-height: 1.5;
    }

    .error-page__actions {
        margin-top: 24px;
        text-align: center;
    }

    .error-page__home {
        display: inline-block;
        border-radius: var(--r-sm);
        background: var(--ink);
        color: var(--surface);
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 600;
        text-decoration: none;
    }

    .error-page__home:hover {
        opacity: 0.92;
    }
</style>
