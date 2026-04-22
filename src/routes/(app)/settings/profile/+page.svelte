<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import { page } from '$app/stores';
	const user = $derived($page.data.user!);
	const workspace = $derived($page.data.workspace!);
</script>

<PageHeader title="Profile" />
<Card class="p-4 text-sm">
	<dl class="grid grid-cols-1 gap-3 md:grid-cols-2">
		<div><dt class="text-xs uppercase text-muted-foreground">Name</dt><dd>{user.name ?? '—'}</dd></div>
		<div><dt class="text-xs uppercase text-muted-foreground">Email</dt><dd>{user.email}</dd></div>
		<div><dt class="text-xs uppercase text-muted-foreground">Workspace</dt><dd>{workspace.name}</dd></div>
		<div><dt class="text-xs uppercase text-muted-foreground">Role</dt><dd>{workspace.role}</dd></div>
	</dl>
</Card>
