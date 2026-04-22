import type { MemberRole } from '@prisma/client';

declare global {
	namespace App {
		interface Locals {
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
			code?: string;
		}
	}
}

export {};
