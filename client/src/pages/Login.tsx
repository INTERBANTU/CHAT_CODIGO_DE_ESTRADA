import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Lock, Eye, EyeOff, GraduationCap, Shield, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState<'user' | 'manager' | 'admin'>('user');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);
    
    // Simular um pequeno delay para melhor UX
    setTimeout(() => {
      const success = login(email, password);
      
      if (success) {
        toast.success('Login realizado com sucesso!');
        // Navegar diretamente baseado no tipo de usuário
        const userType = email.includes('usuario') ? 'user' : 
                        email.includes('gestor') ? 'manager' : 'admin';
        
        setTimeout(() => {
          if (userType === 'user') {
            navigate('/assistente');
          } else if (userType === 'manager') {
            navigate('/gestor');
          } else {
            navigate('/admin');
          }
        }, 500);
      } else {
        toast.error('Email ou senha incorretos');
        setIsLoading(false);
      }
    }, 800);
  };

  const userTypes = [
    {
      type: 'user' as const,
      icon: GraduationCap,
      title: 'Usuário',
      description: 'Acesso ao assistente virtual',
      credentials: 'usuario@codigoestrada.mz',
      bgGradient: 'custom-gradient-1'
    },
    {
      type: 'manager' as const,
      icon: Shield,
      title: 'Gestor',
      description: 'Gestão da base de conhecimento',
      credentials: 'gestor@codigoestrada.mz',
      bgGradient: 'custom-gradient-2'
    },
    {
      type: 'admin' as const,
      icon: Settings,
      title: 'Administrador',
      description: 'Gestão de contas e sistema',
      credentials: 'admin@codigoestrada.mz',
      bgGradient: 'custom-gradient-3'
    }
  ];

  const handleUserTypeSelect = (type: 'user' | 'manager' | 'admin') => {
    setSelectedUserType(type);
    const userType = userTypes.find(u => u.type === type);
    if (userType) {
      setEmail(userType.credentials);
      setPassword(type === 'user' ? 'usuario2024' : type === 'manager' ? 'gestor2024' : 'admin2024');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #ffffff, #f5f5f5)' }}>
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" style={{ backgroundColor: '#cf5001' }}></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" style={{ backgroundColor: '#2d1d0e' }}></div>
        <div className="absolute top-40 left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" style={{ backgroundColor: '#cf5001' + '80' }}></div>
      </div>

      <div className="w-full max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center mb-4 sm:mb-6">
            <Logo size={60} className="sm:w-20 sm:h-20" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-2 sm:mb-4">
            Assistente Virtual
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4">
            Assistente Virtual - Código de Estrada e Legislação de Trânsito
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center">
          {/* User Type Selection */}
          <div className="order-2 lg:order-1">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6 text-center lg:text-left">
              Selecione seu perfil
            </h2>
            <div className="space-y-3 sm:space-y-4">
              {userTypes.map((userType) => {
                const Icon = userType.icon;
                const isSelected = selectedUserType === userType.type;
                
                return (
                  <div
                    key={userType.type}
                    onClick={() => handleUserTypeSelect(userType.type)}
                    className={`relative p-4 sm:p-6 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                      isSelected
                        ? 'text-white shadow-xl'
                        : 'bg-white/70 backdrop-blur-sm text-gray-700 hover:bg-white/90 shadow-lg'
                    }`}
                    style={isSelected ? {
                      background: userType.type === 'user' 
                        ? 'linear-gradient(to right, #cf5001, #2d1d0e)'
                        : userType.type === 'manager'
                        ? 'linear-gradient(to right, #cf5001, #2d1d0e)'
                        : 'linear-gradient(to right, #2d1d0e, #cf5001)'
                    } : {}}
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className={`p-2 sm:p-3 rounded-lg ${
                        isSelected ? 'bg-white/20' : ''
                      }`}
                      style={!isSelected ? { backgroundColor: '#cf5001' + '20' } : {}}
                      >
                        <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${
                          isSelected ? 'text-white' : ''
                        }`}
                        style={!isSelected ? { color: '#cf5001' } : {}}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold truncate">
                          {userType.title}
                        </h3>
                        <p className={`text-xs sm:text-sm mt-1 ${
                          isSelected ? 'text-white/90' : 'text-gray-500'
                        }`}>
                          {userType.description}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#cf5001' }}></div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Login Form */}
          <div className="order-1 lg:order-2">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/20">
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                  Entrar
                </h2>
                <p className="text-sm sm:text-base text-gray-600">
                  Acesse sua conta para continuar
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 transition-colors text-sm sm:text-base"
                      style={{ '--tw-ring-color': '#cf5001' } as React.CSSProperties}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#cf5001';
                        e.currentTarget.style.boxShadow = '0 0 0 2px ' + '#cf5001' + '40';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#d1d5db';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      placeholder="seu.email@codigoestrada.mz"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 transition-colors text-sm sm:text-base"
                      style={{ '--tw-ring-color': '#cf5001' } as React.CSSProperties}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#cf5001';
                        e.currentTarget.style.boxShadow = '0 0 0 2px ' + '#cf5001' + '40';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#d1d5db';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      placeholder="Digite sua senha"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                 disabled={isLoading}
                  className="w-full text-white py-3 px-4 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transform hover:scale-105 transition-all duration-200 shadow-lg text-sm sm:text-base"
                  style={{ 
                    background: 'linear-gradient(to right, #cf5001, #2d1d0e)',
                    '--tw-ring-color': '#cf5001'
                  } as React.CSSProperties}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.background = 'linear-gradient(to right, #2d1d0e, #cf5001)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.background = 'linear-gradient(to right, #cf5001, #2d1d0e)';
                    }
                  }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Entrando...</span>
                    </div>
                  ) : (
                    'Entrar no Sistema'
                  )}
                </button>
              </form>

              <div className="mt-6 sm:mt-8 p-3 sm:p-4 rounded-lg border" style={{ backgroundColor: '#cf5001' + '10', borderColor: '#cf5001' + '40' }}>
                <p className="text-xs sm:text-sm text-center" style={{ color: '#cf5001' }}>
                  <strong>Credenciais de teste:</strong><br />
                  Selecione um perfil acima para preencher automaticamente
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 py-3 sm:py-4 text-center relative z-10">
        <p className="text-xs sm:text-sm text-gray-600">
          Powered by <a href="https://interbantu.com" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: '#cf5001' }}>InterBantu</a>
        </p>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default Login;