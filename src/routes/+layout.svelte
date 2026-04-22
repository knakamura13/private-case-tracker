<script lang="ts">
	import '../app.css';
	import { Toaster } from 'svelte-sonner';
	let { children } = $props();
</script>

<a href="#main" class="skip-link">Skip to main content</a>
<Toaster richColors position="top-right" />
{@render children()}
