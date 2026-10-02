import { useRegistryItems } from './use-registry-items'

/**
 * The Event's Registry item names by id, for other features to show next to a `registryItemId`
 * (through the route, ADR-0001). Undefined while the Registry loads; empty if it failed to load,
 * so a name shows "—" instead of loading forever (the Presentes tab shows the error).
 */
export function useRegistryItemNames(eventId: number): ReadonlyMap<number, string> | undefined {
  const items = useRegistryItems(eventId)
  if (items.data) return new Map(items.data.map((item) => [item.id, item.name]))
  return items.isError ? new Map() : undefined
}
