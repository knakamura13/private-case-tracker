<script lang="ts">
	import PageHeader from '$lib/components/shared/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Disclaimer from '$lib/components/shared/Disclaimer.svelte';
	import { ClipboardList, Printer } from 'lucide-svelte';
	import { titleCase } from '$lib/utils/format';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<PageHeader title="Packet assembly" description="An aggregate view of forms, evidence, and final-prep checklist for filing.">
	{#snippet actions()}
		<Button variant="outline" href="/forms">
			{#snippet children()}<ClipboardList class="h-4 w-4" /> Forms list{/snippet}
		</Button>
		<Button variant="outline" onclick={() => window.print()}>
			{#snippet children()}<Printer class="h-4 w-4" /> Print{/snippet}
		</Button>
	{/snippet}
</PageHeader>

<Disclaimer class="mb-4" detailed />

<div class="mb-6 grid grid-cols-2 gap-3 md:grid-cols-6">
	{#each [
		{ label: 'Forms', value: data.totals.forms },
		{ label: 'Ready/filed', value: data.totals.readyForms },
		{ label: 'Evidence in packet', value: data.totals.evidenceInPacket },
		{ label: 'Translations needed', value: data.totals.translationsNeeded },
		{ label: 'Photos', value: data.totals.photos },
		{ label: 'Supporting items outstanding', value: data.totals.supportingOutstanding }
	] as stat}
		<Card class="p-3 text-center">
			<p class="text-xl font-semibold">{stat.value}</p>
			<p class="text-xs text-muted-foreground">{stat.label}</p>
		</Card>
	{/each}
</div>

<section class="mb-6">
	<h2 class="mb-2 font-semibold">Forms</h2>
	<ul class="space-y-2">
		{#each data.forms as f (f.id)}
			<li>
				<Card class="flex items-center justify-between p-3 text-sm">
					<div>
						<p class="font-mono text-xs uppercase text-muted-foreground">{f.code}</p>
						<p class="font-medium">{f.name}</p>
					</div>
					<div class="flex items-center gap-2">
						<Badge>{titleCase(f.filingStatus)}</Badge>
						<Badge variant="outline">{f.supportingItems.filter((s) => s.done).length}/{f.supportingItems.length} supporting</Badge>
						<Badge variant="secondary">{f._count.documents} docs</Badge>
						<Button size="sm" variant="ghost" href={`/forms/${f.id}`}>Open</Button>
					</div>
				</Card>
			</li>
		{/each}
	</ul>
</section>

<section class="mb-6">
	<h2 class="mb-2 font-semibold">Evidence marked for packet</h2>
	{#if data.evidence.length === 0}
		<p class="text-sm text-muted-foreground">Mark evidence items "Included in packet" from their detail page.</p>
	{:else}
		<ul class="grid grid-cols-1 gap-2 md:grid-cols-2">
			{#each data.evidence as ev (ev.id)}
				<li>
					<a href={`/evidence/${ev.id}`}>
						<Card class="p-3 text-sm hover:border-primary/40">
							<p class="font-medium">{ev.title}</p>
							<p class="text-xs text-muted-foreground">{ev.type} · {titleCase(ev.status)}</p>
						</Card>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<section class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
	<Card class="p-4 text-sm">
		<h3 class="mb-2 font-semibold">Final review checklist</h3>
		<ul class="space-y-1 text-sm">
			<li><label><input type="checkbox" /> All forms signed</label></li>
			<li><label><input type="checkbox" /> All forms dated</label></li>
			<li><label><input type="checkbox" /> Translations attached</label></li>
			<li><label><input type="checkbox" /> Photos present</label></li>
			<li><label><input type="checkbox" /> Copies made</label></li>
			<li><label><input type="checkbox" /> Mailing prep (envelope, tracking)</label></li>
			<li><label><input type="checkbox" /> Fee payment prepared</label></li>
			<li><label><input type="checkbox" /> Receipt-keeping plan confirmed</label></li>
		</ul>
		<p class="mt-3 text-xs text-muted-foreground">This checklist is for your reference — it is not saved.</p>
	</Card>
	<Card class="p-4 text-sm md:col-span-2">
		<h3 class="mb-2 font-semibold">Outstanding supporting items</h3>
		{#if data.supportingUnsatisfied.length === 0}
			<p class="text-sm text-muted-foreground">Nothing outstanding marked across forms. 🎉</p>
		{:else}
			<ul class="space-y-1">
				{#each data.supportingUnsatisfied as s (s.id)}
					<li class="text-sm">
						<a href={`/forms/${s.formId}`} class="text-primary underline-offset-4 hover:underline">{s.formCode}</a>
						<span class="text-muted-foreground"> — {s.label}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</Card>
</section>
