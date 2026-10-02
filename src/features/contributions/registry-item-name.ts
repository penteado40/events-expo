/**
 * Registry item names by id: the route builds it from the Registry (ADR-0001). Undefined while
 * the Registry loads; empty when it failed to load.
 */
export type RegistryItemNames = ReadonlyMap<number, string>

/**
 * A Contribution's Registry item name: undefined while the Registry loads (a skeleton shows), "—"
 * when there's no name to show (the item isn't in the Registry, or the Registry failed to load).
 */
export const registryItemName = (
  names: RegistryItemNames | undefined,
  id: number,
): string | undefined => (names ? (names.get(id) ?? '—') : undefined)
