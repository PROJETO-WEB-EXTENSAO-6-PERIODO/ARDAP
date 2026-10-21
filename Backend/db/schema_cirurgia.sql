USE ardap;

CREATE TABLE IF NOT EXISTS cirurgia (
    id INT AUTO_INCREMENT PRIMARY KEY,

    animal_id INT,
    funcionario_id INT,

    proprietario_responsavel VARCHAR(150) NOT NULL,
    cpf_cnpj VARCHAR(20),
    endereco VARCHAR(255),
    numero VARCHAR(10),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    ba_telefones VARCHAR(50),
    email VARCHAR(150),

    nome_animal VARCHAR(100),
    idade_real VARCHAR(50),
    especie VARCHAR(50),
    raca VARCHAR(100),
    pelagem VARCHAR(100),
    sexo ENUM('macho', 'femea'),

    procedimento VARCHAR(255),

    assinatura_responsavel TEXT,
    local_assinatura VARCHAR(100),
    data_assinatura DATE,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (animal_id) REFERENCES animais(id),
    FOREIGN KEY (funcionario_id) REFERENCES users(id)
);
