import { FotoAnimal } from "./FotoAnimal";
import { grupoEspecie, type ModuloRegistro, type Registro } from "../services/registros";

const EMOJIS: Record<string, string> = { cao: "🐶", gato: "🐱", outro: "🐾" };

// Foto do animal vinculado; sem foto, o ícone da espécie ou do módulo.
export function FotoRegistro({
  modulo,
  registro,
}: {
  modulo: ModuloRegistro;
  registro: Registro;
}) {
  if (!modulo.temAnimal) {
    return <i aria-hidden="true" className={`bi ${modulo.icone}`}></i>;
  }
  const emoji = <span aria-hidden="true">{EMOJIS[grupoEspecie(registro)]}</span>;
  return registro.animal?.tem_foto ? (
    <FotoAnimal
      id={registro.animal.id}
      alt=""
      className="h-full w-full object-cover"
      fallback={emoji}
    />
  ) : (
    emoji
  );
}
