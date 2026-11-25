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
                <Animais />
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
                <Castracao />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cirurgias"
            element={
              <ProtectedRoute>
                <Cirurgia />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hipossuficiencias"
            element={
              <ProtectedRoute>
                <Hipossuficiencia />
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
          <Route path="/relatorios" element={<Navigate to="/home" replace />} />
          <Route
            path="/eutanasias"
            element={
              <ProtectedRoute>
                <Eutanasia />
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
                <Supatas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/adocoes"
            element={
              <ProtectedRoute>
                <Adocao />
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
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
