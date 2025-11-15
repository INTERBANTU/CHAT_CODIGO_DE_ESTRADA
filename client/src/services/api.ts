/**
 * Serviço de API para comunicação com o backend Python
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

interface ApiResponse<T> {
  success?: boolean;
  error?: string;
  data?: T;
}

interface ChatResponse {
  answer: string;
  sources: Array<{
    content: string;
    metadata?: Record<string, any>;
  }>;
}

interface UploadResponse {
  success: boolean;
  message: string;
  files: Array<{
    id: string;
    name: string;
  }>;
  processing_info: {
    total_pages: number;
    successful_pages: number;
    total_chunks: number;
    total_characters: number;
  };
}

interface Document {
  name: string;
  file_path: string;
  file_size: number;
  upload_date: string;
  chunk_count: number;
}

interface DocumentInfo {
  has_documents: boolean;
  document_count?: number;
  total_chunks?: number;
  collection_name?: string;
  message?: string;
  documents?: Document[];
}

interface ModelInfo {
  provider: string;
  model: string;
  temperature: number;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async healthCheck(): Promise<{ status: string; llm_provider: string }> {
    return this.request('/health');
  }

  async uploadFiles(files: File[]): Promise<UploadResponse> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async sendMessage(question: string): Promise<ChatResponse> {
    return this.request('/chat', {
      method: 'POST',
      body: JSON.stringify({ question }),
    });
  }

  async getDocuments(): Promise<DocumentInfo> {
    return this.request('/documents');
  }

  async clearDocuments(): Promise<{ success: boolean; message: string }> {
    return this.request('/documents', {
      method: 'DELETE',
    });
  }

  async deleteDocument(documentName: string): Promise<{ success: boolean; message: string }> {
    const encodedName = encodeURIComponent(documentName);
    return this.request(`/documents/${encodedName}`, {
      method: 'DELETE',
    });
  }

  getDocumentViewUrl(documentName: string): string {
    const encodedName = encodeURIComponent(documentName);
    return `${this.baseUrl}/documents/${encodedName}/view`;
  }


  async getModelInfo(): Promise<ModelInfo> {
    return this.request('/model');
  }
}

export const apiService = new ApiService();
export type { ChatResponse, UploadResponse, DocumentInfo, Document, ModelInfo };

