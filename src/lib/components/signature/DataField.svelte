<script lang="ts">
	let {
		label,
		value,
		class: klass = ''
	}: {
		label: string;
		value: string | number | null | undefined;
		class?: string;
	} = $props();
</script>

<div class={`data-field ${klass}`}>
	<span class="data-field-label">{label}</span>
	<span class="data-field-value">{value ?? '—'}</span>
</div>
