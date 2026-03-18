import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { ExternalLink, Stethoscope } from 'lucide-react';

interface UserProfile {
  username: string;
  displayName: string;
  bio?: string;
  photoURL?: string;
  theme?: string;
}

interface LinkItem {
  id: string;
  title: string;
  url: string;
  order: number;
  isActive: boolean;
}

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileAndLinks = async () => {
      if (!username) return;
      
      try {
        // Fetch profile
        const usersRef = collection(db, 'users');
        const qUser = query(usersRef, where('username', '==', username), limit(1));
        const userSnap = await getDocs(qUser);
        
        if (!userSnap.empty) {
          const userDoc = userSnap.docs[0];
          setProfile(userDoc.data() as UserProfile);
          const actualUserId = userDoc.id;
          
          // Fetch active links
          const q = query(
            collection(db, 'users', actualUserId, 'links'),
            where('isActive', '==', true),
            orderBy('order', 'asc')
          );
          
          const querySnapshot = await getDocs(q);
          const linksData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as LinkItem[];
          
          setLinks(linksData);
        } else {
          setError('Perfil não encontrado.');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Erro ao carregar o perfil.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndLinks();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-24 h-24 bg-slate-200 rounded-full mb-4"></div>
          <div className="w-48 h-6 bg-slate-200 rounded mb-2"></div>
          <div className="w-32 h-4 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <Stethoscope className="w-16 h-16 text-slate-300 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Ops!</h1>
        <p className="text-slate-600">{error || 'Perfil não encontrado.'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          {profile.photoURL ? (
            <img
              src={profile.photoURL}
              alt={profile.displayName}
              className="w-24 h-24 rounded-full mx-auto shadow-md border-4 border-white object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-24 h-24 rounded-full mx-auto bg-emerald-100 flex items-center justify-center shadow-md border-4 border-white">
              <Stethoscope className="w-10 h-10 text-emerald-600" />
            </div>
          )}
          
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{profile.displayName}</h1>
            {profile.bio && (
              <p className="mt-2 text-slate-600 max-w-sm mx-auto leading-relaxed">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Links */}
        <div className="space-y-4 pt-4">
          {links.length === 0 ? (
            <p className="text-center text-slate-500 italic">Nenhum link disponível no momento.</p>
          ) : (
            links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all duration-200 transform hover:-translate-y-1"
              >
                <span className="font-medium text-slate-800 group-hover:text-emerald-700 transition-colors">
                  {link.title}
                </span>
                <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
              </a>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-12 pb-8 text-center">
          <a href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors">
            <Stethoscope className="w-4 h-4" />
            Criado com MedLinks
          </a>
        </div>
      </div>
    </div>
  );
}
