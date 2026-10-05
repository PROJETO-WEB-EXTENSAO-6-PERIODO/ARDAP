-- Usuario inicial de DESENVOLVIMENTO.
--
-- Senha: ardap@123
-- (hash bcrypt, rounds=12, gerado pelo proprio backend)
--
-- Em producao gere OUTRO hash e nao versione a senha real.
--
-- Repetivel: usa INSERT IGNORE, entao rodar duas vezes nao quebra.

USE ardap;

INSERT IGNORE INTO users (first_name, second_name, email, password, role)
VALUES ('Admin', 'ARDAP', 'admin@ardap.org',
        '$2b$12$5djeMAbBsUzrjmpyF.uxiO.TyNVk5x9cAXark5RLbbjcQffVwO9VO',
        'admin');
