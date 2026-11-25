export function formatarIdade(anos: number | null) {
  if (anos === null) return null;
  if (anos === 0) return "Menos de 1 ano";
  return `${anos} ${anos === 1 ? "ano" : "anos"}`;
}
