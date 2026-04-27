<script lang="ts">
	import { linkifyText } from '$lib/utils/linkify';
	import { cn } from '$lib/utils/cn';

	let {
		text,
		class: klass = '',
		lineClamp = false,
		onClick,
		editable = false
	}: {
		text: string | null;
		class?: string;
		lineClamp?: boolean;
		onClick?: () => void;
		editable?: boolean;
	} = $props();

	const parts = $derived(linkifyText(text || ''));

	function handleClick(e: MouseEvent) {
		if (!editable) return;
		// Don't trigger onClick if clicking on a link
		if ((e.target as HTMLElement).closest('A')) {
			return;
		}
		onClick?.();
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (!editable) return;
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onClick?.();
		}
	}
</script>

{#if parts.length === 0}
	<p class={cn('text-sm text-muted-foreground', klass)}></p>
{:else}
	{#if editable}
		<div
			class={cn(
				'text-sm text-muted-foreground whitespace-pre-wrap',
				lineClamp && 'line-clamp-2',
				'cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 py-0.5 transition-colors',
				klass
			)}
			onclick={handleClick}
			onkeydown={handleKeyDown}
			role="button"
			tabindex={0}
		>
			{#each parts as part}
				{#if part.type === 'url'}
					<a
						href={part.href}
						target="_blank"
						rel="noopener noreferrer"
						class="text-primary hover:underline break-all"
						onclick={(e) => e.stopPropagation()}
					>
						{part.content}
					</a>
				{:else if part.type === 'phone'}
					<a href={part.href} target="_blank" rel="noopener noreferrer" class="text-primary hover:underline" onclick={(e) => e.stopPropagation()}>{part.content}</a>
				{:else}
					{part.content}
				{/if}
			{/each}
		</div>
	{:else}
		<p class={cn('text-sm text-muted-foreground whitespace-pre-wrap', lineClamp && 'line-clamp-2', klass)}>
				{#each parts as part}
				{#if part.type === 'url'}
					<a
						href={part.href}
						target="_blank"
						rel="noopener noreferrer"
						class="text-primary hover:underline break-all"
						onclick={(e) => e.stopPropagation()}
					>
						{part.content}
					</a>
				{:else if part.type === 'phone'}
					<a
						href={part.href}
						target="_blank"
						rel="noopener noreferrer"
						class="text-primary hover:underline"
						onclick={(e) => e.stopPropagation()}
					>
						{part.content}
					</a>
				{:else}
					{part.content}
				{/if}
			{/each}
		</p>
	{/if}
{/if}
