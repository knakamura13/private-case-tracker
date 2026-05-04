/**
 * Finds class names used in markup (Svelte + app.html) that are never defined in
 * any project stylesheet (global .css files plus style blocks in Svelte files).
 *
 * Run: npm run report:undefined-classes
 * Output: reports/undefined-classes.txt (override path: tsx scripts/find-undefined-classes.ts path/to/out.txt)
 *
 * Limits: dynamic class expressions only partially handled; library-injected classes
 * may appear as false positives.
 */

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const SRC = join(ROOT, 'src');

const CLASS_RE = /^[a-zA-Z_][\w-]*$/;
// Allowed directory names for security
const ALLOWED_DIR_NAMES = /^[a-zA-Z0-9._-]+$/;

/** Single-word quoted strings inside class="... {expr} ..." often pick up JS literals (e.g. === 'OWNER'). */
function quotedTokenLikelyClass(t: string): boolean {
    if (!CLASS_RE.test(t) || t.endsWith('--')) return false;
    if (t.includes('-')) return true;
    if (t.length >= 12) return true;
    return false;
}
/** Class selectors in CSS / Svelte <style> (no leading dot in capture) */
const CSS_CLASS_DEF_RE = /\.([a-zA-Z_][\w-]*)/g;

const SKIP_DIRS = new Set(['node_modules', '.git', 'build', '.svelte-kit']);

function validateDirectoryName(name: string): boolean {
    return ALLOWED_DIR_NAMES.test(name) && name !== '.' && name !== '..' && !name.includes('..');
}

function walkFiles(dir: string, match: (p: string) => boolean, out: string[] = []): string[] {
    // Validate directory path
    if (!dir.startsWith(ROOT) || !validatePath(dir)) {
        throw new Error(`Invalid directory path: ${dir}`);
    }

    const entries = safeReaddirSync(dir, { withFileTypes: true });

    for (const ent of entries) {
        const name = ent.name;

        // Validate directory/file name
        if (!validateDirectoryName(name)) {
            continue;
        }

        const p = join(dir, name);

        // Additional path validation
        if (!validatePath(p)) {
            continue;
        }

        if (ent.isDirectory()) {
            if (SKIP_DIRS.has(name)) continue;
            walkFiles(p, match, out);
        } else if (match(p)) {
            out.push(p);
        }
    }
    return out;
}

function validatePath(path: string): boolean {
    // Basic path traversal protection
    return !path.includes('..') && !path.includes('~') && !path.startsWith('/') && !path.includes('\0');
}

function safeReaddirSync(dirPath: string, options: { withFileTypes: true }) {
    // Validate directory path
    if (!dirPath.startsWith(ROOT) || !validatePath(dirPath)) {
        throw new Error(`Invalid directory path: ${dirPath}`);
    }

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    return readdirSync(dirPath, options);
}

function safeReadFileSync(filePath: string, encoding: BufferEncoding): string {
    // Validate file path before reading
    if (!filePath.startsWith(ROOT) || !validatePath(filePath)) {
        throw new Error(`Invalid file path for reading: ${filePath}`);
    }

    // Additional validation for file extensions
    const allowedExtensions = ['.css', '.svelte', '.html'];
    const hasAllowedExtension = allowedExtensions.some((ext) => filePath.endsWith(ext));
    if (!hasAllowedExtension) {
        throw new Error(`File extension not allowed: ${filePath}`);
    }

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    return readFileSync(filePath, encoding);
}

function safeMkdirSync(dirPath: string, options: { recursive?: boolean }): void {
    // Validate directory path
    if (!dirPath.startsWith(ROOT) || !validatePath(dirPath)) {
        throw new Error(`Invalid directory path: ${dirPath}`);
    }

    // Only allow creating directories under ROOT
    if (!dirPath.startsWith(ROOT)) {
        throw new Error(`Directory creation only allowed under project root: ${dirPath}`);
    }

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    mkdirSync(dirPath, options);
}

function safeWriteFileSync(filePath: string, data: string, encoding: BufferEncoding): void {
    // Validate file path before writing
    if (!filePath.startsWith(ROOT) || !validatePath(filePath)) {
        throw new Error(`Invalid file path for writing: ${filePath}`);
    }

    // Only allow writing to reports directory
    if (!filePath.includes('/reports/')) {
        throw new Error(`Writing only allowed to reports directory: ${filePath}`);
    }

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    writeFileSync(filePath, data, encoding);
}

function stripBlockComments(text: string): string {
    return text.replace(/\/\*[\s\S]*?\*\//g, ' ');
}

function extractDefinedClassesFromCss(css: string): Set<string> {
    const set = new Set<string>();
    const cleaned = stripBlockComments(css);
    let m: RegExpExecArray | null;
    // Use the literal regex instead of constructor to avoid security warning
    while ((m = CSS_CLASS_DEF_RE.exec(cleaned)) !== null) {
        set.add(m[1]);
    }
    return set;
}

function extractStyleBlocksFromSvelte(source: string): string[] {
    const blocks: string[] = [];
    const re = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(source)) !== null) {
        blocks.push(m[1]);
    }
    return blocks;
}

