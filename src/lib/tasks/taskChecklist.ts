export interface TaskChecklistItem {
    id: string;
    taskId?: string;
    text: string;
    done: boolean;
    order?: number;
}

export function parseTaskChecklist(checklist: unknown): TaskChecklistItem[] {
    if (!checklist) return [];
    try {
        const parsed = checklist as TaskChecklistItem[];
        if (Array.isArray(parsed)) {
            return parsed.filter((item) => item && typeof item === 'object' && 'id' in item && 'text' in item);
        }
        return [];
    } catch {
        return [];
    }
}
