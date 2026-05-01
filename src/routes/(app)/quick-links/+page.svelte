<script lang="ts">
    import PageHeader from '$lib/components/shared/PageHeader.svelte';
    import QuickLinksWidget from '$lib/components/dashboard/QuickLinksWidget.svelte';
    import { getPageNumber } from '$lib/constants/navigation';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();
</script>

<PageHeader 
    title="Quick links" 
    sub="Access your most-used resources and documents." 
    number={getPageNumber('/quick-links')} 
/>

<div class="card" style="padding: 32px; max-width: 1200px;">
    <QuickLinksWidget links={data.quickLinks} folders={data.quickLinkFolders} />
</div>
