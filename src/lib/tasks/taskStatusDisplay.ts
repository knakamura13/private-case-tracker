export function taskStatusPillClass(status: string): string {
    switch (status) {
        case 'TODO':
            return 's-active';
        case 'IN_PROGRESS':
            return 's-note';
        case 'WAITING':
            return 's-waiting';
        case 'DONE':
            return 's-done';
        default:
            return '';
    }
}

export function taskStatusLabel(status: string): string {
    switch (status) {
        case 'TODO':
            return 'This week';
        case 'IN_PROGRESS':
            return 'Soon';
        case 'WAITING':
            return 'Waiting';
        case 'DONE':
            return 'Done';
        default:
            return status;
    }
}
