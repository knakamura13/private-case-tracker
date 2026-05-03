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
</script>

<form method="post" {action} use:enhance={onenhance} class="form-grid">
    <div class="form-grid-full">
        <Label for="question">Question</Label>
        <Textarea id="question" name="question" required rows={3} value={val('question')} />
    </div>
    <div>
        <Label for="category">Category</Label>
        <Input id="category" name="category" value={val('category')} />
    </div>
    <div>
        <Label for="priority">Priority</Label>
        <Select id="priority" name="priority" value={val('priority', 'MEDIUM')}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
        </Select>
    </div>
    <div>
        <Label for="status">Status</Label>
        <Select id="status" name="status" value={val('status', 'OPEN')}>
            <option value="OPEN">Open</option>
            <option value="RESEARCHING">Researching</option>
            <option value="ANSWERED">Answered</option>
            <option value="WONT_FIX">Won't pursue</option>
        </Select>
    </div>
    <div>
        <Label for="sourceType">Source type</Label>
        <Select id="sourceType" name="sourceType" value={val('sourceType', 'OTHER')}>
            <option value="ATTORNEY">Attorney</option>
            <option value="NONPROFIT">Nonprofit</option>
            <option value="USCIS_SITE">USCIS site</option>
            <option value="COUNTY_SITE">County site</option>
            <option value="COMMUNITY">Community</option>
            <option value="OTHER">Other</option>
        </Select>
    </div>
    <div class="form-grid-full">
        <Label for="citationUrl">Citation URL</Label>
        <Input id="citationUrl" name="citationUrl" type="url" value={val('citationUrl')} />
    </div>
    <div class="form-grid-full">
        <Label for="answer">Answer</Label>
        <Textarea id="answer" name="answer" rows={5} value={val('answer')} />
    </div>
    <div>
        <Label for="answeredAt">Answered on</Label>
        <Input id="answeredAt" name="answeredAt" type="date" value={val('answeredAt')} />
    </div>
    {#if error}<p class="form-grid-full form-error">{error}</p>{/if}
    <div class="form-grid-full form-actions">
        <Button type="submit">{submitLabel}</Button>
        <Button type="button" variant="outline" onclick={() => history.back()}>Cancel</Button>
    </div>
</form>
