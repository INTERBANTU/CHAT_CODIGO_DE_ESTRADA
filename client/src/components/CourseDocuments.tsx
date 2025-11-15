import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Trash2, 
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  GraduationCap,
  BookOpen,
  Filter,
  Users,
  User,
  FileStack,
  Search,
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Course {
  id: string;
  name: string;
  level: 'licenciatura' | 'mestrado';
  regimes: ('normal' | 'pos-laboral')[];
}

interface CourseDocument {
  id: string;
  name: string;
  size: number;
  uploadDate: Date;
  status: 'processing' | 'ready' | 'error';
  pages?: number;
  courseId: string;
  courseName: string;
  courseLevel: 'licenciatura' | 'mestrado';
  documentType: 'comum' | 'normal' | 'pos-laboral'; // Novo campo
}

interface CourseDocumentsProps {
  documents: CourseDocument[];
  onDocumentsChange: (documents: CourseDocument[]) => void;
  courses: Course[];
}

const CourseDocuments: React.FC<CourseDocumentsProps> = ({ documents, onDocumentsChange, courses }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedDocumentType, setSelectedDocumentType] = useState<'comum' | 'normal' | 'pos-laboral'>('comum');
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<'all' | 'licenciatura' | 'mestrado'>('all');
  const [filterDocumentType, setFilterDocumentType] = useState<'all' | 'comum' | 'normal' | 'pos-laboral'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    if (!selectedCourse) {
      toast.error('Selecione um curso para fazer upload');
      return;
    }

    const course = courses.find(c => c.id === selectedCourse);
    if (!course) return;

    Array.from(files).forEach(file => {
      if (file.type !== 'application/pdf') {
        toast.error(`${file.name} não é um arquivo PDF válido`);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} é muito grande. Limite: 10MB`);
        return;
      }

      const newDoc: CourseDocument = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        uploadDate: new Date(),
        status: 'processing',
        courseId: course.id,
        courseName: course.name,
        courseLevel: course.level,
        documentType: selectedDocumentType
      };

      onDocumentsChange([...documents, newDoc]);
      
      const typeText = selectedDocumentType === 'comum' ? 'Comum' : 
                      selectedDocumentType === 'pos-laboral' ? 'Pós-Laboral' : 'Normal';
      toast.success(`${file.name} foi enviado para ${course.name} (${typeText})`);

      setTimeout(() => {
        onDocumentsChange(prev => prev.map(doc => 
          doc.id === newDoc.id 
            ? { ...doc, status: 'ready', pages: Math.floor(Math.random() * 50) + 10 }
            : doc
        ));
        toast.success(`${file.name} foi processado com sucesso`);
      }, 3000 + Math.random() * 2000);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteDocument = (id: string) => {
    const doc = documents.find(d => d.id === id);
    if (doc && window.confirm(`Tem certeza que deseja excluir "${doc.name}"?`)) {
      onDocumentsChange(documents.filter(d => d.id !== id));
      toast.success('Documento excluído com sucesso');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: CourseDocument['status']) => {
    switch (status) {
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusText = (status: CourseDocument['status']) => {
    switch (status) {
      case 'processing':
        return 'Processando...';
      case 'ready':
        return 'Pronto';
      case 'error':
        return 'Erro';
    }
  };

  const getDocumentTypeBadge = (documentType: CourseDocument['documentType']) => {
    switch (documentType) {
      case 'comum':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Comum</span>;
      case 'normal':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Normal</span>;
      case 'pos-laboral':
        return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">Pós-Laboral</span>;
    }
  };

  const getDocumentTypeIcon = (documentType: CourseDocument['documentType']) => {
    switch (documentType) {
      case 'comum':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'normal':
        return <User className="w-4 h-4 text-green-500" />;
      case 'pos-laboral':
        return <Clock className="w-4 h-4 text-purple-500" />;
    }
  };

  const selectedCourseData = courses.find(c => c.id === selectedCourse);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.courseName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = filterCourse === 'all' || doc.courseId === filterCourse;
    const matchesLevel = filterLevel === 'all' || doc.courseLevel === filterLevel;
    const matchesDocumentType = filterDocumentType === 'all' || doc.documentType === filterDocumentType;
    
    return matchesSearch && matchesCourse && matchesLevel && matchesDocumentType;
  });

  const documentTypeOptions = [
    {
      value: 'comum' as const,
      label: 'Documentos Comuns',
      description: 'Aplicam-se a todos os regimes do curso',
      icon: Users,
      color: 'blue'
    },
    {
      value: 'normal' as const,
      label: 'Regime Normal',
      description: 'Específicos para o regime normal',
      icon: User,
      color: 'green'
    },
    {
      value: 'pos-laboral' as const,
      label: 'Regime Pós-Laboral',
      description: 'Específicos para o regime pós-laboral',
      icon: Clock,
      color: 'purple'
    }
  ];

  const getUploadAreaContent = () => {
    const selectedType = documentTypeOptions.find(opt => opt.value === selectedDocumentType);
    if (!selectedType) return null;

    const Icon = selectedType.icon;
    const colorClasses = {
      blue: 'border-blue-300 hover:border-blue-400 hover:bg-blue-50 bg-blue-100 text-blue-600',
      green: 'border-green-300 hover:border-green-400 hover:bg-green-50 bg-green-100 text-green-600',
      purple: 'border-purple-300 hover:border-purple-400 hover:bg-purple-50 bg-purple-100 text-purple-600'
    };

    return (
      <div 
        className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-colors ${colorClasses[selectedType.color]}`}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className={`p-4 rounded-2xl ${selectedType.color === 'blue' ? 'bg-blue-100' : selectedType.color === 'green' ? 'bg-green-100' : 'bg-purple-100'}`}>
            <Upload className={`w-12 sm:w-16 h-12 sm:h-16 ${selectedType.color === 'blue' ? 'text-blue-600' : selectedType.color === 'green' ? 'text-green-600' : 'text-purple-600'}`} />
          </div>
          <div>
            <p className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              Adicionar {selectedType.label}
            </p>
            <p className={`font-medium mb-2 ${selectedType.color === 'blue' ? 'text-blue-700' : selectedType.color === 'green' ? 'text-green-700' : 'text-purple-700'}`}>
              {selectedCourseData?.name}
            </p>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              {selectedType.description}
            </p>
            <p className="text-xs sm:text-sm text-gray-500">
              Arraste arquivos PDF aqui ou clique para selecionar • Máximo: 10MB por arquivo
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="p-2 sm:p-3 rounded-xl bg-green-600">
            <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Documentos por Curso</h2>
        </div>
        <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-4">
          Organize documentos por curso: comuns a todos os regimes ou específicos para Normal/Pós-Laboral
        </p>
      </div>

      {/* Course and Document Type Selection */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Selecionar Curso e Tipo de Documento</h3>
        
        {/* Course Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Curso</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
          >
            <option value="">Selecione um curso</option>
            <optgroup label="Licenciaturas">
              {courses.filter(c => c.level === 'licenciatura').map(course => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </optgroup>
            <optgroup label="Mestrados">
              {courses.filter(c => c.level === 'mestrado').map(course => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Document Type Selection */}
        {selectedCourse && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Tipo de Documento</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {documentTypeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedDocumentType === option.value;
                const colorClasses = {
                  blue: isSelected ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100',
                  green: isSelected ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100',
                  purple: isSelected ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                };
                
                return (
                  <button
                    key={option.value}
                    onClick={() => setSelectedDocumentType(option.value)}
                    className={`p-3 sm:p-4 rounded-xl border-2 transition-colors text-left ${
                      isSelected 
                        ? `border-${option.color}-600 ${colorClasses[option.color]}` 
                        : `border-gray-200 ${colorClasses[option.color]}`
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        isSelected 
                          ? 'bg-white/20' 
                          : option.color === 'blue' ? 'bg-blue-100' : 
                            option.color === 'green' ? 'bg-green-100' : 'bg-purple-100'
                      }`}>
                        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${
                          isSelected 
                            ? 'text-white' 
                            : option.color === 'blue' ? 'text-blue-600' : 
                              option.color === 'green' ? 'text-green-600' : 'text-purple-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm sm:text-base font-semibold truncate">{option.label}</h4>
                        <p className={`text-xs sm:text-sm mt-1 ${
                          isSelected ? 'text-white/90' : 'text-gray-500'
                        }`}>
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Upload Area */}
        {selectedCourse ? (
          <>
            {getUploadAreaContent()}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 sm:p-12 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 rounded-2xl bg-gray-100">
                <BookOpen className="w-12 sm:w-16 h-12 sm:h-16 text-gray-400" />
              </div>
              <div>
                <p className="text-lg sm:text-xl font-semibold text-gray-500 mb-2">
                  Selecione um Curso
                </p>
                <p className="text-sm sm:text-base text-gray-400">
                  Escolha o curso para organizar documentos por tipo
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">Total</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{documents.length}</p>
            </div>
            <FileText className="w-5 h-5 sm:w-8 sm:h-8 text-gray-600" />
          </div>
        </div>

        <div className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">Comuns</p>
              <p className="text-lg sm:text-2xl font-bold text-blue-600">
                {documents.filter(d => d.documentType === 'comum').length}
              </p>
            </div>
            <Users className="w-5 h-5 sm:w-8 sm:h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">Normal</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600">
                {documents.filter(d => d.documentType === 'normal').length}
              </p>
            </div>
            <User className="w-5 h-5 sm:w-8 sm:h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">Pós-Laboral</p>
              <p className="text-lg sm:text-2xl font-bold text-purple-600">
                {documents.filter(d => d.documentType === 'pos-laboral').length}
              </p>
            </div>
            <Clock className="w-5 h-5 sm:w-8 sm:h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-3 sm:p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">Licenciaturas</p>
              <p className="text-lg sm:text-2xl font-bold text-emerald-600">
                {documents.filter(d => d.courseLevel === 'licenciatura').length}
              </p>
            </div>
            <GraduationCap className="w-5 h-5 sm:w-8 sm:h-8 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center space-x-2 sm:space-x-4 mb-4">
          <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Filtrar e Buscar</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Nome do documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Por Curso</label>
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            >
              <option value="all">Todos os Cursos</option>
              <optgroup label="Licenciaturas">
                {courses.filter(c => c.level === 'licenciatura').map(course => (
                  <option key={course.id} value={course.id}>{course.name}</option>
                ))}
              </optgroup>
              <optgroup label="Mestrados">
                {courses.filter(c => c.level === 'mestrado').map(course => (
                  <option key={course.id} value={course.id}>{course.name}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Por Nível</label>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            >
              <option value="all">Todos os Níveis</option>
              <option value="licenciatura">Licenciaturas</option>
              <option value="mestrado">Mestrados</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Por Tipo</label>
            <select
              value={filterDocumentType}
              onChange={(e) => setFilterDocumentType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            >
              <option value="all">Todos os Tipos</option>
              <option value="comum">Documentos Comuns</option>
              <option value="normal">Regime Normal</option>
              <option value="pos-laboral">Regime Pós-Laboral</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-base sm:text-lg font-bold text-gray-900">Documentos por Curso</h3>
          <p className="text-xs sm:text-sm text-gray-600">Organizados por tipo: comuns, normal e pós-laboral</p>
        </div>

        {filteredDocuments.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="p-3 sm:p-4 rounded-2xl bg-gray-100 inline-block mb-4">
              <FileStack className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
            </div>
            <p className="text-base sm:text-lg text-gray-500 font-medium">Nenhum documento encontrado</p>
            <p className="text-xs sm:text-sm text-gray-400 mt-2 px-4">
              {searchTerm || filterCourse !== 'all' || filterLevel !== 'all' || filterDocumentType !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Selecione um curso e comece a enviar documentos'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Curso
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">
                    Status
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                    Data
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-1.5 sm:p-2 rounded-lg bg-red-100 mr-2 sm:mr-4 flex-shrink-0">
                          <FileText className="w-4 h-4 sm:w-6 sm:h-6 text-red-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{doc.name}</div>
                          {doc.pages && (
                            <div className="text-xs text-gray-500">{doc.pages} páginas</div>
                          )}
                          <div className="sm:hidden mt-1">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(doc.status)}
                              <span className={`text-xs font-medium ${
                                doc.status === 'ready' ? 'text-green-600' :
                                doc.status === 'processing' ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {getStatusText(doc.status)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">
                        {doc.courseName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {doc.courseLevel === 'licenciatura' ? 'Licenciatura' : 'Mestrado'}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getDocumentTypeIcon(doc.documentType)}
                        <div className="hidden sm:block">
                          {getDocumentTypeBadge(doc.documentType)}
                        </div>
                        <div className="sm:hidden">
                          <span className={`text-xs font-medium ${
                            doc.documentType === 'comum' ? 'text-blue-600' :
                            doc.documentType === 'normal' ? 'text-green-600' : 'text-purple-600'
                          }`}>
                            {doc.documentType === 'comum' ? 'Comum' :
                             doc.documentType === 'normal' ? 'Normal' : 'PL'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(doc.status)}
                        <span className={`text-sm font-medium ${
                          doc.status === 'ready' ? 'text-green-600' :
                          doc.status === 'processing' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {getStatusText(doc.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 font-medium hidden md:table-cell">
                      {doc.uploadDate.toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <button
                          className="p-1.5 sm:p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors"
                          title="Visualizar"
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          className="p-1.5 sm:p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-1.5 sm:p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
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

export default CourseDocuments;