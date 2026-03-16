import type { APIRoute } from 'astro';
import type { StructureNode } from '../../lib/types';
import { getAllLaws } from '../../lib/laws';

interface SearchEntry {
  slug: string;
  title: string;
  titleShort: string;
  type: string;
  date: string;
  vigpiracy: string;
  fragments: { id: string; title: string; text: string }[];
}

function extractFragments(nodes: StructureNode[]): { id: string; title: string; text: string }[] {
  const fragments: { id: string; title: string; text: string }[] = [];
  for (const node of nodes) {
    if (node.content) {
      fragments.push({ id: node.id, title: node.title, text: node.content });
    }
    if (node.versions && node.versions.length > 0) {
      fragments.push({ id: node.id, title: node.title, text: node.versions[0].content });
    }
    if (node.children) {
      fragments.push(...extractFragments(node.children));
    }
  }
  return fragments;
}

export const GET: APIRoute = () => {
  const laws = getAllLaws('va');
  const index: SearchEntry[] = laws.map((law) => ({
    slug: law.slug,
    title: law.title,
    titleShort: law.titleShort,
    type: law.type,
    date: law.date,
    vigpiracy: law.vigpiracy.status,
    fragments: extractFragments(law.structure),
  }));

  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json' },
  });
};
