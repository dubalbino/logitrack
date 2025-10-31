import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layout e Páginas
import Layout from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import ListaClientes from './pages/Clientes/ListaClientes';
import FormCliente from './pages/Clientes/FormCliente';
import ListaEntregadores from './pages/Entregadores/ListaEntregadores';
import FormEntregador from './pages/Entregadores/FormEntregador';
import ListaEntregas from './pages/Entregas/ListaEntregas';
import FormEntrega from './pages/Entregas/FormEntrega';
import PesquisaPedido from './pages/Pesquisa/PesquisaPedido';
import NotFound from './pages/NotFound';

function App() {
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <BrowserRouter>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Rotas protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="clientes" element={<ListaClientes />} />
              <Route path="clientes/novo" element={<FormCliente />} />
              <Route path="clientes/:id/editar" element={<FormCliente />} />
              <Route path="entregadores" element={<ListaEntregadores />} />
              <Route path="entregadores/novo" element={<FormEntregador />} />
              <Route path="entregadores/:id/editar" element={<FormEntregador />} />
              <Route path="entregas" element={<ListaEntregas />} />
              <Route path="entregas/novo" element={<FormEntrega />} />
              <Route path="entregas/:id/editar" element={<FormEntrega />} />
              <Route path="pesquisa" element={<PesquisaPedido />} />
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;