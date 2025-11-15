import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  Users, 
  UserPlus, 
  Edit3, 
  Trash2,
  Shield,
  User,
  Search,
  Sparkles,
  UserCheck,
  Database,
  Loader2,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import GeneralDocuments from '../components/GeneralDocuments';
import { apiService } from '../services/api';
import Logo from '../components/Logo';

interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  lastLogin?: Date;
}

interface GeneralDocument {
  id: string;
  name: string;
  size: number;
  uploadDate: Date;
  status: 'processing' | 'ready' | 'error';
  pages?: number;
}

const AdminDashboard: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'knowledge'>('knowledge');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'manager' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [generalDocuments, setGeneralDocuments] = useState<GeneralDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [showSegmentosHint, setShowSegmentosHint] = useState(false);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    readyDocuments: 0,
    totalChunks: 0
  });

  const [users, setUsers] = useState<UserAccount[]>([
    {
      id: '1',
      name: 'Gestor UEM',
      email: 'gestor@uem.ac.mz',
      role: 'manager',
      status: 'active',
      createdAt: new Date('2025-11-05'), // 5 de novembro de 2025 (quarta-feira desta semana)
      lastLogin: new Date('2025-11-09') // 9 de novembro de 2025 (hoje)
    },
    {
      id: '3',
      name: 'Carlos Mendes',
      email: 'carlos.mendes@uem.ac.mz',
      role: 'manager',
      status: 'active',
      createdAt: new Date('2025-11-06'), // 6 de novembro de 2025 (quinta-feira desta semana)
      lastLogin: new Date('2025-11-09') // 9 de novembro de 2025 (hoje)
    }
  ]);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'manager' as const,
    password: ''
  });

  useEffect(() => {
    if (activeTab === 'knowledge') {
      loadDocumentsData();
    }
  }, [activeTab]);

  const loadDocumentsData = async () => {
    try {
      setLoadingDocuments(true);
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
      setLoadingDocuments(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'manager':
        return <User className="w-4 h-4 text-green-500" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-red-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 text-xs font-semibold rounded-full";
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'inactive':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case 'suspended':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const userExists = users.some(u => u.email === newUser.email);
    if (userExists) {
      toast.error('Já existe um usuário com este email');
      return;
    }

    const user: UserAccount = {
      id: Date.now().toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: 'active',
      createdAt: new Date(), // Data atual (hoje)
      lastLogin: undefined // Ainda não fez login
    };

    setUsers(prev => [...prev, user]);
    setNewUser({ name: '', email: '', role: 'manager', password: '' });
    setShowCreateModal(false);
    toast.success('Gestor criado com sucesso');
  };

  const handleEditUser = (user: UserAccount) => {
    setEditingUser(user);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setUsers(prev => prev.map(u => 
      u.id === editingUser.id ? editingUser : u
    ));
    setEditingUser(null);
    toast.success('Usuário atualizado com sucesso');
  };

  const handleDeleteUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user && window.confirm(`Tem certeza que deseja excluir o usuário "${user.name}"?`)) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('Usuário excluído com sucesso');
    }
  };

  const handleToggleStatus = (userId: string) => {
    setUsers(prev => prev.map(u => 
      u.id === userId 
        ? { ...u, status: u.status === 'active' ? 'suspended' : 'active' as const }
        : u
    ));
    toast.success('Status do usuário atualizado');
  };

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const managerCount = users.filter(u => u.role === 'manager').length;
  const adminCount = users.filter(u => u.role === 'admin').length;

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #ffffff, #f5f5f5)' }}>
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow" style={{ backgroundColor: '#cf5001' }}></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-slow" style={{ backgroundColor: '#2d1d0e' }}></div>
      </div>

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b shadow-lg relative z-10" style={{ borderColor: '#cf5001' + '40' }}>
        <div className="container mx-auto px-3 sm:px-4">
          <div className="h-14 sm:h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Logo size={28} className="sm:w-8 sm:h-8" />
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
                  <span>Painel do Administrador</span>
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#cf5001' }} />
                </h1>
                <p className="text-xs sm:text-sm font-medium" style={{ color: '#cf5001' }}>Gestão de Gestores e Base de Conhecimento</p>
              </div>
              <div className="sm:hidden">
                <h1 className="text-sm font-bold text-gray-900">Admin</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:block text-right">
                <p className="text-xs text-gray-600">Olá,</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-900">{user?.name}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <LogOut size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span className="hidden sm:inline text-sm">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 relative z-10">
        {/* Tabs */}
        <div className="flex space-x-2 mb-6 sm:mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`px-4 sm:px-6 py-2 sm:py-3 font-semibold text-sm sm:text-base transition-all duration-300 border-b-2 ${
              activeTab === 'knowledge'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Base de Conhecimento</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 sm:px-6 py-2 sm:py-3 font-semibold text-sm sm:text-base transition-all duration-300 border-b-2 ${
              activeTab === 'users'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Gestão de Gestores</span>
            </div>
          </button>
        </div>

        {activeTab === 'users' && (
          <>
            {/* Statistics */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
              <div className="bg-white/80 backdrop-blur-sm p-3 sm:p-6 rounded-2xl shadow-lg border border-green-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">Total de Gestores</p>
                    <p className="text-xl sm:text-3xl font-bold text-gray-900">{totalUsers}</p>
                    <p className="text-xs text-blue-600 mt-1 hidden sm:block">Sistema completo</p>
                  </div>
                  <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600">
                    <Users className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-3 sm:p-6 rounded-2xl shadow-lg border border-green-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">Gestores Ativos</p>
                    <p className="text-xl sm:text-3xl font-bold text-green-600">{activeUsers}</p>
                    <p className="text-xs text-green-600 mt-1 hidden sm:block">Online e ativos</p>
                  </div>
                  <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600">
                    <UserCheck className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-3 sm:p-6 rounded-2xl shadow-lg border border-green-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">Gestores</p>
                    <p className="text-xl sm:text-3xl font-bold text-green-600">{managerCount}</p>
                    <p className="text-xs text-green-600 mt-1 hidden sm:block">Administradores</p>
                  </div>
                  <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600">
                    <User className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
                  </div>
                </div>
              </div>
            </div>

        {/* Controls */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-green-100 p-4 sm:p-6 mb-4 sm:mb-6 hover:shadow-xl transition-all duration-300">
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder="Buscar usuários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-sm text-sm sm:text-base w-full sm:w-auto"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-sm text-sm sm:text-base"
              >
                <option value="all">Todos os Perfis</option>
                <option value="manager">Gestores</option>
                <option value="admin">Administradores</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-sm text-sm sm:text-base"
              >
                <option value="all">Todos os Status</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="suspended">Suspenso</option>
              </select>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
            >
              <UserPlus size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span>Novo Gestor</span>
            </button>
          </div>
        </div>

            {/* Users Table */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-green-100 overflow-hidden hover:shadow-xl transition-all duration-300">
          <div className="overflow-x-auto -mx-1 sm:mx-0">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-green-50 to-emerald-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">
                    Perfil
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                    Criado em
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                    Último Login
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-green-50/50 transition-colors duration-200">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center text-white font-semibold mr-2 sm:mr-4 text-sm sm:text-base">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-semibold text-gray-900 truncate max-w-[120px] sm:max-w-none">{user.name}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[120px] sm:max-w-none">{user.email}</div>
                          <div className="sm:hidden">
                            <div className="flex items-center space-x-1 mt-1">
                              {getRoleIcon(user.role)}
                              <span className="text-xs text-gray-600 capitalize">{user.role}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(user.role)}
                        <span className="text-xs sm:text-sm text-gray-900 capitalize font-medium">{user.role}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className={getStatusBadge(user.status)}>
                        <span className="hidden sm:inline">
                          {user.status === 'active' ? 'Ativo' : user.status === 'inactive' ? 'Inativo' : 'Suspenso'}
                        </span>
                        <span className="sm:hidden">
                          {user.status === 'active' ? '✓' : user.status === 'inactive' ? '○' : '✗'}
                        </span>
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 font-medium hidden md:table-cell">
                      {user.createdAt.toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 font-medium hidden lg:table-cell">
                      {user.lastLogin ? user.lastLogin.toLocaleDateString('pt-BR') : 'Nunca'}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-1.5 sm:p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-all duration-200"
                          title="Editar"
                        >
                          <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user.id)}
                          className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${
                            user.status === 'active' 
                              ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100' 
                              : 'text-green-600 hover:text-green-800 hover:bg-green-100'
                          }`}
                          title={user.status === 'active' ? 'Suspender' : 'Ativar'}
                        >
                          <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1.5 sm:p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-all duration-200"
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

          {filteredUsers.length === 0 && (
            <div className="p-8 sm:p-12 text-center">
              <div className="p-3 sm:p-4 rounded-2xl bg-gray-100 inline-block mb-4">
                <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
              </div>
              <p className="text-gray-500 text-base sm:text-lg font-medium">Nenhum usuário encontrado</p>
              <p className="text-gray-400 text-xs sm:text-sm mt-2 px-4">Tente ajustar os filtros de busca</p>
            </div>
          )}
            </div>
          </>
        )}

        {activeTab === 'knowledge' && (
          <>
            {/* Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
              <div className="bg-white/80 backdrop-blur-sm p-3 sm:p-6 rounded-2xl shadow-lg border border-green-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">Total de Documentos</p>
                    {loadingDocuments ? (
                      <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-gray-400" />
                    ) : (
                      <p className="text-xl sm:text-3xl font-bold text-gray-900">{stats.totalDocuments}</p>
                    )}
                    <p className="text-xs text-green-600 mt-1 hidden sm:block">Base de conhecimento</p>
                  </div>
                  <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600">
                    <Database className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-3 sm:p-6 rounded-2xl shadow-lg border border-green-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">Documentos Prontos</p>
                    {loadingDocuments ? (
                      <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-gray-400" />
                    ) : (
                      <p className="text-xl sm:text-3xl font-bold text-green-600">{stats.readyDocuments}</p>
                    )}
                    <p className="text-xs text-green-600 mt-1 hidden sm:block">Treinamento ativo</p>
                  </div>
                  <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600">
                    <Database className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-3 sm:p-6 rounded-2xl shadow-lg border border-green-100 relative">
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
                    {loadingDocuments ? (
                      <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-gray-400" />
                    ) : (
                      <p className="text-xl sm:text-3xl font-bold text-gray-900">{stats.totalChunks}</p>
                    )}
                    <p className="text-xs text-gray-600 mt-1 hidden sm:block">Segmentos de texto indexados</p>
                  </div>
                  <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-r from-gray-500 to-gray-600">
                    <Database className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Documents Content */}
            <div className="min-h-[600px]">
              <GeneralDocuments 
                documents={generalDocuments}
                onDocumentsChange={setGeneralDocuments}
                onUploadComplete={loadDocumentsData}
              />
            </div>
          </>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl max-w-sm sm:max-w-md w-full p-4 sm:p-6 shadow-2xl border border-white/20 mx-4">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center space-x-2">
              <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              <span>Criar Novo Usuário</span>
            </h3>
            
            <form onSubmit={handleCreateUser} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Nome Completo</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                  placeholder="Digite o nome completo"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Email Institucional</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                  placeholder="usuario@uem.ac.mz"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Perfil de Acesso</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as any }))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                >
                  <option value="manager">Gestor</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Apenas gestores podem ser criados aqui. Estudantes vêm de outra base de dados.</p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Senha Inicial</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                  placeholder="Digite uma senha segura"
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4 sm:pt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 text-sm sm:text-base"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg text-sm sm:text-base"
                >
                  Criar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl max-w-sm sm:max-w-md w-full p-4 sm:p-6 shadow-2xl border border-white/20 mx-4">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center space-x-2">
              <Edit3 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              <span>Editar Usuário</span>
            </h3>
            
            <form onSubmit={handleUpdateUser} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Nome Completo</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Email Institucional</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Perfil de Acesso</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, role: e.target.value as any }) : null)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                >
                  <option value="manager">Gestor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Status da Conta</label>
                <select
                  value={editingUser.status}
                  onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, status: e.target.value as any }) : null)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="suspended">Suspenso</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4 sm:pt-6">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 text-sm sm:text-base"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg text-sm sm:text-base"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="py-3 sm:py-4 text-center relative z-10">
        <p className="text-xs sm:text-sm text-gray-600">
          Powered by <a href="https://interbantu.com" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: '#cf5001' }}>InterBantu</a>
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;