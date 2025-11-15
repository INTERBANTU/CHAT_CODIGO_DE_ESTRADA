import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  Trash2, 
  Eye,
  FolderOpen,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { apiService, Document } from '../services/api';

interface PDFDocument {
  id: string;
  name: string;
  size: number;
  uploadDate: Date;
  status: 'processing' | 'ready' | 'error';
  pages?: number;
}

interface GeneralDocumentsProps {
  documents: PDFDocument[];
  onDocumentsChange: (documents: PDFDocument[] | ((prev: PDFDocument[]) => PDFDocument[])) => void;
  onUploadComplete?: () => void;
}

const GeneralDocuments: React.FC<GeneralDocumentsProps> = ({ documents, onDocumentsChange, onUploadComplete }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backendDocuments, setBackendDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);

  useEffect(() => {
    loadBackendDocuments();
  }, []);

  const loadBackendDocuments = async () => {
    try {
      setLoadingDocuments(true);
      const docInfo = await apiService.getDocuments();
      if (docInfo.documents) {
        setBackendDocuments(docInfo.documents);
      }
    } catch (error: any) {
      console.error('Erro ao carregar documentos:', error);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    const newDocs: PDFDocument[] = [];

    // Validar arquivos
    Array.from(files).forEach(file => {
      if (file.type !== 'application/pdf') {
        toast.error(`${file.name} não é um arquivo PDF válido`);
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} é muito grande. Limite: 50MB`);
        return;
      }

      const newDoc: PDFDocument = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        uploadDate: new Date(),
        status: 'processing'
      };

      validFiles.push(file);
      newDocs.push(newDoc);
    });

    if (validFiles.length === 0) return;

    // Adicionar documentos com status processing
    onDocumentsChange([...documents, ...newDocs]);
    toast.loading('Enviando e processando documentos...', { id: 'upload' });

    try {
      // Fazer upload para a API
      const response = await apiService.uploadFiles(validFiles);
      
      // Atualizar status dos documentos
      newDocs.forEach((newDoc, index) => {
        const uploadedFile = response.files[index];
        if (uploadedFile) {
          onDocumentsChange((prev: PDFDocument[]) => prev.map((doc: PDFDocument) => 
            doc.id === newDoc.id 
              ? { 
                  ...doc, 
                  status: 'ready', 
                  pages: response.processing_info.successful_pages / response.files.length 
                }
              : doc
          ));
        }
      });

      toast.success(
        `${response.files.length} documento(s) processado(s) com sucesso! ${response.processing_info.total_chunks} segmentos de texto indexados.`,
        { id: 'upload' }
      );
      
      // Notificar o componente pai para recarregar estatísticas
      if (onUploadComplete) {
        onUploadComplete();
      }
      
      // Recarregar lista de documentos do backend
      loadBackendDocuments();
    } catch (error: any) {
      // Atualizar status para erro
      newDocs.forEach(newDoc => {
        onDocumentsChange((prev: PDFDocument[]) => prev.map((doc: PDFDocument) => 
          doc.id === newDoc.id 
            ? { ...doc, status: 'error' }
            : doc
        ));
      });

      toast.error(error.message || 'Erro ao processar documentos', { id: 'upload' });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteDocument = async (documentName: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir "${documentName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      toast.loading('Deletando documento...', { id: 'delete' });
      await apiService.deleteDocument(documentName);
      toast.success('Documento deletado com sucesso', { id: 'delete' });
      
      // Recarregar lista de documentos
      await loadBackendDocuments();
      
      // Notificar componente pai para atualizar estatísticas
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao deletar documento', { id: 'delete' });
    }
  };

  const handleViewDocument = (documentName: string) => {
    const viewUrl = apiService.getDocumentViewUrl(documentName);
    window.open(viewUrl, '_blank');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="p-3 rounded-xl" style={{ backgroundColor: '#cf5001' }}>
            <FolderOpen className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Código da Estrada</h2>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Assistente virtual especializado em Código da Estrada e legislação de trânsito. Faça upload de documentos relacionados para que o sistema possa responder perguntas sobre regras de trânsito, multas, infrações e demais aspectos do código de estrada.
        </p>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div 
          className="border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer"
          style={{ 
            borderColor: '#cf5001' + '80',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#cf5001';
            e.currentTarget.style.backgroundColor = '#cf5001' + '10';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#cf5001' + '80';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 rounded-2xl" style={{ backgroundColor: '#cf5001' + '20' }}>
              <Upload className="w-16 h-16" style={{ color: '#cf5001' }} />
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-900 mb-2">
                Adicionar Documentos do Código da Estrada
              </p>
              <p className="text-gray-600 mb-4">
                Documentos do Código da Estrada e legislação de trânsito
              </p>
              <p className="text-sm text-gray-500">
                Arraste arquivos PDF aqui ou clique para selecionar • Máximo: 10MB por arquivo
              </p>
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900">Documentos do Código da Estrada Carregados</h3>
          <p className="text-gray-600 text-sm">Documentos de legislação de trânsito e código de estrada</p>
        </div>

        {loadingDocuments ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: '#cf5001' }} />
            <p className="text-gray-500">Carregando documentos...</p>
          </div>
        ) : backendDocuments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="p-4 rounded-2xl bg-gray-100 inline-block mb-4">
              <FolderOpen className="w-16 h-16 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg font-medium">Nenhum documento do Código da Estrada carregado</p>
            <p className="text-gray-400 text-sm mt-2">Comece enviando documentos do Código da Estrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tamanho
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Segmentos
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {backendDocuments.map((doc) => (
                  <tr key={doc.name} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 rounded-lg bg-red-100 mr-4">
                          <FileText className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {doc.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 font-medium">{formatFileSize(doc.file_size)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600 font-medium">{doc.chunk_count}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                      {doc.upload_date ? new Date(doc.upload_date).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDocument(doc.name)}
                          className="p-2 rounded-lg transition-colors"
                          style={{ color: '#cf5001' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#2d1d0e';
                            e.currentTarget.style.backgroundColor = '#cf5001' + '20';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#cf5001';
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(doc.name)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneralDocuments;