/** Lowercase and without accents, so "saida" finds "Saída". */
export const foldText = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
