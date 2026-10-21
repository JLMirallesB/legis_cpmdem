import { renderInline } from './content-renderer';

/**
 * Aclaraciones de aplicación de una ley: material complementario, no
 * normativo, en `data/aclaraciones/{slug}.md`. Solo existe en castellano.
 * Se guarda aparte del JSON de la ley para que nunca se confunda con el texto
 * publicado.
 */
const clarificationModules = import.meta.glob('/data/aclaraciones/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function renderMarkdown(md: string): string {
  return md
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block && block !== '---' && !block.startsWith('# '))
    .map((block) => {
      if (block.startsWith('## ')) return `<h3>${renderInline(block.slice(3))}</h3>`;
      const lines = block.split('\n');
      if (lines.every((l) => /^\s*- /.test(l) || /^\s{2,}\S/.test(l))) {
        // Lista con ítems que pueden seguir en la línea siguiente sangrada
        const items = block.split(/\n(?=- )/).map((it) => it.replace(/^- /, '').replace(/\s*\n\s*/g, ' '));
        return `<ul>${items.map((it) => `<li>${renderInline(it)}</li>`).join('')}</ul>`;
      }
      return `<p>${renderInline(block.replace(/\s*\n\s*/g, ' '))}</p>`;
    })
    .join('');
}

/** HTML de las aclaraciones de la ley, o null si no tiene. */
export function getClarificationsHtml(slug: string): string | null {
  const md = clarificationModules[`/data/aclaraciones/${slug}.md`];
  return md ? renderMarkdown(md) : null;
}
