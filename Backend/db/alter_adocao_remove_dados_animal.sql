USE ardap;

-- Os dados do animal passam a vir de animais, via animal_id.
-- ATENCAO: apaga os dados destas colunas; faca backup antes.
ALTER TABLE termo_adocao
    DROP COLUMN nome_animal,
    DROP COLUMN especie,
    DROP COLUMN sexo,
    DROP COLUMN idade,
    DROP COLUMN raca,
    DROP COLUMN srd,
    DROP COLUMN onde_resgatou_tutor,
    DROP COLUMN cor_pelo,
    DROP COLUMN porte,
    DROP COLUMN peso,
    DROP COLUMN castrado,
    DROP COLUMN vermifugado_3meses,
    DROP COLUMN medicamento_diario;
