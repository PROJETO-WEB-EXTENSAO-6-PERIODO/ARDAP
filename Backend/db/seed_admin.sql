-- SO PARA DESENVOLVIMENTO: esta senha e publica no repositorio.
-- No banco da ONG use: python -m app.scripts.criar_admin
USE ardap;

INSERT INTO users (first_name, second_name, email, password, role)
VALUES ('Admin', 'ARDAP', 'admin@ardap.org', '$2y$12$4qTOQ6devEDVxcZ2TuBr7eEzo5IdZQAD.Yli79k0sdPQkm30qoqOC', 'admin');
