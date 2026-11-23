USE ardap;

CREATE TABLE IF NOT EXISTS eutanasia (
    id INT AUTO_INCREMENT PRIMARY KEY,

    animal_id INT,
    funcionario_id INT,

    nome_animal VARCHAR(100),
    especie VARCHAR(50),
    raca VARCHAR(100),
    sexo ENUM('macho', 'femea'),
    idade VARCHAR(50),
    pelagem VARCHAR(100),
    crmv_veterinario VARCHAR(30),

    nome_responsavel VARCHAR(150) NOT NULL,
    rg VARCHAR(30),
    cpf VARCHAR(20),
    endereco VARCHAR(255),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    telefone_email VARCHAR(150),

    declaracao_aceite BOOLEAN NOT NULL DEFAULT FALSE,
    local_declaracao VARCHAR(100),
    data_declaracao DATE,
    assinatura_responsavel TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (animal_id) REFERENCES animais(id),
    FOREIGN KEY (funcionario_id) REFERENCES users(id)
);
