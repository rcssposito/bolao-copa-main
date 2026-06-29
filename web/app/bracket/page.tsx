'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  getCompetitions,
  getAvailableMatches,
  getUserBets,
  loginUser,
  Match,
  Bet,
  User
} from '@/lib/api';

import { 
  ArrowLeft, 
  Trophy,
  Renew
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

// Stage ordering
const STAGE_ORDER: Record<string, number> = {
  'LAST_32': 1,
  'LAST_16': 2,
  'QUARTER_FINALS': 3,
  'SEMI_FINALS': 4,
  'THIRD_PLACE': 5,
  'FINAL': 6
};

const STAGE_LABELS: Record<string, string> = {
  'LAST_32': 'Fase de 32 (16-Avos)',
  'LAST_16': 'Oitavas de Final',
  'QUARTER_FINALS': 'Quartas de Final',
  'SEMI_FINALS': 'Semifinais',
  'THIRD_PLACE': 'Terceiro Lugar',
  'FINAL': 'Grande Final'
};

const STAGE_EXPECTED_COUNT: Record<string, number> = {
  'LAST_32': 16,
  'LAST_16': 8,
  'QUARTER_FINALS': 4,
  'SEMI_FINALS': 2,
  'THIRD_PLACE': 1,
  'FINAL': 1
};

export default function BracketPage() {
  const [activeCompCode, setActiveCompCode] = useState<string>('WC');
  const [competitions, setCompetitions] = useState<{ id: number; name: string; code: string; emblem: string }[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [bets, setBets] = useState<Record<string, Bet>>({});
  const [loggedUser, setLoggedUser] = useState<User | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [selectedStageTab, setSelectedStageTab] = useState<string>('LAST_32'); // for mobile tabs

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeCompCode) {
      loadMatchesForComp(activeCompCode);
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
        setBets(betsMap);
      }

    } catch (err) {
      console.error('Erro ao carregar dados iniciais da chave:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMatchesForComp = async (compCode: string) => {
    try {
      setLoading(true);
      const res = await getAvailableMatches(compCode, true);
      
      // Filter out group stage matches
      const knockoutMatches = res.data.filter(m => m.stage && m.stage !== 'GROUP_STAGE');
      
      // Sort matches by id_api to ensure stable tree structure pairing
      knockoutMatches.sort((a, b) => (a.id_api || 0) - (b.id_api || 0));
      setMatches(knockoutMatches);

      // Auto select tab to the first stage that has matches
      if (knockoutMatches.length > 0) {
        const uniqueStages = Array.from(new Set(knockoutMatches.map(m => m.stage!)));
        const sortedStages = uniqueStages.sort((a, b) => (STAGE_ORDER[a] || 99) - (STAGE_ORDER[b] || 99));
        setSelectedStageTab(sortedStages[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar partidas da chave:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group matches by stage
  const matchesByStage: Record<string, Match[]> = {};
  matches.forEach(m => {
    if (m.stage) {
      if (!matchesByStage[m.stage]) {
        matchesByStage[m.stage] = [];
      }
      matchesByStage[m.stage].push(m);
    }
  });

  // Get active stages sorted by order
  const activeStages = Object.keys(matchesByStage).sort(
    (a, b) => (STAGE_ORDER[a] || 99) - (STAGE_ORDER[b] || 99)
  );

  // Match card rendering helper
  const renderMatchCard = (match: Match) => {
    const matchDate = new Date(match.data);
    const userBet = bets[match.id];
    const matchExt = match as any;
    
    const isFinished = match.status === 'FINISHED';
    const isLive = match.status === 'LIVE';
    
    // Determine winner
    let homeWinner = false;
    let awayWinner = false;
    if (isFinished) {
      if (matchExt.vencedor_final === 'CASA') {
        homeWinner = true;
      } else if (matchExt.vencedor_final === 'FORA') {
        awayWinner = true;
      } else if (match.placar_casa !== null && match.placar_fora !== null) {
        if (match.placar_casa > match.placar_fora) {
          homeWinner = true;
        } else if (match.placar_fora > match.placar_casa) {
          awayWinner = true;
        }
      }
    }

    return (
      <div 
        key={match.id} 
        className="glass-card rounded-lg p-3.5 border border-gray-800 bg-[#161616]/40 hover:bg-[#161616]/65 transition-all text-xs w-full max-w-[280px] shrink-0 select-none shadow-lg"
      >
        {/* Match Header */}
        <div className="flex justify-between items-center text-[10px] text-gray-500 font-semibold mb-2.5 uppercase tracking-wider pb-1.5 border-b border-gray-900/60">
          <span>{matchDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} • {matchDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          {match.status === 'LIVE' ? (
            <span className="text-red-400 font-bold animate-pulse">Ao Vivo</span>
          ) : match.status === 'FINISHED' ? (
            <span className="text-gray-500">Fim</span>
          ) : (
            <span className="text-blue-400">Agendado</span>
          )}
        </div>

        {/* Teams & Scores */}
        <div className="space-y-2">
          {/* Home Team */}
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 truncate pr-2 transition-all ${
              isFinished 
                ? (homeWinner ? 'font-black text-white' : 'font-medium text-gray-500 opacity-55') 
                : 'font-bold text-gray-200'
            }`}>
              {getFlagUrl(match.time_casa) && (
                <img 
                  src={getFlagUrl(match.time_casa)} 
                  alt="" 
                  className={`w-4.5 h-3 object-cover rounded-sm shadow-sm transition-all ${isFinished && !homeWinner ? 'opacity-40 grayscale' : ''}`} 
                />
              )}
              <span className="truncate">{match.time_casa}</span>
            </div>
            <span className={`font-black text-sm px-1.5 py-0.5 rounded transition-all ${
              isFinished 
                ? (homeWinner ? 'text-white bg-emerald-950/20 border border-emerald-500/15' : 'text-gray-550 bg-slate-955/40 border border-gray-900 opacity-55') 
                : isLive 
                  ? 'text-red-400 bg-red-950/30 border border-red-500/20 animate-pulse'
                  : 'text-gray-500'
            }`}>
              {match.placar_casa !== null ? match.placar_casa : '-'}
            </span>
          </div>

          {/* Away Team */}
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 truncate pr-2 transition-all ${
              isFinished 
                ? (awayWinner ? 'font-black text-white' : 'font-medium text-gray-500 opacity-55') 
                : 'font-bold text-gray-200'
            }`}>
              {getFlagUrl(match.time_fora) && (
                <img 
                  src={getFlagUrl(match.time_fora)} 
                  alt="" 
                  className={`w-4.5 h-3 object-cover rounded-sm shadow-sm transition-all ${isFinished && !awayWinner ? 'opacity-40 grayscale' : ''}`} 
                />
              )}
              <span className="truncate">{match.time_fora}</span>
            </div>
            <span className={`font-black text-sm px-1.5 py-0.5 rounded transition-all ${
              isFinished 
                ? (awayWinner ? 'text-white bg-emerald-950/20 border border-emerald-500/15' : 'text-gray-550 bg-slate-955/40 border border-gray-900 opacity-55') 
                : isLive 
                  ? 'text-red-400 bg-red-950/30 border border-red-500/20 animate-pulse'
                  : 'text-gray-500'
            }`}>
              {match.placar_fora !== null ? match.placar_fora : '-'}
            </span>
          </div>
        </div>

        {/* Extra Time/Penalty Indicator */}
        {match.status === 'FINISHED' && matchExt.decidido_por && matchExt.decidido_por !== 'REGULAR' && (
          <div className="mt-2 text-[9px] font-bold text-orange-400 text-center bg-orange-950/20 border border-orange-500/10 py-0.5 rounded">
            Decidido na {matchExt.decidido_por === 'EXTRA_TIME' ? 'Prorrogação' : 'Disputa de Pênaltis'}
            {matchExt.vencedor_final && (
              <span className="text-white"> (Vencedor: {matchExt.vencedor_final === 'CASA' ? match.time_casa : match.time_fora})</span>
            )}
          </div>
        )}

        {/* User Prediction Section */}
        {loggedUser && (
          <div className="mt-2.5 pt-2 border-t border-gray-900/60 flex justify-between items-center text-[10px]">
            <span className="text-gray-500 font-medium">Seu palpite:</span>
            {userBet ? (
              <div className="flex items-center gap-1">
                <span className="font-bold text-indigo-300 bg-indigo-950/30 border border-indigo-500/15 px-1.5 py-0.5 rounded">
                  {userBet.palpite_casa} x {userBet.palpite_fora}
                </span>
                {match.status === 'FINISHED' && (
                  <span className={`font-black px-1 py-0.5 rounded ${userBet.pontos > 0 ? 'bg-emerald-950/30 text-emerald-400' : 'bg-gray-900 text-gray-500'}`}>
                    +{userBet.pontos}p
                  </span>
                )}
              </div>
            ) : (
              <span className="text-gray-600 italic">Sem palpite</span>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading && matches.length === 0) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] flex flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mb-4"></div>
        <p className="text-gray-400 font-semibold">Carregando chaveamento do mata-mata...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0c0c0c] text-gray-100 font-sans antialiased">
      {/* Top Header Navigation */}
      <header className="h-12 w-full bg-[#161616]/80 backdrop-blur-md border-b border-gray-900 fixed top-0 left-0 z-40 flex items-center px-4 justify-between">
        <span className="font-bold text-white tracking-tight flex items-center gap-1.5">
          <Trophy size={16} className="text-amber-400" />
          Chaveamento do Bolão
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

      {/* Dashboard Spacing */}
      <div className="pt-16"></div>

      <div className="container mx-auto px-4 py-8 max-w-[1600px]">
        {/* Header Description */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1 flex items-center gap-2">
              ⚽ Árvore do Mata-Mata
            </h1>
            <p className="text-gray-500 font-medium text-sm">
              Acompanhe o chaveamento do campeonato, os placares oficiais e veja a pontuação de cada um dos seus palpites.
            </p>
          </div>

          {/* Competition Selector */}
          {competitions.length > 1 && (
            <div className="flex items-center gap-2 bg-gray-950 p-1 border border-gray-850 rounded">
              {competitions.map((comp) => (
                <button
                  key={comp.code}
                  type="button"
                  onClick={() => setActiveCompCode(comp.code)}
                  className={`px-3 py-1.5 text-xs font-bold transition-all rounded cursor-pointer ${
                    activeCompCode === comp.code
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {comp.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {matches.length === 0 ? (
          <div className="glass-panel border-gray-900 p-16 text-center text-gray-500 rounded-lg max-w-xl mx-auto mt-12">
            <Trophy size={48} className="text-gray-700 mx-auto mb-4" />
            <p className="text-lg font-bold mb-2 text-gray-400">Chaveamento indisponível</p>
            <p className="text-sm text-gray-500">
              Nenhuma partida de fase eliminatória (mata-mata) foi cadastrada ou sincronizada para esta competição ainda.
            </p>
          </div>
        ) : (
          <>
            {/* MOBILE LAYOUT: Swipeable Tabs + Vertical Cards */}
            <div className="block md:hidden space-y-6">
              {/* Tab Selector */}
              <div className="flex overflow-x-auto gap-2 p-1 bg-gray-950 border border-gray-850 rounded scrollbar-none">
                {activeStages.map((stage) => (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => setSelectedStageTab(stage)}
                    className={`flex-1 min-w-[110px] py-2 text-xs font-bold transition-all rounded cursor-pointer whitespace-nowrap ${
                      selectedStageTab === stage
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {STAGE_LABELS[stage] || stage}
                  </button>
                ))}
              </div>

              {/* Match List for selected tab */}
              <div className="flex flex-col items-center gap-4">
                {matchesByStage[selectedStageTab]?.map(match => (
                  <div key={match.id} className="w-full flex justify-center">
                    {renderMatchCard(match)}
                  </div>
                ))}
              </div>
            </div>

            {(() => {
              const baseCellHeight = activeStages.includes('LAST_32') 
                ? 180 
                : activeStages.includes('LAST_16') 
                  ? 240 
                  : 320;
              const firstStage = activeStages[0];
              const firstStageCount = STAGE_EXPECTED_COUNT[firstStage] || 1;
              const totalHeight = firstStageCount * baseCellHeight;

              return (
                <div className="hidden md:block w-full overflow-x-auto py-8 px-4 border border-gray-900 bg-[#161616]/20 backdrop-blur-md rounded-xl select-none">
                  <div 
                    style={{ height: `${totalHeight + 80}px` }}
                    className={`flex gap-12 items-stretch justify-center ${
                      activeStages.includes('LAST_32') 
                        ? 'min-w-[1600px]' 
                        : activeStages.includes('LAST_16')
                          ? 'min-w-[1400px]'
                          : 'min-w-[1200px]'
                    }`}
                  >
                    {activeStages.map((stage, stageIndex) => {
                      const stageMatches = matchesByStage[stage] || [];
                      const isFinalRound = stage === 'FINAL' || stage === 'THIRD_PLACE';
                      const expectedCount = STAGE_EXPECTED_COUNT[stage] || 1;
                      const cellHeight = totalHeight / expectedCount;

                      return (
                        <div 
                          key={stage} 
                          className="flex flex-col justify-start items-center w-[280px]"
                        >
                          {/* Round Title */}
                          <div className="text-center font-black text-xs text-gray-400 uppercase tracking-widest pb-3 border-b border-indigo-500/20 w-full mb-4 shrink-0">
                            {STAGE_LABELS[stage] || stage}
                          </div>

                          {/* Matches Cards Column */}
                          <div className="flex-1 flex flex-col justify-start w-full relative">
                            {stageMatches.map((match, matchIndex) => {
                              const verticalLineHeight = cellHeight / 2;
                              
                              return (
                                <div 
                                  key={match.id} 
                                  style={{ height: `${cellHeight}px` }}
                                  className="relative flex items-center justify-center w-full group"
                                >
                                  {renderMatchCard(match)}

                                  {/* CSS Connector Lines for Tree Bracket Structure */}
                                  {stageIndex < activeStages.length - 1 && !isFinalRound && stage !== 'SEMI_FINALS' && (
                                    <>
                                      {/* Right side line extending out of card */}
                                      <div className="absolute right-[-24px] top-1/2 -translate-y-1/2 w-[24px] h-[2px] bg-gray-800 group-hover:bg-indigo-500/35 transition-colors"></div>
                                      
                                      {/* Vertical line connecting to next round pair */}
                                      {matchIndex % 2 === 0 ? (
                                        <>
                                          {/* Vertical line going down */}
                                          <div 
                                            style={{ height: `${verticalLineHeight}px` }}
                                            className="absolute right-[-24px] top-1/2 w-[2px] bg-gray-800 group-hover:bg-indigo-500/35 transition-colors origin-top"
                                          ></div>
                                          {/* Midpoint horizontal line going right */}
                                          <div 
                                            style={{ top: `calc(50% + ${verticalLineHeight}px)` }}
                                            className="absolute right-[-48px] -translate-y-1/2 w-[24px] h-[2px] bg-gray-800 group-hover:bg-indigo-500/35 transition-colors"
                                          ></div>
                                        </>
                                      ) : (
                                        /* Vertical line going up */
                                        <div 
                                          style={{ height: `${verticalLineHeight}px` }}
                                          className="absolute right-[-24px] bottom-1/2 w-[2px] bg-gray-800 group-hover:bg-indigo-500/35 transition-colors origin-bottom"
                                        ></div>
                                      )}
                                    </>
                                  )}

                                  {stageIndex > 0 && !isFinalRound && (
                                    <>
                                      {/* Left side line extending into card */}
                                      <div className="absolute left-[-24px] top-1/2 -translate-y-1/2 w-[24px] h-[2px] bg-gray-800 group-hover:bg-indigo-500/35 transition-colors"></div>
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
            
            {/* Navigation Tip */}
            <p className="hidden md:block text-center text-[10px] text-gray-500 font-semibold mt-4">
              💡 Deslize horizontalmente para navegar entre as fases do mata-mata
            </p>
          </>
        )}
      </div>
    </main>
  );
}
