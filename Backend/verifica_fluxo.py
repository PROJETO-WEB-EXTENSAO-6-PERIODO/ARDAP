"""Verificacao ao vivo do fluxo de login/logout contra a API rodando.

Uso (com a API em :8000):
    python verifica_fluxo.py

Diferente do pytest, isto passa por HTTP de verdade - util para demonstrar na
apresentacao. A suite definitiva continua sendo `pytest -v`.
"""
import statistics
import sys
import time

import httpx

B = "http://localhost:8000"
SENHA = "ardap@123"
ok = True


def check(cond, msg):
    global ok
    print(f"[{'OK ' if cond else 'FAIL'}] {msg}")
    ok = ok and cond


def mediana(email, senha, n=7):
    c = httpx.Client()
    ts, status = [], None
    c.post(B + "/auth/login", json={"email": email, "password": senha})
    for _ in range(n):
        t = time.perf_counter()
        r = c.post(B + "/auth/login", json={"email": email, "password": senha})
        ts.append((time.perf_counter() - t) * 1000)
        status = r.status_code
    return status, statistics.median(ts)


# espera a API subir
for _ in range(40):
    try:
        if httpx.get(B + "/health").status_code == 200:
            break
    except httpx.HTTPError:
        time.sleep(0.25)
else:
    sys.exit("API nao subiu")

print("== 1. Enumeracao por tempo de resposta ==")
s1, t1 = mediana("ninguem@ardap.org", "x")
s2, t2 = mediana("admin@ardap.org", "senha-errada")
print(f"    e-mail INEXISTENTE : {s1}  {t1:7.1f} ms")
print(f"    e-mail EXISTENTE   : {s2}  {t2:7.1f} ms")
check(abs(t2 - t1) < 40, f"tempos iguais (delta {abs(t2 - t1):.1f} ms) - bcrypt roda sempre")

print("\n== 2. Mensagem identica nos dois 401 ==")
c = httpx.Client()
a = c.post(B + "/auth/login", json={"email": "admin@ardap.org", "password": "errada"})
b = c.post(B + "/auth/login", json={"email": "ninguem@ardap.org", "password": "errada"})
check(a.status_code == b.status_code == 401, "ambos 401")
check(a.json() == b.json(), f"corpo identico: {a.json()['detail']!r}")

print("\n== 3. Login valido ==")
r = c.post(B + "/auth/login", json={"email": "admin@ardap.org", "password": SENHA})
check(r.status_code == 200, f"POST /auth/login -> {r.status_code}")
token = r.json().get("access_token", "")
check(r.json().get("token_type") == "bearer", "token_type=bearer (padrao da issue #9)")
h = {"Authorization": f"Bearer {token}"}

print("\n== 4. Sessao ==")
me = c.get(B + "/users/me", headers=h)
check(me.status_code == 200 and me.json()["role"] == "admin", f"/users/me -> {me.json()}")
check(c.get(B + "/users/me").status_code == 401, "sem token -> 401")
check(
    c.get(B + "/users/me", headers={"Authorization": "Bearer token-forjado"}).status_code == 401,
    "token forjado -> 401",
)

print("\n== 5. Logout revoga o token ==")
lg = c.post(B + "/auth/logout", headers=h)
check(lg.status_code == 200, f"POST /auth/logout -> {lg.status_code} {lg.json()}")
depois = c.get(B + "/users/me", headers=h)
check(depois.status_code == 401, "MESMO token depois do logout -> 401")
check(depois.json()["detail"] == "Sessao encerrada", f"motivo: {depois.json()['detail']!r}")

print("\n== 6. RF12 (require_admin roda no servidor) ==")
print("    coberto por test_rf12_restricao_de_papel_no_backend em pytest")

print("\nTUDO OK" if ok else "\nHOUVE FALHA")
sys.exit(0 if ok else 1)
