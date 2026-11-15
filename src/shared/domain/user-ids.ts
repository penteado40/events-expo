/**
 * A list of User ids each once, in ascending order: how an Audience's chosen people are kept, by
 * the item draft and by the mock backend alike.
 */
export const uniqueAscending = (ids: Iterable<number>): number[] =>
  [...new Set(ids)].sort((a, b) => a - b)
