<script lang="ts">
    import '../app.css';
    import { Toaster } from 'svelte-sonner';
    import { afterNavigate } from '$app/navigation';
    let { children } = $props();

    afterNavigate(() => {
        if (typeof window !== 'undefined') {
            window.scrollTo(0, 0);
            const main = document.getElementById('main');
            if (main) {
                main.scrollTo(0, 0);
            }
        }
    });
</script>

<Toaster richColors position="top-right" />
{@render children()}
