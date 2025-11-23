import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, LogOut, Lightbulb, Clock, User, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';

interface Message {
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  loading?: boolean;
}

const suggestedQuestions = [
  {
    question: "Quais são os limites de velocidade dentro e fora das localidades para automóveis ligeiros?",
    category: "Velocidade",
    icon: Clock
  },
  {
    question: "Quais são as multas por condução sob influência de álcool no Código da Estrada?",
    category: "Multas e Sanções",
    icon: Lightbulb
  },
  {
    question: "Em que locais é proibida a ultrapassagem?",
    category: "Condução",
    icon: User
  },
  {
    question: "Quais são as multas aplicadas por excesso de velocidade dentro e fora das localidades?",
    category: "Multas",
    icon: Clock
  }
];

const VirtualAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'bot',
      content: 'Olá! Sou o IB - EstradaResponde da InterBantu, um assistente virtual especializado em Código de Estrada e legislação de trânsito. Estou aqui para ajudá-lo(a) a compreender as regras e normas de trânsito. Como posso ajudá-lo(a) hoje?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [messages]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleClearConversation = () => {
    if (window.confirm('Tem certeza que deseja limpar a conversa?')) {
      setMessages([{
        type: 'bot',
        content: 'Olá! Sou o IB - EstradaResponde da InterBantu, um assistente virtual especializado em Código de Estrada e legislação de trânsito. Estou aqui para ajudá-lo(a) a compreender as regras e normas de trânsito. Como posso ajudá-lo(a) hoje?',
        timestamp: new Date()
      }]);
      toast.success('Conversa limpa');
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    setMessages(prev => [...prev, {
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    }]);

    setIsTyping(true);
    setInputValue('');

    try {
      const response = await apiService.sendMessage(content.trim());
      
      // Garantir que o conteúdo HTML não está sendo escapado
      const htmlContent = response.answer;
      
      // Debug: verificar se o HTML está chegando corretamente
      if (htmlContent && htmlContent.includes('<p>')) {
        console.log('HTML recebido:', htmlContent.substring(0, 100));
      }
      
      setMessages(prev => [...prev, {
        type: 'bot',
        content: htmlContent,
        timestamp: new Date()
      }]);
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao processar sua pergunta. Por favor, tente novamente.';
      
      // Mensagem mais amigável se o assistente não estiver disponível
      let friendlyMessage = errorMessage;
      let showToast = true;
      
      if (errorMessage.includes('não está disponível') || errorMessage.includes('não inicializado') || errorMessage.includes('não consigo responder')) {
        friendlyMessage = 'Olá! 😊 No momento não consigo responder suas perguntas. Por favor, tente novamente em alguns instantes.';
        showToast = false; // Não mostrar popup para essa mensagem
      }
      
      setMessages(prev => [...prev, {
        type: 'bot',
        content: friendlyMessage,
        timestamp: new Date()
      }]);
      
      if (showToast) {
        toast.error(friendlyMessage);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0">
        <div className="w-full px-2 sm:px-4">
          <div className="h-12 sm:h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Logo size={28} className="sm:w-8 sm:h-8" />
              <div className="hidden md:block">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">IB - EstradaResponde</h1>
                <p className="text-xs sm:text-sm font-medium italic" style={{ color: '#cf5001' }}>"A estrada tem perguntas — nós temos as respostas."</p>
              </div>
              <div className="md:hidden">
                <h1 className="text-xs font-bold text-gray-900">IB - EstradaResponde</h1>
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-4">
              <div className="hidden lg:block text-right">
                <p className="text-xs text-gray-600">Olá,</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-900">{user?.name}</p>
              </div>
              {messages.length > 1 && (
                <button
                  onClick={handleClearConversation}
                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  title="Limpar conversa"
                >
                  <Trash2 size={14} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="hidden sm:inline text-xs sm:text-sm">Limpar</span>
                </button>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1 sm:py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                <LogOut size={14} className="sm:w-[18px] sm:h-[18px]" />
                <span className="hidden sm:inline text-xs sm:text-sm">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto pb-16 sm:pb-24">
        <div className="max-w-4xl mx-auto py-2 sm:py-6 px-2 sm:px-4">
          <div className="space-y-2 sm:space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-3 sm:p-4 shadow-sm ${
                    message.type === 'user' 
                      ? 'text-white'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                  style={message.type === 'user' ? { backgroundColor: '#cf5001' } : {}}
                >
                  {message.loading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 size={16} className="animate-spin sm:w-[18px] sm:h-[18px]" />
                      <span className="text-xs sm:text-base">Digitando...</span>
                    </div>
                  ) : message.type === 'bot' ? (
                    <>
                      <div 
                        className="text-xs sm:text-base leading-relaxed message-content"
                        style={{ lineHeight: '1.6' }}
                        dangerouslySetInnerHTML={{ __html: message.content }}
                      />
                      <style>{`
                        .message-content h2 {
                          font-size: 1.25rem;
                          font-weight: 700;
                          margin-top: 1rem;
                          margin-bottom: 0.5rem;
                          color: #1f2937;
                        }
                        .message-content h3 {
                          font-size: 1.125rem;
                          font-weight: 600;
                          margin-top: 0.75rem;
                          margin-bottom: 0.5rem;
                          color: #374151;
                        }
                        .message-content p {
                          margin-bottom: 0.75rem;
                          color: #4b5563;
                        }
                        .message-content ul {
                          margin-left: 1.5rem;
                          margin-bottom: 0.75rem;
                          list-style-type: disc;
                        }
                        .message-content li {
                          margin-bottom: 0.25rem;
                          color: #4b5563;
                        }
                        .message-content strong {
                          font-weight: 600;
                          color: #1f2937;
                        }
                        .message-content .document-link {
                          color: #059669;
                          text-decoration: underline;
                          font-weight: 500;
                          cursor: pointer;
                        }
                        .message-content .document-link:hover {
                          color: #047857;
                          text-decoration: underline;
                        }
                        .message-content hr {
                          border: none;
                          border-top: 1px solid #e5e7eb;
                          margin: 1rem 0;
                        }
                      `}</style>
                    </>
                  ) : (
                    <div className="text-xs sm:text-base leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </div>
                  )}
                  <div className={`text-xs mt-1 sm:mt-2 ${
                    message.type === 'user' ? 'text-white' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#cf5001' }}></div>
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#cf5001', animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#cf5001', animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-gray-600 text-xs sm:text-sm">Assistente está digitando...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length === 1 && (
            <div className="mt-4 sm:mt-8">
              <div className="text-center mb-3 sm:mb-6">
                <h3 className="text-sm sm:text-lg font-semibold text-gray-800 mb-1 sm:mb-2">Perguntas Frequentes</h3>
                <p className="text-xs sm:text-base text-gray-600 px-2">Clique em uma pergunta para começar</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {suggestedQuestions.map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(item.question)}
                      className="text-left p-2 sm:p-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#cf5001' + '80';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      }}
                    >
                      <div className="flex items-start space-x-2 sm:space-x-3">
                        <div className="p-1 sm:p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: '#cf5001' + '20' }}>
                          <IconComponent className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: '#cf5001' }} />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-medium mb-0.5 sm:mb-1" style={{ color: '#cf5001' }}>{item.category}</div>
                          <div className="text-xs sm:text-sm text-gray-800 font-medium leading-tight">{item.question}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white shadow-sm">
        <div className="max-w-4xl mx-auto p-2 sm:p-4">
          <div className="flex items-end space-x-1 sm:space-x-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                rows={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua pergunta sobre o regulamento acadêmico..."
                className="w-full px-2 sm:px-4 py-2 sm:py-3 pr-8 sm:pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent resize-none bg-white shadow-sm text-xs sm:text-base"
                style={{ 
                  minHeight: '36px', 
                  maxHeight: '100px',
                  '--tw-ring-color': '#cf5001'
                } as React.CSSProperties}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#cf5001';
                  e.currentTarget.style.boxShadow = '0 0 0 2px ' + '#cf5001' + '40';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <div className="absolute right-2 sm:right-3 bottom-2 sm:bottom-3 text-xs text-gray-400 hidden md:block">
                Enter para enviar
              </div>
            </div>
            <button
              onClick={() => handleSendMessage(inputValue)}
              className="p-2 sm:p-3 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex-shrink-0"
              style={{ backgroundColor: '#cf5001' }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = '#2d1d0e';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = '#cf5001';
                }
              }}
              disabled={!inputValue.trim() || isTyping}
            >
              <Send size={14} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-2 sm:py-3 bg-white border-t border-gray-200 text-center">
        <p className="text-xs sm:text-sm text-gray-600">
          Powered by <a href="https://interbantu.com" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: '#cf5001' }}>InterBantu</a>
        </p>
      </div>
    </div>
  );
};

export default VirtualAssistant;