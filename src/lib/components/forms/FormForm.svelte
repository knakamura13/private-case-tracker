<script lang="ts">
    import Input from '$lib/components/ui/Input.svelte';
    import Textarea from '$lib/components/ui/Textarea.svelte';
    import Select from '$lib/components/ui/Select.svelte';
    import Label from '$lib/components/ui/Label.svelte';
    import Button from '$lib/components/ui/Button.svelte';
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
        return String(v);
    }
    /* eslint-enable security/detect-object-injection */

    const filingStatusOptions = [
        { value: 'NOT_STARTED', label: 'Not started' },
        { value: 'IN_PROGRESS', label: 'In progress' },
        { value: 'READY_FOR_REVIEW', label: 'Ready for review' },
        { value: 'FILED', label: 'Filed' },
        { value: 'RECEIVED', label: 'Received' },
        { value: 'REPLACED', label: 'Replaced' },
        { value: 'NOT_NEEDED', label: 'Not needed' }
    ];

    let filingStatusField = $state(val('filingStatus', 'NOT_STARTED'));

    $effect(() => {
        void initial;
        filingStatusField = val('filingStatus', 'NOT_STARTED');
    });
</script>

<form method="post" {action} use:enhance={onenhance} class="form-grid">
    <div>
        <Label for="code">Code</Label>
        <Input id="code" name="code" required value={val('code')} placeholder="e.g. I-130" />
    </div>
    <div>
        <Label for="name">Name</Label>
        <Input id="name" name="name" required value={val('name')} />
    </div>
    <div class="form-grid-full">
        <Label for="purpose">Purpose</Label>
        <Input id="purpose" name="purpose" value={val('purpose')} />
    </div>
    <div>
        <Label for="filingStatus">Filing status</Label>
        <Select id="filingStatus" name="filingStatus" bind:value={filingStatusField} options={filingStatusOptions} />
    </div>
    <div>
        <Label for="plannedFilingDate">Planned filing date</Label>
        <Input id="plannedFilingDate" name="plannedFilingDate" type="date" value={val('plannedFilingDate')} />
    </div>
    <div>
        <Label for="actualFilingDate">Actual filing date</Label>
        <Input id="actualFilingDate" name="actualFilingDate" type="date" value={val('actualFilingDate')} />
    </div>
    <div>
        <Label for="receiptNumber">Receipt number (stored encrypted, displayed masked)</Label>
        <Input id="receiptNumber" name="receiptNumber" placeholder="IOE••••1234" value={val('receiptNumber')} />
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
