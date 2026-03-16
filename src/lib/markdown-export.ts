import type { Law, StructureNode } from './types';

/**
 * Genera Markdown consolidado (solo versión vigente).
 */
export function lawToMarkdownConsolidated(law: Law): string {
  const lines: string[] = [];

  lines.push(`# ${law.title}`);
  lines.push('');
  lines.push(`**${law.type.replace(/_/g, ' ')}** ${law.number} — ${law.date}`);
  lines.push(`Publicado en: ${law.publishedIn.source} núm. ${law.publishedIn.number} (${law.publishedIn.date})`);
  lines.push(`Estado: ${law.vigpiracy.statusLabel}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  renderNodesConsolidated(law.structure, lines, 2);

  return lines.join('\n');
}

/**
 * Genera Markdown con historial de versiones de cada artículo.
 */
export function lawToMarkdownWithHistory(law: Law): string {
  const lines: string[] = [];

  lines.push(`# ${law.title}`);
  lines.push('');
  lines.push(`**${law.type.replace(/_/g, ' ')}** ${law.number} — ${law.date}`);
  lines.push(`Publicado en: ${law.publishedIn.source} núm. ${law.publishedIn.number} (${law.publishedIn.date})`);
  lines.push(`Estado: ${law.vigpiracy.statusLabel}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  renderNodesWithHistory(law.structure, lines, 2);

  return lines.join('\n');
}

function headingPrefix(level: number): string {
  return '#'.repeat(Math.min(level, 6)) + ' ';
}

function renderNodesConsolidated(nodes: StructureNode[], lines: string[], headingLevel: number): void {
  for (const node of nodes) {
    if (node.type === 'titulo' || node.type === 'capitulo' || node.type === 'seccion') {
      lines.push(headingPrefix(headingLevel) + node.title);
      lines.push('');
      if (node.children) {
        renderNodesConsolidated(node.children, lines, headingLevel + 1);
      }
    } else {
      // articulo, preambulo, disposiciones
      lines.push(headingPrefix(headingLevel) + node.title);
      lines.push('');
      const text = node.content ?? node.versions?.[0]?.content ?? '';
      if (text) {
        lines.push(text);
        lines.push('');
      }
      if (node.children) {
        renderNodesConsolidated(node.children, lines, headingLevel + 1);
      }
    }
  }
}

function renderNodesWithHistory(nodes: StructureNode[], lines: string[], headingLevel: number): void {
  for (const node of nodes) {
    if (node.type === 'titulo' || node.type === 'capitulo' || node.type === 'seccion') {
      lines.push(headingPrefix(headingLevel) + node.title);
      lines.push('');
      if (node.children) {
        renderNodesWithHistory(node.children, lines, headingLevel + 1);
      }
    } else {
      lines.push(headingPrefix(headingLevel) + node.title);
      lines.push('');

      if (node.versions && node.versions.length > 0) {
        for (const v of node.versions) {
          const label = v.modifiedBy
            ? `Versión de ${v.effectiveDate} (${v.modifiedBy.title})`
            : `Versión original (${v.effectiveDate})`;
          lines.push(`> **${label}**`);
          lines.push('');
          lines.push(v.content);
          lines.push('');
        }
      } else if (node.content) {
        lines.push(node.content);
        lines.push('');
      }

      if (node.children) {
        renderNodesWithHistory(node.children, lines, headingLevel + 1);
      }
    }
  }
}
