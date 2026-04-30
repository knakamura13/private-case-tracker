<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import { page } from '$app/stores';
	const user = $derived($page.data.user!);
	const workspace = $derived($page.data.workspace!);
</script>

<PageHeader title="Profile" />
<Card class="settings-profile-card">
	<dl class="settings-profile-grid">
		<div><dt class="settings-profile-label">Name</dt><dd>{user.name ?? '—'}</dd></div>
		<div><dt class="settings-profile-label">Email</dt><dd>{user.email}</dd></div>
		<div><dt class="settings-profile-label">Workspace</dt><dd>{workspace.name}</dd></div>
		<div><dt class="settings-profile-label">Role</dt><dd>{workspace.role}</dd></div>
	</dl>
</Card>
