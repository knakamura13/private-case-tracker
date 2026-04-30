<script lang="ts">
	import { ShieldAlert } from 'lucide-svelte';
	import { privacyCopy } from '$lib/constants/navigation';
	let { detailed = false, class: klass = '' } = $props<{ detailed?: boolean; class?: string }>();
</script>

<div class={`disclaimer ${klass}`}>
	<ShieldAlert class="disclaimer-icon" />
	<span>{detailed ? privacyCopy.long : privacyCopy.short}</span>
</div>
