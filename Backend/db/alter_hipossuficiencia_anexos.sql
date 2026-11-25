USE ardap;

-- Documentos anexados as declaracoes de hipossuficiencia.
CREATE TABLE IF NOT EXISTS hipossuficiencia_anexos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hipossuficiencia_id INT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    path VARCHAR(255) NOT NULL,              -- chave no armazenamento
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (hipossuficiencia_id) REFERENCES hipossuficiencia(id)
);
