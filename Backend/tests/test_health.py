"""Rota de saude usada pelo monitor que mantem a API acordada."""


def test_health_get(cliente_sem_login):
    r = cliente_sem_login.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_health_head(cliente_sem_login):
    assert cliente_sem_login.head("/health").status_code == 200
