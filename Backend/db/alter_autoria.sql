USE ardap;

-- Autoria: quem cadastrou (funcionario_id) e quem alterou por ultimo.
ALTER TABLE animais
    ADD COLUMN funcionario_id INT NULL,
    ADD FOREIGN KEY (funcionario_id) REFERENCES users(id);

ALTER TABLE users
    ADD COLUMN funcionario_id INT NULL,
    ADD COLUMN alterado_por_id INT NULL,
    ADD FOREIGN KEY (funcionario_id) REFERENCES users(id),
    ADD FOREIGN KEY (alterado_por_id) REFERENCES users(id);
