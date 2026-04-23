import { Resend } from 'resend';
import { ENV } from './env';

let resend: Resend | null = null;
if (ENV.RESEND_API_KEY) resend = new Resend(ENV.RESEND_API_KEY);

interface Mail {
	to: string;
	subject: string;
	text: string;
	html?: string;
}

export async function sendEmail(mail: Mail): Promise<void> {
	if (!resend) {
		console.info('[email:dev-stub]', JSON.stringify(mail, null, 2));
		return;
	}
	const res = await resend.emails.send({
		from: ENV.EMAIL_FROM,
		to: mail.to,
		subject: mail.subject,
		text: mail.text,
		html: mail.html
	});
	if (res.error) {
		console.error('[email] send failed', res.error);
		throw new Error(`Email send failed: ${res.error.name} - ${res.error.message}`);
	}
}

export function inviteEmail(params: { to: string; inviter: string; workspace: string; url: string }) {
	return {
		to: params.to,
		subject: `${params.inviter} invited you to ${params.workspace}`,
		text: [
			`${params.inviter} has invited you to join the ${params.workspace} workspace on Private Case Tracker.`,
			'',
			'This is a private organizational dashboard for a specific case. Official government websites remain the source of truth.',
			'',
			`Accept the invitation: ${params.url}`,
			'',
			'If you were not expecting this, you can ignore this email.'
		].join('\n')
	};
}
