import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Sparkles, Database, Loader2, Info } from 'lucide-react';
import GeneralDocuments from '../components/GeneralDocuments';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';

interface GeneralDocument {
  id: string;
  name: string;
  size: number;
  uploadDate: Date;
  status: 'processing' | 'ready' | 'error';
  pages?: number;
}

const ManagerDashboard: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  
  const [generalDocuments, setGeneralDocuments] = useState<GeneralDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSegmentosHint, setShowSegmentosHint] = useState(false);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    readyDocuments: 0,
    totalChunks: 0
  });

  useEffect(() => {
    loadDocumentsData();
  }, []);

  const loadDocumentsData = async () => {
    try {
      setLoading(true);
      const docInfo = await apiService.getDocuments();
      
      if (docInfo.has_documents) {
        setStats({
          totalDocuments: docInfo.document_count || 0,
          readyDocuments: docInfo.document_count || 0,
          totalChunks: docInfo.total_chunks || 0
        });
      } else {
        setStats({
          totalDocuments: 0,
          readyDocuments: 0,
          totalChunks: 0
        });
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar informações dos documentos');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDocumentsChange = (documents: GeneralDocument[] | ((prev: GeneralDocument[]) => GeneralDocument[])) => {
    if (typeof documents === 'function') {
      setGeneralDocuments(documents);
    } else {
      setGeneralDocuments(documents);
    }
    // Recarregar estatísticas após mudanças
    loadDocumentsData();
  };

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-20" style={{ backgroundColor: '#cf5001' }}></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-20" style={{ backgroundColor: '#2d1d0e' }}></div>
      </div>

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b shadow-lg relative z-10" style={{ borderColor: '#cf5001' + '40' }}>
        <div className="container mx-auto px-3 sm:px-4">
          <div className="h-14 sm:h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Logo size={28} className="sm:w-8 sm:h-8" />
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
                  <span>Painel do Gestor</span>
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#cf5001' }} />
                </h1>
                <p className="text-xs sm:text-sm font-medium" style={{ color: '#cf5001' }}>Base de Conhecimento</p>
              </div>
              <div className="sm:hidden">
                <h1 className="text-sm font-bold text-gray-900">Gestor</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:block text-right">
                <p className="text-xs text-gray-600">Olá,</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-900">{user?.name}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg"
              >
                <LogOut size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span className="hidden sm:inline text-sm">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 relative z-10">
        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white/80 backdrop-blur-sm p-3 sm:p-6 rounded-2xl shadow-lg border" style={{ borderColor: '#cf5001' + '40' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">Total de Documentos</p>
                {loading ? (
                  <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-gray-400" />
                ) : (
                  <p className="text-xl sm:text-3xl font-bold text-gray-900">{stats.totalDocuments}</p>
                )}
                <p className="text-xs mt-1 hidden sm:block" style={{ color: '#cf5001' }}>Base de conhecimento</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl" style={{ background: '#cf5001' }}>
                <Database className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-3 sm:p-6 rounded-2xl shadow-lg border" style={{ borderColor: '#cf5001' + '40' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">Documentos Prontos</p>
                {loading ? (
                  <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-gray-400" />
                ) : (
                  <p className="text-xl sm:text-3xl font-bold" style={{ color: '#cf5001' }}>{stats.readyDocuments}</p>
                )}
                <p className="text-xs mt-1 hidden sm:block" style={{ color: '#cf5001' }}>Treinamento ativo</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl" style={{ background: 'linear-gradient(to right, #cf5001, #2d1d0e)' }}>
                <Database className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-3 sm:p-6 rounded-2xl shadow-lg border relative" style={{ borderColor: '#cf5001' + '40' }}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs sm:text-sm font-semibold text-gray-600">Total de Segmentos</p>
                  <div className="relative">
                    <button
                      onMouseEnter={() => setShowSegmentosHint(true)}
                      onMouseLeave={() => setShowSegmentosHint(false)}
                      onClick={() => setShowSegmentosHint(!showSegmentosHint)}
                      className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                      aria-label="Informação sobre segmentos"
                    >
                      <Info className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    {showSegmentosHint && (
                      <div className="absolute z-50 bottom-full left-0 sm:left-1/2 sm:transform sm:-translate-x-1/2 mb-2 w-72 sm:w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl">
                        <p className="font-semibold mb-2 text-white">Como funcionam os segmentos?</p>
                        <p className="text-gray-300 leading-relaxed">
                          Os documentos são divididos em segmentos menores de texto para facilitar a busca e recuperação de informações. Cada segmento representa uma parte do documento que pode ser encontrada quando os usuários fazem perguntas. Quanto mais segmentos, maior a capacidade do sistema de encontrar informações precisas no Código da Estrada.
                        </p>
                        <div className="absolute bottom-0 left-4 sm:left-1/2 sm:transform sm:-translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    )}
                  </div>
                </div>
                {loading ? (
                  <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-gray-400" />
                ) : (
                  <p className="text-xl sm:text-3xl font-bold text-gray-900">{stats.totalChunks}</p>
                )}
                <p className="text-xs text-gray-600 mt-1 hidden sm:block">Segmentos de texto indexados</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl" style={{ background: 'linear-gradient(to right, #2d1d0e, #cf5001)' }}>
                <Database className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Documents Content */}
        <div className="min-h-[600px]">
          <GeneralDocuments 
            documents={generalDocuments}
            onDocumentsChange={handleDocumentsChange}
            onUploadComplete={loadDocumentsData}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="py-3 sm:py-4 text-center relative z-10">
        <p className="text-xs sm:text-sm text-gray-600">
          Powered by <a href="https://interbantu.com" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: '#cf5001' }}>InterBantu</a>
        </p>
      </div>
    </div>
  );
};

export default ManagerDashboard;