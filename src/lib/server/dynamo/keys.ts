export type EntityType =
    | 'Workspace'
    | 'Membership'
    | 'Invitation'
    | 'Task'
    | 'TaskChecklistItem'
    | 'EvidenceFile'
    | 'TimelineMilestone'
    | 'FormRecord'
    | 'FormSupportingItem'
    | 'QuestionItem'
    | 'Note'
    | 'QuickLink'
    | 'QuickLinkFolder'
    | 'DocumentFile'
    | 'ActivityLog'
    | 'ErrorLog'
    | 'BetterAuth';

export function wsPk(workspaceId: string) {
    return `WS#${workspaceId}`;
}

export function entitySk(type: EntityType, id: string) {
    return `${type}#${id}`;
}

export function gsi1UserPk(userId: string) {
    return `USER#${userId}`;
}

export function gsi1Sk(type: EntityType, id: string) {
    return `${type}#${id}`;
}

export function baPk(model: string) {
    return `BA#${model}`;
}
