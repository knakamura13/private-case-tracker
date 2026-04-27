/**
 * Parse text and convert URLs and phone numbers to clickable links
 */

export interface LinkifiedPart {
	type: 'text' | 'url' | 'phone';
	content: string;
	href?: string;
}

/**
 * Regex patterns for URLs and phone numbers
 */
const URL_REGEX =
	/(https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&//=]*)|(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&//=]*))/g;

const PHONE_REGEX = /(\b\d{3}[-.]?\d{3}[-.]?\d{4}\b|\(\d{3}\)\s*\d{3}[-.]?\d{4}\b)/g;

/**
 * Parse text and identify URLs, phone numbers, and plain text segments
 */
export function linkifyText(text: string): LinkifiedPart[] {
	if (!text) return [];

	const parts: LinkifiedPart[] = [];
	let lastIndex = 0;

	// Find all matches
	const urlMatches = [...text.matchAll(URL_REGEX)];
	const phoneMatches = [...text.matchAll(PHONE_REGEX)];

	// Combine all matches and sort by position
	const allMatches = [
		...urlMatches.map((m) => ({ type: 'url' as const, match: m, index: m.index!, length: m[0].length })),
		...phoneMatches.map((m) => ({ type: 'phone' as const, match: m, index: m.index!, length: m[0].length }))
	].sort((a, b) => a.index - b.index);

	// Build parts array
	allMatches.forEach(({ type, match, index, length }) => {
		// Skip matches that overlap with already-consumed text
		if (index < lastIndex) {
			return;
		}

		// Add plain text before this match
		if (index > lastIndex) {
			const plainText = text.slice(lastIndex, index);
			if (plainText) {
				parts.push({ type: 'text', content: plainText });
			}
		}

		// Add the matched link
		const content = match[0];
		if (type === 'url') {
			// Add https:// prefix if URL doesn't have a protocol
			const href = content.startsWith('http') ? content : `https://${content}`;
			parts.push({ type: 'url', content, href });
		} else if (type === 'phone') {
			// Clean phone number for tel: link
			const cleanPhone = content.replace(/\D/g, '');
			parts.push({ type: 'phone', content, href: `tel:${cleanPhone}` });
		}

		lastIndex = index + length;
	});

	// Add remaining plain text
	if (lastIndex < text.length) {
		const remainingText = text.slice(lastIndex);
		if (remainingText) {
			parts.push({ type: 'text', content: remainingText });
		}
	}

	// If no matches found, return entire text as plain text
	if (parts.length === 0 && text) {
		parts.push({ type: 'text', content: text });
	}

	return parts;
}
