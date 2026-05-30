import type { UseQueryEntry } from '@pinia/colada';
import { useQueryCache } from '@pinia/colada';

type GeneratedQueryEntry = UseQueryEntry<unknown, unknown, unknown>;

function hasGeneratedTag(entry: GeneratedQueryEntry, tagSet: ReadonlySet<string>): boolean {
  const [head] = entry.key;
  if (typeof head !== 'object' || head == null) {
    return false;
  }

  const tags = (head as { tags?: unknown }).tags;
  return Array.isArray(tags) && tags.some(tag => typeof tag === 'string' && tagSet.has(tag));
}

export async function invalidateGeneratedQueries(tags: string | string[]) {
  const tagSet = new Set(Array.isArray(tags) ? tags : [tags]);
  const queryCache = useQueryCache();
  await queryCache.invalidateQueries({ predicate: entry => hasGeneratedTag(entry, tagSet) }, 'all');
}
