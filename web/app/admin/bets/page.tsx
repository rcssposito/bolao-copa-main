'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  getAllBets,
  getTags,
  loginUser,
  getCompetitions,
  updateBet,
  AdminBet,
  TagItem
} from '@/lib/api';

const STAGE_LABELS: Record<string, string> = {
  'GROUP_STAGE': 'Fase de Grupos',
  'LAST_32': 'Fase de 32 (16-Avos)',
  'LAST_16': 'Oitavas de Final',
  'QUARTER_FINALS': 'Quartas de Final',
  'SEMI_FINALS': 'Semifinais',
  'THIRD_PLACE': 'Terceiro Lugar',
  'FINAL': 'Grande Final'
};

import { 
  ArrowLeft, 
  Renew,
  Edit
} from '@carbon/icons-react';

// Helper function to map team name to flag image URL from FlagCDN
const getFlagUrl = (teamName: string): string => {
  if (!teamName) return '';
  const normalized = teamName.toLowerCase().trim();
  
  // Mapping of common team/club names to ISO 2-letter country codes
  const mapping: { [key: string]: string } = {
    'mexico': 'mx',
    'méxico': 'mx',
    'south africa': 'za',
    'áfrica do sul': 'za',
    'south korea': 'kr',
    'coréia do sul': 'kr',
    'coreia do sul': 'kr',
    'czechia': 'cz',
    'república tcheca': 'cz',
    'republica tcheca': 'cz',
    'canada': 'ca',
    'canadá': 'ca',
    'bosnia-herzegovina': 'ba',
    'bósnia e herzegovina': 'ba',
    'bosnia and herzegovina': 'ba',
    'united states': 'us',
    'estados unidos': 'us',
    'usa': 'us',
    'paraguay': 'py',
    'paraguai': 'py',
    'brazil': 'br',
    'brasil': 'br',
    'argentina': 'ar',
    'france': 'fr',
    'frança': 'fr',
    'germany': 'de',
    'alemanha': 'de',
    'spain': 'es',
    'espanha': 'es',
    'italy': 'it',
    'itália': 'it',
    'portugal': 'pt',
    'england': 'gb',
    'inglaterra': 'gb',
    'belgium': 'be',
    'bélgica': 'be',
    'croatia': 'hr',
    'croácia': 'hr',
    'denmark': 'dk',
    'dinamarca': 'dk',
    'netherlands': 'nl',
    'holanda': 'nl',
    'países baixos': 'nl',
    'paises baixos': 'nl',
    'uruguay': 'uy',
    'uruguaia': 'uy',
    'uruguai': 'uy',
    'colombia': 'co',
    'colômbia': 'co',
    'chile': 'cl',
    'peru': 'pe',
    'ecuador': 'ec',
    'equador': 'ec',
    'venezuela': 've',
    'bolivia': 'bo',
    'bolívia': 'bo',
    'japan': 'jp',
    'japão': 'jp',
    'china': 'cn',
    'australia': 'au',
    'austrália': 'au',
    'morocco': 'ma',
    'marrocos': 'ma',
    'senegal': 'sn',
    'egypt': 'eg',
    'egito': 'eg',
    'nigeria': 'ng',
    'nigéria': 'ng',
    'cameroon': 'cm',
    'camarões': 'cm',
    'ghana': 'gh',
    'gana': 'gh',
    'switzerland': 'ch',
    'suíça': 'ch',
    'sweden': 'se',
    'suécia': 'se',
    'norway': 'no',
    'noruega': 'no',
    'poland': 'pl',
    'polônia': 'pl',
    'polonia': 'pl',
    'ukraine': 'ua',
    'ucrânia': 'ua',
    'austria': 'at',
    'áustria': 'at',
    'turkey': 'tr',
    'turquia': 'tr',
    'saudi arabia': 'sa',
    'arábia saudita': 'sa',
    'costa rica': 'cr',
    'honduras': 'hn',
    'panama': 'pa',
    'panamá': 'pa',
    'jamaica': 'jm',
    'algeria': 'dz',
    'argélia': 'dz',
    'tunisia': 'tn',
    'tunísia': 'tn',
    'ivory coast': 'ci',
    'costa do marfim': 'ci',
    'cape verde islands': 'cv',
    'cape verde': 'cv',
    'cabo verde': 'cv',
    'congo dr': 'cd',
    'dr congo': 'cd',
    'congo': 'cd',
    'república democrática do congo': 'cd',
    'curaçao': 'cw',
    'curacao': 'cw',
    'haiti': 'ht',
    'iran': 'ir',
    'irã': 'ir',
    'iraq': 'iq',
    'iraque': 'iq',
    'jordan': 'jo',
    'jordânia': 'jo',
    'new zealand': 'nz',
    'nova zelândia': 'nz',
    'qatar': 'qa',
    'catar': 'qa',
    'scotland': 'gb',
    'escócia': 'gb',
    'uzbekistan': 'uz',
    'uzbequistão': 'uz',
    'flamengo': 'br',
    'palmeiras': 'br',
    'são paulo': 'br',
    'sao paulo': 'br',
    'corinthians': 'br',
    'grêmio': 'br',
    'gremio': 'br',
    'internacional': 'br',
    'fluminense': 'br',
    'botafogo': 'br',
    'vasco': 'br',
    'cruzeiro': 'br',
    'atlético-mg': 'br',
    'atletico-mg': 'br',
    'bahia': 'br',
    'fortaleza': 'br',
    'athletico-pr': 'br',
    'cuiabá': 'br',
    'cuiaba': 'br',
    'red bull bragantino': 'br',
    'bragantino': 'br',
    'juventude': 'br',
    'criciúma': 'br',
    'criciuma': 'br',
    'atlético-go': 'br',
    'atletico-go': 'br',
    'vitória': 'br',
    'vitoria': 'br',
    'real madrid': 'es',
    'barcelona': 'es',
    'atlético madrid': 'es',
    'atletico madrid': 'es',
    'manchester city': 'gb',
    'manchester united': 'gb',
    'liverpool': 'gb',
    'arsenal': 'gb',
    'chelsea': 'gb',
    'tottenham': 'gb',
    'bayern munich': 'de',
    'bayern de munique': 'de',
    'borussia dortmund': 'de',
    'bayer leverkusen': 'de',
    'paris saint-germain': 'fr',
    'psg': 'fr',
    'marseille': 'fr',
    'juventus': 'it',
    'inter milan': 'it',
    'ac milan': 'it',
    'milan': 'it',
    'napoli': 'it',
    'roma': 'it',
    'benfica': 'pt',
    'porto': 'pt',
    'sporting': 'pt',
    'ajax': 'nl',
    'psv': 'nl'
  };
  
  const code = mapping[normalized];
  return code ? `https://flagcdn.com/w40/${code}.png` : '';
};

