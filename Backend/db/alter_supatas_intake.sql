USE ardap;

ALTER TABLE supatas_intake
    ADD COLUMN especie VARCHAR(50) NULL AFTER data_encaminhamento;

ALTER TABLE supatas_intake
    ADD COLUMN especie_outro VARCHAR(100) NULL AFTER especie;

ALTER TABLE supatas_intake
    ADD COLUMN sexo ENUM('macho', 'femea') NULL AFTER especie_outro;

ALTER TABLE supatas_intake
    ADD COLUMN nome_animal VARCHAR(100) NULL AFTER sexo;

ALTER TABLE supatas_intake
    ADD COLUMN recebido_por VARCHAR(150) NULL AFTER relatorio;

ALTER TABLE supatas_intake
    ADD COLUMN data_recebimento DATE NULL AFTER recebido_por;
