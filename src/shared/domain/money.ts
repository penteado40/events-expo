/** Amounts added up in centavos, so 0.1 + 0.2 is 0.3. */
export const sumMoney = (amounts: readonly number[]) =>
  amounts.reduce((centavos, amount) => centavos + Math.round(amount * 100), 0) / 100

/** An amount in the Event's currency, pt-BR, always with centavos (e.g. "R$ 1.090,00"). */
export const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)

/** A total where centavos don't fit (Início's "Verificado"): whole reais, rounded down (e.g. "R$ 1.090"). */
export const formatWholeMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.floor(amount))
