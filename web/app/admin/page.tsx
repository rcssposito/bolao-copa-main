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
  Button, 
  TextInput, 
  Select, 
  SelectItem, 
  Tile, 
  Loading, 
  Tag,
  Header,
  HeaderName,
  Theme,
  Toggle,
  Modal
} from '@carbon/react';

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

  const handleSaveCompetition = async (code: string) => {
    setIsConfirmCompModalOpen(false);
    try {
      setChangingComp(true);
      const res = await updateActiveCompetition(code);
      setActiveCompCode(code);
      alert(res.data.message || 'Competição ativa atualizada e sincronizada com sucesso!');
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
      <Theme theme="g100">
        <div className="min-h-screen bg-[#0c0c0c] flex flex-col items-center justify-center">
          <Loading withOverlay={false} description="Verificando..." />
          <p className="text-gray-400 font-semibold mt-4">Verificando credenciais de admin...</p>
        </div>
      </Theme>
    );
  }

  if (!isAuthorized) {
    return (
      <Theme theme="g100">
        <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
          <div className="text-xl text-red-500 font-bold">Redirecionando...</div>
        </div>
      </Theme>
    );
  }

  return (
    <Theme theme="g100">
      <main className="min-h-screen bg-[#0c0c0c] text-gray-100 font-sans antialiased">
        {/* Carbon Header */}
        <Header aria-label="Painel Admin">
          <HeaderName href="#" prefix="">
            Administração
          </HeaderName>
          <div className="absolute right-4 top-0 h-full flex items-center">
            <Button
              as={Link}
              href="/"
              kind="ghost"
              size="sm"
              renderIcon={ArrowLeft}
              className="text-xs font-semibold px-3 py-1.5 h-8 text-gray-400 hover:text-white flex items-center"
            >
              Voltar ao Bolão
            </Button>
          </div>
        </Header>

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
            <Button
              kind="primary"
              size="md"
              renderIcon={Renew}
              onClick={handleManualSync}
              disabled={syncing}
              className="bg-indigo-600 hover:bg-indigo-700 font-bold border-0"
            >
              {syncing ? 'Sincronizando...' : 'Sincronizar Resultados da FIFA'}
            </Button>
          </div>

          {/* Active Competition Settings */}
          <Tile className="glass-card p-6 mb-8 rounded-lg">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              🏆 Competição Ativa do Bolão
            </h2>
            <p className="text-xs text-gray-400 mb-4 font-medium">
              Escolha qual competição da API de Futebol carregar e manter ativa. Novas partidas serão importadas sem apagar os dados dos outros campeonatos.
            </p>
            
            {loadingComps ? (
              <p className="text-xs text-gray-500 font-medium">Carregando campeonatos disponíveis da API...</p>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 items-end max-w-xl">
                <div className="flex-1 w-full">
                  <Select
                    id="active-comp-select"
                    labelText="Campeonato Selecionado"
                    value={activeCompCode}
                    onChange={(e) => setActiveCompCode(e.target.value)}
                    disabled={changingComp}
                  >
                    {competitions.map(comp => (
                      <SelectItem 
                        key={comp.code} 
                        value={comp.code} 
                        text={`${comp.name} (${comp.code})`} 
                      />
                    ))}
                  </Select>
                </div>
                <Button
                  kind="danger"
                  onClick={() => openConfirmCompModal(activeCompCode)}
                  disabled={changingComp || !activeCompCode}
                  className="h-10 px-6 font-bold flex items-center justify-center cds--btn--danger"
                >
                  {changingComp ? 'Atualizando...' : 'Definir e Sincronizar'}
                </Button>
              </div>
            )}
          </Tile>

          {/* Add User Form using Carbon Tile */}
          <Tile className="glass-card p-6 mb-8 rounded-lg">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Add size={18} className="text-indigo-400" /> Adicionar Usuário Manualmente
            </h2>
            <form onSubmit={createUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-1">
                <TextInput
                  id="new-username"
                  labelText="Nome"
                  placeholder="Nome do usuário"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-1">
                <TextInput
                  id="new-useremail"
                  labelText="E-mail (Google Login)"
                  placeholder="exemplo@gmail.com"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Select
                  id="new-usergroup"
                  labelText="Grupo (Opcional)"
                  value={newUserGroup}
                  onChange={(e) => setNewUserGroup(e.target.value)}
                >
                  <SelectItem value="" text="Nenhum grupo" />
                  {tags.map(t => (
                    <SelectItem key={t.codigo} value={t.nome} text={t.nome} />
                  ))}
                </Select>
              </div>

              <Button
                type="submit"
                size="md"
                renderIcon={Add}
                className="bg-indigo-600 hover:bg-indigo-700 font-bold"
              >
                Cadastrar
              </Button>
            </form>
          </Tile>

          {/* Tag Management Form & List using Carbon Tile */}
          <Tile className="glass-card p-6 mb-8 rounded-lg">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              👥 Gerenciar Grupos (Tags)
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form to Create Tag */}
              <div className="lg:col-span-1 border-b lg:border-b-0 lg:border-r border-gray-800 pb-6 lg:pb-0 lg:pr-6">
                <h3 className="text-sm font-bold text-gray-300 mb-3">Criar Novo Grupo</h3>
                <form onSubmit={createTag} className="space-y-4">
                  <TextInput
                    id="new-tagname"
                    labelText="Nome do Grupo"
                    placeholder="Ex: Franga Toys"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    required
                  />
                  <TextInput
                    id="new-tagcode"
                    labelText="Código de Ingresso"
                    placeholder="Ex: FT2026"
                    value={newTagCode}
                    onChange={(e) => setNewTagCode(e.target.value)}
                    required
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={savingTag}
                    renderIcon={Add}
                    className="w-full bg-orange-600 hover:bg-orange-700 font-bold border-0"
                  >
                    {savingTag ? 'Criando...' : 'Criar Grupo'}
                  </Button>
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
                          <Button
                            kind="danger--ghost"
                            size="sm"
                            hasIconOnly
                            iconDescription="Excluir grupo"
                            renderIcon={TrashCan}
                            onClick={() => deleteTag(tag.nome)}
                            className="hover:bg-red-950/20 text-red-400 border border-red-500/10 hover:border-red-500/20"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Tile>

          {/* Users List using Carbon Table styled markup */}
          <Tile className="glass-panel rounded-lg p-0 overflow-hidden shadow-xl">
            <div className="px-6 py-4 bg-slate-900/80 border-b border-gray-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">
                👥 Participantes Cadastrados ({users.length})
              </h2>
              <Button
                kind="ghost"
                size="sm"
                renderIcon={Renew}
                onClick={loadUsers}
                className="text-gray-400 hover:text-white"
              >
                Atualizar Lista
              </Button>
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
                          <Tag
                            type={user.pagou ? "green" : "red"}
                            className="font-bold cursor-pointer text-xs uppercase"
                          >
                            {user.pagou ? 'Pago' : 'Pendente'}
                          </Tag>
                        </button>
                      </td>

                      {/* Ações: Editar e Deletar */}
                      <td className="py-3.5 px-6 text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            kind="ghost"
                            size="sm"
                            hasIconOnly
                            iconDescription="Editar participante"
                            renderIcon={Edit}
                            onClick={() => openEditModal(user)}
                            className="hover:bg-indigo-950/20 text-indigo-400 border border-indigo-500/10 hover:border-indigo-500/20"
                          />
                          <Button
                            kind="danger--ghost"
                            size="sm"
                            hasIconOnly
                            iconDescription="Deletar participante"
                            renderIcon={TrashCan}
                            disabled={user.is_admin}
                            onClick={() => deleteUser(user.id)}
                            className="hover:bg-red-950/20 text-red-400 border border-red-500/10 hover:border-red-500/20"
                          />
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
          </Tile>
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
                <TextInput
                  id="edit-username"
                  labelText="Nome"
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  required
                />
                <TextInput
                  id="edit-useremail"
                  labelText="E-mail de Acesso"
                  value={editUserEmail}
                  onChange={(e) => setEditUserEmail(e.target.value)}
                  required
                />
                
                {/* Group dropdown populated with tags */}
                <Select
                  id="edit-usergroup"
                  labelText="Grupo / Tag"
                  value={editUserGroup}
                  onChange={(e) => setEditUserGroup(e.target.value)}
                >
                  <SelectItem value="" text="Nenhum grupo" />
                  {tags.map(t => (
                    <SelectItem key={t.codigo} value={t.nome} text={t.nome} />
                  ))}
                </Select>

                {/* Is Admin Toggle */}
                <div className="pt-2">
                  <Toggle
                    id="edit-userisadmin"
                    labelText="Privilégios de Administrador"
                    labelA="Não"
                    labelB="Sim"
                    toggled={editUserIsAdmin}
                    onToggle={(checked) => setEditUserIsAdmin(checked)}
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-800">
                  <Button
                    type="button"
                    kind="secondary"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setSelectedUserToEdit(null);
                    }}
                    className="flex-1 font-bold"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 font-bold border-0"
                  >
                    Salvar Alterações
                  </Button>
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
                  Você está prestes a ativar e sincronizar a competição <span className="font-bold text-white">{compToSync}</span>.
                </p>
                <div className="bg-red-950/15 border border-red-500/10 p-3.5 rounded text-xs text-red-400 font-medium">
                  <strong>Atenção:</strong> Esta operação fará requisições adicionais à API e importará novas partidas. Certifique-se de que a chave da API está correta.
                </div>
                <p className="text-xs">
                  Para confirmar, digite <span className="font-bold text-white font-mono">CONFIRMAR</span> abaixo:
                </p>
                
                <TextInput
                  id="confirm-comp-input"
                  labelText=""
                  hideLabel
                  placeholder="Digite CONFIRMAR"
                  value={compConfirmText}
                  onChange={(e) => setCompConfirmText(e.target.value)}
                  className="w-full font-bold uppercase tracking-wider"
                />

                <div className="flex gap-3 pt-4 border-t border-gray-800">
                  <Button
                    type="button"
                    kind="secondary"
                    onClick={() => setIsConfirmCompModalOpen(false)}
                    className="flex-1 font-bold"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    kind="danger"
                    disabled={compConfirmText !== 'CONFIRMAR'}
                    onClick={() => handleSaveCompetition(compToSync)}
                    className="flex-1 font-bold bg-red-600 hover:bg-red-700 border-red-600 cds--btn--danger"
                  >
                    Confirmar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </Theme>
  );
}
