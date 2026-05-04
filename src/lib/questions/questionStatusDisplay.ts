export function questionStatusPillClass(status: string): string {
    switch (status) {
        case 'OPEN':
            return 's-active';
        case 'RESEARCHING':
            return 's-note';
        case 'ANSWERED':
            return 's-done';
        case 'WONT_FIX':
            return 's-waiting';
        default:
            return '';
    }
}

export function questionStatusLabel(status: string): string {
    switch (status) {
        case 'OPEN':
            return 'Open';
        case 'RESEARCHING':
            return 'Researching';
        case 'ANSWERED':
            return 'Answered';
        case 'WONT_FIX':
            return "Won't pursue";
        default:
            return status;
    }
}
