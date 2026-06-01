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
  User,
  Match,
  RankingUser,
  Bet
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
  Theme
} from '@carbon/react';

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

  // First Login Registration States
  const [registrationPendingUser, setRegistrationPendingUser] = useState<{ email: string; nome: string } | null>(null);
  const [registrationCode, setRegistrationCode] = useState<string>('');
  const [confirmingCode, setConfirmingCode] = useState<boolean>(false);

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
          
          if (res.status === 202 && (res.data as any).error === 'REGISTRATION_REQUIRED_CODE') {
            setRegistrationPendingUser({ email, nome });
            setLoggedUser(null);
          } else {
            setLoggedUser(res.data);
            setRegistrationPendingUser(null);
            
            // Load their predictions
            await loadUserBets(res.data.id, matches);

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

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [rankingRes, potRes, matchesRes] = await Promise.all([
        getRanking(selectedCompetition),
        getPotTotal(),
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
      setPredictions(initialPredictions);

      // Reload user bets if logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && loggedUser) {
        await loadUserBets(loggedUser.id, matchesRes.data);
      }

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

  const loadUserBets = async (userId: string, currentMatches: Match[] = matches) => {
    try {
      const response = await getUserBets(userId);
      const userBets = response.data;
      
      setPredictions(prev => {
        const updated = { ...prev };
        
        currentMatches.forEach(match => {
          const matchingBet = userBets.find((b: Bet) => b.jogo_id === match.id);
          if (matchingBet) {
            updated[match.id] = {
              palpite_casa: matchingBet.palpite_casa,
              palpite_fora: matchingBet.palpite_fora,
              resultado_radio: matchingBet.resultado_radio,
              betId: matchingBet.id,
              saved: true
            };
          } else {
            updated[match.id] = {
              palpite_casa: '',
              palpite_fora: '',
              resultado_radio: '',
              saved: false
            };
          }
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

  const handleRegistrationConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationPendingUser || !registrationCode.trim()) return;
    try {
      setConfirmingCode(true);
      const res = await loginUser({
        email: registrationPendingUser.email,
        nome: registrationPendingUser.nome,
        code: registrationCode
      });
      
      if (res.status === 201) {
        setLoggedUser(res.data);
        setRegistrationPendingUser(null);
        setRegistrationCode('');
        alert('Cadastro realizado com sucesso! Bem-vindo ao bolão.');
        
        // Load predictions
        await loadUserBets(res.data.id, matches);
        
        // Load group rankings
        if (res.data.grupo) {
          const uGroups = res.data.grupo.split(',').map((g: string) => g.trim()).filter(Boolean);
          const firstGroup = uGroups[0];
          if (firstGroup) {
            setRankingFilter(firstGroup);
            const groupRankRes = await getGroupRanking(firstGroup, selectedCompetition);
            setGroupRanking(groupRankRes.data.ranking);
          }
        }
      } else {
        alert((res.data as any).message || 'Código inválido.');
      }
    } catch (error: any) {
      console.error('Erro ao confirmar código:', error);
      alert(error.response?.data?.message || error.response?.data?.error || 'Código de grupo inválido ou inexistente.');
    } finally {
      setConfirmingCode(false);
    }
  };

  const handleRegistrationCancel = async () => {
    try {
      await supabase.auth.signOut();
      setRegistrationPendingUser(null);
      setRegistrationCode('');
    } catch (error) {
      console.error('Erro ao cancelar registro:', error);
    }
  };

  const selectedUserStats = loggedUser 
    ? ranking.find(u => u.id === loggedUser.id) 
    : null;

  const userGroups = loggedUser?.grupo
    ? loggedUser.grupo.split(',').map(g => g.trim()).filter(Boolean)
    : [];

  if (loading) {
    return (
      <Theme theme="g100">
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white">
          <Loading withOverlay={false} description="Carregando..." />
          <p className="text-gray-400 font-semibold mt-4">Carregando Bolão da Copa...</p>
        </div>
      </Theme>
    );
  }

  // Se o usuário logou via Google, mas é novo e precisa do código do grupo
  if (registrationPendingUser) {
    return (
      <Theme theme="g100">
        <main className="min-h-screen bg-gray-950 text-gray-100 font-sans antialiased flex flex-col items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-600/20 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 text-center">
              <div className="mx-auto w-16 h-16 bg-blue-600/10 border border-blue-500/30 rounded-full flex items-center justify-center mb-6">
                <Trophy size={32} className="text-blue-500" />
              </div>
              
              <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Primeiro Acesso</h1>
              <p className="text-sm text-gray-400 mb-6 font-medium">
                Olá, <span className="text-white font-semibold">{registrationPendingUser.nome}</span>! Para participar do Bolão da Copa, você precisa inserir um código de grupo válido.
              </p>
              
              <form onSubmit={handleRegistrationConfirmCode} className="space-y-4 text-left">
                <div>
                  <label htmlFor="reg-code" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Código do Grupo
                  </label>
                  <TextInput
                    id="reg-code"
                    labelText=""
                    placeholder="Ex: GRUPO2026"
                    value={registrationCode}
                    onChange={(e) => setRegistrationCode(e.target.value)}
                    className="w-full bg-gray-900 border-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    disabled={confirmingCode}
                    hideLabel
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    kind="secondary"
                    className="flex-1"
                    onClick={handleRegistrationCancel}
                    disabled={confirmingCode}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 border-blue-600"
                    disabled={confirmingCode || !registrationCode.trim()}
                  >
                    {confirmingCode ? 'Confirmando...' : 'Confirmar'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </Theme>
    );
  }

  // Render Landing Page if User NOT Authenticated
  if (!loggedUser) {
    return (
      <Theme theme="g100">
        <main className="min-h-screen bg-gray-950 text-gray-100 font-sans antialiased">
          {/* Carbon Header */}
          <Header aria-label="Bolão Copa 2026">
            <HeaderName href="#" prefix="">
              Bolão Copa 2026
            </HeaderName>
          </Header>

          {/* Hero Section */}
          <section className="relative bg-gradient-to-b from-slate-900 to-gray-950 pt-28 pb-16 border-b border-gray-900 overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-10"></div>
            
            <div className="container mx-auto px-4 max-w-4xl text-center relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-6">
                ⚽ Copa do Mundo 2026
              </span>
              
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 leading-none">
                Participe do Nosso <span className="text-indigo-400">Bolão da Copa</span>
              </h1>
              
              <p className="text-base md:text-lg text-gray-400 max-w-xl mx-auto mb-10 font-medium">
                Dê seus palpites, acumule pontos e acompanhe a classificação geral dos seus amigos em tempo real.
              </p>

              {/* Carbon Button for Login */}
              <div className="flex flex-col items-center justify-center gap-4">
                <Button
                  renderIcon={Login}
                  onClick={handleGoogleLogin}
                  disabled={authLoading}
                  size="lg"
                  className="px-8 font-bold border-indigo-600 bg-indigo-600 hover:bg-indigo-700"
                >
                  {authLoading ? 'Conectando...' : 'Entrar com o Google'}
                </Button>
                <p className="text-xs text-gray-500">Acesso rápido e seguro via OAuth oficial.</p>
              </div>
            </div>
          </section>

          {/* Dashboard Preview Section (Read Only) */}
          <section className="container mx-auto px-4 py-12 max-w-5xl">
            {/* Pot display using Carbon Tile */}
            <Tile className="glass-card ibm-border-emerald mb-12 p-6 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-left flex items-center gap-3">
                <div className="p-3 bg-emerald-950/40 text-emerald-400 border border-emerald-500/10 rounded-xl">
                  <Finance size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white mb-0.5">💰 Valor do Pote Acumulado</h2>
                  <p className="text-xs text-indigo-400 font-medium">{totalPot.usuarios_pagantes} participantes ativos pagantes.</p>
                </div>
              </div>
              <div className="text-3xl font-black text-emerald-400 bg-emerald-950/20 px-6 py-3 border border-emerald-500/20">
                R$ {totalPot.total_pote.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </Tile>

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
                      <Tile key={match.id} className="glass-card flex justify-between items-center gap-4 py-4">
                        <div className="flex-1 text-right font-bold text-sm text-gray-300">{match.time_casa}</div>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs font-bold text-indigo-400">vs</span>
                          <span className="text-[10px] text-gray-500 font-semibold bg-gray-950 px-2 py-0.5 border border-gray-800">
                            {matchDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} {matchDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex-1 text-left font-bold text-sm text-gray-300">{match.time_fora}</div>
                      </Tile>
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
      </Theme>
    );
  }

  // Render Full Betting Dashboard if Authenticated
  return (
    <Theme theme="g100">
      <main className="min-h-screen bg-gray-950 text-gray-100 font-sans antialiased flex flex-col">
        {/* Carbon Header */}
        <Header aria-label="Bolão Copa 2026" className="border-b border-gray-900 bg-gray-950/85 backdrop-blur-md">
          <HeaderName href="#" prefix="">
            Bolão Copa 2026
          </HeaderName>
          
          {/* User profile action badge directly in Carbon layout */}
          <div className="absolute right-4 top-0 h-full flex items-center gap-3">
            {/* Visual icons to match the mockup */}
            <button className="text-gray-400 hover:text-white p-1.5 bg-transparent border-0 cursor-pointer hidden sm:block">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </button>
            <button className="text-gray-400 hover:text-white p-1.5 bg-transparent border-0 cursor-pointer hidden sm:block">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            </button>
            <button className="text-gray-400 hover:text-white p-1.5 bg-transparent border-0 cursor-pointer hidden sm:block">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </button>
            <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-sm text-blue-400">
              {loggedUser.nome.slice(0,2).toUpperCase()}
            </div>
          </div>
        </Header>

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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-gray-900 pb-4">
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight leading-none">Dashboard</h1>
                <p className="text-xs text-gray-500 mt-1.5 font-medium">Bem-vindo de volta ao Bolão da Copa.</p>
              </div>
              
              {/* Event Tabs Switcher */}
              <div className="flex items-center gap-1.5 bg-gray-950/40 p-1 border border-white/5 rounded-lg backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setSelectedCompetition('WC')}
                  className={`px-3 py-1.5 text-xs font-bold rounded transition-all cursor-pointer border-0 ${
                    selectedCompetition === 'WC' 
                      ? 'bg-blue-600 text-white shadow' 
                      : 'text-gray-400 hover:text-gray-200 bg-transparent'
                  }`}
                >
                  🌎 Copa do Mundo
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCompetition('CL')}
                  className={`px-3 py-1.5 text-xs font-bold rounded transition-all cursor-pointer border-0 ${
                    selectedCompetition === 'CL' 
                      ? 'bg-blue-600 text-white shadow' 
                      : 'text-gray-400 hover:text-gray-200 bg-transparent'
                  }`}
                >
                  🏆 Champions
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCompetition('BSA')}
                  className={`px-3 py-1.5 text-xs font-bold rounded transition-all cursor-pointer border-0 ${
                    selectedCompetition === 'BSA' 
                      ? 'bg-blue-600 text-white shadow' 
                      : 'text-gray-400 hover:text-gray-200 bg-transparent'
                  }`}
                >
                  ⚽ Brasileirão
                </button>
              </div>

              <div className="flex items-center gap-4">
                {loggedUser.is_admin && (
                  <Button
                    as={Link}
                    href="/admin"
                    kind="ghost"
                    size="sm"
                    renderIcon={Settings}
                    className="text-xs font-semibold px-3 py-1.5 h-8 text-amber-400 hover:text-amber-300 hover:bg-slate-900/40 flex items-center"
                  >
                    Painel Admin
                  </Button>
                )}
                <div className="flex flex-col text-right">
                  <span className="text-[9px] text-indigo-400 uppercase font-black tracking-wider leading-none">Conectado como</span>
                  <span className="text-xs font-bold text-white mt-1">{loggedUser.nome}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-sm text-blue-400">
                  {loggedUser.nome.slice(0,2).toUpperCase()}
                </div>
              </div>
            </div>

            {/* Status Dashboard Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {/* Pote Total Card */}
              <Tile className="glass-card rounded-lg p-6 flex flex-col justify-between transition-all duration-300">
                <div>
                  <div className="text-xs uppercase tracking-wider text-emerald-400 font-bold mb-1">💰 Pote Total</div>
                  <div className="text-3xl font-extrabold text-white mt-1">
                    R$ {totalPot.total_pote.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-4 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  {totalPot.usuarios_pagantes} pagantes {loggedUser.pagou ? '(Você pagou ✓)' : '(Você não pagou ✗)'}
                </div>
              </Tile>

              {/* Jogos Disponíveis Card */}
              <Tile className="glass-card rounded-lg p-6 flex flex-col justify-between transition-all duration-300">
                <div>
                  <div className="text-xs uppercase tracking-wider text-indigo-400 font-bold mb-1">⚽ Jogos Disponíveis</div>
                  <div className="text-3xl font-extrabold text-white mt-1">
                    {matches.length}
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-4">
                  Partidas prontas para palpitar
                </div>
              </Tile>

              {/* Sua Posição Card */}
              <Tile className="glass-card rounded-lg p-6 flex flex-col justify-between transition-all duration-300">
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
              </Tile>

              {/* Grupo / Tag Card */}
              <Tile id="seus-grupos-card" className="glass-card rounded-lg p-6 flex flex-col justify-between transition-all duration-300">
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
                      <TextInput
                        id="join-group-code"
                        labelText=""
                        hideLabel
                        placeholder="Código do Grupo"
                        value={groupCode}
                        onChange={(e) => setGroupCode(e.target.value)}
                        className="h-8 text-xs font-bold w-full"
                        size="sm"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleJoinGroup(groupCode)}
                        disabled={joiningGroup || !groupCode.trim()}
                        className="bg-orange-600 hover:bg-orange-700 h-8 font-bold px-3 text-xs border-0"
                      >
                        Entrar
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-4">
                  Participe de múltiplos grupos!
                </div>
              </Tile>
            </div>

            {/* Split Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Matches Column (Left) */}
              <div id="palpites-disponiveis" className="lg:col-span-2 space-y-6">
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <Events size={20} className="text-indigo-400" /> Palpites Disponíveis
                </h2>

                {matches.length === 0 ? (
                  <Tile className="glass-panel border-gray-900 p-12 text-center text-gray-500 rounded-lg">
                    <p className="text-lg font-semibold mb-2 text-gray-400">Nenhum jogo disponível para palpitar</p>
                    <p className="text-sm max-w-sm mx-auto text-gray-500">
                      Todos os jogos da Copa já começaram ou foram finalizados.
                    </p>
                  </Tile>
                ) : (
                  <div className="space-y-4">
                    {matches.map((match) => {
                      const pred = predictions[match.id] || { palpite_casa: '', palpite_fora: '', resultado_radio: '', saved: false };
                      const matchDate = new Date(match.data);
                      
                      return (
                        <Tile key={match.id} className="glass-card rounded-lg p-5 flex flex-col md:flex-row justify-between items-center gap-6">
                          {/* Match Info & Teams */}
                          <div className="flex-1 w-full space-y-3">
                            <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                              {matchDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })} • {matchDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1 text-right font-bold text-sm text-gray-100 truncate">{match.time_casa}</div>
                              <span className="text-[10px] text-gray-500 font-bold bg-gray-950 px-2 py-0.5 border border-gray-800 rounded">VS</span>
                              <div className="flex-1 text-left font-bold text-sm text-gray-100 truncate">{match.time_fora}</div>
                            </div>
                          </div>

                          {/* Prediction Inputs */}
                          <div className="flex items-center gap-3 bg-gray-950/60 p-2 rounded-lg border border-gray-800/80">
                            <input
                              type="number"
                              min="0"
                              value={pred.palpite_casa}
                              onChange={(e) => handleScoreChange(match.id, 'home', e.target.value)}
                              className="w-10 h-10 text-center bg-gray-900 border border-gray-800 focus:border-blue-500 rounded font-bold text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              placeholder="0"
                            />
                            <span className="text-gray-600 font-bold">x</span>
                            <input
                              type="number"
                              min="0"
                              value={pred.palpite_fora}
                              onChange={(e) => handleScoreChange(match.id, 'away', e.target.value)}
                              className="w-10 h-10 text-center bg-gray-900 border border-gray-800 focus:border-blue-500 rounded font-bold text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              placeholder="0"
                            />
                          </div>

                          {/* Quick Radio Selection for Outcome */}
                          <div className="flex items-center gap-1 bg-gray-950/30 p-1 rounded-md border border-gray-900">
                            <button
                              type="button"
                              onClick={() => handleOutcomeChange(match.id, 'CASA')}
                              className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all ${
                                pred.resultado_radio === 'CASA'
                                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent'
                              }`}
                            >
                              Casa
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOutcomeChange(match.id, 'EMPATE')}
                              className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all ${
                                pred.resultado_radio === 'EMPATE'
                                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent'
                              }`}
                            >
                              Empate
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOutcomeChange(match.id, 'FORA')}
                              className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all ${
                                pred.resultado_radio === 'FORA'
                                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent'
                              }`}
                            >
                              Fora
                            </button>
                          </div>

                          {/* Submit Bet */}
                          <div className="flex flex-col items-end gap-1 shrink-0 w-full md:w-auto">
                            <Button
                              size="sm"
                              onClick={() => submitPrediction(match.id)}
                              disabled={savingBetId === match.id}
                              className={`w-full md:w-auto font-bold ${
                                pred.saved 
                                  ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600' 
                                  : 'bg-blue-600 hover:bg-blue-700 border-blue-600'
                              }`}
                            >
                              {savingBetId === match.id 
                                ? 'Salvando...' 
                                : pred.saved 
                                  ? '✓ Salvo' 
                                  : 'Salvar'}
                            </Button>
                            
                            <span className="text-[9px] font-bold text-gray-500 flex items-center gap-1 mt-1 pr-1">
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
                          </div>
                        </Tile>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Ranking Column (Right) */}
              <div id="classificacao-geral" className="lg:col-span-1">
                <Tile className="glass-panel border-gray-900 p-6 shadow-xl sticky top-20 rounded-lg">
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
                                  <Tag size="sm" type="cool-gray" className="ml-1.5 uppercase font-normal text-[9px] h-4">
                                    {row.grupo}
                                  </Tag>
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
                      <div>🤝 Empate correto: <span className="text-blue-400 font-bold">3 pts</span></div>
                      <div>❌ Outros placares: <span className="text-blue-400 font-bold">0 pts</span></div>
                    </div>
                    <p className="text-[9px] leading-relaxed mt-2 text-gray-600">
                      * Desempate (Des): Quanto menor o número, mais próximo o palpite do placar real da partida final da Copa.
                    </p>
                  </div>
                </Tile>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 border-t border-gray-900 bg-gray-950/80 py-8 text-center text-xs text-gray-500">
          <p className="mb-4">Desenvolvido para a Copa do Mundo 2026 🌎⚽</p>
          
          {loggedUser.is_admin && (
            <Button
              as={Link}
              href="/admin"
              kind="ghost"
              renderIcon={Settings}
              size="sm"
              className="text-gray-400 hover:text-gray-200"
            >
              Acessar Painel Administrativo
            </Button>
          )}
        </footer>
      </main>
    </Theme>
  );
}
