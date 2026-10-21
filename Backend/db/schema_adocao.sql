USE ardap;

CREATE TABLE IF NOT EXISTS questionario_adocao (
    id INT AUTO_INCREMENT PRIMARY KEY,

    animal_id INT,
    funcionario_id INT,

    especie_adocao ENUM('canino', 'felino') NOT NULL,
    nome_adotante VARCHAR(150) NOT NULL,
    endereco_adotante VARCHAR(255) NOT NULL,

    outros_animais BOOLEAN NOT NULL DEFAULT FALSE,
    quantos_animais INT,
    espaco_casa BOOLEAN NOT NULL DEFAULT FALSE,
    casa_murada BOOLEAN NOT NULL DEFAULT FALSE,
    espaco_coberto_quintal BOOLEAN NOT NULL DEFAULT FALSE,
    mora_aluguel BOOLEAN NOT NULL DEFAULT FALSE,
    proprietario_permite_animais BOOLEAN,
    viajar_quem_cuidara VARCHAR(255),
    familia_sabe_adocao BOOLEAN NOT NULL DEFAULT FALSE,
    alguem_alergia BOOLEAN NOT NULL DEFAULT FALSE,
    alimentacao VARCHAR(255),
    acesso_rua BOOLEAN NOT NULL DEFAULT FALSE,
    ciencia_vacinacao BOOLEAN NOT NULL DEFAULT FALSE,

    aceite_declaracao BOOLEAN NOT NULL DEFAULT FALSE,
    assinatura_adotante TEXT,
    local_assinatura VARCHAR(100),
    data_assinatura DATE,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (animal_id) REFERENCES animais(id),
    FOREIGN KEY (funcionario_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS termo_adocao (
    questionario_adocao_id INT NOT NULL PRIMARY KEY,

    animal_id INT,
    funcionario_id INT,

    local_termo VARCHAR(100),
    data_termo DATE,

    nome_adotante VARCHAR(150) NOT NULL,
    rg VARCHAR(30),
    cpf VARCHAR(20),
    endereco_residencial VARCHAR(255),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    cep VARCHAR(12),
    instagram VARCHAR(100),
    profissao VARCHAR(100),
    telefone VARCHAR(20),
    whatsapp VARCHAR(20),

    nome_animal VARCHAR(100),
    especie ENUM('cao', 'gato'),
    sexo ENUM('macho', 'femea'),
    idade VARCHAR(50),
    raca VARCHAR(100),
    srd BOOLEAN NOT NULL DEFAULT FALSE,
    onde_resgatou_tutor VARCHAR(255),
    cor_pelo VARCHAR(100),
    porte ENUM('pequeno', 'medio', 'grande'),
    peso DECIMAL(5,2),
    castrado BOOLEAN,
    vermifugado_3meses ENUM('sim', 'nao', 'sem_informacao'),
    vacinado ENUM('sim', 'nao', 'sem_informacao'),
    vacinas_recebidas VARCHAR(255),
    medicamento_diario BOOLEAN NOT NULL DEFAULT FALSE,
    mais_animais_em_casa BOOLEAN NOT NULL DEFAULT FALSE,
    quantos_mais_animais INT,
    endereco_ficara_animal ENUM('mesmo', 'outro') NOT NULL DEFAULT 'mesmo',
    endereco_ficara_animal_outro VARCHAR(255),
    local_na_casa VARCHAR(255),

    aceite_termo BOOLEAN NOT NULL DEFAULT FALSE,
    assinatura_adotante TEXT,
    assinatura_ardap TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (questionario_adocao_id) REFERENCES questionario_adocao(id),
    FOREIGN KEY (animal_id) REFERENCES animais(id),
    FOREIGN KEY (funcionario_id) REFERENCES users(id)
);
