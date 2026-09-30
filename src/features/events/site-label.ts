/** The Site card's URL, without the scheme or a trailing slash. */
export const siteLabel = (siteUrl: string) => siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
