/**
 * Valida os atributos da carta para garantir que fiquem entre 1 e 10.
 * @param value O valor original do atributo
 * @returns O valor dentro do intervalo permitido [1, 10]
 */
export function validateAttribute(value: number): number {
  if (isNaN(value)) return 1;
  return Math.min(Math.max(value, 1), 10);
}

/**
 * Valida um objeto completo de atributos.
 */
export function validateAllAttributes(atributos: Record<string, number>) {
  const validated: Record<string, number> = {};
  for (const key in atributos) {
    validated[key] = validateAttribute(atributos[key]);
  }
  return validated;
}
