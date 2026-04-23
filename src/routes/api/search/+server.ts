import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { truncate } from '$lib/utils/format';

const LIMIT_PER_GROUP = 6;

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user || !locals.workspace) return json({}, { status: 401 });
	const q = (url.searchParams.get('q') ?? '').trim();
	if (!q) return json({});

	const workspaceId = locals.workspace.id;
	const contains = { contains: q, mode: 'insensitive' as const };

	const [tasks, forms, evidence, questions, notes, files, quickLinks] = await Promise.all([
		db.task.findMany({
			where: {
				workspaceId,
				deletedAt: null,
				OR: [{ title: contains }, { description: contains }]
			},
			take: LIMIT_PER_GROUP,
			orderBy: { updatedAt: 'desc' }
		}),
		db.formRecord.findMany({
			where: {
				workspaceId,
				deletedAt: null,
				OR: [{ name: contains }, { code: contains }, { purpose: contains }, { notes: contains }]
			},
			take: LIMIT_PER_GROUP,
			orderBy: { updatedAt: 'desc' }
		}),
		db.evidenceItem.findMany({
			where: {
				workspaceId,
				deletedAt: null,
				OR: [
					{ title: contains },
					{ description: contains },
					{ significance: contains },
					{ notes: contains }
				]
			},
			take: LIMIT_PER_GROUP,
			orderBy: { updatedAt: 'desc' }
		}),
		db.questionItem.findMany({
			where: {
				workspaceId,
				deletedAt: null,
				OR: [{ question: contains }, { answer: contains }, { category: contains }]
			},
			take: LIMIT_PER_GROUP,
			orderBy: { updatedAt: 'desc' }
		}),
		db.note.findMany({
			where: {
				workspaceId,
				deletedAt: null,
				OR: [{ title: contains }, { bodyMd: contains }]
			},
			take: LIMIT_PER_GROUP,
			orderBy: { updatedAt: 'desc' }
		}),
		db.documentFile.findMany({
			where: {
				workspaceId,
				deletedAt: null,
				OR: [{ title: contains }, { notes: contains }, { category: contains }]
			},
			take: LIMIT_PER_GROUP,
			orderBy: { updatedAt: 'desc' }
		}),
		db.quickLink.findMany({
			where: {
				workspaceId,
				deletedAt: null,
				OR: [{ title: contains }, { url: contains }, { description: contains }, { notes: contains }]
			},
			take: LIMIT_PER_GROUP,
			orderBy: { updatedAt: 'desc' }
		})
	]);

	return json({
		Tasks: tasks.map((t) => ({
			type: 'task',
			id: t.id,
			title: t.title,
			description: t.description ? truncate(t.description, 80) : undefined,
			href: `/tasks/${t.id}`
		})),
		Forms: forms.map((f) => ({
			type: 'form',
			id: f.id,
			title: `${f.code} — ${f.name}`,
			description: f.purpose ? truncate(f.purpose, 80) : undefined,
			href: `/forms/${f.id}`
		})),
		Evidence: evidence.map((e) => ({
			type: 'evidence',
			id: e.id,
			title: e.title,
			description: e.type,
			href: `/evidence/${e.id}`
		})),
		Questions: questions.map((qItem) => ({
			type: 'question',
			id: qItem.id,
			title: qItem.question,
			description: qItem.status,
			href: `/questions/${qItem.id}`
		})),
		Notes: notes.map((n) => ({
			type: 'note',
			id: n.id,
			title: n.title,
			description: truncate(n.bodyMd.replace(/[#*_`>]/g, ''), 80),
			href: `/notes/${n.id}`
		})),
		Files: files.map((f) => ({
			type: 'file',
			id: f.id,
			title: f.title,
			description: f.category,
			href: `/documents/${f.id}`
		})),
		'Quick links': quickLinks.map((l) => ({
			type: 'quicklink',
			id: l.id,
			title: l.title ?? l.url,
			description: l.url,
			href: l.url
		}))
	});
};
