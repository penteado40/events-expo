/** A Registry item's "N contribuições" (counted by the API: `PAID` + `VERIFIED`). */
export function contributionCountLabel(count: number): string {
  if (count === 0) return 'nenhuma contribuição'
  return count === 1 ? '1 contribuição' : `${count} contribuições`
}
