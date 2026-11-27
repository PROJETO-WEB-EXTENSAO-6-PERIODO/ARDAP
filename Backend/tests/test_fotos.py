"""Fotos dos animais: versoes reduzidas, links assinados e limpeza."""

import base64
import io
import time

import pytest
from PIL import Image
from sqlalchemy.orm import sessionmaker

from app.core import armazenamento, miniaturas
from app.models.animal import Animal


def _jpeg(largura: int = 3000, altura: int = 2000, orientacao: int | None = None) -> bytes:
    imagem = Image.new("RGB", (largura, altura), (200, 120, 40))
    saida = io.BytesIO()
    exif = Image.Exif()
    if orientacao:
        exif[0x0112] = orientacao
    imagem.save(saida, "JPEG", quality=95, exif=exif.tobytes())
    return saida.getvalue()


def _tamanho(conteudo: bytes) -> tuple[int, int]:
    with Image.open(io.BytesIO(conteudo)) as imagem:
        return imagem.size


@pytest.fixture(autouse=True)
def pasta_temporaria(tmp_path, monkeypatch):
    monkeypatch.setattr(armazenamento, "UPLOADS_DIR", tmp_path)
    armazenamento._urls.clear()
    yield tmp_path
    armazenamento._urls.clear()


def _cadastrar(cliente, foto: bytes) -> dict:
    r = cliente.post("/animais", json={
        "nome": "Rex", "especie": "cao", "sexo": "macho",
        "foto": base64.b64encode(foto).decode(),
    })
    assert r.status_code == 201, r.text
    return r.json()


def test_variantes_reduzem_tamanho_e_peso():
    original = _jpeg()
    variantes = armazenamento.gerar_variantes(original)
    assert max(_tamanho(variantes["mini"])) == 320
    assert max(_tamanho(variantes["media"])) == 1024
    assert len(variantes["mini"]) < len(original) / 10


def test_variante_respeita_rotacao_do_celular():
    # orientacao 6: a foto foi tirada com o celular em pe
    variantes = armazenamento.gerar_variantes(_jpeg(3000, 2000, orientacao=6))
    largura, altura = _tamanho(variantes["mini"])
    assert altura > largura


def test_imagem_corrompida_e_recusada():
    with pytest.raises(armazenamento.ImagemInvalida):
        armazenamento.gerar_variantes(b"\xff\xd8\xff" + b"lixo" * 100)


def test_upload_corrompido_responde_415(cliente):
    r = cliente.post("/animais", json={
        "especie": "cao", "sexo": "macho",
        "foto": base64.b64encode(b"\xff\xd8\xff" + b"lixo" * 100).decode(),
    })
    assert r.status_code == 415
    assert "Não foi possível ler a foto" in r.json()["detail"]


def test_cadastro_grava_versoes_e_devolve_links(cliente, pasta_temporaria):
    animal = _cadastrar(cliente, _jpeg())
    arquivos = sorted(p.name for p in (pasta_temporaria / "animais").iterdir())
    assert len(arquivos) == 3
    assert any(n.endswith("_mini.webp") for n in arquivos)
    assert any(n.endswith("_media.webp") for n in arquivos)
    assert animal["foto_mini_url"].startswith("/arquivos/animais/")
    assert "_media.webp" in animal["foto_url"]


def test_link_assinado_abre_sem_login(cliente, cliente_sem_login):
    url = _cadastrar(cliente, _jpeg())["foto_mini_url"]
    r = cliente_sem_login.get(url)
    assert r.status_code == 200
    assert r.headers["content-type"] == "image/webp"
    assert "immutable" in r.headers["cache-control"]


def test_link_adulterado_ou_vencido_e_recusado(cliente):
    url = _cadastrar(cliente, _jpeg())["foto_mini_url"]
    assert cliente.get(url[:-4] + "0000").status_code == 403
    chave = url.split("?")[0].removeprefix("/arquivos/")
    vencido = int(time.time()) - 10
    assinatura = armazenamento._assinatura(chave, vencido)
    r = cliente.get(f"/arquivos/{chave}?expira={vencido}&assinatura={assinatura}")
    assert r.status_code == 403


def test_link_e_reaproveitado_para_o_cache_do_navegador():
    assert armazenamento.url_assinada("animais/a_mini.webp") == armazenamento.url_assinada(
        "animais/a_mini.webp"
    )


def test_listagem_traz_links(cliente):
    _cadastrar(cliente, _jpeg())
    animal = cliente.get("/animais").json()[0]
    assert animal["foto_mini_url"] and animal["foto_url"]


def test_trocar_e_excluir_apagam_as_versoes(cliente, pasta_temporaria):
    animal = _cadastrar(cliente, _jpeg())
    pasta = pasta_temporaria / "animais"
    r = cliente.put(f"/animais/{animal['id']}", json={
        "especie": "cao", "sexo": "macho",
        "foto": base64.b64encode(_jpeg(800, 600)).decode(),
    })
    assert r.status_code == 200
    assert len(list(pasta.iterdir())) == 3  # so as da foto nova
    assert cliente.delete(f"/animais/{animal['id']}").status_code == 204
    assert list(pasta.iterdir()) == []


def test_gera_versoes_das_fotos_antigas(db, monkeypatch):
    chave = armazenamento.salvar("animais", _jpeg(), ".jpg")  # sem versoes
    db.add(Animal(especie="gato", sexo="femea", foto_path=chave))
    db.commit()
    monkeypatch.setattr(miniaturas, "SessionLocal", sessionmaker(bind=db.get_bind()))

    assert miniaturas.gerar_faltantes() == {"geradas": 1, "puladas": 0, "erros": 0}
    assert armazenamento.existe(armazenamento.chave_variante(chave, "mini"))
    # rodar de novo nao refaz nada
    assert miniaturas.gerar_faltantes() == {"geradas": 0, "puladas": 1, "erros": 0}
