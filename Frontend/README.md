# Frontend

Site do ARDAP: React 19, TypeScript, Vite e Tailwind CSS.

A instalação completa está no [README principal](../README.md#como-rodar). Com a API
rodando:

```
npm install
npm run dev
```

| Comando | O que faz |
|---|---|
| `npm run dev` | Inicia em http://localhost:5173 |
| `npm run build` | Confere os tipos e gera `dist/` |
| `npm run lint` | Procura problemas no código |

`VITE_API_URL` define o endereço da API (vazio: `http://127.0.0.1:8000`). No Cloudflare é
obrigatória e deve usar `https://`.
