<script lang="ts">
	import { X } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	const actions = [
		{ label: 'New task', href: '/tasks/new' },
		{ label: 'New form', href: '/forms/new' },
		{ label: 'New evidence item', href: '/evidence/new' },
		{ label: 'New document', href: '/documents/new' },
		{ label: 'New appointment', href: '/appointments/new' },
		{ label: 'New question', href: '/questions/new' },
		{ label: 'New note', href: '/notes/new' },
		{ label: 'New milestone', href: '/timeline/new' }
	];
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-start justify-center bg-background/60 p-4 pt-24 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
	>
		<button
			class="absolute inset-0 z-0 cursor-default"
			aria-label="Close"
			onclick={() => (open = false)}
		></button>
		<div class="relative z-10 w-full max-w-sm overflow-hidden rounded-lg border border-border bg-card shadow-xl">
			<div class="flex items-center justify-between border-b border-border px-4 py-3">
				<p class="text-sm font-semibold">Quick create</p>
				<button class="rounded-md p-1 hover:bg-muted" aria-label="Close" onclick={() => (open = false)}>
					<X class="h-4 w-4" />
				</button>
			</div>
			<ul class="p-2">
				{#each actions as a (a.href)}
					<li>
						<button
							onclick={() => {
								open = false;
								goto(a.href);
							}}
							class="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
						>
							{a.label}
						</button>
					</li>
				{/each}
			</ul>
		</div>
	</div>
{/if}
