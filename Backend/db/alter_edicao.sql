USE ardap;

-- Edicao de registros: quem alterou por ultimo.
ALTER TABLE animais
    ADD COLUMN alterado_por_id INT NULL,
    ADD FOREIGN KEY (alterado_por_id) REFERENCES users(id);

ALTER TABLE supatas_intake
    ADD COLUMN alterado_por_id INT NULL,
    ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ADD FOREIGN KEY (alterado_por_id) REFERENCES users(id);

ALTER TABLE termo_adocao
    ADD COLUMN alterado_por_id INT NULL,
    ADD FOREIGN KEY (alterado_por_id) REFERENCES users(id);

ALTER TABLE castracao
    ADD COLUMN alterado_por_id INT NULL,
    ADD FOREIGN KEY (alterado_por_id) REFERENCES users(id);

ALTER TABLE cirurgia
    ADD COLUMN alterado_por_id INT NULL,
    ADD FOREIGN KEY (alterado_por_id) REFERENCES users(id);

ALTER TABLE hipossuficiencia
    ADD COLUMN alterado_por_id INT NULL,
    ADD FOREIGN KEY (alterado_por_id) REFERENCES users(id);

ALTER TABLE eutanasia
    ADD COLUMN alterado_por_id INT NULL,
    ADD FOREIGN KEY (alterado_por_id) REFERENCES users(id);
