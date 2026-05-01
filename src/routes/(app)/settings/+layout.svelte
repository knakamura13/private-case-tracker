<script lang="ts">
	import { page } from '$app/stores';
	let { children }: { children: import('svelte').Snippet } = $props();

	const sections = [
		{ href: '/settings/profile', label: 'Profile' },
		{ href: '/settings/security', label: 'Security' },
		{ href: '/settings/members', label: 'Members' },
		{ href: '/settings/data', label: 'Data & privacy' },
		{ href: '/settings/tags', label: 'Tags' },
		{ href: '/settings/dev', label: 'Dev' }
	];
</script>

<div style="display: flex; flex-direction: column; gap: 32px; md:flex-direction: row;" class="settings-layout-md-flex-row">
	<aside style="width: 200px; flex-shrink: 0;">
		<nav aria-label="Settings sections">
			<ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px;">
				{#each sections as s (s.href)}
					{@const active = $page.url.pathname === s.href}
					<li>
						<a
							href={s.href}
							aria-current={active ? 'page' : undefined}
							style="display: block; padding: 10px 16px; border-radius: var(--r-sm); font-size: 14px; font-weight: 500; text-decoration: none; transition: all 120ms ease; background: {active ? 'var(--ink)' : 'transparent'}; color: {active ? 'var(--surface)' : 'var(--ink-2)'};"
						>
							{s.label}
						</a>
					</li>
				{/each}
			</ul>
		</nav>
	</aside>
	<div style="flex: 1; min-width: 0;">{@render children()}</div>
</div>

<style>
    @media (max-width: 768px) {
        .settings-layout-md-flex-row {
            flex-direction: column !important;
        }
        aside {
            width: 100% !important;
        }
        nav ul {
            flex-direction: row !important;
            overflow-x: auto;
            padding-bottom: 8px !important;
        }
        nav li {
            flex-shrink: 0;
        }
    }
</style>
