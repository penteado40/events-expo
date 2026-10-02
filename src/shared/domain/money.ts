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
