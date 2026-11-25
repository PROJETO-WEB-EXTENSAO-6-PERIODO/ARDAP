USE ardap;

-- Fica apenas a idade estimada. Executar DEPOIS de publicar o codigo novo:
-- a versao anterior da API ainda le esta coluna.

-- Quem so tinha a data recebe a idade calculada por ela.
UPDATE animais
SET idade_estimada = LEAST(40, GREATEST(0, TIMESTAMPDIFF(YEAR, data_nascimento_estimada, CURDATE()))),
    updated_at = updated_at
WHERE idade_estimada IS NULL AND data_nascimento_estimada IS NOT NULL;

ALTER TABLE animais DROP COLUMN data_nascimento_estimada;
