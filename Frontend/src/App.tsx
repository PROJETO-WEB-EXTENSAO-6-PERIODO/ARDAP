import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Animais } from "./pages/Animais";
import { AnimalDetalhes } from "./pages/AnimalDetalhes";
import { Castracao } from "./pages/Castracao";
import { Cirurgia } from "./pages/Cirurgia";
import { Eutanasia } from "./pages/Eutanasia";
import { Hipossuficiencia } from "./pages/Hipossuficiencia";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Relatorios } from "./pages/Relatorios";
import { NovoUsuario } from "./pages/NovoUsuario";
import { Supatas } from "./pages/Supatas";
import { Adocao } from "./pages/Adocao";

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
                <Eutanasia />
              </ProtectedRoute>
            }
          />
          <Route
            path="/usuarios/novo"
            element={
              <ProtectedRoute role="admin">
                <NovoUsuario />
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
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
