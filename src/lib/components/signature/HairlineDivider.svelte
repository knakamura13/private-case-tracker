<script lang="ts">
	let {
		class: klass = ''
	}: {
		class?: string;
	} = $props();
</script>

<div class={`hairline-divider ${klass}`} aria-hidden="true"></div>
