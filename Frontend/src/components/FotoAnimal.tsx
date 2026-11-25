import { useEffect, useState, type ReactNode } from "react";
import { api } from "../services/api";

// A rota da foto exige token, então <img src> direto não funciona:
// a imagem é baixada pelo axios e exibida por uma URL local.
export function FotoAnimal({
  id,
  alt,
  className,
  fallback = null,
}: {
  id: number;
  alt: string;
  className?: string;
  fallback?: ReactNode;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    let objeto: string | null = null;
    api
      .get<Blob>(`/animais/${id}/foto`, { responseType: "blob" })
      .then(({ data }) => {
        if (!ativo) return;
        objeto = URL.createObjectURL(data);
        setUrl(objeto);
      })
      .catch(() => {});
    return () => {
      ativo = false;
      setUrl(null);
      if (objeto) URL.revokeObjectURL(objeto);
    };
  }, [id]);

  return url ? <img src={url} alt={alt} className={className} /> : <>{fallback}</>;
}
