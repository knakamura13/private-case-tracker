/**
 * Minimal, safe Markdown renderer (headings, bold, italic, code, links, lists).
 */
export function renderMarkdown(src: string): string {
	const escape = (s: string) =>
		s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	let html = escape(src);
	html = html.replace(/^###### (.*)$/gm, '<h6>$1</h6>');
	html = html.replace(/^##### (.*)$/gm, '<h5>$1</h5>');
	html = html.replace(/^#### (.*)$/gm, '<h4 class="mt-3 font-semibold">$1</h4>');
	html = html.replace(/^### (.*)$/gm, '<h3 class="mt-3 text-base font-semibold">$1</h3>');
	html = html.replace(/^## (.*)$/gm, '<h2 class="mt-3 text-lg font-semibold">$1</h2>');
	html = html.replace(/^# (.*)$/gm, '<h1 class="mt-3 text-xl font-semibold">$1</h1>');
	html = html.replace(/`([^`]+)`/g, '<code class="rounded bg-muted px-1">$1</code>');
	html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
	html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
	html = html.replace(
		/\[([^\]]+)\]\((https?:[^\s)]+)\)/g,
		'<a href="$2" class="text-primary underline-offset-4 hover:underline" target="_blank" rel="noreferrer noopener">$1</a>'
	);
	// Simple bullet lists
	html = html.replace(/(^|\n)- (.+)/g, '$1<li>$2</li>');
	html = html.replace(/(<li>.*<\/li>)(?!\s*<li>)/gs, '<ul class="list-disc pl-6">$1</ul>');
	// Collapse 3+ newlines into 2 newlines (preserve single blank lines)
	html = html.replace(/\n{3,}/g, '\n\n');
	// Convert double newlines to paragraph breaks
	html = html.replace(/\n\n+/g, '</p><p class="mt-3">');
	// Convert single newlines to <br> (but not after block elements)
	html = html.replace(/(?<!<\/(?:h[1-6]|li|ul|p)>)\n(?!\n)/g, '<br />');
	return `<p>${html}</p>`;
}
