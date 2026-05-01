import fs from 'node:fs';
import path from 'node:path';

const BLOG_ROOT = path.resolve('src/content/blog');
const MARKDOWN_EXTENSIONS = new Set(['.md', '.mdx']);

function walkMarkdownFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkMarkdownFiles(fullPath));
      continue;
    }
    if (MARKDOWN_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files;
}

function readFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return null;
  return match[1];
}

function getSingleLineField(frontmatter, fieldName) {
  const regex = new RegExp(`^${fieldName}:[ \\t]*(.+)[ \\t]*$`, 'm');
  const match = frontmatter.match(regex);
  if (!match) return null;
  return match[1].trim();
}

function stripQuotes(value) {
  const text = String(value || '').trim();
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    return text.slice(1, -1);
  }
  return text;
}

function parseLocation(frontmatter) {
  const blockMatch = frontmatter.match(/^location:\s*\r?\n((?:[ \t]+.+\r?\n?)*)/m);
  if (!blockMatch) return null;
  const block = blockMatch[1];
  const name = block.match(/^[ \t]+name:\s*(.+)\s*$/m)?.[1]?.trim();
  const lat = block.match(/^[ \t]+lat:\s*(.+)\s*$/m)?.[1]?.trim();
  const lng = block.match(/^[ \t]+lng:\s*(.+)\s*$/m)?.[1]?.trim();
  return { name, lat, lng };
}

function validateFile(filePath, slugSet) {
  const errors = [];
  const raw = fs.readFileSync(filePath, 'utf8');
  const relative = path.relative(process.cwd(), filePath);
  const id = relative.replace(/^src\/content\/blog\//, '').replace(/\.(md|mdx)$/i, '');

  if (slugSet.has(id)) {
    errors.push(`${relative}: duplicated entry id "${id}"`);
  } else {
    slugSet.add(id);
  }

  const frontmatter = readFrontmatter(raw);
  if (!frontmatter) {
    errors.push(`${relative}: missing frontmatter block`);
    return errors;
  }

  const title = stripQuotes(getSingleLineField(frontmatter, 'title'));
  if (!title) {
    errors.push(`${relative}: missing or empty title`);
  }

  const dateRaw = getSingleLineField(frontmatter, 'date');
  if (!dateRaw) {
    errors.push(`${relative}: missing date`);
  } else {
    const normalized = stripQuotes(dateRaw);
    const timestamp = Date.parse(normalized);
    if (Number.isNaN(timestamp)) {
      errors.push(`${relative}: invalid date "${normalized}"`);
    }
  }

  const tagsInline = getSingleLineField(frontmatter, 'tags');
  if (tagsInline && tagsInline !== '[]' && !tagsInline.startsWith('[')) {
    errors.push(`${relative}: tags should be array style, e.g. ["a","b"] or list block`);
  }

  const coverRaw = getSingleLineField(frontmatter, 'cover');
  if (coverRaw) {
    const cover = stripQuotes(coverRaw);
    try {
      const parsed = new URL(cover);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        errors.push(`${relative}: cover must be http/https URL`);
      }
    } catch (_) {
      errors.push(`${relative}: cover must be valid URL`);
    }
  }

  const location = parseLocation(frontmatter);
  if (location) {
    if (!location.name || !stripQuotes(location.name)) {
      errors.push(`${relative}: location.name is required when location exists`);
    }
    const lat = Number(stripQuotes(location.lat));
    const lng = Number(stripQuotes(location.lng));
    if (!Number.isFinite(lat)) {
      errors.push(`${relative}: location.lat must be number`);
    }
    if (!Number.isFinite(lng)) {
      errors.push(`${relative}: location.lng must be number`);
    }
  }

  return errors;
}

if (!fs.existsSync(BLOG_ROOT)) {
  console.error('Content root not found:', BLOG_ROOT);
  process.exit(1);
}

const files = walkMarkdownFiles(BLOG_ROOT);
const slugSet = new Set();
const allErrors = files.flatMap((filePath) => validateFile(filePath, slugSet));

if (allErrors.length > 0) {
  console.error('Content validation failed:');
  for (const err of allErrors) console.error(`- ${err}`);
  process.exit(1);
}

console.log(`Content validation passed (${files.length} files checked).`);