// Convert UTC time to São Paulo/Brasília timezone
const formatSaoPauloTime = (utcTimeString: string) => {
  if (!utcTimeString) return '-';
  try {
    const date = new Date(utcTimeString);
    return date.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Erro ao formatar data para São Paulo:', error);
    return utcTimeString;
  }
};

export default function AdminBetsPage() {
  const [bets, setBets] = useState<AdminBet[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // Filters and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [teamSearch, setTeamSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // newest, oldest, points_desc, points_asc
  const [activeCompetitions, setActiveCompetitions] = useState<{ id: number; name: string; code: string; emblem: string }[]>([]);
  const [selectedCompCode, setSelectedCompCode] = useState('WC');
  const [statusFilter, setStatusFilter] = useState('SCHEDULED');
  const [stageFilter, setStageFilter] = useState('');

  // Modal Editing States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<AdminBet | null>(null);
  const [editHomePrediction, setEditHomePrediction] = useState<string>('');
  const [editAwayPrediction, setEditAwayPrediction] = useState<string>('');
  const [editLoading, setEditLoading] = useState(false);

  const openEditModal = (bet: AdminBet) => {
    setSelectedBet(bet);
    setEditHomePrediction(bet.palpite_casa.toString());
    setEditAwayPrediction(bet.palpite_fora.toString());
    setIsEditModalOpen(true);
  };

  const handleSaveBet = async () => {
    if (!selectedBet) return;
    
    try {
      setEditLoading(true);
      const valCasa = parseInt(editHomePrediction, 10);
      const valFora = parseInt(editAwayPrediction, 10);
      
      if (isNaN(valCasa) || isNaN(valFora)) {
        alert('Por favor, insira palpites válidos.');
        return;
      }
      
      const res = await updateBet(selectedBet.id, {
        palpite_casa: valCasa,
        palpite_fora: valFora
      });
      
      // Update bet in local state
      setBets(prev => prev.map(b => {
        if (b.id === selectedBet.id) {
          return {
            ...b,
            palpite_casa: valCasa,
            palpite_fora: valFora,
            pontos: res.data.pontos
          };
        }
        return b;
      }));
      
      setIsEditModalOpen(false);
      setSelectedBet(null);
    } catch (error: any) {
      console.error('Erro ao atualizar aposta:', error);
      alert('Erro ao salvar palpite: ' + (error.response?.data?.error || error.message));
    } finally {
      setEditLoading(false);
    }
  };

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
      
      const res = await loginUser({ email, nome });
      const userProfile = res.data;
      
      if (!userProfile.is_admin) {
        alert('Acesso negado: Você não possui privilégios de administrador.');
        window.location.href = '/';
        return;
      }
      
      setIsAuthorized(true);
      await Promise.all([loadBets(), loadTags(), loadCompetitionsList()]);
    } catch (error) {
      console.error('Erro ao autenticar administrador:', error);
      window.location.href = '/';
    } finally {
      setAuthLoading(false);
    }
  };

  const loadCompetitionsList = async () => {
    try {
      const res = await getCompetitions();
      const activeListStr = res.data.active || 'WC';
      const activeCodes = activeListStr.split(',').map((c: string) => c.trim()).filter(Boolean);
      const allComps = res.data.competitions || [];
      const activeComps = allComps.filter((c: any) => activeCodes.includes(c.code));
      
      setActiveCompetitions(activeComps);
      if (activeComps.length > 0) {
        setSelectedCompCode(activeComps[0].code);
      }
    } catch (err) {
      console.error('Erro ao carregar competições:', err);
    }
  };

  const loadBets = async () => {
    try {
      setLoading(true);
      const response = await getAllBets();
      setBets(response.data);
    } catch (error) {
      console.error('Erro ao carregar apostas:', error);
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

  // Filter bets based on search input, selected group, and team search
  const filteredBets = bets.filter(bet => {
    const user = bet.users;
    const userName = user?.nome?.toLowerCase() || '';
    const userEmail = user?.email?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    
    // User name or email search filter
    const matchesUser = userName.includes(search) || userEmail.includes(search);
    
    // Group filter
    let matchesGroup = true;
    if (selectedGroup === 'sem_grupo') {
      matchesGroup = !user?.grupo;
    } else if (selectedGroup) {
      const userGroups = user?.grupo?.split(',').map(g => g.trim().toLowerCase()) || [];
      matchesGroup = userGroups.includes(selectedGroup.toLowerCase());
    }
    
    // Team name or match teams search filter
    const match = bet.matches;
    const teamHome = match?.time_casa?.toLowerCase() || '';
    const teamAway = match?.time_fora?.toLowerCase() || '';
    const team = teamSearch.toLowerCase();
    const matchesTeam = teamHome.includes(team) || teamAway.includes(team);

    // Competition filter
    const matchesComp = !selectedCompCode || match?.competition === selectedCompCode;

    // Status filter
    const matchesStatus = !statusFilter || match?.status === statusFilter;

    // Stage filter
    const matchesStage = !stageFilter || match?.stage === stageFilter;
    
    return matchesUser && matchesGroup && matchesTeam && matchesComp && matchesStatus && matchesStage;
  });

  // Sort bets based on selection
  const sortedBets = [...filteredBets].sort((a, b) => {
    if (sortOrder === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sortOrder === 'oldest') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    if (sortOrder === 'points_desc') {
      return (b.pontos || 0) - (a.pontos || 0);
    }
    if (sortOrder === 'points_asc') {
      return (a.pontos || 0) - (b.pontos || 0);
    }
    return 0;
  });

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
        <span className="font-bold text-white tracking-tight">Administração &gt; Apostas</span>
        
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors font-semibold py-1.5 px-3 bg-transparent border-0 cursor-pointer no-underline"
          >
            <ArrowLeft size={14} />
            Voltar ao Painel
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
              📝 Visualização de Apostas
            </h1>
            <p className="text-gray-500 font-medium text-sm">
              Consulte os palpites efetuados pelos participantes, horários de envio (fuso de São Paulo) e pontuações obtidas.
            </p>
          </div>
          <button
            type="button"
            onClick={loadBets}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-xs border-0 cursor-pointer disabled:opacity-50 transition-colors"
          >
            <Renew size={16} className={loading ? "animate-spin" : ""} />
            {loading ? 'Atualizando...' : 'Atualizar Apostas'}
          </button>
        </div>

        {/* Filters Panel */}
        <div className="glass-card p-6 mb-8 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Select Competition */}
            <div className="flex flex-col gap-1 w-full text-left">
              <label htmlFor="select-competition" className="text-xs font-bold text-gray-400">
                🏆 Selecionar Competição
              </label>
              <select
                id="select-competition"
                value={selectedCompCode}
                onChange={(e) => setSelectedCompCode(e.target.value)}
                className="w-full h-10 px-3 bg-[#161616] border border-gray-800 focus:border-blue-500 rounded font-medium text-sm text-white outline-none transition-all cursor-pointer"
              >
                {activeCompetitions.map(c => (
                  <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>

            {/* Filter by Status */}
            <div className="flex flex-col gap-1 w-full text-left">
              <label htmlFor="filter-status" className="text-xs font-bold text-gray-400">
                ↕️ Filtrar por Status
              </label>
              <select
                id="filter-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 px-3 bg-[#161616] border border-gray-800 focus:border-blue-500 rounded font-medium text-sm text-white outline-none transition-all cursor-pointer"
              >
                <option value="">Todos os status</option>
                <option value="SCHEDULED">Agendado</option>
                <option value="LIVE">Ao Vivo</option>
                <option value="FINISHED">Finalizado</option>
                <option value="POSTPONED">Adiado</option>
              </select>
            </div>

            {/* Filter by Stage */}
            <div className="flex flex-col gap-1 w-full text-left">
              <label htmlFor="filter-stage" className="text-xs font-bold text-gray-400">
                ⚡ Filtrar por Fase
              </label>
              <select
                id="filter-stage"
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="w-full h-10 px-3 bg-[#161616] border border-gray-800 focus:border-blue-500 rounded font-medium text-sm text-white outline-none transition-all cursor-pointer"
              >
                <option value="">Todas as fases</option>
                <option value="GROUP_STAGE">Fase de Grupos</option>
                <option value="LAST_32">Fase de 32 (16-Avos)</option>
                <option value="LAST_16">Oitavas de Final</option>
                <option value="QUARTER_FINALS">Quartas de Final</option>
                <option value="SEMI_FINALS">Semifinais</option>
                <option value="THIRD_PLACE">Terceiro Lugar</option>
                <option value="FINAL">Grande Final</option>
              </select>
            </div>

            {/* Filter by Team/Match */}
            <div className="flex flex-col gap-1 w-full text-left">
              <label htmlFor="search-team" className="text-xs font-bold text-gray-400">
                ⚽ Filtrar por Time / Partida
              </label>
              <input
                id="search-team"
                type="text"
                placeholder="Ex: Brasil, Alemanha..."
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                className="w-full h-10 px-3 bg-[#161616] border border-gray-800 focus:border-blue-500 rounded font-medium text-sm text-white placeholder-gray-600 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Participant */}
            <div className="flex flex-col gap-1 w-full text-left">
              <label htmlFor="search-user" className="text-xs font-bold text-gray-400 flex items-center gap-1">
                🔍 Buscar por Participante
              </label>
              <input
                id="search-user"
                type="text"
                placeholder="Nome ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 px-3 bg-[#161616] border border-gray-800 focus:border-blue-500 rounded font-medium text-sm text-white placeholder-gray-600 outline-none transition-all"
              />
            </div>

            {/* Filter by Group */}
            <div className="flex flex-col gap-1 w-full text-left">
              <label htmlFor="filter-group" className="text-xs font-bold text-gray-400">
                👥 Filtrar por Grupo
              </label>
              <select
                id="filter-group"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full h-10 px-3 bg-[#161616] border border-gray-800 focus:border-blue-500 rounded font-medium text-sm text-white outline-none transition-all cursor-pointer"
              >
                <option value="">Todos os grupos</option>
                <option value="sem_grupo">Sem grupo</option>
                {tags.map(t => (
                  <option key={t.codigo} value={t.nome}>{t.nome}</option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <div className="flex flex-col gap-1 w-full text-left">
              <label htmlFor="sort-order" className="text-xs font-bold text-gray-400">
                ↕️ Ordenação
              </label>
              <select
                id="sort-order"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full h-10 px-3 bg-[#161616] border border-gray-800 focus:border-blue-500 rounded font-medium text-sm text-white outline-none transition-all cursor-pointer"
              >
                <option value="newest">Mais recente</option>
                <option value="oldest">Mais antiga</option>
                <option value="points_desc">Pontuação (Maior &gt; Menor)</option>
                <option value="points_asc">Pontuação (Menor &gt; Maior)</option>
              </select>
            </div>
          </div>

          {/* Filter Status Summary */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-800/60 text-xs text-gray-400">
            <div>
              Mostrando <span className="font-bold text-white">{sortedBets.length}</span> apostas
              {bets.length !== sortedBets.length && (
                <span> (filtrado de um total de <span className="font-bold text-white">{bets.length}</span>)</span>
              )}
            </div>
            {(searchTerm || selectedGroup || teamSearch || statusFilter !== 'SCHEDULED' || stageFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedGroup('');
                  setTeamSearch('');
                  setStatusFilter('SCHEDULED');
                  setStageFilter('');
                  setSortOrder('newest');
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold bg-transparent border-0 cursor-pointer p-0"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        </div>

        {/* Bets List Panel */}
        <div className="glass-panel rounded-lg p-0 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-950/60 border-b border-gray-800 text-gray-400 text-xs font-semibold uppercase tracking-wider text-left">
                  <th className="py-4 px-6">Participante</th>
                  <th className="py-4 px-6">Grupo</th>
                  <th className="py-4 px-6">Partida</th>
                  <th className="py-4 px-6 text-center w-36">Palpite</th>
                  <th className="py-4 px-6 text-center w-36">Placar Real</th>
                  <th className="py-4 px-6 text-center w-28">Pontos Obtidos</th>
                  <th className="py-4 px-6 w-52">Horário da Aposta</th>
                  <th className="py-4 px-6 text-center w-28">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-gray-300">
                {sortedBets.map((bet) => {
                  const user = bet.users;
                  const match = bet.matches;
                  const formattedTime = formatSaoPauloTime(bet.created_at);
                  
                  // Flags for matches
                  const flagCasa = match ? getFlagUrl(match.time_casa) : '';
                  const flagFora = match ? getFlagUrl(match.time_fora) : '';

                  // Status badge styling
                  let statusBadge = null;
                  if (match) {
                    if (match.status === 'FINISHED') {
                      statusBadge = <span className="text-[10px] bg-gray-800 text-gray-400 border border-gray-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider scale-90">Encerrado</span>;
                    } else if (match.status === 'LIVE') {
                      statusBadge = <span className="text-[10px] bg-red-950/45 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider animate-pulse scale-90">Ao Vivo</span>;
                    }
                  }

                  return (
                    <tr key={bet.id} className="hover:bg-slate-900/20">
                      {/* Participant */}
                      <td className="py-3.5 px-6">
                        <div className="font-bold text-white">{user?.nome || <span className="text-gray-600 italic">Desconhecido</span>}</div>
                        <div className="text-xs text-gray-500">{user?.email || '-'}</div>
                      </td>

                      {/* Group */}
                      <td className="py-3.5 px-6">
                        <span className="font-semibold text-gray-200 text-xs">
                          {user?.grupo ? (
                            user.grupo.split(',').map((g: string) => g.trim()).filter(Boolean).join(', ')
                          ) : (
                            <span className="text-gray-600 italic">sem grupo</span>
                          )}
                        </span>
                      </td>

                      {/* Match */}
                      <td className="py-3.5 px-6">
                        {match ? (
                          <div className="flex flex-col gap-0.5 text-left">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5 min-w-[120px] justify-end text-right">
                                <span className="text-xs font-semibold text-gray-200">{match.time_casa}</span>
                                {flagCasa && (
                                  <img
                                    src={flagCasa}
                                    alt={match.time_casa}
                                    className="w-4 h-3 object-cover rounded shadow-sm shrink-0"
                                  />
                                )}
                              </div>
                              <span className="text-[10px] font-bold text-gray-500 uppercase">vs</span>
                              <div className="flex items-center gap-1.5 min-w-[120px]">
                                {flagFora && (
                                  <img
                                    src={flagFora}
                                    alt={match.time_fora}
                                    className="w-4 h-3 object-cover rounded shadow-sm shrink-0"
                                  />
                                )}
                                <span className="text-xs font-semibold text-gray-200">{match.time_fora}</span>
                              </div>
                              {statusBadge && <div className="ml-1 shrink-0">{statusBadge}</div>}
                            </div>
                            {match.stage && (
                              <div className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-wider pl-1">
                                ⚽ {STAGE_LABELS[match.stage] || match.stage}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-600 italic">Partida inexistente</span>
                        )}
                      </td>

                      {/* Prediction */}
                      <td className="py-3.5 px-6 text-center">
                        <div className="inline-flex items-center justify-center bg-indigo-950/20 border border-indigo-500/20 px-3 py-1 rounded-md font-bold text-indigo-300">
                          {bet.palpite_casa} <span className="mx-1.5 text-indigo-500/60">x</span> {bet.palpite_fora}
                        </div>
                      </td>

                      {/* Real Score */}
                      <td className="py-3.5 px-6 text-center">
                        {match && match.placar_casa !== null && match.placar_fora !== null ? (
                          <div className="inline-flex items-center justify-center bg-gray-900 border border-gray-800 px-3 py-1 rounded-md font-bold text-gray-300">
                            {match.placar_casa} <span className="mx-1.5 text-gray-600">x</span> {match.placar_fora}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-600 italic font-medium">Aguardando jogo</span>
                        )}
                      </td>

                      {/* Points Obtained */}
                      <td className="py-3.5 px-6 text-center font-bold">
                        {match?.status === 'FINISHED' ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                            bet.pontos > 0 
                              ? 'bg-emerald-950/45 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-gray-850 text-gray-500 border border-transparent'
                          }`}>
                            +{bet.pontos} pts
                          </span>
                        ) : (
                          <span className="text-xs text-gray-600 font-semibold font-mono">-</span>
                        )}
                      </td>

                      {/* Bet Time (São Paulo timezone) */}
                      <td className="py-3.5 px-6 text-gray-400 text-xs font-medium font-mono">
                        {formattedTime}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-6 text-center">
                        <button
                          type="button"
                          onClick={() => openEditModal(bet)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600/10 hover:bg-blue-600/25 text-blue-400 font-bold rounded text-[11px] border border-blue-500/20 cursor-pointer transition-colors"
                        >
                          <Edit size={12} />
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {sortedBets.length === 0 && (
            <div className="text-center py-16 text-gray-500 bg-gray-950/20">
              <p className="text-lg font-bold">Nenhuma aposta encontrada</p>
              <p className="text-sm mt-1">
                Tente alterar os filtros de pesquisa acima.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Bet Modal */}
      {isEditModalOpen && selectedBet && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full overflow-hidden rounded-xl border border-gray-800 shadow-2xl animate-fade-in text-left">
            {/* Modal Header */}
            <div className="bg-[#161616] px-6 py-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="font-bold text-lg text-white">Editar Palpite</h3>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedBet(null);
                }}
                className="text-gray-400 hover:text-white cursor-pointer bg-transparent border-0 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-5">
              {/* Context: User */}
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Participante</label>
                <div className="text-sm font-semibold text-white mt-0.5">{selectedBet.users?.nome}</div>
                <div className="text-xs text-gray-400">{selectedBet.users?.email}</div>
              </div>

              {/* Context: Match */}
              {selectedBet.matches && (
                <div className="bg-gray-950/45 p-3 rounded-lg border border-gray-800/80">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block mb-1.5">Partida</label>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {getFlagUrl(selectedBet.matches.time_casa) && (
                        <img
                          src={getFlagUrl(selectedBet.matches.time_casa)}
                          alt=""
                          className="w-4 h-3 object-cover rounded shadow-sm shrink-0"
                        />
                      )}
                      <span className="font-semibold text-gray-200">{selectedBet.matches.time_casa}</span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-500">VS</span>
                    <div className="flex items-center gap-2">
                      {getFlagUrl(selectedBet.matches.time_fora) && (
                        <img
                          src={getFlagUrl(selectedBet.matches.time_fora)}
                          alt=""
                          className="w-4 h-3 object-cover rounded shadow-sm shrink-0"
                        />
                      )}
                      <span className="font-semibold text-gray-200">{selectedBet.matches.time_fora}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Inputs */}
              <div className="flex items-center justify-center gap-6 py-2">
                {/* Home Prediction */}
                <div className="flex flex-col items-center gap-1.5 w-20">
                  <span className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-wider truncate w-full">Casa</span>
                  <input
                    type="number"
                    min="0"
                    value={editHomePrediction}
                    onChange={(e) => setEditHomePrediction(e.target.value)}
                    className="w-16 h-12 text-center bg-[#161616] border border-gray-800 focus:border-blue-500 rounded-lg font-bold text-xl text-white outline-none transition-all"
                  />
                </div>

                <span className="text-xl font-bold text-gray-600 mt-5">x</span>

                {/* Away Prediction */}
                <div className="flex flex-col items-center gap-1.5 w-20">
                  <span className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-wider truncate w-full">Fora</span>
                  <input
                    type="number"
                    min="0"
                    value={editAwayPrediction}
                    onChange={(e) => setEditAwayPrediction(e.target.value)}
                    className="w-16 h-12 text-center bg-[#161616] border border-gray-800 focus:border-blue-500 rounded-lg font-bold text-xl text-white outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#161616] px-6 py-4 border-t border-gray-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedBet(null);
                }}
                className="px-4 py-2 border border-gray-800 hover:bg-gray-800 text-gray-400 hover:text-white font-bold rounded text-xs cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveBet}
                disabled={editLoading}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-xs border-0 cursor-pointer disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {editLoading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
