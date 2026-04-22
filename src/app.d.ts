import type { MemberRole } from '@prisma/client';

declare global {
	namespace App {
		interface Locals {
			requestId: string;
			user: {
				id: string;
				email: string;
				name: string | null;
				image: string | null;
			} | null;
			session: {
				id: string;
				expiresAt: Date;
			} | null;
			workspace: {
				id: string;
				name: string;
				role: MemberRole;
			} | null;
		}
		interface PageData {
			user: App.Locals['user'];
			workspace: App.Locals['workspace'];
		}
		interface Error {
			message: string;
			errorId?: string;
			requestId?: string;
			stack?: string;
			code?: string;
		}
	}
}

export {};
