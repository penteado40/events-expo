/** A count of Contributions to verify, as the lime chips say it: "1 pendente", "N pendentes". */
export const pendingLabel = (count: number) => (count === 1 ? '1 pendente' : `${count} pendentes`)
