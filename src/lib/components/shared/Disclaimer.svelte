<script lang="ts">
	import { ShieldAlert } from 'lucide-svelte';
	import { privacyCopy } from '$lib/constants/navigation';
	let { detailed = false, class: klass = '' } = $props<{ detailed?: boolean; class?: string }>();
</script>

<div
	class={`flex items-start gap-2 rounded-md border border-border/60 bg-muted/50 px-3 py-2 text-xs text-muted-foreground ${klass}`}
>
	<ShieldAlert class="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
	<span>{detailed ? privacyCopy.long : privacyCopy.short}</span>
</div>
