import { useRegistryItems } from './use-registry-items'

/**
 * The Event's Registry item names by id, for other features to show next to a `registryItemId`
 * (through the route, ADR-0001). Undefined until the Registry loads; a failed load stays undefined.
 */
export function useRegistryItemNames(eventId: number): ReadonlyMap<number, string> | undefined {
  const items = useRegistryItems(eventId)
  return items.data && new Map(items.data.map((item) => [item.id, item.name]))
}
