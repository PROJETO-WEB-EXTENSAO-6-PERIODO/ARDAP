# API ARDAP — contrato para o Frontend

> Documento gerado pela equipe de backend (issue **#FEATURE0002/fluxo-login-logout**).
> Tudo aqui foi validado pelos testes em `Backend/tests/`.

**Base URL (dev):** `http://localhost:8000`
**Documentação interativa:** <http://localhost:8000/docs> (Swagger — gerado pelo FastAPI)

> **CORS:** o backend já está liberado para `http://localhost:5173`. Se o Vite
> rodar nessa porta, pode chamar direto. Se preferir esconder a porta da API
> atrás de um proxy do Vite (`server.proxy`), é só configurar do lado do front —
> não muda nada aqui.

---

## 1. Como autenticar

O login devolve um **JWT** (padrão da issue #9, validade **60 minutos**).
A partir daí, **toda** requisição protegida leva o token no header:

```
Authorization: Bearer <access_token>
```

Sem esse header → `401`. Header malformado, token expirado, token forjado ou
token revogado por logout → `401` (o corpo muda, ver §5).

### Sobre onde guardar o token — **decisão pendente do time**

| Opção | Como fazer | Risco |
|---|---|---|
| **(a) `localStorage`** | `localStorage.setItem('token', t)` | Uma única falha de XSS no navegador lê o token e assume a sessão. Simples de implementar. |
| **(b) `sessionStorage`** | `sessionStorage.setItem('token', t)` | Mesmo risco da (a), mas some ao fechar a aba. |
| **(c) Cookie `HttpOnly`** | backend passa a setar cookie, front só usa `credentials: 'include'` | Requer mudança no backend — **fora do escopo atual** (decisão: manter Bearer). |

**Recomendação da equipe de backend:** enquanto o frontend não existir, registrar
essa decisão numa issue. Se for (a) ou (b), vale tratar do **RNF03/LGPD**: as
telas carregam CPF e RG de adotantes, então o custo de uma XSS é alto.

---

## 2. `POST /auth/login` — RF01

**Request**

```http
POST /auth/login
Content-Type: application/json

{ "email": "admin@ardap.org", "password": "ardap@123" }
```

**Response `200 OK`**

```json
{ "access_token": "eyJhbGciOiJIUzI1NiIs...", "token_type": "bearer" }
```

**Response `401 Unauthorized`**

```json
{ "detail": "E-mail ou senha invalidos" }
```

### O que o frontend precisa saber

1. **A mensagem é única.** E-mail inexistente e senha errada devolvem **exatamente**
   o mesmo `401` — o sistema não pode dizer quem tem cadastro (issue #9).
2. **O tempo de resposta também é igual** nos dois casos (~225 ms com o
   `bcrypt.checkpw()` rodando sempre). Isso é garantia do backend; não precisa
   compensar nada no front.
3. `422` = corpo fora do contrato (JSON malformado, campo faltando).

### Exemplo (curl)

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ardap.org","password":"ardap@123"}'
```

---

## 3. `POST /auth/logout` — RF01

Encerra a sessão **revogando o token atual** no servidor.

```http
POST /auth/logout
Authorization: Bearer <access_token>
```

**Response `200 OK`**

```json
{ "msg": "Sessao encerrada" }
```

**Response `401 Unauthorized`** — token ausente, inválido, expirado **ou já revogado**.

### Fluxo que o frontend deve seguir

```js
const API = 'http://localhost:8000';

async function logout(token) {
  await fetch(`${API}/auth/logout`, {           // 401 aqui NAO e um erro fatal
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {});
  localStorage.removeItem('token');             // limpa o estado local
  navegarPara('/login');                        // volta para a tela de login
}
```

> Se o token já expirou, o `POST /auth/logout` devolve `401`. Para o cliente
> isso significa a mesma coisa: **já está deslogado** — limpe e siga.

### Limites da revogação (importante para a apresentação)

O token é revogado em **memória, por processo**:

- com `uvicorn --workers N`, um worker **não enxerga** o logout feito em outro;
- se o servidor reiniciar, a lista esvazia e o token volta a valer até o `exp`
  (no máximo **60 minutos**).

Para o cenário atual (ONG, ~4 usuários internos, `uvicorn` de um worker) é
suficiente. Se um dia escalar, a alternativa é persistir a revogação no MySQL
(ou trocar para cookie `HttpOnly`, onde o logout apaga o cookie de verdade).

---

## 4. `GET /users/me` — consultar a sessão

Útil para **restaurar a tela** quando o usuário recarrega a página: o token ainda
está guardado, então chame este endpoint em vez de pedir login de novo.

```http
GET /users/me
Authorization: Bearer <access_token>
```

**Response `200 OK`**

```json
{ "id": 1, "email": "admin@ardap.org", "role": "admin" }
```

`role` ∈ `"admin"` | `"funcionario"` — é ele que o frontend usa para esconder
links/botões (ver §6).

---

## 5. Tabela de erros

| Status | `detail` | Quando |
|---|---|---|
| `401` | `E-mail ou senha invalidos` | login com credencial errada |
| `401` | `Token ausente` | header `Authorization` ausente |
| `401` | `Token invalido` | assinatura errada ou token expirado |
| `401` | `Sessao encerrada` | token revogado por logout |
| `403` | `Acesso de admin` | usuário logado, mas sem papel `admin` |
| `422` | *(lista de campos)* | corpo fora do contrato Pydantic |

> Regra prática para o frontend: **`401` ⇒ limpar sessão e mandar para `/login`**.
> **`403` ⇒ mostrar "acesso restrito"** (mantém o usuário logado).

---

## 6. RF12 — a autorização acontece no backend

O FastAPI expõe a dependência `require_admin`, que devolve `403` para quem não
for `admin`. Ela **roda no servidor**.

⚠️ **Hoje nenhum endpoint público a utiliza** — porque ainda não existe
gestão de usuários (RF02) nem as telas internas. Ou seja:

- o frontend **pode** esconder links por `role` para não mostrar o que o usuário
  não usa, mas isso é **conforto de uso, não segurança**;
- na hora de criar o primeiro endpoint restrito, ele **tem** que declarar
  `Depends(require_admin)` — é aí que o RF12 passa a valer.

---

## 7. Credenciais de desenvolvimento

| Campo | Valor |
|---|---|
| e-mail | `admin@ardap.org` |
| senha | `ardap@123` |
| papel | `admin` |

> Vem de `Backend/db/seed_admin.sql`. É credencial de **desenvolvimento** —
> troque antes de qualquer coisa ir para produção.

---

## 8. Checklist de integração (sugestão de teste manual)

- [ ] Login com credenciais corretas → cai na Home
- [ ] Login com senha errada → aparece *"E-mail ou senha invalidos"*
- [ ] Login com e-mail que não existe → **mesma** mensagem
- [ ] Recarregar a página com token válido → `GET /users/me` restaura a tela
- [ ] Recarregar a página com token expirado → volta para o login
- [ ] Clicar em **Sair** → volta para o login e o token antigo **não** autentica mais
- [ ] Usuário `funcionario` não vê (e não alcança) rota administrativa
