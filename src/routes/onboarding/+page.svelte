<script lang="ts">
    import AuthShell from '$lib/components/layout/AuthShell.svelte';
    import Button from '$lib/components/ui/Button.svelte';
    import { enhance } from '$app/forms';
    import { Check } from 'lucide-svelte';
    import type { ActionData, PageData } from './$types';
    let { data, form }: { data: PageData; form: ActionData } = $props();

    let step = $state(1);
    const totalSteps = 3;

    let workspaceName = $state('Our case');
    let caseType = $state('MARRIAGE_GREEN_CARD');

    const caseTypes = [
        { id: 'MARRIAGE_GREEN_CARD', label: 'Marriage Green Card', sub: 'I-130 / I-485 concurrent filing' },
        { id: 'K1_VISA', label: 'K-1 Fiancé Visa', sub: 'I-129F petition for fiancé' },
        { id: 'CITIZENSHIP', label: 'Citizenship', sub: 'N-400 naturalization process' },
        { id: 'OTHER', label: 'Other / Custom', sub: 'Generic case structure' }
    ];

    function nextStep() {
        if (step < totalSteps) step++;
    }

    function prevStep() {
        if (step > 1) step--;
    }
</script>

<AuthShell
    title={data.isFirstUser ? (step === 1 ? 'Name your case' : step === 2 ? 'Case type' : 'Getting ready') : 'Waiting for invitation'}
    subtitle={data.isFirstUser
        ? step === 1
            ? 'This will be the name of your shared workspace.'
            : step === 2
              ? 'We will pre-load common tasks based on your selection.'
              : 'Just a few more things before we launch.'
        : 'Your account exists, but you have not been invited to a workspace yet.'}
>
    {#if data.isFirstUser}
        <!-- Progress Indicator -->
        <div style="display: flex; gap: 8px; margin-bottom: 32px;">
            {#each Array(totalSteps) as _, i}
                <div
                    style="height: 4px; flex: 1; border-radius: 2px; transition: all 300ms ease; background: {i + 1 <= step
                        ? 'var(--ink)'
                        : 'var(--surface-3)'};"
                ></div>
            {/each}
        </div>

        <form method="post" action="?/create" use:enhance>
            {#if step === 1}
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    <div>
                        <label for="name" style="display: block; font-size: 13px; font-weight: 500; margin-bottom: 8px;"
                            >Workspace name</label
                        >
                        <input
                            id="name"
                            name="name"
                            bind:value={workspaceName}
                            required
                            class="input"
                            style="width: 100%;"
                            placeholder="e.g., Our case"
                        />
                    </div>
                    <Button type="button" onclick={nextStep} style="width: 100%;">Continue</Button>
                </div>
            {:else if step === 2}
                <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
                    {#each caseTypes as type}
                        <button
                            type="button"
                            onclick={() => (caseType = type.id)}
                            style="text-align: left; padding: 16px; border: 1px solid {caseType === type.id
                                ? 'var(--peri-d)'
                                : 'var(--hairline)'}; background: {caseType === type.id
                                ? 'var(--peri)'
                                : 'var(--surface)'}; border-radius: var(--r-md); transition: all 120ms ease; display: flex; align-items: center; justify-content: space-between;"
                        >
                            <div>
                                <div style="font-size: 14px; font-weight: 600; color: var(--ink);">{type.label}</div>
                                <div style="font-size: 12px; color: var(--ink-2); margin-top: 2px;">{type.sub}</div>
                            </div>
                            {#if caseType === type.id}
                                <div
                                    style="width: 20px; height: 20px; border-radius: 50%; background: var(--peri-d); color: white; display: flex; align-items: center; justify-content: center;"
                                >
                                    <Check style="width: 12px; height: 12px;" />
                                </div>
                            {/if}
                        </button>
                    {/each}
                    <input type="hidden" name="caseType" value={caseType} />
                </div>
                <div style="display: flex; gap: 8px;">
                    <Button type="button" variant="ghost" onclick={prevStep} style="flex: 1;">Back</Button>
                    <Button type="button" onclick={nextStep} style="flex: 2;">Continue</Button>
                </div>
            {:else if step === 3}
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <div class="card tinted-sage" style="padding: 16px; border-radius: var(--r-md);">
                        <p style="font-size: 13px; margin: 0; color: var(--sage-d);">
                            We've pre-configured your case for a <strong>{caseTypes.find((t) => t.id === caseType)?.label}</strong>. You can
                            customize everything in Settings later.
                        </p>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <div style="display: flex; align-items: center; gap: 12px; font-size: 13px;">
                            <Check style="width: 16px; height: 16px; color: var(--sage-fill);" />
                            <span>10 default phases created</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px; font-size: 13px;">
                            <Check style="width: 16px; height: 16px; color: var(--sage-fill);" />
                            <span>Essential evidence categories pre-loaded</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px; font-size: 13px;">
                            <Check style="width: 16px; height: 16px; color: var(--sage-fill);" />
                            <span>Privacy-first encryption enabled</span>
                        </div>
                    </div>

                    <input type="hidden" name="name" value={workspaceName} />

                    <div style="display: flex; gap: 8px; margin-top: 12px;">
                        <Button type="button" variant="ghost" onclick={prevStep} style="flex: 1;">Back</Button>
                        <Button type="submit" style="flex: 2;">Launch Monarch</Button>
                    </div>
                </div>
            {/if}

            {#if form?.error}<p style="font-size: 13px; color: var(--blush-d); margin-top: 16px;">{form.error}</p>{/if}
        </form>
    {:else}
        <p style="font-size: 13px; color: var(--ink-2); line-height: 1.5;">
            Ask the workspace owner to send an invitation to your email. Invitations are delivered from within Settings → Members.
        </p>
        <form method="post" action="/logout" style="margin-top: 24px;">
            <Button type="submit" variant="outline" style="width: 100%;">Sign out</Button>
        </form>
    {/if}
</AuthShell>
