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
    assinatura_responsavel_supatas TEXT,
    assinatura_recebimento_ardap TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (animal_id) REFERENCES animais(id),
    FOREIGN KEY (funcionario_id) REFERENCES users(id)
);
