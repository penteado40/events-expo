/** Registry item names by id: the route builds it from the Registry (ADR-0001). */
export type RegistryItemNames = ReadonlyMap<number, string>

/** A Contribution's Registry item name; "—" while the Registry loads or when the item is gone. */
export const registryItemName = (names: RegistryItemNames | undefined, id: number) =>
  names?.get(id) ?? '—'
