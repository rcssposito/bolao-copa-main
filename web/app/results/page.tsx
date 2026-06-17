'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  getCompetitions,
  getFinishedMatches,
  getUserBets,
  getMatchBets,
  loginUser,
  Match,
  Bet,
  User
} from '@/lib/api';

import { 
  ArrowLeft, 
  Trophy,
  Events,
  UserMultiple,
  Close,
  CheckmarkFilled,
  WarningFilled
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

export default function ResultsPage() {
  const [activeCompCode, setActiveCompCode] = useState<string>('WC');
  const [competitions, setCompetitions] = useState<{ id: number; name: string; code: string; emblem: string }[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [userBets, setUserBets] = useState<Record<string, Bet>>({});
  const [loggedUser, setLoggedUser] = useState<User | null>(null);
  
  const [loading, setLoading] = useState(true);
  
  // Modal states for match bets
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [modalBets, setModalBets] = useState<Bet[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [modalGroupFilter, setModalGroupFilter] = useState('ALL');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeCompCode) {
      loadMatches(activeCompCode);
    }
  }, [activeCompCode]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // 1. Get auth and user
      const { data: { session } } = await supabase.auth.getSession();
      let userId: string | null = null;
      if (session?.user) {
        const email = session.user.email!;
        const nome = session.user.user_metadata.full_name || email.split('@')[0];
        const res = await loginUser({ email, nome });
        setLoggedUser(res.data);
        userId = res.data.id;
      }

      // 2. Load active competition list
      const compRes = await getCompetitions();
      const activeListStr = compRes.data.active || 'WC';
      const activeCodes = activeListStr.split(',').map((c: string) => c.trim()).filter(Boolean);
      const allComps = compRes.data.competitions || [];
      const activeComps = allComps.filter((c: any) => activeCodes.includes(c.code));
      setCompetitions(activeComps);
      
      if (activeComps.length > 0) {
        setActiveCompCode(activeComps[0].code);
      }

      // 3. Load user bets if logged in
      if (userId) {
        const betsRes = await getUserBets(userId);
        const betsMap: Record<string, Bet> = {};
        betsRes.data.forEach(bet => {
          betsMap[bet.jogo_id] = bet;
        });
        setUserBets(betsMap);
      }
    } catch (err) {
      console.error('Erro ao carregar dados iniciais de resultados:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async (compCode: string) => {
    try {
      setLoading(true);
      const res = await getFinishedMatches(compCode);
      setMatches(res.data);
    } catch (err) {
      console.error('Erro ao carregar resultados:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBetsModal = async (match: Match) => {
    setSelectedMatch(match);
    setModalBets([]);
    setModalLoading(true);
    setModalSearch('');
    setModalGroupFilter('ALL');
    
    try {
      const res = await getMatchBets(match.id);
      // Sort: points descending, then user name alphabetically
      const sorted = res.data.sort((a, b) => {
        if (b.pontos !== a.pontos) return b.pontos - a.pontos;
        const nameA = a.users?.nome || '';
        const nameB = b.users?.nome || '';
        return nameA.localeCompare(nameB);
      });
      setModalBets(sorted);
    } catch (err) {
      console.error('Erro ao carregar palpites da partida:', err);
    } finally {
      setModalLoading(false);
    }
  };

  // Filter modal bets
  const filteredBets = modalBets.filter(bet => {
    const userName = bet.users?.nome?.toLowerCase() || '';
    const userGroup = bet.users?.grupo?.toLowerCase() || '';
    const matchesSearch = userName.includes(modalSearch.toLowerCase());
    
    if (modalGroupFilter === 'ALL') {
      return matchesSearch;
    }
    const userGroups = userGroup.split(',').map(g => g.trim().toLowerCase());
    return matchesSearch && userGroups.includes(modalGroupFilter.toLowerCase());
  });

  // Get unique groups from modal bets
  const uniqueGroups = Array.from(new Set(
    modalBets.flatMap(bet => {
      const gStr = bet.users?.grupo;
      if (!gStr) return [];
      return gStr.split(',').map(g => g.trim());
    }).filter(Boolean)
  )) as string[];

  if (loading && matches.length === 0) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] flex flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mb-4"></div>
        <p className="text-gray-400 font-semibold">Carregando resultados...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0c0c0c] text-gray-100 font-sans antialiased">
      {/* Top Header Navigation */}
      <header className="h-12 w-full bg-[#161616]/80 backdrop-blur-md border-b border-gray-900 fixed top-0 left-0 z-40 flex items-center px-4 justify-between">
        <span className="font-bold text-white tracking-tight flex items-center gap-1.5">
          <Events size={16} className="text-indigo-400" />
          Resultados do Bolão
        </span>
        
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

      {/* Spacing */}
      <div className="pt-16"></div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header Title */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1 flex items-center gap-2">
              📊 Placar e Palpites dos Jogos
            </h1>
            <p className="text-gray-500 font-medium text-sm">
              Consulte os resultados oficiais das partidas iniciadas e finalizadas, veja o que você apostou e confira os palpites de todos os participantes.
            </p>
          </div>

          {/* Competition Selector */}
          {competitions.length > 1 && (
            <div className="flex items-center gap-2 bg-gray-950 p-1 border border-gray-850 rounded shrink-0">
              {competitions.map((comp) => (
                <button
                  key={comp.code}
                  type="button"
                  onClick={() => setActiveCompCode(comp.code)}
                  className={`px-3 py-1.5 text-xs font-bold transition-all rounded cursor-pointer border-0 ${
                    activeCompCode === comp.code
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-gray-200 bg-transparent'
                  }`}
                >
                  {comp.name.replace('UEFA ', '').replace('FIFA ', '')}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Matches List */}
        {matches.length === 0 ? (
          <div className="glass-panel border-gray-900 p-16 text-center text-gray-500 rounded-lg max-w-xl mx-auto mt-12">
            <Events size={48} className="text-gray-700 mx-auto mb-4" />
            <p className="text-lg font-bold mb-2 text-gray-400">Nenhum resultado ainda</p>
            <p className="text-sm text-gray-500">
              Nenhuma partida foi iniciada ou finalizada para esta competição ainda. Os palpites estarão visíveis assim que os jogos começarem.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => {
              const matchDate = new Date(match.data);
              const userBet = userBets[match.id];
              
              return (
                <div 
                  key={match.id}
                  className="glass-card rounded-lg p-5 border border-gray-850 bg-[#161616]/40 hover:bg-[#161616]/65 transition-all flex flex-col md:flex-row gap-5 items-center justify-between shadow-lg"
                >
                  {/* Left: Match Info & Status */}
                  <div className="flex-1 w-full md:w-auto text-center md:text-left space-y-1.5">
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center justify-center md:justify-start gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${match.status === 'LIVE' ? 'bg-red-500 animate-pulse' : match.status === 'SCHEDULED' ? 'bg-amber-500 animate-pulse' : 'bg-gray-500'}`}></span>
                      {match.status === 'LIVE' ? (
                        <span className="text-red-400 font-extrabold animate-pulse">Ao Vivo</span>
                      ) : match.status === 'SCHEDULED' ? (
                        <span className="text-amber-400 font-extrabold animate-pulse">Em Andamento</span>
                      ) : (
                        <span className="text-gray-400">Fim de Jogo</span>
                      )}
                      <span>•</span>
                      <span>{matchDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })} • {matchDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      {match.stage && match.stage !== 'GROUP_STAGE' && (
                        <>
                          <span>•</span>
                          <span className="text-amber-400 font-extrabold">{match.stage.replace('LAST_32', 'Dezesseis-avos').replace('LAST_16', 'Oitavas').replace('QUARTER_FINALS', 'Quartas').replace('SEMI_FINALS', 'Semis').replace('THIRD_PLACE', '3º Lugar').replace('FINAL', 'Final')}</span>
                        </>
                      )}
                    </div>
                    
                    {/* Team display and score */}
                    <div className="flex items-center gap-3 w-full max-w-[380px] mx-auto md:mx-0">
                      {/* Home Team */}
                      <div className="flex-1 flex items-center justify-end gap-2 font-bold text-sm text-gray-200 truncate pr-1">
                        <span className="truncate">{match.time_casa}</span>
                        {getFlagUrl(match.time_casa) && (
                          <img src={getFlagUrl(match.time_casa)} alt="" className="w-4.5 h-3 object-cover rounded-sm shadow-sm shrink-0" />
                        )}
                      </div>
                      
                      {/* Score Badge */}
                      <div className="bg-gray-950 px-3 py-1 border border-gray-850 rounded font-black text-base text-white tracking-wide shrink-0 min-w-[75px] text-center">
                        {match.placar_casa !== null ? match.placar_casa : '-'} x {match.placar_fora !== null ? match.placar_fora : '-'}
                      </div>

                      {/* Away Team */}
                      <div className="flex-1 flex items-center justify-start gap-2 font-bold text-sm text-gray-200 truncate pl-1">
                        {getFlagUrl(match.time_fora) && (
                          <img src={getFlagUrl(match.time_fora)} alt="" className="w-4.5 h-3 object-cover rounded-sm shadow-sm shrink-0" />
                        )}
                        <span className="truncate">{match.time_fora}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: User prediction details */}
                  {loggedUser && (
                    <div className="flex items-center gap-6 py-2 px-4 bg-gray-950/40 border border-gray-900 rounded-lg shrink-0 w-full md:w-auto justify-between md:justify-center">
                      <div className="text-left">
                        <span className="block text-[9px] uppercase tracking-wider text-gray-500 font-bold">Seu Palpite</span>
                        {userBet ? (
                          <span className="font-extrabold text-sm text-indigo-300">
                            {userBet.palpite_casa} x {userBet.palpite_fora}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-600 italic">Sem palpite</span>
                        )}
                      </div>
                      {userBet && match.status === 'FINISHED' && (
                        <div className="text-right">
                          <span className="block text-[9px] uppercase tracking-wider text-gray-500 font-bold">Pontos</span>
                          <span className={`text-sm font-black px-2 py-0.5 rounded ${userBet.pontos > 0 ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/10' : 'bg-gray-900 text-gray-500'}`}>
                            +{userBet.pontos}p
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Right: Actions */}
                  <div className="shrink-0 w-full md:w-auto">
                    <button
                      onClick={() => handleOpenBetsModal(match)}
                      className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded cursor-pointer border-0 transition-colors shadow-md"
                    >
                      <UserMultiple size={16} />
                      Ver Palpites da Galera
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bets Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="w-full max-w-xl bg-slate-900 border border-gray-800 rounded-lg shadow-2xl p-6 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <UserMultiple size={20} className="text-indigo-400" />
                  Palpites dos Participantes
                </h3>
                <p className="text-xs text-gray-550 font-medium mt-0.5">
                  {selectedMatch.time_casa} vs {selectedMatch.time_fora}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedMatch(null)}
                className="text-gray-400 hover:text-white bg-transparent border-0 cursor-pointer p-1"
              >
                <Close size={20} />
              </button>
            </div>

            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4 shrink-0">
              <input
                type="text"
                placeholder="Buscar participante..."
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                className="flex-1 h-9 px-3 bg-[#161616] border border-gray-800 focus:border-blue-500 rounded text-xs font-bold text-white placeholder-gray-650 outline-none transition-all"
              />
              
              {uniqueGroups.length > 0 && (
                <select
                  value={modalGroupFilter}
                  onChange={(e) => setModalGroupFilter(e.target.value)}
                  className="h-9 px-3 bg-[#161616] border border-gray-800 focus:border-blue-500 rounded text-xs font-bold text-white outline-none cursor-pointer"
                >
                  <option value="ALL">Todos os Grupos</option>
                  {uniqueGroups.map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Modal List Content */}
            <div className="flex-1 overflow-y-auto pr-1 border border-gray-850 rounded-lg bg-gray-950/35">
              {modalLoading ? (
                <div className="py-16 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent mx-auto mb-2"></div>
                  <p className="text-xs font-semibold">Carregando palpites dos participantes...</p>
                </div>
              ) : filteredBets.length === 0 ? (
                <div className="py-16 text-center text-gray-550 text-xs italic">
                  Nenhum palpite encontrado para esta busca/filtro.
                </div>
              ) : (
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-950/60 border-b border-gray-900 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-4">Participante</th>
                      <th className="py-2.5 px-3 text-center">Palpite</th>
                      {selectedMatch.status === 'FINISHED' && (
                        <th className="py-2.5 px-4 text-center">Pontos</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-900/60 font-medium">
                    {filteredBets.map(bet => {
                      const isMe = loggedUser && bet.usuario_id === loggedUser.id;
                      return (
                        <tr 
                          key={bet.id} 
                          className={`hover:bg-slate-900/15 transition-all ${
                            isMe ? 'bg-indigo-600/10 font-bold text-indigo-300' : 'text-gray-300'
                          }`}
                        >
                          <td className="py-3 px-4 truncate max-w-[160px]">
                            {bet.users?.nome || 'Anônimo'}
                            {bet.users?.grupo && (
                              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-gray-800 text-gray-455 uppercase">
                                {bet.users.grupo}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center font-black text-gray-150">
                            {bet.palpite_casa} x {bet.palpite_fora}
                          </td>
                          {selectedMatch.status === 'FINISHED' && (
                            <td className="py-3 px-4 text-center">
                              <span className={`px-1.5 py-0.5 rounded font-black ${
                                bet.pontos === 7 
                                  ? 'bg-emerald-950/40 text-emerald-450 border border-emerald-500/10'
                                  : bet.pontos === 5
                                    ? 'bg-blue-950/45 text-blue-400 border border-blue-500/10'
                                    : 'bg-gray-900 text-gray-505'
                              }`}>
                                +{bet.pontos}p
                              </span>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-4 pt-3 border-t border-gray-850 flex justify-between items-center text-[10px] text-gray-500 shrink-0 font-medium">
              <span>Exibindo {filteredBets.length} palpites registrados</span>
              <button
                type="button"
                onClick={() => setSelectedMatch(null)}
                className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-755 text-gray-300 rounded font-bold cursor-pointer border-0 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
