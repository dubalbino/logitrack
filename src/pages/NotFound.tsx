import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100">
      <h1 className="text-6xl font-bold text-purple-600">404</h1>
      <p className="text-xl text-slate-700 mt-4">Página não encontrada</p>
      <Link to="/" className="mt-8 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition">
        Voltar para o Início
      </Link>
    </div>
  );
};

export default NotFound;
