import { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  email: string;
  role: 'user' | 'manager' | 'admin';
  name: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo credentials
const VALID_CREDENTIALS = [
  {
    email: 'usuario@interbantu.com',
    password: 'usuario2024',
    role: 'user' as const,
    name: 'Usuário'
  },
  {
    email: 'gestor@interbantu.com',
    password: 'gestor2024',
    role: 'manager' as const,
    name: 'Gestor'
  },
  {
    email: 'admin@interbantu.com',
    password: 'admin2024',
    role: 'admin' as const,
    name: 'Administrador'
  }
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, password: string) => {
    console.log('Tentando login com:', email);
    
    const validUser = VALID_CREDENTIALS.find(
      cred => cred.email === email && cred.password === password
    );
    
    if (validUser) {
      const userData = {
        email: validUser.email,
        role: validUser.role,
        name: validUser.name
      };
      
      setIsAuthenticated(true);
      setUser(userData);
      console.log('Login bem-sucedido para:', userData.role);
      return true;
    }
    
    console.log('Login falhou - credenciais inválidas');
    return false;
  };

  const logout = () => {
    console.log('Fazendo logout');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user,
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}