/** A count with its noun: "1 pessoa", "5 pessoas". */
export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
