'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  getCompetitions,
  getAvailableMatches,
  updateMatch,
  loginUser,
  Match
} from '@/lib/api';

import { 
  ArrowLeft, 
  Renew,
  Edit,
  Close,
  Checkmark
} from '@carbon/icons-react';

// Helper function to map team name to flag image URL from FlagCDN
const getFlagUrl = (teamName: string): string => {
  if (!teamName) return '';
  const normalized = teamName.toLowerCase().trim();
  
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

export default function AdminMatchesPage() {
  const [activeCompetitions, setActiveCompetitions] = useState<{ id: number; name: string; code: string; emblem: string }[]>([]);
  const [selectedCompCode, setSelectedCompCode] = useState<string>('WC');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Filter and search states
  const [teamSearch, setTeamSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal Editing States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [editHomeScore, setEditHomeScore] = useState<string>('');
  const [editAwayScore, setEditAwayScore] = useState<string>('');
  const [editStatus, setEditStatus] = useState<'SCHEDULED' | 'FINISHED' | 'LIVE' | 'POSTPONED'>('SCHEDULED');
  const [editDecididoPor, setEditDecididoPor] = useState<'REGULAR' | 'EXTRA_TIME' | 'PENALTY_SHOOTOUT'>('REGULAR');
  const [editVencedorFinal, setEditVencedorFinal] = useState<'CASA' | 'FORA' | 'EMPATE' | ''>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  useEffect(() => {
    if (isAuthorized && selectedCompCode) {
      loadMatches(selectedCompCode);
    }
  }, [isAuthorized, selectedCompCode]);

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
      await loadCompetitionsList();
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

  const loadMatches = async (compCode: string) => {
    try {
      setLoading(true);
      const res = await getAvailableMatches(compCode);
      // Sort matches by date ascending
      const sorted = [...res.data].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
      setMatches(sorted);
    } catch (error) {
      console.error('Erro ao carregar jogos:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (match: Match) => {
    setSelectedMatch(match);
    setEditHomeScore(match.placar_casa !== null ? String(match.placar_casa) : '');
    setEditAwayScore(match.placar_fora !== null ? String(match.placar_fora) : '');
    setEditStatus(match.status);
    
    // Check extra fields in DB
    // Cast match since ts types in Match interface might not have decidido_por explicitly
    const matchExt = match as any;
    setEditDecididoPor(matchExt.decidido_por || 'REGULAR');
    setEditVencedorFinal(matchExt.vencedor_final || '');
    
    setIsEditModalOpen(true);
  };

  const handleSaveMatchScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;

    try {
      setSaving(true);
      
      const payload: any = {
        placar_casa: editHomeScore === '' ? null : parseInt(editHomeScore, 10),
        placar_fora: editAwayScore === '' ? null : parseInt(editAwayScore, 10),
        status: editStatus,
        decidido_por: editDecididoPor,
        vencedor_final: editVencedorFinal === '' ? null : editVencedorFinal
      };

      await updateMatch(selectedMatch.id, payload);
      
      setIsEditModalOpen(false);
      setSelectedMatch(null);
      alert('Partida e pontuações atualizadas com sucesso no banco de dados!');
      await loadMatches(selectedCompCode);
    } catch (error: any) {
      console.error('Erro ao salvar placar da partida:', error);
      alert(error.response?.data?.error || 'Erro ao salvar partida.');
    } finally {
      setSaving(false);
    }
  };

  // Filter matches
  const filteredMatches = matches.filter(match => {
    const search = teamSearch.toLowerCase();
    const matchesTeam = match.time_casa.toLowerCase().includes(search) || 
                        match.time_fora.toLowerCase().includes(search);
    
    const matchesStatus = !statusFilter || match.status === statusFilter;
    
    return matchesTeam && matchesStatus;
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
        <span className="font-bold text-white tracking-tight">Administração &gt; Partidas</span>
        
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
              🏆 Lançamento de Resultados
            </h1>
            <p className="text-gray-500 font-medium text-sm">
              Lance ou corrija os resultados das partidas manualmente. O cálculo das pontuações dos usuários ocorre no banco de dados.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadMatches(selectedCompCode)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-xs border-0 cursor-pointer disabled:opacity-50 transition-colors"
          >
            <Renew size={16} className={loading ? "animate-spin" : ""} />
            {loading ? 'Carregando...' : 'Recarregar Jogos'}
          </button>
        </div>

        {/* Filters Panel */}
        <div className="glass-card p-6 mb-8 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            {/* Search Team */}
            <div className="flex flex-col gap-1 w-full text-left">
              <label htmlFor="search-team" className="text-xs font-bold text-gray-400">
                🔍 Buscar por Seleção / Time
              </label>
              <input
                id="search-team"
                type="text"
                placeholder="Ex: México, Brasil..."
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                className="w-full h-10 px-3 bg-[#161616] border border-gray-800 focus:border-blue-500 rounded font-medium text-sm text-white placeholder-gray-600 outline-none transition-all"
              />
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
          </div>
        </div>

        {/* Matches List Panel */}
        <div className="glass-panel rounded-lg p-0 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-950/60 border-b border-gray-800 text-gray-400 text-xs font-semibold uppercase tracking-wider text-left">
                  <th className="py-4 px-6">Partida</th>
                  <th className="py-4 px-6">Data / Horário</th>
                  <th className="py-4 px-6 text-center w-40">Status</th>
                  <th className="py-4 px-6 text-center w-36">Placar Gravado</th>
                  <th className="py-4 px-6 text-center w-40">Forma de Decisão</th>
                  <th className="py-4 px-6 text-center w-32">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-gray-300">
                {filteredMatches.map((match) => {
                  const matchDate = new Date(match.data);
                  const flagCasa = getFlagUrl(match.time_casa);
                  const flagFora = getFlagUrl(match.time_fora);
                  const matchExt = match as any;

                  return (
                    <tr key={match.id} className="hover:bg-slate-900/20">
                      {/* Match Teams */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 min-w-[130px] justify-end text-right">
                            <span className="text-xs font-bold text-gray-200">{match.time_casa}</span>
                            {flagCasa && (
                              <img
                                src={flagCasa}
                                alt=""
                                className="w-5 h-3.5 object-cover rounded-sm border border-gray-800 shrink-0"
                              />
                            )}
                          </div>
                          <span className="text-[10px] font-black text-gray-600 uppercase">vs</span>
                          <div className="flex items-center gap-1.5 min-w-[130px]">
                            {flagFora && (
                              <img
                                src={flagFora}
                                alt=""
                                className="w-5 h-3.5 object-cover rounded-sm border border-gray-800 shrink-0"
                              />
                            )}
                            <span className="text-xs font-bold text-gray-200">{match.time_fora}</span>
                          </div>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-6 font-semibold text-xs text-gray-400">
                        {matchDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} - {matchDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-6 text-center">
                        {match.status === 'FINISHED' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-800 text-gray-400 border border-gray-700">Encerrado</span>
                        ) : match.status === 'LIVE' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-950/45 text-red-400 border border-red-500/20 animate-pulse">Ao Vivo</span>
                        ) : match.status === 'POSTPONED' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-950/45 text-orange-400 border border-orange-500/20">Adiado</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-950/45 text-blue-400 border border-blue-500/20">Agendado</span>
                        )}
                      </td>

                      {/* Score */}
                      <td className="py-3.5 px-6 text-center font-extrabold text-sm">
                        {match.placar_casa !== null && match.placar_fora !== null ? (
                          <span className="inline-block bg-slate-900 border border-gray-800 px-3 py-1 rounded text-white">
                            {match.placar_casa} x {match.placar_fora}
                          </span>
                        ) : (
                          <span className="text-gray-600 italic text-xs font-semibold">-</span>
                        )}
                      </td>

                      {/* Decided By / Tiebreaker info */}
                      <td className="py-3.5 px-6 text-center font-semibold text-xs text-gray-400">
                        {matchExt.decidido_por === 'EXTRA_TIME' ? (
                          <span className="text-orange-400">Prorrogação</span>
                        ) : matchExt.decidido_por === 'PENALTY_SHOOTOUT' ? (
                          <span className="text-yellow-400">Disputa de Pênaltis</span>
                        ) : (
                          <span>Tempo Regulamentar</span>
                        )}
                        {matchExt.vencedor_final && (
                          <div className="text-[9px] font-bold text-gray-500 mt-0.5">
                            Vencedor Final: {matchExt.vencedor_final === 'CASA' ? 'Casa' : 'Fora'}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-6 text-center">
                        <button
                          type="button"
                          onClick={() => openEditModal(match)}
                          className="h-8 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-xs border-0 cursor-pointer transition-colors flex items-center gap-1.5 justify-center mx-auto"
                        >
                          <Edit size={14} />
                          Lançar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredMatches.length === 0 && !loading && (
            <div className="text-center py-16 text-gray-500">
              <p className="text-lg font-bold">Nenhum jogo encontrado</p>
              <p className="text-sm mt-1">
                Tente redefinir seus filtros de busca acima.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Manual Score Input Modal */}
      {isEditModalOpen && selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-md bg-slate-900 border border-gray-800 rounded-lg shadow-2xl p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit size={20} className="text-indigo-400" />
                Lançar Resultado
              </h3>
              <button 
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedMatch(null);
                }}
                className="text-gray-400 hover:text-white bg-transparent border-0 cursor-pointer p-1"
              >
                <Close size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveMatchScore} className="space-y-4">
              {/* Match Details Display */}
              <div className="flex justify-center items-center gap-3 bg-gray-950/50 border border-gray-850 p-3 rounded-lg text-sm text-gray-200">
                <div className="flex items-center gap-1.5 font-bold">
                  {getFlagUrl(selectedMatch.time_casa) && (
                    <img src={getFlagUrl(selectedMatch.time_casa)} alt="" className="w-4 h-3 object-cover rounded shadow" />
                  )}
                  {selectedMatch.time_casa}
                </div>
                <span className="text-[10px] text-gray-500 font-bold uppercase">vs</span>
                <div className="flex items-center gap-1.5 font-bold">
                  {getFlagUrl(selectedMatch.time_fora) && (
                    <img src={getFlagUrl(selectedMatch.time_fora)} alt="" className="w-4 h-3 object-cover rounded shadow" />
                  )}
                  {selectedMatch.time_fora}
                </div>
              </div>

              {/* Placar Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 text-left">
                  <label htmlFor="modal-home-score" className="text-xs font-bold text-gray-400">Gols {selectedMatch.time_casa}</label>
                  <input
                    id="modal-home-score"
                    type="number"
                    min="0"
                    placeholder="Sem placar"
                    value={editHomeScore}
                    onChange={(e) => setEditHomeScore(e.target.value)}
                    className="w-full h-10 px-3 bg-[#161616] border border-gray-800 focus:border-blue-500 rounded font-bold text-center text-sm text-white outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <label htmlFor="modal-away-score" className="text-xs font-bold text-gray-400">Gols {selectedMatch.time_fora}</label>
                  <input
                    id="modal-away-score"
                    type="number"
                    min="0"
                    placeholder="Sem placar"
                    value={editAwayScore}
                    onChange={(e) => setEditAwayScore(e.target.value)}
                    className="w-full h-10 px-3 bg-[#161616] border border-gray-800 focus:border-blue-500 rounded font-bold text-center text-sm text-white outline-none"
                  />
                </div>
              </div>

              {/* Status Select */}
              <div className="flex flex-col gap-1 text-left">
                <label htmlFor="modal-status" className="text-xs font-bold text-gray-400">Status da Partida</label>
                <select
                  id="modal-status"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full h-10 px-3 bg-[#161616] border border-gray-800 focus:border-blue-500 rounded font-medium text-sm text-white outline-none transition-all cursor-pointer"
                >
                  <option value="SCHEDULED">Agendado</option>
                  <option value="LIVE">Ao Vivo</option>
                  <option value="FINISHED">Finalizado (Recalcula pontos)</option>
                  <option value="POSTPONED">Adiado</option>
                </select>
              </div>

              {/* Decisão Select */}
              <div className="flex flex-col gap-1 text-left">
                <label htmlFor="modal-decided-por" className="text-xs font-bold text-gray-400">Como foi decidido?</label>
                <select
                  id="modal-decided-por"
                  value={editDecididoPor}
                  onChange={(e) => setEditDecididoPor(e.target.value as any)}
                  className="w-full h-10 px-3 bg-[#161616] border border-gray-800 focus:border-blue-500 rounded font-medium text-sm text-white outline-none transition-all cursor-pointer"
                >
                  <option value="REGULAR">Tempo Regulamentar</option>
                  <option value="EXTRA_TIME">Prorrogação</option>
                  <option value="PENALTY_SHOOTOUT">Disputa de Pênaltis</option>
                </select>
              </div>

              {/* Winner Selection (Only for tiebreakers) */}
              {editDecididoPor !== 'REGULAR' && (
                <div className="flex flex-col gap-1 text-left">
                  <label htmlFor="modal-winner" className="text-xs font-bold text-orange-400">Vencedor Final da Disputa</label>
                  <select
                    id="modal-winner"
                    value={editVencedorFinal}
                    onChange={(e) => setEditVencedorFinal(e.target.value as any)}
                    required
                    className="w-full h-10 px-3 bg-[#161616] border border-orange-500/40 focus:border-orange-500 rounded font-bold text-sm text-white outline-none transition-all cursor-pointer"
                  >
                    <option value="">Selecione o vencedor...</option>
                    <option value="CASA">{selectedMatch.time_casa}</option>
                    <option value="FORA">{selectedMatch.time_fora}</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedMatch(null);
                  }}
                  className="flex-1 py-2.5 bg-transparent hover:bg-white/5 text-gray-300 font-bold rounded text-xs border border-gray-850 cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded text-xs border-0 cursor-pointer transition-colors disabled:opacity-50"
                >
                  {saving ? 'Gravando...' : 'Salvar Resultado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
