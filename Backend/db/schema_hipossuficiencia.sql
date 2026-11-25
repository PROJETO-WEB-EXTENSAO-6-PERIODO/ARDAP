USE ardap;

CREATE TABLE IF NOT EXISTS hipossuficiencia (
    id INT AUTO_INCREMENT PRIMARY KEY,

    nome_representante VARCHAR(150) NOT NULL,
    documento_representante VARCHAR(50),
    tipo_documento_representante VARCHAR(50),
    email_representante VARCHAR(150),

    nome_imigrante VARCHAR(150) NOT NULL,
    documento_imigrante VARCHAR(50),
    tipo_documento_imigrante VARCHAR(50),
    email_imigrante VARCHAR(150),

    nao_possui_trabalho_remunerado BOOLEAN NOT NULL DEFAULT FALSE,
    nao_possui_renda BOOLEAN NOT NULL DEFAULT FALSE,
    renda_ate_meio_salario_per_capita BOOLEAN NOT NULL DEFAULT FALSE,
    outro_motivo TEXT,

    local_declaracao VARCHAR(100),
    data_declaracao DATE,

    assinatura_representante TEXT,

    anexo_documentos TEXT,                   -- legado: so os nomes dos arquivos

    funcionario_id INT,
    alterado_por_id INT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (funcionario_id) REFERENCES users(id),
    FOREIGN KEY (alterado_por_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS hipossuficiencia_anexos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hipossuficiencia_id INT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    path VARCHAR(255) NOT NULL,              -- chave no armazenamento
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (hipossuficiencia_id) REFERENCES hipossuficiencia(id)
);
