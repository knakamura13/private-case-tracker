<script lang="ts" module>
    const statusBadgeVariants = {
        variant: {
            success: 'border-l-success',
            warning: 'border-l-warning',
            error: 'border-l-destructive',
            destructive: 'border-l-destructive',
            neutral: 'border-l-muted-foreground',
            secondary: 'border-l-muted-foreground',
            outline: 'border-l-border',
            default: 'border-l-primary'
        }
    } as const;

    export type StatusBadgeVariant = keyof typeof statusBadgeVariants.variant;
</script>

<script lang="ts">
    let {
        status,
        variant = 'default',
        class: klass = ''
    }: {
        status: string;
        variant?: StatusBadgeVariant;
        class?: string;
    } = $props();

    const baseClass =
        'inline-flex items-center border-l-[3px] bg-muted/20 px-2.5 py-1 text-xs font-medium text-foreground transition-colors';
    // eslint-disable-next-line security/detect-object-injection
    const statusClass = $derived(`${baseClass} ${statusBadgeVariants.variant[variant]} ${klass}`.trim());
</script>

<span class={statusClass}>
    {status}
</span>
