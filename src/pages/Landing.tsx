import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, Link as LinkIcon, ArrowRight } from 'lucide-react';

export default function Landing() {
  const { user, profile, login, authError } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!user) {
      await login();
    }
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="bg-emerald-100 p-4 rounded-full">
            <Stethoscope className="w-12 h-12 text-emerald-600" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
          MedLinks
        </h1>
        <p className="text-lg text-slate-600">
          Organize e compartilhe seus drives e materiais de medicina com seus colegas de faculdade.
        </p>

        <div className="pt-8 space-y-4">
          {authError && (
            <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
              {authError}
            </div>
          )}
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            {user ? 'Acessar Painel Admin' : 'Entrar com Google'}
            <ArrowRight className="w-5 h-5" />
          </button>
          
          {user && (
            <Link
              to={`/${profile?.username || user.uid}`}
              className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-xl font-medium transition-colors"
            >
              <LinkIcon className="w-5 h-5" />
              Ver minha página pública
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
