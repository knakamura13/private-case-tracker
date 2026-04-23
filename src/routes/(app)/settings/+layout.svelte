<script lang="ts">
	import { page } from '$app/stores';
	import { cn } from '$lib/utils/cn';
	let { children }: { children: import('svelte').Snippet } = $props();

	const sections = [
		{ href: '/settings/profile', label: 'Profile' },
		{ href: '/settings/security', label: 'Security' },
		{ href: '/settings/members', label: 'Members' },
		{ href: '/settings/data', label: 'Data & privacy' },
		{ href: '/settings/storage', label: 'Storage' },
		{ href: '/settings/tags', label: 'Tags' },
		{ href: '/settings/dev', label: 'Dev' }
	];
</script>

<div class="flex flex-col gap-6 md:flex-row">
	<aside class="md:w-48">
		<nav aria-label="Settings sections">
			<ul class="space-y-1 text-sm">
				{#each sections as s (s.href)}
					{@const active = $page.url.pathname === s.href}
					<li>
						<a
							href={s.href}
							aria-current={active ? 'page' : undefined}
							class={cn(
								'block rounded-md px-3 py-2',
								active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
							)}
						>
							{s.label}
						</a>
					</li>
				{/each}
			</ul>
		</nav>
	</aside>
	<div class="min-w-0 flex-1">{@render children()}</div>
</div>
