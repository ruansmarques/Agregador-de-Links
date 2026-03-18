import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

interface UserProfile {
  username: string;
  displayName: string;
  bio?: string;
  photoURL?: string;
  theme?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            // Create default profile
            let defaultUsername = currentUser.email?.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') || `user_${currentUser.uid.slice(0, 5)}`;
            if (defaultUsername.length < 3) defaultUsername = `user_${defaultUsername}`;
            if (defaultUsername.length > 30) defaultUsername = defaultUsername.slice(0, 30);

            const newProfile: UserProfile = {
              username: defaultUsername,
              displayName: (currentUser.displayName || 'New User').slice(0, 50),
              bio: 'Estudante de Medicina',
              theme: 'light',
            };
            
            if (currentUser.photoURL) {
              newProfile.photoURL = currentUser.photoURL;
            }

            await setDoc(docRef, newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          console.error('Error fetching/creating profile:', error);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.log('Login cancelado pelo usuário.');
      } else if (error.code === 'auth/unauthorized-domain') {
        setAuthError('Domínio não autorizado. Adicione bio.medferpa.com no Firebase Console > Authentication > Settings > Authorized domains.');
      } else {
        console.error('Login error:', error);
        setAuthError(error.message || 'Erro ao fazer login.');
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user || !profile) return;
    try {
      const updatedProfile = { ...profile, ...data };
      await setDoc(doc(db, 'users', user.uid), updatedProfile, { merge: true });
      setProfile(updatedProfile);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, authError, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
