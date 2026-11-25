import { Fragment } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Animais } from "./pages/Animais";
import { AnimaisCadastrados } from "./pages/AnimaisCadastrados";
import { AnimalDetalhes } from "./pages/AnimalDetalhes";
import { Castracao } from "./pages/Castracao";
import { Cirurgia } from "./pages/Cirurgia";
import { Eutanasia } from "./pages/Eutanasia";
import { Hipossuficiencia } from "./pages/Hipossuficiencia";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Modulos } from "./pages/Modulos";
import { Relatorios } from "./pages/Relatorios";
import { UsuarioForm } from "./pages/UsuarioForm";
import { Usuarios } from "./pages/Usuarios";
import { Supatas } from "./pages/Supatas";
import { ListaRegistros } from "./pages/ListaRegistros";
import { RegistroDetalhes } from "./pages/RegistroDetalhes";
import { MODULOS_REGISTRO } from "./services/registros";
import { Adocao } from "./pages/Adocao";
import { AdocaoDetalhes } from "./pages/AdocaoDetalhes";
import { AdocoesRegistradas } from "./pages/AdocoesRegistradas";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/animais"
            element={
              <ProtectedRoute>
                <Animais key="novo" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/animais/cadastrados"
            element={
              <ProtectedRoute>
                <AnimaisCadastrados />
              </ProtectedRoute>
            }
          />
          <Route
            path="/animais/:id"
            element={
              <ProtectedRoute>
                <AnimalDetalhes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/castracoes"
            element={
              <ProtectedRoute>
                <Castracao key="novo" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cirurgias"
            element={
              <ProtectedRoute>
                <Cirurgia key="novo" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hipossuficiencias"
            element={
              <ProtectedRoute>
                <Hipossuficiencia key="novo" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/modulos"
            element={
              <ProtectedRoute>
                <Modulos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/relatorios"
            element={
              <ProtectedRoute>
                <Relatorios />
              </ProtectedRoute>
            }
          />
          <Route
            path="/eutanasias"
            element={
              <ProtectedRoute>
                <Eutanasia key="novo" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/usuarios"
            element={
              <ProtectedRoute role="admin">
                <Usuarios />
              </ProtectedRoute>
            }
          />
          <Route
            path="/usuarios/novo"
            element={
              <ProtectedRoute role="admin">
                <UsuarioForm key="novo" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/usuarios/:id/editar"
            element={
              <ProtectedRoute role="admin">
                <UsuarioForm key="editar" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supatas"
            element={
              <ProtectedRoute>
                <Supatas key="novo" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/adocoes"
            element={
              <ProtectedRoute>
                <Adocao key="novo" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/adocoes/registradas"
            element={
              <ProtectedRoute>
                <AdocoesRegistradas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/adocoes/:id"
            element={
              <ProtectedRoute>
                <AdocaoDetalhes />
              </ProtectedRoute>
            }
          />
          {MODULOS_REGISTRO.map((modulo) => (
            <Fragment key={modulo.rota}>
              <Route
                path={`/${modulo.rota}/registros`}
                element={
                  <ProtectedRoute>
                    <ListaRegistros key={modulo.rota} modulo={modulo} />
                  </ProtectedRoute>
                }
              />
              <Route
                path={`/${modulo.rota}/:id`}
                element={
                  <ProtectedRoute>
                    <RegistroDetalhes key={modulo.rota} modulo={modulo} />
                  </ProtectedRoute>
                }
              />
            </Fragment>
          ))}
          <Route
            path="/animais/:id/editar"
            element={
              <ProtectedRoute>
                <Animais key="editar" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supatas/:id/editar"
            element={
              <ProtectedRoute>
                <Supatas key="editar" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/castracoes/:id/editar"
            element={
              <ProtectedRoute>
                <Castracao key="editar" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cirurgias/:id/editar"
            element={
              <ProtectedRoute>
                <Cirurgia key="editar" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/adocoes/:id/editar"
            element={
              <ProtectedRoute>
                <Adocao key="editar" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hipossuficiencias/:id/editar"
            element={
              <ProtectedRoute>
                <Hipossuficiencia key="editar" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/eutanasias/:id/editar"
            element={
              <ProtectedRoute>
                <Eutanasia key="editar" />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
