import type { Lang, Law, StructureNode, NotebookDefinition, ResolvedFragment, ResolvedNotebook } from './types';
import { getAllLaws } from './laws';
import { buildCitationData, apaReference, apaParenthetical } from './apa-citation';
import { renderContent } from './content-renderer';

const notebookModules = import.meta.glob('/data/notebooks/*.json', { eager: true });

const BASE = '/legis_cpmdem/';

// ── Helpers ─────────────────────────────────────────────

function findNodeById(nodes: StructureNode[], id: string): StructureNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function lawShortLabel(law: Law): string {
  return `${law.type.replace(/_/g, ' ')} ${law.number}`;
}

// ── Public API ──────────────────────────────────────────

export function getAllNotebooks(): NotebookDefinition[] {
  return Object.values(notebookModules).map((mod: any) => mod.default ?? mod);
}

export function getNotebookBySlug(slug: string): NotebookDefinition | undefined {
  return getAllNotebooks().find(n => n.slug === slug);
}

export function resolveNotebook(def: NotebookDefinition, lang: Lang): ResolvedNotebook {
  const laws = getAllLaws(lang);
  const lawMap = new Map<string, Law>();
  for (const law of laws) {
    lawMap.set(law.slug, law);
  }

  const lawPath = lang === 'va' ? 'llei' : 'ley';
  const resolvedFragments: ResolvedFragment[] = [];
  const seenLaws = new Set<string>();

  for (const ref of def.fragments) {
    const law = lawMap.get(ref.lawSlug);
    if (!law) {
      console.warn(`[notebooks] Law not found: ${ref.lawSlug}`);
      continue;
    }

    const node = findNodeById(law.structure, ref.articleId);
    if (!node) {
      console.warn(`[notebooks] Node not found: ${ref.articleId} in ${ref.lawSlug}`);
      continue;
    }

    const fullContent = node.content ?? node.versions?.[0]?.content ?? '';
    const excerptText = typeof ref.excerpt === 'string' ? ref.excerpt : ref.excerpt?.[lang];
    const isExcerpt = !!excerptText;
    const rawContent = isExcerpt ? excerptText! : fullContent;
    const html = renderContent(rawContent);
    const text = isExcerpt
      ? `[...] ${stripHtml(html)} [...]`
      : stripHtml(html);

    const citData = buildCitationData(law);
    const url = `${BASE}${lang}/${lawPath}/${ref.lawSlug}/#${ref.articleId}`;

    seenLaws.add(ref.lawSlug);

    resolvedFragments.push({
      id: `${ref.lawSlug}_${ref.articleId}`,
      text,
      html,
      articleId: ref.articleId,
      articleTitle: node.title,
      lawSlug: ref.lawSlug,
      lawShort: lawShortLabel(law),
      lawTitle: law.title,
      url,
      versionLabel: null,
      apaParenthetical: apaParenthetical(citData, ref.articleId),
      apaReference: apaReference(citData),
      savedAt: def.updatedAt,
    });
  }

  return {
    id: def.id,
    slug: def.slug,
    title: def.title[lang],
    description: def.description[lang],
    updatedAt: def.updatedAt,
    fragments: resolvedFragments,
    lawCount: seenLaws.size,
  };
}
