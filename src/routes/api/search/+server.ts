import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { truncate } from '$lib/utils/format';
import { listTasks } from '$lib/server/services/task.service';
import { listForms } from '$lib/server/services/form.service';
import { listEvidence } from '$lib/server/services/evidence.service';
import { listQuestions } from '$lib/server/services/question.service';
import { listNotes } from '$lib/server/services/note.service';
import { listDocuments } from '$lib/server/services/document.service';
import { listQuickLinks } from '$lib/server/services/quickLink.service';

const LIMIT_PER_GROUP = 6;

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user || !locals.workspace) return json({}, { status: 401 });
	const q = (url.searchParams.get('q') ?? '').trim();
	if (!q) return json({});

	const workspaceId = locals.workspace.id;

	const [tasks, forms, evidence, questions, notes, files, quickLinks] = await Promise.all([
		listTasks(workspaceId, { q }).then((r) => r.slice(0, LIMIT_PER_GROUP)),
		listForms(workspaceId, { q }).then((r) => r.slice(0, LIMIT_PER_GROUP)),
		listEvidence(workspaceId, { q }).then((r) => r.slice(0, LIMIT_PER_GROUP)),
		listQuestions(workspaceId, { q }).then((r) => r.slice(0, LIMIT_PER_GROUP)),
		listNotes(workspaceId, { q }).then((r) => r.slice(0, LIMIT_PER_GROUP)),
		listDocuments(workspaceId, { q }).then((r) => r.slice(0, LIMIT_PER_GROUP)),
		listQuickLinks(workspaceId).then((r) =>
			r
				.filter((l) =>
					[l.title, l.url, l.description, l.notes].some((x) =>
						String(x ?? '')
							.toLowerCase()
							.includes(q.toLowerCase())
					)
				)
				.slice(0, LIMIT_PER_GROUP)
		)
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