function stripScriptAndStyleForTemplateScan(source: string): string {
    return source.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ');
}

function extractTokensFromClassAttrValue(value: string): string[] {
    const out = new Set<string>();
    // Quoted strings (ternaries): only tokens that look like utility/BEM classes
    const quoted = /["']([^'"]+)["']/g;
    let m: RegExpExecArray | null;
    while ((m = quoted.exec(value)) !== null) {
        for (const t of m[1].trim().split(/\s+/)) {
            if (quotedTokenLikelyClass(t)) out.add(t);
        }
    }
    // Static bits: remove {...} blocks (one shallow pass; rare nested braces in class expr)
    let rest = value;
    let prev = '';
    while (rest !== prev) {
        prev = rest;
        rest = rest.replace(/\{[^{}]*\}/g, ' ');
    }
    for (const t of rest.split(/\s+/)) {
        if (CLASS_RE.test(t) && !t.endsWith('--')) out.add(t);
    }
    return [...out];
}

function extractUsedClassesFromTemplate(template: string, fileLabel: string, usage: Map<string, Set<string>>) {
    function record(token: string) {
        if (!CLASS_RE.test(token) || token.endsWith('--')) return;
        if (!usage.has(token)) usage.set(token, new Set());
        usage.get(token)!.add(fileLabel);
    }

    // class="..." | class='...' | class=`...` (multiline)
    const classAttr = /class\s*=\s*(?:"([^"]*)"|'([^']*)'|`([\s\S]*?)`)/g;
    let m: RegExpExecArray | null;
    while ((m = classAttr.exec(template)) !== null) {
        const raw = m[1] ?? m[2] ?? m[3] ?? '';
        for (const t of extractTokensFromClassAttrValue(raw)) {
            record(t);
        }
    }

    // class:directive
    const classDir = /class:([a-zA-Z_][\w-]*)\s*=/g;
    while ((m = classDir.exec(template)) !== null) {
        record(m[1]);
    }
}

function main() {
    const outPath = process.argv[2] ? join(ROOT, process.argv[2]) : join(ROOT, 'reports', 'undefined-classes.txt');
    const cssFiles = walkFiles(SRC, (p) => p.endsWith('.css'));
    const svelteFiles = walkFiles(SRC, (p) => p.endsWith('.svelte'));
    const htmlFiles = walkFiles(SRC, (p) => p.endsWith('.html'));

    const defined = new Set<string>();

    for (const f of cssFiles) {
        const text = safeReadFileSync(f, 'utf8');
        for (const c of extractDefinedClassesFromCss(text)) defined.add(c);
    }

    for (const f of svelteFiles) {
        const text = safeReadFileSync(f, 'utf8');
        for (const block of extractStyleBlocksFromSvelte(text)) {
            for (const c of extractDefinedClassesFromCss(block)) defined.add(c);
        }
    }

    const usage = new Map<string, Set<string>>();

    for (const f of svelteFiles) {
        const text = safeReadFileSync(f, 'utf8');
        const template = stripScriptAndStyleForTemplateScan(text);
        const label = relative(ROOT, f);
        extractUsedClassesFromTemplate(template, label, usage);
    }

    for (const f of htmlFiles) {
        const text = safeReadFileSync(f, 'utf8');
        const label = relative(ROOT, f);
        extractUsedClassesFromTemplate(text, label, usage);
    }

    const undefinedClasses: { name: string; files: string[] }[] = [];
    for (const [name, files] of usage) {
        if (!defined.has(name)) {
            undefinedClasses.push({ name, files: [...files].sort() });
        }
    }

    undefinedClasses.sort((a, b) => a.name.localeCompare(b.name));

    const header =
        `Defined class names (from CSS + Svelte style blocks): ${defined.size}\n` +
        `Used class tokens in markup: ${usage.size}\n` +
        `Used in markup but never defined in project stylesheets: ${undefinedClasses.length}\n\n`;

    const lines = undefinedClasses.map(({ name, files }) => {
        const where = files.length > 3 ? `${files.slice(0, 3).join(', ')} (+${files.length - 3} more)` : files.join(', ');
        return `${name}\t${files.length} file(s)\t${where}`;
    });

    const body = header + lines.join('\n') + '\n';
    safeMkdirSync(join(ROOT, 'reports'), { recursive: true });
    safeWriteFileSync(outPath, body, 'utf8');

    console.log(body);
    console.log(`Wrote ${relative(ROOT, outPath)}`);
}

main();
