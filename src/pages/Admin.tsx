import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Plus, Trash2, GripVertical, ExternalLink, LogOut, Save } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface LinkItem {
  id: string;
  title: string;
  url: string;
  order: number;
  isActive: boolean;
  createdAt: any;
}

export default function Admin() {
  const { user, profile, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [bio, setBio] = useState(profile?.bio || '');
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const q = query(collection(db, 'users', user.uid, 'links'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const linksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LinkItem[];
      setLinks(linksData);
    });

    return () => unsubscribe();
  }, [user, navigate]);

  useEffect(() => {
    if (profile) {
      setBio(profile.bio || '');
      setDisplayName(profile.displayName || '');
    }
  }, [profile]);

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTitle || !newUrl) return;

    try {
      await addDoc(collection(db, 'users', user.uid, 'links'), {
        title: newTitle,
        url: newUrl,
        order: links.length,
        isActive: true,
        createdAt: serverTimestamp()
      });
      setNewTitle('');
      setNewUrl('');
    } catch (error) {
      console.error('Error adding link:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'links', id));
    } catch (error) {
      console.error('Error deleting link:', error);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'links', id), {
        isActive: !currentStatus
      });
    } catch (error) {
      console.error('Error updating link:', error);
    }
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await updateProfile({ displayName, bio });
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (!user || !profile) return <div className="p-8 text-center">Carregando...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="font-bold text-xl text-slate-900">Painel Admin</h1>
          <div className="flex items-center gap-4">
            <Link
              to={`/${user.uid}`}
              target="_blank"
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Ver Página
            </Link>
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="p-2 text-slate-400 hover:text-red-600 transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Profile Section */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Perfil</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome de Exibição</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Biografia</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                placeholder="Ex: Estudante de Medicina - Turma 2026"
              />
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSavingProfile ? 'Salvando...' : 'Salvar Perfil'}
            </button>
          </div>
        </section>

        {/* Add Link Section */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Adicionar Novo Link</h2>
          <form onSubmit={handleAddLink} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Título (ex: Drive de Anatomia)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
              <input
                type="url"
                placeholder="URL (ex: https://drive.google.com/...)"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Adicionar Link
            </button>
          </form>
        </section>

        {/* Links List */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Seus Links</h2>
          
          {links.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
              <p className="text-slate-500">Nenhum link adicionado ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {links.map((link) => (
                <div key={link.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4 group">
                  <div className="cursor-grab text-slate-400 hover:text-slate-600">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-900 truncate">{link.title}</h3>
                    <p className="text-sm text-slate-500 truncate">{link.url}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={link.isActive}
                        onChange={() => toggleActive(link.id, link.isActive)}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                    
                    <button
                      onClick={() => handleDelete(link.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
