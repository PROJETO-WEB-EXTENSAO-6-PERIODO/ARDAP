USE ardap;

ALTER TABLE animais
    ADD COLUMN foto_path VARCHAR(255) NULL AFTER observacoes;
