export type CursorPage<T> = {
  page: T[];
  nextCursor: string | null;
};

type WithId = { id: string };

export function paginateByCursor<T extends WithId>(
  items: T[],
  cursor: string | null,
  pageSize: number,
): CursorPage<T> {
  let endExclusive = items.length;
  if (cursor !== null) {
    const cursorIndex = items.findIndex((item) => item.id === cursor);
    endExclusive = cursorIndex === -1 ? 0 : cursorIndex;
  }

  const startInclusive = Math.max(0, endExclusive - pageSize);
  const page = items.slice(startInclusive, endExclusive);

  const nextCursor = startInclusive > 0 && page.length > 0 ? page[0].id : null;

  return { page, nextCursor };
}
