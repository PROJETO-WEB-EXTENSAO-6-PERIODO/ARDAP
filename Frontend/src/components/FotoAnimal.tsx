import { useState, type ReactNode } from "react";
import { api } from "../services/api";

// A API devolve links temporários e assinados das versões reduzidas da foto
// (foto_mini_url para listas, foto_url para o perfil). Em produção eles
// apontam direto para o bucket; em desenvolvimento, para a rota /arquivos da
// API. O navegador baixa a imagem sem passar pelo login e a guarda em cache.
function urlCompleta(src: string) {
  return src.startsWith("/") ? `${api.defaults.baseURL}${src}` : src;
}

export function FotoAnimal({
  src,
  alt,
  className,
  fallback = null,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallback?: ReactNode;
}) {
  // o link que falhou; um link novo (outra foto) tenta de novo
  const [falhou, setFalhou] = useState<string | null>(null);

  if (!src || falhou === src) return <>{fallback}</>;
  return (
    <img
      src={urlCompleta(src)}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => setFalhou(src)}
    />
  );
}
