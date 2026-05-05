export type QuickLinkDragItem = { id: string; kind: 'folder' | 'link' };

export type QuickLinkDragState = {
    id: string;
    kind: 'folder' | 'link';
    pointerOffsetX: number;
    pointerOffsetY: number;
    gridLeft: number;
    gridTop: number;
    gridRight: number;
    gridBottom: number;
    width: number;
    height: number;
    currentLeft: number;
    currentTop: number;
};

export function arraysEqual(left: string[], right: string[]) {
    return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

export function moveItemById(items: QuickLinkDragItem[], activeId: string, targetId: string) {
    const next = [...items];
    const from = next.findIndex((item) => item.id === activeId);
    const to = next.findIndex((item) => item.id === targetId);
    if (from === -1 || to === -1 || from === to) return items;
    const [removed] = next.splice(from, 1);
    if (!removed) return items;
    next.splice(to, 0, removed);
    return next;
}

export function visibleItemIds(items: QuickLinkDragItem[], kind: 'folder' | 'link') {
    return items.filter((item) => item.kind === kind).map((item) => item.id);
}
