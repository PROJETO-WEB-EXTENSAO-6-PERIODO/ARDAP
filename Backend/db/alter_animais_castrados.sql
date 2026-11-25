USE ardap;

-- Marca como castrados os animais que ja tinham termo de castracao.
-- Os termos novos fazem isso sozinhos.
UPDATE animais
SET castrado = TRUE, updated_at = updated_at
WHERE castrado = FALSE
  AND id IN (SELECT animal_id FROM castracao WHERE animal_id IS NOT NULL);
