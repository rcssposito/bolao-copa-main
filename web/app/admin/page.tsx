'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  getAllUsers, 
  createUser as apiCreateUser, 
  updateUserAdmin, 
  deleteUser as apiDeleteUser, 
  loginUser,
  getTags,
  saveTags,
  triggerSync,
  getCompetitions,
  updateActiveCompetition,
  User,
  TagItem
} from '@/lib/api';



import { 
  ArrowLeft, 
  Add, 
   TrashCan, 
   Edit, 
   Checkmark, 
   Close,
   Renew,
   WarningFilled
 } from '@carbon/icons-react';

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // Create user form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserGroup, setNewUserGroup] = useState('');
  
  // Edit user state
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editGroup, setEditGroup] = useState('');

  // Tag (Group) Management State
  const [tags, setTags] = useState<TagItem[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagCode, setNewTagCode] = useState('');
  const [savingTag, setSavingTag] = useState(false);

  // Syncing State
  const [syncing, setSyncing] = useState(false);

  // Competitions States
  const [competitions, setCompetitions] = useState<{ id: number; name: string; code: string; emblem: string }[]>([]);
  const [activeCompCode, setActiveCompCode] = useState<string>('WC');
  const [loadingComps, setLoadingComps] = useState<boolean>(false);
  const [changingComp, setChangingComp] = useState<boolean>(false);

  // Custom confirmation modal states for active competition
  const [isConfirmCompModalOpen, setIsConfirmCompModalOpen] = useState(false);
  const [compConfirmText, setCompConfirmText] = useState('');
  const [compToSync, setCompToSync] = useState('');

  // Edit User Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUserToEdit, setSelectedUserToEdit] = useState<User | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserGroup, setEditUserGroup] = useState('');
  const [editUserIsAdmin, setEditUserIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      setAuthLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        window.location.href = '/';
        return;
      }
      
      const email = session.user.email!;
      const nome = session.user.user_metadata.full_name || email.split('@')[0];
      
      // Get detailed user profile from backend
      const res = await loginUser({ email, nome });
      const userProfile = res.data;
      
      if (!userProfile.is_admin) {
        alert('Acesso negado: Você não possui privilégios de administrador.');
        window.location.href = '/';
        return;
      }
      
      setIsAuthorized(true);
      await Promise.all([loadUsers(), loadTags(), loadCompetitions()]);
    } catch (error) {
      console.error('Erro ao autenticar administrador:', error);
      window.location.href = '/';
    } finally {
      setAuthLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await getAllUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const response = await getTags();
      setTags(response.data);
    } catch (error) {
      console.error('Erro ao carregar tags/grupos:', error);
    }
  };

  const loadCompetitions = async () => {
    try {
      setLoadingComps(true);
      const res = await getCompetitions();
      setCompetitions(res.data.competitions);
      setActiveCompCode(res.data.active);
    } catch (error) {
      console.error('Erro ao carregar competições:', error);
    } finally {
      setLoadingComps(false);
    }
  };

  const openConfirmCompModal = (code: string) => {
    setCompToSync(code);
    setCompConfirmText('');
    setIsConfirmCompModalOpen(true);
  };

  const handleToggleComp = (code: string) => {
    let list = activeCompCode.split(',').map(c => c.trim()).filter(c => c.length > 0);
    if (list.includes(code)) {
      list = list.filter(c => c !== code);
    } else {
      list.push(code);
    }
    setActiveCompCode(list.join(','));
  };

  const handleSaveCompetition = async (code: string) => {
    setIsConfirmCompModalOpen(false);
    try {
      setChangingComp(true);
      const res = await updateActiveCompetition(code);
      setActiveCompCode(code);
      alert(res.data.message || 'Competições ativas atualizadas e sincronizadas com sucesso!');
      await loadUsers();
    } catch (error: any) {
      console.error('Erro ao salvar competição ativa:', error);
      alert(error.response?.data?.error || 'Erro ao salvar competição.');
    } finally {
      setChangingComp(false);
    }
  };

  const createTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim() || !newTagCode.trim()) return;

    // Check if code or name already exists
    const exists = tags.some(
      t => t.nome.toLowerCase() === newTagName.trim().toLowerCase() ||
           t.codigo.toLowerCase() === newTagCode.trim().toLowerCase()
    );

    if (exists) {
      alert('Nome ou Código do grupo já cadastrado!');
      return;
    }

    const updatedTags = [...tags, { nome: newTagName.trim(), codigo: newTagCode.trim().toUpperCase() }];
    try {
      setSavingTag(true);
      await saveTags(updatedTags);
      setTags(updatedTags);
      setNewTagName('');
      setNewTagCode('');
      alert('Grupo cadastrado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar tag:', error);
      alert('Não foi possível salvar o grupo.');
    } finally {
      setSavingTag(false);
    }
  };

  const deleteTag = async (tagName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o grupo "${tagName}"?`)) return;

    const updatedTags = tags.filter(t => t.nome !== tagName);
    try {
      setSavingTag(true);
      await saveTags(updatedTags);
      setTags(updatedTags);
      alert('Grupo excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir tag:', error);
      alert('Não foi possível excluir o grupo.');
    } finally {
      setSavingTag(false);
    }
  };

  const handleManualSync = async () => {
    try {
      setSyncing(true);
      await triggerSync();
      alert('Sincronização com FIFA realizada com sucesso! As notas dos usuários foram recalculadas.');
      await loadUsers();
    } catch (error: any) {
      console.error('Erro ao sincronizar resultados:', error);
      alert(error.response?.data?.error || 'Erro ao sincronizar resultados.');
    } finally {
      setSyncing(false);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUserToEdit(user);
    setEditUserName(user.nome);
    setEditUserEmail(user.email);
    setEditUserGroup(user.grupo || '');
    setEditUserIsAdmin(user.is_admin);
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserToEdit) return;

    try {
      setLoading(true);
      await updateUserAdmin(selectedUserToEdit.id, {
        nome: editUserName,
        email: editUserEmail,
        grupo: editUserGroup || null,
        is_admin: editUserIsAdmin
      });
      setIsEditModalOpen(false);
      setSelectedUserToEdit(null);
      await loadUsers();
      alert('Usuário atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      alert('Não foi possível atualizar o usuário.');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    try {
      const response = await apiCreateUser({
        nome: newUserName,
        email: newUserEmail,
        grupo: newUserGroup || null,
        pagou: false,
        is_admin: false
      });

      if (response.status === 200 || response.status === 201 || response.status === 210) {
        setNewUserName('');
        setNewUserEmail('');
        setNewUserGroup('');
        loadUsers();
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      alert('Erro ao cadastrar usuário. Verifique se o e-mail já existe.');
    }
  };

  const togglePaid = async (userId: string, currentStatus: boolean) => {
    try {
      await updateUserAdmin(userId, { pagou: !currentStatus });
      loadUsers();
    } catch (error) {
      console.error('Erro ao atualizar pagamento:', error);
    }
  };

  const updateGroup = async (userId: string) => {
    try {
      await updateUserAdmin(userId, { grupo: editGroup || null });
      setEditingUser(null);
      setEditGroup('');
      loadUsers();
    } catch (error) {
      console.error('Erro ao atualizar grupo:', error);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja deletar este usuário?')) return;

    try {
      await apiDeleteUser(userId);
      loadUsers();
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mb-4"></div>
        <p className="text-gray-400 font-semibold">Verificando credenciais de admin...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
        <div className="text-xl text-red-500 font-bold">Redirecionando...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0c0c0c] text-gray-100 font-sans antialiased">
      {/* Top Header Navigation */}
      <header className="h-12 w-full bg-[#161616]/80 backdrop-blur-md border-b border-gray-900 fixed top-0 left-0 z-40 flex items-center px-4 justify-between">
        <span className="font-bold text-white tracking-tight">Administração</span>
        
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors font-semibold py-1.5 px-3 bg-transparent border-0 cursor-pointer no-underline"
          >
            <ArrowLeft size={14} />
            Voltar ao Bolão
          </Link>
        </div>
      </header>

        {/* Dashboard Spacing */}
        <div className="pt-16"></div>

        <div className="container mx-auto px-4 py-8 max-w-[1600px]">
          {/* Header Description */}
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">
                ⚙️ Painel Administrativo
              </h1>
              <p className="text-gray-500 font-medium text-sm">
                Gerencie usuários, e-mails de acesso, grupos e pagamentos
              </p>
            </div>
            <button
              type="button"
              onClick={handleManualSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-xs border-0 cursor-pointer disabled:opacity-50 transition-colors"
            >
              <Renew size={16} className={syncing ? "animate-spin" : ""} />
              {syncing ? 'Sincronizando...' : 'Sincronizar Resultados da FIFA'}
            </button>
          </div>

          {/* Active Competition Settings */}
          <div className="glass-card p-6 mb-8 rounded-lg">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              🏆 Competições Ativas do Bolão
            </h2>
            <p className="text-xs text-gray-400 mb-4 font-medium">
              Escolha quais competições da API de Futebol carregar e manter ativas simultaneamente. Novas partidas serão importadas sem apagar os dados dos outros campeonatos.
            </p>
            
            {loadingComps ? (
              <p className="text-xs text-gray-500 font-medium">Carregando campeonatos disponíveis da API...</p>
            ) : (
              <div className="space-y-4 max-w-2xl">
                <label className="text-xs font-bold text-gray-400">Campeonatos Selecionados</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-3 bg-gray-950/45 border border-gray-800 rounded">
                  {competitions.map((comp) => {
                    const isChecked = activeCompCode.split(',').map(c => c.trim()).includes(comp.code);
                    return (
                      <label
                        key={comp.code}
                        className={`flex items-center gap-3 p-2.5 border rounded cursor-pointer transition-all duration-200 select-none ${
                          isChecked
                            ? 'bg-indigo-950/20 border-indigo-500/40 text-white'
                            : 'bg-transparent border-gray-850 hover:bg-white/5 text-gray-400 hover:text-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleComp(comp.code)}
                          disabled={changingComp}
                          className="h-4 w-4 rounded border-gray-850 text-indigo-600 focus:ring-indigo-500 bg-gray-950 accent-indigo-500 cursor-pointer"
                        />
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold">{comp.name}</span>
                          <span className="text-[10px] text-gray-500 font-semibold">{comp.code}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => openConfirmCompModal(activeCompCode)}
                    disabled={changingComp || !activeCompCode.trim()}
                    className="h-10 px-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-xs border-0 cursor-pointer disabled:opacity-50 transition-colors flex items-center justify-center"
                  >
                    {changingComp ? 'Atualizando...' : 'Definir e Sincronizar'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Add User Form using Carbon Tile */}
          <div className="glass-card p-6 mb-8 rounded-lg">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Add size={18} className="text-indigo-400" /> Adicionar Usuário Manualmente
            </h2>
            <form onSubmit={createUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-1">
                <div className="flex flex-col gap-1 w-full text-left">
                  <label htmlFor="new-username" className="text-xs font-bold text-gray-400">Nome</label>
                  <input
                    id="new-username"
                    type="text"
                    placeholder="Nome do usuário"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    required
                    className="w-full h-10 px-3 bg-[#161616] border border-gray-800 focus:border-blue-500 rounded font-medium text-sm text-white placeholder-gray-600 outline-none transition-all"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex flex-col gap-1 w-full text-left">
                  <label htmlFor="new-useremail" className="text-xs font-bold text-gray-400">E-mail (Google Login)</label>
                  <input
                    id="new-useremail"
                    type="email"
                    placeholder="exemplo@gmail.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    required
                    className="w-full h-10 px-3 bg-[#161616] border border-gray-800 focus:border-blue-500 rounded font-medium text-sm text-white placeholder-gray-600 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex flex-col gap-1 w-full text-left">
                  <label htmlFor="new-usergroup" className="text-xs font-bold text-gray-400">Grupo (Opcional)</label>
                  <select
                    id="new-usergroup"
                    value={newUserGroup}
                    onChange={(e) => setNewUserGroup(e.target.value)}
                    className="w-full h-10 px-3 bg-[#161616] border border-gray-800 focus:border-blue-500 rounded font-medium text-sm text-white outline-none transition-all cursor-pointer"
                  >
                    <option value="">Nenhum grupo</option>
                    {tags.map(t => (
                      <option key={t.codigo} value={t.nome}>{t.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="h-10 w-full px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-xs border-0 cursor-pointer disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <Add size={16} />
                Cadastrar
              </button>
            </form>
          </div>

          {/* Tag Management Form & List using Carbon Tile */}
          <div className="glass-card p-6 mb-8 rounded-lg">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              👥 Gerenciar Grupos (Tags)
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form to Create Tag */}
              <div className="lg:col-span-1 border-b lg:border-b-0 lg:border-r border-gray-800 pb-6 lg:pb-0 lg:pr-6">
                <h3 className="text-sm font-bold text-gray-300 mb-3">Criar Novo Grupo</h3>
                <form onSubmit={createTag} className="space-y-4">
                  <div className="flex flex-col gap-1 w-full text-left">
                    <label htmlFor="new-tagname" className="text-xs font-bold text-gray-400">Nome do Grupo</label>
                    <input
                      id="new-tagname"
                      type="text"
                      placeholder="Ex: Franga Toys"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      required
                      className="w-full h-10 px-3 bg-[#161616] border border-gray-800 focus:border-blue-500 rounded font-medium text-sm text-white placeholder-gray-600 outline-none transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1 w-full text-left">
                    <label htmlFor="new-tagcode" className="text-xs font-bold text-gray-400">Código de Ingresso</label>
                    <input
                      id="new-tagcode"
                      type="text"
                      placeholder="Ex: FT2026"
                      value={newTagCode}
                      onChange={(e) => setNewTagCode(e.target.value)}
                      required
                      className="w-full h-10 px-3 bg-[#161616] border border-gray-800 focus:border-blue-500 rounded font-medium text-sm text-white placeholder-gray-600 outline-none transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingTag}
                    className="w-full h-9 px-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded text-xs border-0 cursor-pointer disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Add size={14} />
                    {savingTag ? 'Criando...' : 'Criar Grupo'}
                  </button>
                </form>
              </div>

              {/* List of Tags */}
              <div className="lg:col-span-2">
                <h3 className="text-sm font-bold text-gray-300 mb-3">Grupos Cadastrados ({tags.length})</h3>
                <div className="overflow-y-auto max-h-56 border border-gray-800 bg-gray-950/40 rounded p-4">
                  {tags.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-6">Nenhum grupo cadastrado. Crie um grupo para começar.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {tags.map((tag) => (
                        <div key={tag.codigo} className="flex justify-between items-center bg-slate-900/50 p-2.5 border border-gray-800 rounded">
                          <div>
                            <div className="text-xs font-bold text-white">{tag.nome}</div>
                            <div className="text-[10px] text-indigo-400 font-medium mt-0.5">Código: <span className="font-bold text-gray-300">{tag.codigo}</span></div>
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteTag(tag.nome)}
                            title="Excluir grupo"
                            className="h-8 w-8 rounded bg-transparent hover:bg-red-950/30 text-red-400 hover:text-red-300 flex items-center justify-center border border-red-500/10 hover:border-red-500/25 transition-colors cursor-pointer"
                          >
                            <TrashCan size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Users List using Carbon Table styled markup */}
          <div className="glass-panel rounded-lg p-0 overflow-hidden shadow-xl">
            <div className="px-6 py-4 bg-slate-900/80 border-b border-gray-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">
                👥 Participantes Cadastrados ({users.length})
              </h2>
              <button
                type="button"
                onClick={loadUsers}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-transparent hover:bg-white/5 text-gray-400 hover:text-white font-semibold rounded text-xs border border-transparent hover:border-gray-800 cursor-pointer transition-colors"
              >
                <Renew size={14} />
                Atualizar Lista
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-950/60 border-b border-gray-800 text-gray-400 text-xs font-semibold uppercase tracking-wider text-left">
                    <th className="py-4 px-6">Nome / E-mail</th>
                    <th className="py-4 px-6 w-40">Grupo</th>
                    <th className="py-4 px-6 text-center w-24">Pontos</th>
                    <th className="py-4 px-6 text-center w-36">Pagamento</th>
                    <th className="py-4 px-6 text-center w-24">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 text-gray-300">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-900/20">
                      {/* Name / Email */}
                      <td className="py-3.5 px-6">
                        <div className="font-bold text-white">{user.nome}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </td>

                      {/* Group Editing Inline */}
                      <td className="py-3.5 px-6">
                        {editingUser === user.id ? (
                          <div className="flex gap-1.5 items-center">
                            <input
                              type="text"
                              value={editGroup}
                              onChange={(e) => setEditGroup(e.target.value)}
                              className="px-2 py-1 bg-gray-950 border border-gray-800 text-white rounded text-xs w-20 outline-none focus:ring-1 focus:ring-indigo-500"
                              placeholder="Grupo"
                            />
                            <button
                              onClick={() => updateGroup(user.id)}
                              className="text-green-500 hover:text-green-400 p-1"
                              title="Salvar"
                            >
                              <Checkmark size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingUser(null);
                                setEditGroup('');
                              }}
                              className="text-red-500 hover:text-red-400 p-1"
                              title="Cancelar"
                            >
                              <Close size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-200">
                              {user.grupo || '-'}
                            </span>
                            <button
                              onClick={() => {
                                setEditingUser(user.id);
                                setEditGroup(user.grupo || '');
                              }}
                              className="text-indigo-400 hover:text-indigo-300 p-1"
                              title="Editar grupo"
                            >
                              <Edit size={14} />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Points */}
                      <td className="py-3.5 px-6 text-center font-bold text-white">
                        {user.pontos_total} pts
                      </td>

                      {/* Payment Toggle using Carbon Tag buttons */}
                      <td className="py-3.5 px-6 text-center">
                        <button
                          type="button"
                          onClick={() => togglePaid(user.id, user.pagou)}
                          className="cursor-pointer border-0 bg-transparent p-0 inline-block focus:outline-none"
                        >
                          <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors duration-200 ${
                            user.pagou 
                              ? 'bg-green-950/45 text-green-400 border border-green-500/20 hover:bg-green-950/65' 
                              : 'bg-red-950/45 text-red-400 border border-red-500/20 hover:bg-red-950/65'
                          }`}>
                            {user.pagou ? 'Pago' : 'Pendente'}
                          </span>
                        </button>
                      </td>

                      {/* Ações: Editar e Deletar */}
                      <td className="py-3.5 px-6 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            title="Editar participante"
                            className="h-8 w-8 rounded bg-transparent hover:bg-indigo-950/30 text-indigo-400 hover:text-indigo-300 flex items-center justify-center border border-indigo-500/10 hover:border-indigo-500/25 transition-colors cursor-pointer"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteUser(user.id)}
                            disabled={user.is_admin}
                            title="Deletar participante"
                            className="h-8 w-8 rounded bg-transparent hover:bg-red-950/30 text-red-400 hover:text-red-300 flex items-center justify-center border border-red-500/10 hover:border-red-500/25 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <TrashCan size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg font-bold">Nenhum usuário cadastrado</p>
                <p className="text-sm mt-1">
                  Adicione o primeiro participante usando o formulário acima
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Custom Edit User Modal */}
        {isEditModalOpen && selectedUserToEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
            <div className="w-full max-w-md bg-slate-900 border border-gray-800 rounded-lg shadow-2xl p-6 overflow-hidden">
              <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Edit size={20} className="text-indigo-400" />
                  Editar Participante
                </h3>
                <button 
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedUserToEdit(null);
                  }}
                  className="text-gray-400 hover:text-white bg-transparent border-0 cursor-pointer p-1"
                >
                  <Close size={20} />
                </button>
              </div>
              
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div className="flex flex-col gap-1 w-full text-left">
                  <label htmlFor="edit-username" className="text-xs font-bold text-gray-400">Nome</label>
                  <input
                    id="edit-username"
                    type="text"
                    value={editUserName}
                    onChange={(e) => setEditUserName(e.target.value)}
                    required
                    className="w-full h-10 px-3 bg-[#161616] border border-gray-800 focus:border-blue-500 rounded font-medium text-sm text-white outline-none transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1 w-full text-left">
                  <label htmlFor="edit-useremail" className="text-xs font-bold text-gray-400">E-mail de Acesso</label>
                  <input
                    id="edit-useremail"
                    type="email"
                    value={editUserEmail}
                    onChange={(e) => setEditUserEmail(e.target.value)}
                    required
                    className="w-full h-10 px-3 bg-[#161616] border border-gray-800 focus:border-blue-500 rounded font-medium text-sm text-white outline-none transition-all"
                  />
                </div>
                
                {/* Group dropdown populated with tags */}
                <div className="flex flex-col gap-1 w-full text-left">
                  <label htmlFor="edit-usergroup" className="text-xs font-bold text-gray-400">Grupo / Tag</label>
                  <select
                    id="edit-usergroup"
                    value={editUserGroup}
                    onChange={(e) => setEditUserGroup(e.target.value)}
                    className="w-full h-10 px-3 bg-[#161616] border border-gray-800 focus:border-blue-500 rounded font-medium text-sm text-white outline-none transition-all cursor-pointer"
                  >
                    <option value="">Nenhum grupo</option>
                    {tags.map(t => (
                      <option key={t.codigo} value={t.nome}>{t.nome}</option>
                    ))}
                  </select>
                </div>

                {/* Is Admin Toggle */}
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs font-bold text-gray-400">Privilégios de Administrador</span>
                  <button
                    type="button"
                    onClick={() => setEditUserIsAdmin(!editUserIsAdmin)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      editUserIsAdmin ? 'bg-indigo-600' : 'bg-gray-800'
                    }`}
                  >
                    <span className="sr-only">Privilégios de Administrador</span>
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        editUserIsAdmin ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setSelectedUserToEdit(null);
                    }}
                    className="flex-1 py-2.5 bg-transparent hover:bg-white/5 text-gray-300 font-bold rounded text-xs border border-gray-850 cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-xs border-0 cursor-pointer transition-colors"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Custom Confirmation Modal for Active Competition */}
        {isConfirmCompModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
            <div className="w-full max-w-md bg-slate-900 border border-red-500/20 rounded-lg shadow-2xl p-6 overflow-hidden glass-panel">
              <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-3">
                <h3 className="text-lg font-bold text-red-500 flex items-center gap-2">
                  <WarningFilled size={20} className="text-red-500" />
                  Confirmar Sincronização
                </h3>
                <button 
                  type="button"
                  onClick={() => setIsConfirmCompModalOpen(false)}
                  className="text-gray-400 hover:text-white bg-transparent border-0 cursor-pointer p-1"
                >
                  <Close size={20} />
                </button>
              </div>
              
              <div className="space-y-4 text-sm text-gray-300">
                <p>
                  Você está prestes a ativar e sincronizar as competições: <span className="font-bold text-white">{compToSync.split(',').join(', ')}</span>.
                </p>
                <div className="bg-red-950/15 border border-red-500/10 p-3.5 rounded text-xs text-red-400 font-medium">
                  <strong>Atenção:</strong> Esta operação fará requisições adicionais à API e importará novas partidas para todas as ligas selecionadas. Certifique-se de que a chave da API está correta.
                </div>
                <p className="text-xs">
                  Para confirmar, digite <span className="font-bold text-white font-mono">CONFIRMAR</span> abaixo:
                </p>
                
                <input
                  id="confirm-comp-input"
                  type="text"
                  placeholder="Digite CONFIRMAR"
                  value={compConfirmText}
                  onChange={(e) => setCompConfirmText(e.target.value)}
                  className="w-full h-10 px-3 bg-[#161616] border border-gray-800 focus:border-red-500 rounded font-bold text-sm text-white placeholder-gray-600 outline-none transition-all uppercase tracking-wider text-center"
                />

                <div className="flex gap-3 pt-4 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsConfirmCompModalOpen(false)}
                    className="flex-1 py-2.5 bg-transparent hover:bg-white/5 text-gray-300 font-bold rounded text-xs border border-gray-850 cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={compConfirmText !== 'CONFIRMAR'}
                    onClick={() => handleSaveCompetition(compToSync)}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-xs border-0 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
  );
}
