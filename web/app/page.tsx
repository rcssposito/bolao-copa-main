'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  getRanking, 
  getPotTotal, 
  getAvailableMatches, 
  getUserBets, 
  createBet, 
  loginUser,
  joinGroup,
  getGroupRanking,
  getCompetitions,
  User,
  Match,
  RankingUser,
  Bet
} from '@/lib/api';

import { 
  Login, 
  Logout, 
  Settings, 
  CheckmarkFilled, 
  WarningFilled,
  Trophy,
  Finance,
  Events,
  Home as HomeIcon,
  Document,
  UserMultiple,
  Group
} from '@carbon/icons-react';

// Helper function to map team name to flag image URL from FlagCDN
const getFlagUrl = (teamName: string): string => {
  if (!teamName) return '';
  const normalized = teamName.toLowerCase().trim();
  
  // Mapping of common team/club names to ISO 2-letter country codes
  const mapping: { [key: string]: string } = {
    // World Cup 2026 teams
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
    
    // Brasileirão Clubs (default to Brazil flag)
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

    // Champions League clubs
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

const COMPETITION_EMOJIS: { [key: string]: string } = {
  'WC': '🌎',
  'CL': '🏆',
  'BSA': '⚽',
  'CLI': '🏆',
  'PL': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'PD': '🇪🇸',
  'BL1': '🇩🇪',
  'SA': '🇮🇹',
  'FL1': '🇫🇷',
  'DED': '🇳🇱',
  'PPL': '🇵🇹',
  'ELC': '⚽',
  'EC': '🏆'
};

const getCompetitionEmoji = (code: string): string => {
  return COMPETITION_EMOJIS[code] || '⚽';
};

export default function Home() {
  // Authentication State
  const [loggedUser, setLoggedUser] = useState<User | null>(null);
  
  // App Data State
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [totalPot, setTotalPot] = useState({ valor_por_usuario: 50, usuarios_pagantes: 0, total_pote: 0 });
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [savingBetId, setSavingBetId] = useState<string | null>(null);
  
  // Selected competition state on dashboard
  const [selectedCompetition, setSelectedCompetition] = useState<string>('WC');

  // Local prediction state for each match
  // Key: matchId, Value: { palpite_casa, palpite_fora, resultado_radio, saved }
  const [predictions, setPredictions] = useState<Record<string, {
    palpite_casa: string | number;
    palpite_fora: string | number;
    resultado_radio: 'CASA' | 'EMPATE' | 'FORA' | '';
    betId?: string;
    saved: boolean;
  }>>({});

  // Group / Tag States
  const [groupCode, setGroupCode] = useState<string>('');
  const [joiningGroup, setJoiningGroup] = useState<boolean>(false);
  const [rankingFilter, setRankingFilter] = useState<string>('GERAL');
  const [groupRanking, setGroupRanking] = useState<RankingUser[]>([]);

  // Active Competitions States
  const [activeCompetitions, setActiveCompetitions] = useState<{ id: number; name: string; code: string; emblem: string }[]>([]);
  const [loadingActiveComps, setLoadingActiveComps] = useState<boolean>(true);

  // 1. Listen for Supabase Authentication state changes
  // Load active competitions on mount
  useEffect(() => {
    const fetchActiveCompetitions = async () => {
      try {
        setLoadingActiveComps(true);
        const res = await getCompetitions();
        const activeListStr = res.data.active || 'WC';
        const activeCodes = activeListStr.split(',').map((c: string) => c.trim()).filter(Boolean);
        const allComps = res.data.competitions || [];
        const activeComps = allComps.filter((c: any) => activeCodes.includes(c.code));
        
        setActiveCompetitions(activeComps);
        
        // If 'WC' is not in the active codes, switch selectedCompetition to the first active one
        if (activeCodes.length > 0 && !activeCodes.includes(selectedCompetition)) {
          setSelectedCompetition(activeCodes[0]);
        }
      } catch (err) {
        console.error('Erro ao buscar competições ativas:', err);
      } finally {
        setLoadingActiveComps(false);
      }
    };
    fetchActiveCompetitions();
  }, []);

  // 1. Listen for Supabase Authentication state changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      setTimeout(() => {
        window.history.replaceState(null, '', window.location.pathname);
      }, 500);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setAuthLoading(true);
      if (session?.user) {
        try {
          const email = session.user.email!;
          const nome = session.user.user_metadata.full_name || email.split('@')[0];
          
          // Login or register user in backend
          const res = await loginUser({ email, nome });
          
          setLoggedUser(res.data);
          
          // Load their predictions
          await loadUserBets(res.data.id);

          // Load group ranking if they are in a group
          if (res.data.grupo) {
            try {
              const uGroups = res.data.grupo.split(',').map((g: string) => g.trim()).filter(Boolean);
              const firstGroup = uGroups[0];
              if (firstGroup) {
                setRankingFilter(firstGroup);
                const groupRankRes = await getGroupRanking(firstGroup, selectedCompetition);
                setGroupRanking(groupRankRes.data.ranking);
              } else {
                setGroupRanking([]);
                setRankingFilter('GERAL');
              }
            } catch (err) {
              console.error('Erro ao buscar ranking do grupo:', err);
              setGroupRanking([]);
              setRankingFilter('GERAL');
            }
          } else {
            setGroupRanking([]);
            setRankingFilter('GERAL');
          }
        } catch (error) {
          console.error('Erro ao processar login no backend:', error);
        }
      } else {
        setLoggedUser(null);
        setGroupRanking([]);
        setRankingFilter('GERAL');
      }
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [matches, selectedCompetition]);

  // 2. Fetch general app data when selected competition changes
  useEffect(() => {
    loadInitialData();
  }, [selectedCompetition]);

  const loadPot = async (group?: string) => {
    try {
      const potRes = await getPotTotal(group && group !== 'GERAL' ? group : undefined);
      setTotalPot(potRes.data);
    } catch (error) {
      console.error('Erro ao carregar pote:', error);
    }
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [rankingRes, potRes, matchesRes] = await Promise.all([
        getRanking(selectedCompetition),
        getPotTotal(rankingFilter !== 'GERAL' ? rankingFilter : undefined),
        getAvailableMatches(selectedCompetition)
      ]);

      setRanking(rankingRes.data.ranking);
      setTotalPot(potRes.data);
      setMatches(matchesRes.data);

      // Prepopulate empty predictions
      const initialPredictions: typeof predictions = {};
      matchesRes.data.forEach((match: Match) => {
        initialPredictions[match.id] = {
          palpite_casa: '',
          palpite_fora: '',
          resultado_radio: '',
          saved: false
        };
      });

      // Reload user bets if logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        try {
          let userId = loggedUser?.id;
          if (!userId) {
            const email = session.user.email!;
            const nome = session.user.user_metadata.full_name || email.split('@')[0];
            const res = await loginUser({ email, nome });
            setLoggedUser(res.data);
            userId = res.data.id;
          }
          
          if (userId) {
            const betsRes = await getUserBets(userId);
            const userBets = betsRes.data;
            
            userBets.forEach((matchingBet: Bet) => {
              initialPredictions[matchingBet.jogo_id] = {
                palpite_casa: matchingBet.palpite_casa,
                palpite_fora: matchingBet.palpite_fora,
                resultado_radio: matchingBet.resultado_radio,
                betId: matchingBet.id,
                saved: true
              };
            });
          }
        } catch (err) {
          console.error('Erro ao carregar usuário e palpites no loadInitialData:', err);
        }
      }

      setPredictions(initialPredictions);
      
      // Reload group ranking if not general
      if (rankingFilter !== 'GERAL') {
        const groupRankRes = await getGroupRanking(rankingFilter, selectedCompetition);
        setGroupRanking(groupRankRes.data.ranking);
      }

    } catch (error) {
      console.error('Erro ao carregar dados do bolão:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserBets = async (userId: string) => {
    try {
      const response = await getUserBets(userId);
      const userBets = response.data;
      
      setPredictions(prev => {
        const updated = { ...prev };
        
        userBets.forEach((matchingBet: Bet) => {
          updated[matchingBet.jogo_id] = {
            palpite_casa: matchingBet.palpite_casa,
            palpite_fora: matchingBet.palpite_fora,
            resultado_radio: matchingBet.resultado_radio,
            betId: matchingBet.id,
            saved: true
          };
        });
        
        return updated;
      });
    } catch (error) {
      console.error('Erro ao carregar palpites:', error);
    }
  };

  // Auth Handlers
  const handleGoogleLogin = async () => {
    try {
      setAuthLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao autenticar com o Google:', error);
      alert('Falha ao iniciar autenticação com o Google.');
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setAuthLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setLoggedUser(null);
      
      // Clear prediction forms
      setPredictions(prev => {
        const cleared = { ...prev };
        Object.keys(cleared).forEach(key => {
          cleared[key] = {
            palpite_casa: '',
            palpite_fora: '',
            resultado_radio: '',
            saved: false
          };
        });
        return cleared;
      });
    } catch (error) {
      console.error('Erro ao sair:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  // Prediction Form Handlers
  const getOutcomeFromScores = (home: string | number, away: string | number): 'CASA' | 'EMPATE' | 'FORA' | '' => {
    if (home === '' || away === '') return '';
    const h = parseInt(home.toString(), 10);
    const a = parseInt(away.toString(), 10);
    if (isNaN(h) || isNaN(a)) return '';
    if (h > a) return 'CASA';
    if (h < a) return 'FORA';
    return 'EMPATE';
  };

  const handleScoreChange = (matchId: string, side: 'home' | 'away', value: string) => {
    if (loggedUser && !loggedUser.grupo) return;
    setPredictions(prev => {
      const current = prev[matchId] || { palpite_casa: '', palpite_fora: '', resultado_radio: '', saved: false };
      
      let home = current.palpite_casa;
      let away = current.palpite_fora;
      
      if (side === 'home') home = value;
      else away = value;

      const calculatedOutcome = getOutcomeFromScores(home, away);

      return {
        ...prev,
        [matchId]: {
          ...current,
          palpite_casa: home,
          palpite_fora: away,
          resultado_radio: calculatedOutcome || current.resultado_radio,
          saved: false
        }
      };
    });
  };

  const handleOutcomeChange = (matchId: string, outcome: 'CASA' | 'EMPATE' | 'FORA') => {
    if (loggedUser && !loggedUser.grupo) return;
    setPredictions(prev => {
      const current = prev[matchId] || { palpite_casa: '', palpite_fora: '', resultado_radio: '', saved: false };
      
      return {
        ...prev,
        [matchId]: {
          ...current,
          resultado_radio: outcome,
          saved: false
        }
      };
    });
  };

  const submitPrediction = async (matchId: string) => {
    if (!loggedUser) {
      alert('Faça login com o Google para poder salvar palpites.');
      return;
    }

    if (!loggedUser.grupo) {
      alert('Você precisa entrar em um grupo para poder salvar palpites.');
      return;
    }

    const pred = predictions[matchId];
    if (pred.palpite_casa === '' || pred.palpite_fora === '' || !pred.resultado_radio) {
      alert('Defina o placar antes de salvar.');
      return;
    }

    try {
      setSavingBetId(matchId);
      await createBet({
        usuario_id: loggedUser.id,
        jogo_id: matchId,
        palpite_casa: parseInt(pred.palpite_casa.toString(), 10),
        palpite_fora: parseInt(pred.palpite_fora.toString(), 10),
        resultado_radio: pred.resultado_radio
      });

      setPredictions(prev => ({
        ...prev,
        [matchId]: {
          ...prev[matchId],
          saved: true
        }
      }));

      // Refresh ranking list
      const rankingRes = await getRanking(selectedCompetition);
      setRanking(rankingRes.data.ranking);

      if (rankingFilter !== 'GERAL') {
        try {
          const groupRankRes = await getGroupRanking(rankingFilter, selectedCompetition);
          setGroupRanking(groupRankRes.data.ranking);
        } catch (err) {
          console.error('Erro ao recarregar ranking do grupo:', err);
        }
      }

    } catch (error: any) {
      console.error('Erro ao salvar palpite:', error);
      alert(error.response?.data?.detail || 'Não foi possível salvar o palpite.');
    } finally {
      setSavingBetId(null);
    }
  };

  const handleJoinGroup = async (code: string) => {
    if (!loggedUser) return;
    if (!code.trim()) {
      alert('Por favor, digite um código de grupo.');
      return;
    }
    try {
      setJoiningGroup(true);
      const res = await joinGroup(loggedUser.id, code);
      setLoggedUser(res.data);
      setGroupCode('');

      const newGroups = res.data.grupo
        ? res.data.grupo.split(',').map((g: string) => g.trim()).filter(Boolean)
        : [];
      
      const joinedGroup = newGroups[newGroups.length - 1];
      if (joinedGroup) {
        setRankingFilter(joinedGroup);
        const groupRankRes = await getGroupRanking(joinedGroup, selectedCompetition);
        setGroupRanking(groupRankRes.data.ranking);
        alert(`Você entrou no grupo "${joinedGroup}" com sucesso!`);
      } else {
        alert('Cadastro realizado.');
      }
    } catch (error: any) {
      console.error('Erro ao entrar no grupo:', error);
      alert(error.response?.data?.error || 'Não foi possível entrar no grupo. Verifique o código.');
    } finally {
      setJoiningGroup(false);
    }
  };

  const handleLeaveGroup = async (groupToLeave: string) => {
    if (!loggedUser) return;
    if (!confirm(`Deseja realmente sair do grupo "${groupToLeave}"?`)) return;
    try {
      setJoiningGroup(true);
      const res = await joinGroup(loggedUser.id, '', groupToLeave, 'leave');
      setLoggedUser(res.data);

      const newGroups = res.data.grupo
        ? res.data.grupo.split(',').map((g: string) => g.trim()).filter(Boolean)
        : [];

      if (newGroups.length > 0) {
        const nextGroup = newGroups[0];
        setRankingFilter(nextGroup);
        const groupRankRes = await getGroupRanking(nextGroup, selectedCompetition);
        setGroupRanking(groupRankRes.data.ranking);
      } else {
        setRankingFilter('GERAL');
        setGroupRanking([]);
      }
      alert(`Você saiu do grupo "${groupToLeave}".`);
    } catch (error: any) {
      console.error('Erro ao sair do grupo:', error);
      alert('Erro ao processar solicitação de saída.');
    } finally {
      setJoiningGroup(false);
    }
  };

  const handleFilterChange = async (newFilter: string) => {
    setRankingFilter(newFilter);
    // Reload pot for this group
    loadPot(newFilter);
    if (newFilter === 'GERAL') {
      return;
    }
    try {
      const groupRankRes = await getGroupRanking(newFilter, selectedCompetition);
      setGroupRanking(groupRankRes.data.ranking);
    } catch (err) {
      console.error('Erro ao buscar ranking do grupo:', err);
    }
  };

  const selectedUserStats = loggedUser 
    ? ranking.find(u => u.id === loggedUser.id) 
    : null;

  const isGroupRequiredLocked = !!(loggedUser && !loggedUser.grupo);

  const userGroups = loggedUser?.grupo
    ? loggedUser.grupo.split(',').map(g => g.trim()).filter(Boolean)
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] flex flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mb-4"></div>
        <p className="text-gray-400 font-semibold">Carregando Bolão...</p>
      </div>
    );
  }

  // Render Landing Page if User NOT Authenticated
  if (!loggedUser) {
    return (
      <main className="min-h-screen bg-[#0c0c0c] text-gray-100 font-sans antialiased">
        {/* Navigation Header */}
        <header className="h-12 w-full bg-[#161616]/80 backdrop-blur-md border-b border-gray-900 fixed top-0 left-0 z-40 flex items-center px-4">
          <span className="font-bold text-white tracking-tight">Bolão Copa 2026</span>
        </header>

          {/* Hero Section */}
          <section className="relative bg-[#161616] pt-28 pb-16 border-b border-gray-900 overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-10"></div>
            
            <div className="container mx-auto px-4 max-w-4xl text-center relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-6">
                ⚽ Copa do Mundo 2026
              </span>
              
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 leading-none">
                Participe do Nosso <span className="text-blue-500">Bolão da Copa</span>
              </h1>
              
              <p className="text-base md:text-lg text-gray-400 max-w-xl mx-auto mb-10 font-medium">
                Dê seus palpites, acumule pontos e acompanhe a classificação geral dos seus amigos em tempo real.
              </p>

              {/* Carbon Button for Login */}
              <div className="flex flex-col items-center justify-center gap-4">
                <button
                  onClick={handleGoogleLogin}
                  disabled={authLoading}
                  className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition-colors text-sm cursor-pointer flex items-center gap-2 border-0 disabled:opacity-50"
                >
                  {authLoading ? 'Conectando...' : 'Entrar com o Google'}
                  <Login size={20} />
                </button>
                <p className="text-xs text-gray-500">Acesso rápido e seguro via OAuth oficial.</p>
              </div>
            </div>
          </section>

          {/* Dashboard Preview Section (Read Only) */}
          <section className="container mx-auto px-4 py-12 max-w-5xl">
            {/* Pot display using Carbon Tile */}
            <div className="glass-card mb-12 p-6 flex flex-col md:flex-row justify-between items-center gap-6 rounded-lg">
              <div className="text-center md:text-left flex items-center gap-3">
                <div className="p-3 bg-emerald-950/40 text-emerald-400 border border-emerald-500/10 rounded-xl">
                  <Finance size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white mb-0.5">💰 Pote Total Acumulado</h2>
                  <p className="text-xs text-blue-400 font-medium">
                    {totalPot.usuarios_pagantes} participantes pagantes · R$ {(totalPot.valor_por_usuario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} por entrada
                  </p>
                </div>
              </div>
              <div className="text-3xl font-black text-emerald-400 bg-emerald-950/20 px-6 py-3 border border-emerald-500/20 rounded-lg">
                R$ {totalPot.total_pote.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Matches Preview */}
              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <Events size={20} className="text-indigo-400" /> Próximas Partidas
                </h2>

                <div className="space-y-4">
                  {matches.slice(0, 4).map(match => {
                    const matchDate = new Date(match.data);
                    return (
                      <div key={match.id} className="glass-card flex justify-between items-center gap-4 py-4 px-6 rounded-lg">
                        <div className="flex-1 flex items-center justify-end gap-2 font-bold text-sm text-gray-300 truncate">
                          <span>{match.time_casa}</span>
                          {getFlagUrl(match.time_casa) && (
                            <img 
                              src={getFlagUrl(match.time_casa)} 
                              alt="" 
                              className="w-5 h-3.5 object-cover rounded-sm border border-gray-850 shrink-0" 
                            />
                          )}
                        </div>
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <span className="text-xs font-bold text-indigo-400">vs</span>
                          <span className="text-[10px] text-gray-500 font-semibold bg-gray-950 px-2 py-0.5 border border-gray-800 rounded">
                            {matchDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} {matchDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex-1 flex items-center justify-start gap-2 font-bold text-sm text-gray-300 truncate">
                          {getFlagUrl(match.time_fora) && (
                            <img 
                              src={getFlagUrl(match.time_fora)} 
                              alt="" 
                              className="w-5 h-3.5 object-cover rounded-sm border border-gray-850 shrink-0" 
                            />
                          )}
                          <span>{match.time_fora}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Ranking Preview */}
              <div className="lg:col-span-1">
                <h2 className="text-xl font-bold tracking-tight text-white mb-6 flex items-center gap-2">
                  <Trophy size={20} className="text-amber-400" /> Top 5 Líderes
                </h2>

                <div className="border border-gray-800 bg-gray-950/40 overflow-hidden text-sm rounded-lg shadow-lg">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-950/60 border-b border-gray-900 text-gray-400 text-xs font-semibold uppercase tracking-wider text-left">
                        <th className="py-3 px-4 text-center w-12">Pos</th>
                        <th className="py-3 px-3">Nome</th>
                        <th className="py-3 px-4 text-center w-16">Pts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-900/60">
                      {ranking.slice(0, 5).map((row) => (
                        <tr key={row.id} className="hover:bg-slate-900/10">
                          <td className="py-3 px-4 text-center text-gray-400">
                            {row.posicao === 1 ? '🥇' : row.posicao === 2 ? '🥈' : row.posicao === 3 ? '🥉' : `${row.posicao}º`}
                          </td>
                          <td className="py-3 px-3 truncate max-w-[120px] text-gray-300 font-medium">
                            {row.nome}
                          </td>
                          <td className="py-3 px-4 text-center text-white font-bold">
                            {row.pontos_total}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          <footer className="border-t border-gray-900 py-12 text-center text-xs text-gray-600 bg-gray-950">
            <p>Bolão Copa do Mundo 2026 - Acesso restrito a participantes autorizados.</p>
          </footer>
        </main>
    );
  }

  // Render Full Betting Dashboard if Authenticated
  return (
    <main className="min-h-screen bg-[#0c0c0c] text-gray-100 font-sans antialiased flex flex-col">
      {/* Navigation Header */}
      <header className="h-12 w-full bg-[#161616]/80 backdrop-blur-md border-b border-gray-900 fixed top-0 left-0 z-40 flex items-center px-4 justify-between">
        <span className="font-bold text-white tracking-tight">Bolão Copa 2026</span>
        
        {/* User profile action badge */}
        <div className="flex items-center gap-3">
          {loggedUser.is_admin && (
            <Link 
              href="/admin" 
              className="text-gray-400 hover:text-white p-1.5 transition-colors flex items-center bg-transparent border-0 cursor-pointer mr-1"
              title="Painel Admin"
            >
              <Settings size={20} />
            </Link>
          )}
          <div className="flex flex-col text-right">
            <span className="text-[9px] text-blue-400 uppercase font-black tracking-wider leading-none">Conectado como</span>
            <span className="text-xs font-bold text-white mt-1">{loggedUser.nome}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-sm text-blue-400">
            {loggedUser.nome.slice(0,2).toUpperCase()}
          </div>
        </div>
      </header>

        {/* Flex layout for sidebar and content */}
        <div className="flex pt-12 min-h-screen">
          
          {/* Left Sidebar (Standard IBM Style with Glassmorphism) */}
          <aside className="hidden md:flex flex-col w-64 glass-panel border-r border-white/5 shrink-0 p-4 justify-between sticky top-12 h-[calc(100vh-3rem)] z-20">
            <div className="space-y-6">
              {/* Menu items */}
              <nav className="space-y-1">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold rounded-lg text-white bg-blue-600/10 border-l-4 border-blue-500 transition-all text-left no-underline"
                >
                  <HomeIcon size={18} className="text-blue-500" />
                  Dashboard
                </a>
                
                <a
                  href="#palpites-disponiveis"
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById('palpites-disponiveis');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all text-left no-underline"
                >
                  <Document size={18} />
                  Palpites
                </a>

                <a
                  href="#classificacao-geral"
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById('classificacao-geral');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all text-left no-underline"
                >
                  <Trophy size={18} />
                  Classificação
                </a>

                <a
                  href="#classificacao-geral"
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById('classificacao-geral');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all text-left no-underline"
                >
                  <UserMultiple size={18} />
                  Participantes
                </a>

                <a
                  href="#seus-grupos-card"
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById('seus-grupos-card');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all text-left no-underline"
                >
                  <Group size={18} />
                  Grupos
                </a>

                {loggedUser.is_admin && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all text-left no-underline"
                  >
                    <Settings size={18} />
                    Configurações
                  </Link>
                )}
              </nav>
            </div>

            {/* Logout button at bottom of sidebar */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-all text-left border-0 bg-transparent cursor-pointer"
            >
              <Logout size={18} />
              Sair
            </button>
          </aside>

          {/* Main Dashboard Area */}
          <div className="flex-1 overflow-y-auto px-8 py-8 w-full max-w-[1600px] mx-auto">
            {/* Header info in right area with event tabs and real hyperlink link */}
            <div className="flex flex-col gap-4 mb-8 border-b border-gray-900 pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight leading-none">Dashboard</h1>
                  <p className="text-xs text-gray-500 mt-1.5 font-medium">Bem-vindo de volta ao Bolão.</p>
                </div>
              </div>

              {/* Event Tabs Switcher */}
              <div className="flex items-center gap-1.5 bg-[#161616]/60 p-1 border border-white/5 rounded-lg backdrop-blur-md self-start">
                {loadingActiveComps ? (
                  <span className="text-[10px] text-gray-500 font-semibold px-3 py-1.5">Carregando campeonatos...</span>
                ) : activeCompetitions.length === 0 ? (
                  <span className="text-[10px] text-red-400 font-bold px-3 py-1.5">Nenhum campeonato ativo</span>
                ) : (
                  activeCompetitions.map(comp => (
                    <button
                      key={comp.code}
                      type="button"
                      onClick={() => setSelectedCompetition(comp.code)}
                      className={`px-3 py-1.5 text-xs font-bold rounded transition-all cursor-pointer border-0 ${
                        selectedCompetition === comp.code 
                          ? 'bg-blue-600 text-white shadow' 
                          : 'text-gray-400 hover:text-gray-200 bg-transparent'
                      }`}
                    >
                      {getCompetitionEmoji(comp.code)} {comp.name.replace('UEFA ', '').replace('FIFA ', '')}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Status Dashboard Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {/* Pote Total Card */}
              <div className="glass-card rounded-lg p-6 flex flex-col justify-between transition-all duration-300">
                <div>
                  <div className="text-xs uppercase tracking-wider text-emerald-400 font-bold mb-1">
                    💰 {rankingFilter === 'GERAL' ? 'Pote Total Geral' : `Pote · ${rankingFilter}`}
                  </div>
                  <div className="text-3xl font-extrabold text-white mt-1">
                    R$ {totalPot.total_pote.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="mt-4 space-y-1">
                  <div className="text-xs text-gray-400 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    {totalPot.usuarios_pagantes} pagantes · R$ {(totalPot.valor_por_usuario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/entrada
                  </div>
                  <div className={`text-xs font-semibold ${loggedUser.pagou ? 'text-emerald-400' : 'text-red-400'}`}>
                    {loggedUser.pagou ? '✓ Você pagou' : '✗ Seu pagamento está pendente'}
                  </div>
                </div>
              </div>


              {/* Jogos Disponíveis Card */}
              <div className="glass-card rounded-lg p-6 flex flex-col justify-between transition-all duration-300">
                <div>
                  <div className="text-xs uppercase tracking-wider text-indigo-400 font-bold mb-1">⚽ Jogos Disponíveis</div>
                  <div className="text-3xl font-extrabold text-white mt-1">
                    {matches.length}
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-4">
                  Partidas prontas para palpitar
                </div>
              </div>

              {/* Sua Posição Card */}
              <div className="glass-card rounded-lg p-6 flex flex-col justify-between transition-all duration-300">
                <div>
                  <div className="text-xs uppercase tracking-wider text-purple-400 font-bold mb-1">🏅 Sua Pontuação</div>
                  <div className="text-3xl font-extrabold text-white mt-1">
                    {selectedUserStats ? `${selectedUserStats.pontos_total} pts` : '0 pts'}
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-4">
                  {selectedUserStats 
                    ? `Você está no ${selectedUserStats.posicao}º lugar do ranking` 
                    : 'Você ainda não está pontuando'}
                </div>
              </div>

              {/* Grupo / Tag Card */}
              <div id="seus-grupos-card" className="glass-card rounded-lg p-6 flex flex-col justify-between transition-all duration-300">
                <div>
                  <div className="text-xs uppercase tracking-wider text-orange-400 font-bold mb-1">👥 Seus Grupos ({userGroups.length})</div>
                  
                  {userGroups.length > 0 ? (
                    <div className="mt-2 space-y-2 max-h-32 overflow-y-auto pr-1">
                      {userGroups.map(gName => (
                        <div key={gName} className="flex justify-between items-center bg-gray-950/40 px-2.5 py-1.5 border border-gray-900 rounded text-xs">
                          <span className="font-bold text-white truncate max-w-[120px]">{gName}</span>
                          <button
                            type="button"
                            onClick={() => handleLeaveGroup(gName)}
                            disabled={joiningGroup}
                            className="text-[10px] font-bold text-red-400 hover:text-red-300 bg-transparent border-0 cursor-pointer p-0"
                          >
                            Sair
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 mt-2">Você não participa de nenhum grupo.</p>
                  )}

                  <div className="mt-4">
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="text"
                        id="join-group-code"
                        placeholder="Código do Grupo"
                        value={groupCode}
                        onChange={(e) => setGroupCode(e.target.value)}
                        className="h-8 px-2.5 bg-[#161616] border border-gray-800 focus:border-blue-500 rounded text-xs font-bold w-full text-white placeholder-gray-600 outline-none transition-all"
                      />
                      <button
                        onClick={() => handleJoinGroup(groupCode)}
                        disabled={joiningGroup || !groupCode.trim()}
                        className="bg-orange-600 hover:bg-orange-700 h-8 font-bold px-3 text-xs border-0 rounded text-white cursor-pointer disabled:opacity-50"
                      >
                        Entrar
                      </button>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-4">
                  Participe de múltiplos grupos!
                </div>
              </div>
            </div>

            {/* Split Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Matches Column (Left) */}
              <div id="palpites-disponiveis" className="lg:col-span-2 space-y-6">
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <Events size={20} className="text-indigo-400" /> Palpites Disponíveis
                </h2>

                {isGroupRequiredLocked && (
                  <div className="bg-orange-950/20 border border-orange-500/30 p-4 rounded-lg flex gap-3 items-start shadow-lg">
                    <WarningFilled size={20} className="text-orange-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-white mb-1 uppercase tracking-wider">Atenção: Grupo Necessário</h4>
                      <p className="text-xs text-gray-400 font-medium leading-relaxed">
                        Para começar a dar palpites e participar dos rankings, você precisa entrar em um grupo inserindo o código de convite no menu lateral.
                      </p>
                    </div>
                  </div>
                )}

                {matches.length === 0 ? (
                  <div className="glass-panel border-gray-900 p-12 text-center text-gray-500 rounded-lg">
                    <p className="text-lg font-semibold mb-2 text-gray-400">Nenhum jogo disponível para palpitar</p>
                    <p className="text-sm max-w-sm mx-auto text-gray-500">
                      Todos os jogos da Copa já começaram ou foram finalizados.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {matches.map((match) => {
                      const pred = predictions[match.id] || { palpite_casa: '', palpite_fora: '', resultado_radio: '', saved: false };
                      const matchDate = new Date(match.data);
                      const matchStarted = match.status === 'LIVE' || match.status === 'FINISHED' || new Date() >= matchDate;
                      const isInputLocked = isGroupRequiredLocked || matchStarted;
                      
                      return (
                        <div key={match.id} className={`glass-card rounded-lg p-5 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-center transition-all ${matchStarted ? 'opacity-70' : ''}`}>
                          {/* Match Info & Teams (5 cols) */}
                          <div className="md:col-span-5 w-full space-y-3">
                            <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                              <span className={`h-1.5 w-1.5 rounded-full ${match.status === 'LIVE' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`}></span>
                              {match.status === 'LIVE' && <span className="text-red-400 font-bold">AO VIVO · </span>}
                              {matchDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })} • {matchDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1 flex items-center justify-end gap-2 font-bold text-sm text-gray-100 truncate">
                                <span>{match.time_casa}</span>
                                {getFlagUrl(match.time_casa) && (
                                  <img 
                                    src={getFlagUrl(match.time_casa)} 
                                    alt="" 
                                    className="w-5 h-3.5 object-cover rounded-sm border border-gray-850 shrink-0" 
                                  />
                                )}
                              </div>
                              <span className="text-[10px] text-gray-500 font-bold bg-gray-950 px-2 py-0.5 border border-gray-800 rounded shrink-0">VS</span>
                              <div className="flex-1 flex items-center justify-start gap-2 font-bold text-sm text-gray-100 truncate">
                                {getFlagUrl(match.time_fora) && (
                                  <img 
                                    src={getFlagUrl(match.time_fora)} 
                                    alt="" 
                                    className="w-5 h-3.5 object-cover rounded-sm border border-gray-850 shrink-0" 
                                  />
                                )}
                                <span>{match.time_fora}</span>
                              </div>
                            </div>
                          </div>

                          {/* Prediction Inputs (2 cols) */}
                          <div className="md:col-span-2 flex flex-col items-center justify-center w-full">
                            <div className="flex items-center gap-3 bg-gray-950/60 p-2 rounded-lg border border-gray-800/80 w-fit">
                              <input
                                type="number"
                                min="0"
                                value={pred.palpite_casa}
                                onChange={(e) => handleScoreChange(match.id, 'home', e.target.value)}
                                disabled={isInputLocked}
                                className="w-10 h-10 text-center bg-gray-900 border border-gray-800 focus:border-blue-500 rounded font-bold text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder="0"
                              />
                              <span className="text-gray-600 font-bold">x</span>
                              <input
                                type="number"
                                min="0"
                                value={pred.palpite_fora}
                                onChange={(e) => handleScoreChange(match.id, 'away', e.target.value)}
                                disabled={isInputLocked}
                                className="w-10 h-10 text-center bg-gray-900 border border-gray-800 focus:border-blue-500 rounded font-bold text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder="0"
                              />
                            </div>
                            {match.placar_casa !== null && match.placar_fora !== null && (
                              <div className={`mt-1.5 text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${
                                match.status === 'FINISHED'
                                  ? 'text-emerald-400 bg-emerald-950/30 border-emerald-500/20'
                                  : 'text-red-400 bg-red-950/30 border-red-500/20 animate-pulse'
                              }`}>
                                {match.status === 'FINISHED' ? 'Placar: ' : 'Ao Vivo: '} {match.placar_casa} x {match.placar_fora}
                              </div>
                            )}
                          </div>

                          {/* Outcome indicator — read-only, computed from scores (3 cols) */}
                          <div className="md:col-span-3 flex justify-center w-full">
                            <div className="flex items-center gap-1 bg-gray-950/30 p-1 rounded-md border border-gray-900 w-fit">
                              {(['CASA', 'EMPATE', 'FORA'] as const).map((opt) => (
                                <span
                                  key={opt}
                                  className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase select-none ${
                                    pred.resultado_radio === opt
                                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                      : 'text-gray-600 border border-transparent'
                                  }`}
                                >
                                  {opt === 'CASA' ? 'Casa' : opt === 'EMPATE' ? 'Empate' : 'Fora'}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Submit Bet (2 cols) */}
                          <div className="md:col-span-2 flex justify-center md:justify-end w-full">
                            <div className="flex flex-col items-center md:items-end gap-1 w-full md:w-auto">
                              {matchStarted ? (
                                /* Locked state */
                                <div className="flex flex-col items-center md:items-end gap-1">
                                  <span className="px-3 py-2 text-xs font-bold rounded bg-gray-800/60 text-gray-500 border border-gray-700/50 cursor-not-allowed w-full md:w-auto text-center">
                                    🔒 Encerrado
                                  </span>
                                  <span className="text-[9px] font-bold flex items-center gap-1 mt-1">
                                    {pred.saved ? (
                                      <><CheckmarkFilled size={12} className="text-emerald-400" /><span className="text-emerald-400">Palpite registrado</span></>
                                    ) : (
                                      <><WarningFilled size={12} className="text-gray-500" /><span className="text-gray-500">Sem palpite</span></>
                                    )}
                                  </span>
                                </div>
                              ) : (
                                /* Normal editable state */
                                <>
                                  <button
                                    onClick={() => submitPrediction(match.id)}
                                    disabled={savingBetId === match.id || isGroupRequiredLocked}
                                    className={`w-full md:w-auto px-4 py-2 font-bold text-xs rounded border-0 text-white cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                      pred.saved 
                                        ? 'bg-emerald-600 hover:bg-emerald-700' 
                                        : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                                  >
                                    {savingBetId === match.id 
                                      ? 'Salvando...' 
                                      : pred.saved 
                                        ? '✓ Salvo' 
                                        : 'Salvar'}
                                  </button>
                                  
                                  <span className="text-[9px] font-bold text-gray-500 flex items-center gap-1 mt-1">
                                    {pred.saved ? (
                                      <>
                                        <CheckmarkFilled size={12} className="text-emerald-400" />
                                        Palpite gravado
                                      </>
                                    ) : (
                                      <>
                                        <WarningFilled size={12} className="text-orange-400" />
                                        Alterações pendentes
                                      </>
                                    )}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  </div>
                )}
              </div>

              {/* Ranking Column (Right) */}
              <div id="classificacao-geral" className="lg:col-span-1">
                <div className="glass-panel border-gray-900 p-6 shadow-xl sticky top-20 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2 m-0">
                      <Trophy size={18} className="text-amber-400" />
                      {rankingFilter === 'GERAL' ? 'Classificação Geral' : `Grupo: ${rankingFilter}`}
                    </h2>
                  </div>

                  {userGroups.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4 bg-gray-950 p-1 border border-gray-850 rounded">
                      <button
                        type="button"
                        onClick={() => handleFilterChange('GERAL')}
                        className={`flex-1 min-w-[70px] py-1.5 text-xs font-bold transition-all rounded ${
                          rankingFilter === 'GERAL'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        Geral
                      </button>
                      {userGroups.map((gName) => (
                        <button
                          key={gName}
                          type="button"
                          onClick={() => handleFilterChange(gName)}
                          className={`flex-1 min-w-[70px] py-1.5 text-xs font-bold transition-all rounded ${
                            rankingFilter === gName
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'text-gray-400 hover:text-gray-200'
                          }`}
                        >
                          {gName}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="overflow-hidden border border-gray-800 bg-gray-950/40 rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-900/60 border-b border-gray-800 text-gray-400 text-xs font-semibold uppercase tracking-wider text-left">
                          <th className="py-3 px-4 text-center w-12">Pos</th>
                          <th className="py-3 px-3">Nome</th>
                          <th className="py-3 px-3 text-center w-16">Pts</th>
                          <th className="py-3 px-3 text-center w-14">Des</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/60">
                        {(rankingFilter === 'GERAL' ? ranking : groupRanking).map((row) => {
                          const isMe = row.id === loggedUser.id;
                          return (
                            <tr 
                              key={row.id} 
                              className={`hover:bg-slate-900/20 transition-all ${
                                isMe 
                                  ? 'bg-blue-600/10 font-bold border-l-2 border-l-blue-500' 
                                  : ''
                              }`}
                            >
                              <td className="py-3 px-4 text-center text-gray-400">
                                {row.posicao === 1 ? '🥇' : row.posicao === 2 ? '🥈' : row.posicao === 3 ? '🥉' : `${row.posicao}º`}
                              </td>
                              <td className="py-3 px-3 truncate max-w-[120px] text-gray-200">
                                {row.nome}
                                {row.grupo && (
                                  <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-gray-800 text-gray-300 uppercase h-4">
                                    {row.grupo}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-center text-white font-bold">
                                {row.pontos_total}
                              </td>
                              <td className="py-3 px-3 text-center text-xs text-gray-500" title="Diferença de placar no último jogo (Critério de desempate)">
                                {row.diferenca_ultimo_jogo !== null ? `+${row.diferenca_ultimo_jogo}` : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {(rankingFilter === 'GERAL' ? ranking : groupRanking).length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        Nenhum participante neste ranking.
                      </div>
                    )}
                  </div>

                  {/* General tips/legend */}
                  <div className="mt-6 text-xs text-gray-500 space-y-2 border-t border-gray-800/80 pt-4 font-medium">
                    <p className="font-semibold text-gray-400">💡 Sistema de Pontos:</p>
                    <div className="grid grid-cols-2 gap-1">
                      <div>🎯 Placar exato: <span className="text-blue-400 font-bold">7 pts</span></div>
                      <div>⚽ Vencedor correto: <span className="text-blue-400 font-bold">5 pts</span></div>
                      <div>🤝 Empate correto: <span className="text-blue-400 font-bold">5 pts</span></div>
                      <div>❌ Outros placares: <span className="text-blue-400 font-bold">0 pts</span></div>
                    </div>
                    <p className="text-[9px] leading-relaxed mt-2 text-gray-600">
                      * Em caso de prorrogação ou pênaltis, vale quem acertou o vencedor final (5 pts).
                    </p>
                    <p className="text-[9px] leading-relaxed text-gray-600">
                      * Desempate (Des): Quanto menor o número, mais próximo o palpite do placar real da partida final da Copa.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 border-t border-gray-900 bg-gray-950/80 py-8 text-center text-xs text-gray-500">
          <p className="mb-4">Desenvolvido para a Copa do Mundo 2026 🌎⚽</p>
          
          {loggedUser.is_admin && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors font-semibold py-1.5 px-3 bg-transparent border-0 cursor-pointer no-underline"
            >
              <Settings size={14} />
              Acessar Painel Administrativo
            </Link>
          )}
        </footer>
      </main>
    );
  }
