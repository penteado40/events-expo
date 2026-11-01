/**
 * Where the Início's list settles after a scroll, so the header's greeting is never left half
 * folded: `null` when it already is open (top, or pulled past it) or folded; otherwise the nearest
 * of the two. `distance` is how far the list scrolls to fold the greeting away.
 */
export function headerSnap(offset: number, distance: number): number | null {
  'worklet'
  if (distance <= 0 || offset <= 0 || offset >= distance) return null
  return offset < distance / 2 ? 0 : distance
}
