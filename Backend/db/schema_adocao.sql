USE ardap;

-- ============================================================
-- Schema unificado de ADOCAO (merge de questionario_adocao + termo_adocao)
-- Fonte de verdade: formulario impresso "Questionario/Termo de Adocao Responsavel"
-- (PDF "Rony,canino.pdf"). A tabela anterior tinha duas tabelas ligadas por
-- questionario_adocao_id (1:1); agora e uma unica tabela, sem dependencia por ID.
-- Campos presentes no banco mas ausentes no formulario foram removidos
-- (ver Docs/comparacao-campos-adocao.md).
-- ============================================================

CREATE TABLE IF NOT EXISTS termo_adocao (
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- Vinculos
    animal_id INT,
    funcionario_id INT,

    -- Dados do adotante (Termo, p.2 + Questionario, p.1)
    nome_adotante VARCHAR(150) NOT NULL,
    rg VARCHAR(30),
    cpf VARCHAR(20),
    endereco_residencial VARCHAR(255) NOT NULL,
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    cep VARCHAR(12),
    telefone VARCHAR(20),
    instagram VARCHAR(100),

    -- Dados do animal (Termo, p.2)
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
    medicamento_diario BOOLEAN NOT NULL DEFAULT FALSE,
    mais_animais_em_casa BOOLEAN NOT NULL DEFAULT FALSE,
    quantos_mais_animais INT,
    endereco_ficara_animal ENUM('mesmo', 'outro') NOT NULL DEFAULT 'mesmo',
    endereco_ficara_animal_outro VARCHAR(255),
    local_na_casa VARCHAR(255),

    -- Questionario de adocao (p.1)
    especie_adocao ENUM('canino', 'felino') NOT NULL,
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
    aceite_termo BOOLEAN NOT NULL DEFAULT FALSE,

    -- Assinatura / local / data (p.1 e p.2)
    assinatura_adotante TEXT,
    assinatura_ardap TEXT,
    local_assinatura VARCHAR(100),
    data_assinatura DATE,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (animal_id) REFERENCES animais(id),
    FOREIGN KEY (funcionario_id) REFERENCES users(id)
);
