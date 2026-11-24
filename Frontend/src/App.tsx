import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Animais } from "./pages/Animais";
import { Castracao } from "./pages/Castracao";
import { Cirurgia } from "./pages/Cirurgia";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
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
