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
      credentials: 'usuario@interbantu.com',
      bgGradient: 'custom-gradient-1'
    },
    {
      type: 'manager' as const,
      icon: Shield,
      title: 'Gestor',
      description: 'Gestão da base de conhecimento',
      credentials: 'gestor@interbantu.com',
      bgGradient: 'custom-gradient-2'
    },
    {
      type: 'admin' as const,
      icon: Settings,
      title: 'Administrador',
      description: 'Gestão de contas e sistema',
      credentials: 'admin@interbantu.com',
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
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 relative overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #ffffff, #f5f5f5)' }}>
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-40 h-40 sm:w-80 sm:h-80 rounded-full mix-blend-multiply filter blur-xl opacity-50 sm:opacity-70 animate-blob" style={{ backgroundColor: '#cf5001' }}></div>
        <div className="absolute -bottom-20 -left-20 sm:-bottom-40 sm:-left-40 w-40 h-40 sm:w-80 sm:h-80 rounded-full mix-blend-multiply filter blur-xl opacity-50 sm:opacity-70 animate-blob animation-delay-2000" style={{ backgroundColor: '#2d1d0e' }}></div>
        <div className="absolute top-20 left-20 sm:top-40 sm:left-40 w-40 h-40 sm:w-80 sm:h-80 rounded-full mix-blend-multiply filter blur-xl opacity-40 sm:opacity-70 animate-blob animation-delay-4000" style={{ backgroundColor: '#cf5001' + '80' }}></div>
      </div>

      <div className="w-full max-w-6xl mx-auto relative z-10 py-2 sm:py-4 lg:py-0">
        {/* Mobile: Powered by no topo */}
        <div className="block sm:hidden mb-2 text-center">
          <p className="text-xs text-gray-500">
            Powered by <a href="https://interbantu.com" target="_blank" rel="noopener noreferrer" className="font-semibold active:underline touch-manipulation" style={{ color: '#cf5001' }}>InterBantu</a>
          </p>
        </div>

        <div className="text-center mb-3 sm:mb-4 lg:mb-8 xl:mb-12">
          <div className="inline-flex items-center justify-center mb-1.5 sm:mb-2 lg:mb-4 xl:mb-6">
            <Logo size={40} className="sm:w-14 sm:h-14 lg:w-16 lg:h-16 xl:w-20 xl:h-20" />
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold text-gray-800 mb-1 sm:mb-1.5 lg:mb-2 xl:mb-4 px-2">
            IB - EstradaResponde
          </h1>
          <p className="text-xs sm:text-sm lg:text-base xl:text-lg 2xl:text-xl text-gray-600 max-w-2xl mx-auto px-2 sm:px-3 lg:px-4 font-medium italic mb-0.5 sm:mb-1 lg:mb-2">
            "A estrada tem perguntas — nós temos as respostas."
          </p>
          <p className="text-[10px] sm:text-xs lg:text-sm xl:text-base text-gray-500 max-w-2xl mx-auto px-2 sm:px-3 lg:px-4">
            O teu guia inteligente do Código da Estrada
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6 xl:gap-12 items-start lg:items-center">
          {/* Login Form - Primeiro em mobile */}
          <div className="order-1 lg:order-2">
            <div className="bg-white/80 backdrop-blur-lg rounded-lg sm:rounded-xl lg:rounded-2xl shadow-2xl p-3.5 sm:p-5 lg:p-6 xl:p-8 border border-white/20">
              <div className="text-center mb-3 sm:mb-4 lg:mb-6 xl:mb-8">
                <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-800 mb-0.5 sm:mb-1 lg:mb-2">
                  Entrar
                </h2>
                <p className="text-[10px] sm:text-xs lg:text-sm xl:text-base text-gray-600">
                  Acesse sua conta para continuar
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3 lg:space-y-4 xl:space-y-6">
                <div>
                  <label className="block text-[11px] sm:text-xs lg:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5 lg:mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <User className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-8 sm:pl-9 lg:pl-10 pr-2.5 sm:pr-3 lg:pr-4 py-2 sm:py-2.5 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 transition-colors text-sm sm:text-base touch-manipulation"
                      style={{ '--tw-ring-color': '#cf5001' } as React.CSSProperties}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#cf5001';
                        e.currentTarget.style.boxShadow = '0 0 0 2px ' + '#cf5001' + '40';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#d1d5db';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      placeholder="seu.email@interbantu.com"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] sm:text-xs lg:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5 lg:mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-8 sm:pl-9 lg:pl-10 pr-9 sm:pr-10 lg:pr-12 py-2 sm:py-2.5 lg:py-3 border border-gray-300 rounded-lg focus:ring-2 transition-colors text-sm sm:text-base touch-manipulation"
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
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 active:text-gray-600 sm:hover:text-gray-600 transition-colors touch-manipulation p-1"
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full text-white py-2 sm:py-2.5 lg:py-3 px-3 sm:px-4 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 sm:hover:scale-105 transition-all duration-200 shadow-lg text-xs sm:text-sm lg:text-base touch-manipulation min-h-[42px] sm:min-h-[44px]"
                  style={{ 
                    background: 'linear-gradient(to right, #cf5001, #2d1d0e)',
                    '--tw-ring-color': '#cf5001'
                  } as React.CSSProperties}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled && window.innerWidth >= 640) {
                      e.currentTarget.style.background = 'linear-gradient(to right, #2d1d0e, #cf5001)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled && window.innerWidth >= 640) {
                      e.currentTarget.style.background = 'linear-gradient(to right, #cf5001, #2d1d0e)';
                    }
                  }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-1.5 sm:space-x-2">
                      <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Entrando...</span>
                    </div>
                  ) : (
                    'Entrar no Sistema'
                  )}
                </button>
              </form>

              <div className="mt-3 sm:mt-4 lg:mt-6 xl:mt-8 p-2 sm:p-2.5 lg:p-3 xl:p-4 rounded-lg border" style={{ backgroundColor: '#cf5001' + '10', borderColor: '#cf5001' + '40' }}>
                <p className="text-[10px] sm:text-xs lg:text-sm text-center leading-relaxed" style={{ color: '#cf5001' }}>
                  <strong>Credenciais de teste:</strong><br className="hidden sm:block" />
                  <span className="sm:hidden"> </span>Selecione um perfil abaixo para preencher automaticamente
                </p>
              </div>
            </div>
          </div>

          {/* User Type Selection - Segundo em mobile */}
          <div className="order-2 lg:order-1">
            <h2 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-semibold text-gray-800 mb-2 sm:mb-3 lg:mb-4 xl:mb-6 text-center lg:text-left px-2 sm:px-0">
              Selecione seu perfil
            </h2>
            <div className="space-y-1.5 sm:space-y-2 lg:space-y-3 xl:space-y-4">
              {userTypes.map((userType) => {
                const Icon = userType.icon;
                const isSelected = selectedUserType === userType.type;
                
                return (
                  <div
                    key={userType.type}
                    onClick={() => handleUserTypeSelect(userType.type)}
                    className={`relative p-2.5 sm:p-3 lg:p-4 xl:p-6 rounded-md sm:rounded-lg lg:rounded-xl cursor-pointer transition-all duration-300 active:scale-95 sm:hover:scale-105 touch-manipulation ${
                      isSelected
                        ? 'text-white shadow-xl'
                        : 'bg-white/70 backdrop-blur-sm text-gray-700 active:bg-white/90 sm:hover:bg-white/90 shadow-lg'
                    }`}
                    style={isSelected ? {
                      background: userType.type === 'user' 
                        ? 'linear-gradient(to right, #cf5001, #2d1d0e)'
                        : userType.type === 'manager'
                        ? 'linear-gradient(to right, #cf5001, #2d1d0e)'
                        : 'linear-gradient(to right, #2d1d0e, #cf5001)'
                    } : {}}
                  >
                    <div className="flex items-center space-x-2 sm:space-x-2.5 lg:space-x-3 xl:space-x-4">
                      <div className={`p-1 sm:p-1.5 lg:p-2 xl:p-3 rounded sm:rounded-md lg:rounded-lg flex-shrink-0 ${
                        isSelected ? 'bg-white/20' : ''
                      }`}
                      style={!isSelected ? { backgroundColor: '#cf5001' + '20' } : {}}
                      >
                        <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 ${
                          isSelected ? 'text-white' : ''
                        }`}
                        style={!isSelected ? { color: '#cf5001' } : {}}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs sm:text-sm lg:text-base xl:text-lg font-semibold truncate">
                          {userType.title}
                        </h3>
                        <p className={`text-[10px] sm:text-xs lg:text-sm mt-0.5 line-clamp-1 ${
                          isSelected ? 'text-white/90' : 'text-gray-500'
                        }`}>
                          {userType.description}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 xl:w-5 xl:h-5 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 lg:w-2 lg:h-2 rounded-full" style={{ backgroundColor: '#cf5001' }}></div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Footer - Desktop only */}
      <div className="hidden sm:block absolute bottom-0 left-0 right-0 py-2 sm:py-3 lg:py-4 text-center relative z-10 px-3">
        <p className="text-xs sm:text-sm text-gray-600">
          Powered by <a href="https://interbantu.com" target="_blank" rel="noopener noreferrer" className="font-semibold active:underline sm:hover:underline touch-manipulation" style={{ color: '#cf5001' }}>InterBantu</a>
        </p>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
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
      `}} />
    </div>
  );
};

export default Login;