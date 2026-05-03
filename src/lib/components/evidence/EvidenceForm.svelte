<script lang="ts">
    import Input from '$lib/components/ui/Input.svelte';
    import Textarea from '$lib/components/ui/Textarea.svelte';
    import Select from '$lib/components/ui/Select.svelte';
    import Label from '$lib/components/ui/Label.svelte';
    import Button from '$lib/components/ui/Button.svelte';
    import { EVIDENCE_CATEGORIES } from '$lib/constants/categories';
    import { enhance } from '$app/forms';
    import type { SubmitFunction } from '@sveltejs/kit';

    let {
        initial = {},
        submitLabel = 'Save',
        error,
        action,
        onenhance
    }: {
        initial?: Record<string, unknown>;
        submitLabel?: string;
        error?: string | null;
        action?: string;
        onenhance?: SubmitFunction;
    } = $props();

    /* eslint-disable security/detect-object-injection */
    function val(name: string, fallback = '') {
        const v = (initial as Record<string, unknown>)[name];
        if (v == null) return fallback;
        if (v instanceof Date) return v.toISOString().slice(0, 10);
        if (Array.isArray(v)) return v.join(', ');
        return String(v);
    }
    /* eslint-enable security/detect-object-injection */
    const includedInPacket = $derived(Boolean(initial.includedInPacket));

    const evidenceTypeOptions = $derived(EVIDENCE_CATEGORIES.map((c) => ({ value: c, label: c })));
    const evidenceStatusOptions = [
        { value: 'COLLECTED', label: 'Collected' },
        { value: 'NEEDS_SCAN', label: 'Needs scan' },
        { value: 'NEEDS_TRANSLATION', label: 'Needs translation' },
        { value: 'NEEDS_BETTER_COPY', label: 'Needs better copy' },
        { value: 'READY', label: 'Ready' }
    ];

    let typeField = $state(val('type', 'Other'));
    let statusField = $state(val('status', 'COLLECTED'));

    $effect(() => {
        void initial;
        typeField = val('type', 'Other');
        statusField = val('status', 'COLLECTED');
    });
</script>

<form method="post" {action} use:enhance={onenhance} class="form-grid">
    <div class="form-grid-full">
        <Label for="title">Title</Label>
        <Input id="title" name="title" required value={val('title')} />
    </div>
    <div>
        <Label for="type">Category</Label>
        <Select id="type" name="type" bind:value={typeField} options={evidenceTypeOptions} />
    </div>
    <div>
        <Label for="status">Status</Label>
        <Select id="status" name="status" bind:value={statusField} options={evidenceStatusOptions} />
    </div>
    <div>
        <Label for="dateStart">Date start</Label>
        <Input id="dateStart" name="dateStart" type="date" value={val('dateStart')} />
    </div>
    <div>
        <Label for="dateEnd">Date end</Label>
        <Input id="dateEnd" name="dateEnd" type="date" value={val('dateEnd')} />
    </div>
    <div class="form-grid-full">
        <Label for="peopleInvolved">People involved (comma-separated)</Label>
        <Input id="peopleInvolved" name="peopleInvolved" value={val('peopleInvolved')} />
    </div>
    <div class="form-grid-full">
        <Label for="description">Description</Label>
        <Textarea id="description" name="description" value={val('description')} />
    </div>
    <div class="form-grid-full">
        <Label for="significance">Significance</Label>
        <Textarea id="significance" name="significance" value={val('significance')} rows={2} />
    </div>
    <div>
        <Label for="confidenceScore">Confidence (1–5)</Label>
        <Input id="confidenceScore" name="confidenceScore" type="number" min="1" max="5" value={val('confidenceScore', '3')} />
    </div>
    <div class="form-checkbox-wrapper">
        <label class="form-checkbox-label">
            <input type="checkbox" name="includedInPacket" checked={includedInPacket} />
            Included in packet
        </label>
    </div>
    <div class="form-grid-full">
        <Label for="notes">Notes</Label>
        <Textarea id="notes" name="notes" value={val('notes')} />
    </div>
    {#if error}<p class="form-grid-full form-error">{error}</p>{/if}
    <div class="form-grid-full form-actions">
        <Button type="submit">{submitLabel}</Button>
        <Button type="button" variant="outline" onclick={() => history.back()}>Cancel</Button>
    </div>
</form>
