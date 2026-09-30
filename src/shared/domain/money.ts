/** An amount in the Event's currency, pt-BR, always with centavos (e.g. "R$ 1.090,00"). */
export const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
