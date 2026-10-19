CREATE DATABASE IF NOT EXISTS ardap;
USE ardap;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    second_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,          -- sempre hash bcrypt, nunca texto puro
    role ENUM('admin', 'funcionario') NOT NULL DEFAULT 'funcionario',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS animais (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100),
    especie VARCHAR(50) NOT NULL,
    raca VARCHAR(100),
    sexo ENUM('macho', 'femea') NOT NULL,
    data_nascimento_estimada DATE,
    idade_estimada INT,
    porte ENUM('pequeno', 'medio', 'grande'),
    cor_pelo VARCHAR(100),
    peso DECIMAL(5,2),
    castrado BOOLEAN DEFAULT FALSE,
    vermifugado BOOLEAN DEFAULT FALSE,
    vacinado BOOLEAN DEFAULT FALSE,
    temperamento ENUM('docil', 'medroso', 'arisco', 'agressivo', 'desconhecido') DEFAULT 'desconhecido',
    medicacao_necessaria BOOLEAN DEFAULT FALSE,
    medicacao_desc TEXT,
    origem_resgate VARCHAR(255),
    observacoes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS supatas_intake (
    id INT AUTO_INCREMENT PRIMARY KEY,
    animal_id INT NOT NULL,
    funcionario_id INT NOT NULL,
    orgao_solicitante VARCHAR(150),
    nome_responsavel_encaminhamento VARCHAR(150),
    data_encaminhamento DATE,
    situacao_animal ENUM('acidentado', 'doente', 'castracao', 'outros'),
    situacao_animal_outros_desc VARCHAR(255),
    local_recolhimento VARCHAR(255),
    nome_resgatista VARCHAR(150),
    relatorio TEXT,
    cpf_responsavel_supatas VARCHAR(20),
    assinatura_responsavel_supatas LONGTEXT,
    assinatura_recebimento_ardap LONGTEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animais(id),
    FOREIGN KEY (funcionario_id) REFERENCES users(id)
);

-- ---------------------------------------------------------------------------
-- Issues #DB0003 a #DB0007 (2026-10-15) - tabelas novas
--
-- ⚠️ #DB0003 (castracao), #DB0005 (cirurgia) e #DB0007 (eutanasia) tem os
--    campos A CONFIRMAR com a modelagem do draw.io, que ainda nao foi
--    compartilhada com o time de backend.
-- ⚠️ #DB0004 (adocao) traz os dados do adotante INLINE - o modelo original
--    previa uma tabela `adotantes` separada ligada 1:N.
-- ⚠️ #DB0006 (hipossuficiencia) esta autocontida; o modelo original a ligava
--    a `adotantes`.
-- Colunas de assinatura sao LONGTEXT: o base64 assinado passa de 64 KB.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS castracao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    animal_id INT NOT NULL,
    funcionario_id INT NOT NULL,
    data_castracao DATE,
    veterinario VARCHAR(150),
    local VARCHAR(255),
    observacoes TEXT,
    assinatura_responsavel LONGTEXT,
    assinatura_ardap LONGTEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animais(id),
    FOREIGN KEY (funcionario_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS adocao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    animal_id INT NOT NULL,
    funcionario_id INT NOT NULL,
    data_adocao DATE,
    nome_adotante VARCHAR(150) NOT NULL,
    rg_adotante VARCHAR(20),
    cpf_adotante VARCHAR(20),
    endereco_rua VARCHAR(200),
    endereco_bairro VARCHAR(100),
    endereco_cidade VARCHAR(100),
    endereco_cep VARCHAR(10),
    contato_telefone VARCHAR(30),
    contato_instagram VARCHAR(100),
    profissao VARCHAR(100),
    tem_outros_animais BOOLEAN,
    qtd_outros_animais INT,
    espaco_adequado BOOLEAN,
    casa_murada BOOLEAN,
    espaco_coberto_quintal BOOLEAN,
    mora_de_aluguel BOOLEAN,
    aluguel_permite_animais BOOLEAN,
    quem_fica_se_viajar VARCHAR(255),
    familia_sabe BOOLEAN,
    alergia_alguem BOOLEAN,
    alimentacao_oferecida VARCHAR(255),
    acesso_a_rua BOOLEAN,
    ciencia_vacinacao_periodica BOOLEAN,
    autoriza_uso_imagem BOOLEAN,
    assinatura_adotante LONGTEXT,
    assinatura_responsavel_ardap LONGTEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animais(id),
    FOREIGN KEY (funcionario_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS cirurgia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    animal_id INT NOT NULL,
    funcionario_id INT NOT NULL,
    tipo_cirurgia VARCHAR(150),
    data_cirurgia DATE,
    veterinario VARCHAR(150),
    local VARCHAR(255),
    observacoes TEXT,
    assinatura_responsavel LONGTEXT,
    assinatura_ardap LONGTEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animais(id),
    FOREIGN KEY (funcionario_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS hipossuficiencia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    funcionario_id INT NOT NULL,
    nome_declarante VARCHAR(150) NOT NULL,
    documento_declarante VARCHAR(30),
    email_declarante VARCHAR(150),
    motivo ENUM('sem_trabalho_remunerado','sem_renda','renda_ate_limite','outros'),
    motivo_outros_desc VARCHAR(255),
    local VARCHAR(255),
    data_declaracao DATE,
    assinatura LONGTEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (funcionario_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS eutanasia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    animal_id INT NOT NULL,
    funcionario_id INT NOT NULL,
    data_eutanasia DATE,
    motivo TEXT,
    veterinario VARCHAR(150),
    local VARCHAR(255),
    assinatura_responsavel LONGTEXT,
    assinatura_ardap LONGTEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animais(id),
    FOREIGN KEY (funcionario_id) REFERENCES users(id)
);
