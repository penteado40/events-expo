export const DETAIL_TABS = ['summary', 'rsvps', 'registry', 'contributions'] as const

/** A tab of the Event detail. */
export type DetailTab = (typeof DETAIL_TABS)[number]

/** The tab a `?tab=` search param asks for; anything else (absent, unknown, repeated) is Resumo. */
export function parseDetailTab(value: string | string[] | undefined): DetailTab {
  return DETAIL_TABS.find((tab) => tab === value) ?? 'summary'
}

/** The Event detail on `tab`: Resumo needs no param, so its link stays `/events/{id}`. */
export const detailHref = (id: number, tab: DetailTab) =>
  ({
    pathname: '/events/[id]',
    params: tab === 'summary' ? { id } : { id, tab },
  }) as const
