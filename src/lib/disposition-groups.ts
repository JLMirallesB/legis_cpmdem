import type { Lang, StructureNode, StructureNodeType } from './types';

const DISPOSITION_TYPES: StructureNodeType[] = [
  'disposicion_adicional',
  'disposicion_transitoria',
  'disposicion_derogatoria',
  'disposicion_final',
];

const GROUP_LABELS: Record<string, Record<Lang, string>> = {
  disposicion_adicional: {
    es: 'Disposiciones adicionales',
    va: 'Disposicions addicionals',
  },
  disposicion_transitoria: {
    es: 'Disposiciones transitorias',
    va: 'Disposicions transitòries',
  },
  disposicion_derogatoria: {
    es: 'Disposiciones derogatorias',
    va: 'Disposicions derogatòries',
  },
  disposicion_final: {
    es: 'Disposiciones finales',
    va: 'Disposicions finals',
  },
};

const GROUP_IDS: Record<string, string> = {
  disposicion_adicional: 'grupo-da',
  disposicion_transitoria: 'grupo-dt',
  disposicion_derogatoria: 'grupo-dd',
  disposicion_final: 'grupo-df',
};

export interface DispositionGroup {
  id: string;
  title: string;
  type: 'disposition_group';
}

export type NodeOrGroup = StructureNode | DispositionGroup;

export function isDispositionGroup(node: NodeOrGroup): node is DispositionGroup {
  return 'type' in node && node.type === 'disposition_group';
}

/**
 * Inserts virtual group header nodes before each run of dispositions of the same type.
 * Works on the top-level flat array of nodes (after flattening the tree).
 */
export function insertDispositionGroups(nodes: StructureNode[], lang: Lang): NodeOrGroup[] {
  const result: NodeOrGroup[] = [];
  const seenTypes = new Set<StructureNodeType>();

  for (const node of nodes) {
    if (DISPOSITION_TYPES.includes(node.type) && !seenTypes.has(node.type)) {
      seenTypes.add(node.type);
      result.push({
        id: GROUP_IDS[node.type],
        title: GROUP_LABELS[node.type][lang],
        type: 'disposition_group',
      });
    }
    result.push(node);
  }

  return result;
}

/**
 * Builds sidebar nav items with disposition group headers injected.
 */
export function getNavItemsWithGroups(
  structure: StructureNode[],
  lang: Lang
): { id: string; title: string; depth: number; isGroup?: boolean }[] {
  const items: { id: string; title: string; depth: number; isGroup?: boolean }[] = [];
  const seenTypes = new Set<StructureNodeType>();

  function walk(nodes: StructureNode[], depth: number) {
    for (const node of nodes) {
      // Insert group header before first disposition of each type (only at depth 0)
      if (depth === 0 && DISPOSITION_TYPES.includes(node.type) && !seenTypes.has(node.type)) {
        seenTypes.add(node.type);
        items.push({
          id: GROUP_IDS[node.type],
          title: GROUP_LABELS[node.type][lang],
          depth,
          isGroup: true,
        });
      }

      const itemDepth = DISPOSITION_TYPES.includes(node.type) && depth === 0 ? 1 : depth;
      items.push({ id: node.id, title: node.title, depth: itemDepth });

      if (node.children) walk(node.children, depth + 1);
    }
  }

  walk(structure, 0);
  return items;
}
