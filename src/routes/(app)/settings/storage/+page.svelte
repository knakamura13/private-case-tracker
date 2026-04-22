<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
</script>

<PageHeader title="Storage" />
<Card class="p-4 text-sm text-muted-foreground">
	<p>This workspace stores uploaded files in a private S3-compatible bucket configured via environment variables. No public URLs are exposed.</p>
</Card>
