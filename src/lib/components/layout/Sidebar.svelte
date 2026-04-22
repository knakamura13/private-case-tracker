<script lang="ts">
	import { page } from '$app/stores';
	import { navigation } from '$lib/constants/navigation';
	import { cn } from '$lib/utils/cn';
	import { ShieldCheck } from 'lucide-svelte';

	let { workspaceName, onNavigate }: { workspaceName: string; onNavigate?: () => void } = $props();
</script>

<aside class="flex h-full w-64 flex-col border-r border-border bg-card">
	<div class="flex items-center gap-2 border-b border-border px-5 py-4">
		<ShieldCheck class="h-5 w-5 text-primary" />
		<div class="min-w-0">
			<p class="text-sm font-semibold leading-tight">Case Tracker</p>
			<p class="truncate text-xs text-muted-foreground" title={workspaceName}>{workspaceName}</p>
		</div>
	</div>
	<nav class="flex-1 overflow-y-auto p-2" aria-label="Primary">
		<ul class="space-y-1">
			{#each navigation as item (item.href)}
				{@const active = $page.url.pathname === item.href || $page.url.pathname.startsWith(`${item.href}/`)}
				<li>
					<a
						href={item.href}
						onclick={() => onNavigate?.()}
						aria-current={active ? 'page' : undefined}
						class={cn(
							'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
							active
								? 'bg-primary/10 text-primary'
								: 'text-muted-foreground hover:bg-muted hover:text-foreground'
						)}
					>
						<item.icon class="h-4 w-4" aria-hidden="true" />
						<span>{item.label}</span>
					</a>
				</li>
			{/each}
		</ul>
	</nav>
	<div class="border-t border-border p-3">
		<p class="text-[10px] leading-tight text-muted-foreground">
			Private organizational dashboard — not a legal source of truth.
		</p>
	</div>
</aside>
