import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Types
export interface User {
  id: string
  nome: string
  email: string
  pontos_total: number
  ultimo_palpite_casa: number | null
  ultimo_palpite_fora: number | null
  grupo: string | null
  pagou: boolean
  is_admin: boolean
  created_at: string
}

export interface Match {
  id: string
  id_api: number
  time_casa: string
  time_fora: string
  data: string
  placar_casa: number | null
  placar_fora: number | null
  status: 'SCHEDULED' | 'FINISHED' | 'LIVE' | 'POSTPONED'
  is_last_match: boolean
  created_at: string
  updated_at: string
}

export interface Bet {
  id: string
  usuario_id: string
  jogo_id: string
  palpite_casa: number
  palpite_fora: number
  resultado_radio: 'CASA' | 'EMPATE' | 'FORA'
  pontos: number
  created_at: string
}

export interface RankingUser extends User {
  posicao: number
  diferenca_ultimo_jogo: number | null
}

export interface PotInfo {
  valor_por_usuario: number
  usuarios_pagantes: number
  total_pote: number
}

// API Functions

// Users
export const getUsers = () => api.get<User[]>('/users')
export const getUser = (id: string) => api.get<User>(`/users/${id}`)
export const createUser = (data: Partial<User>) => api.post<User>('/users', data)
export const updateUser = (id: string, data: Partial<User>) => api.put<User>(`/users/${id}`, data)
export const deleteUser = (id: string) => api.delete<{ message: string }>(`/admin/users/${id}`)
export const loginUser = (data: { email: string; nome: string; code?: string }) => api.post<User>('/users/login', data)

// Matches
export const getAvailableMatches = (competition?: string) => 
  api.get<Match[]>('/matches', { params: competition ? { competition } : {} })
export const getUpcomingMatches = (competition?: string) => 
  api.get<Match[]>('/matches/upcoming', { params: competition ? { competition } : {} })
export const getFinishedMatches = () => api.get<Match[]>('/matches/finished')
export const getMatch = (id: string) => api.get<Match>(`/matches/${id}`)

// Bets
export const createBet = (data: {
  usuario_id: string
  jogo_id: string
  palpite_casa: number
  palpite_fora: number
  resultado_radio: 'CASA' | 'EMPATE' | 'FORA'
}) => api.post<Bet>('/bets', data)

export const getUserBets = (userId: string) => api.get<Bet[]>(`/bets/user/${userId}`)
export const getMatchBets = (matchId: string) => api.get<Bet[]>(`/bets/match/${matchId}`)

// Ranking
export const getRanking = (competition?: string) => 
  api.get<{ ranking: RankingUser[]; total_usuarios: number }>('/ranking', { params: competition ? { competition } : {} })
export const getGroupRanking = (group: string, competition?: string) => 
  api.get<{ ranking: RankingUser[]; total_usuarios: number }>(`/ranking/group/${group}`, { params: competition ? { competition } : {} })

// Admin
export const getAllUsers = () => api.get<User[]>('/admin/users')
export const updateUserAdmin = (id: string, data: { 
  nome?: string; 
  email?: string; 
  grupo?: string | null; 
  pagou?: boolean; 
  is_admin?: boolean; 
}) => api.put<User>(`/admin/users/${id}`, data)
export const getUsersByGroup = (group: string) => api.get<User[]>(`/admin/users/group/${group}`)
export const getPotTotal = (group?: string) => 
  api.get<PotInfo>('/admin/pot/total', { params: group ? { group } : {} })
export const updatePotValue = (value: string) => api.put('/admin/config/pot', { value })
export const triggerSync = () => api.post('/admin/sync')
export const getStats = () => api.get('/admin/stats')
export const getCompetitions = () => api.get<{ active: string; competitions: any[] }>('/admin/competitions')
export const updateActiveCompetition = (code: string) => api.post('/admin/competitions', { code })

// Tags
export interface TagItem {
  nome: string
  codigo: string
  preco?: number
}
export const getTags = () => api.get<TagItem[]>('/admin/tags')
export const saveTags = (tags: TagItem[]) => api.post<TagItem[]>('/admin/tags', { tags })

// Join Group
export const joinGroup = (userId: string, code: string, groupName?: string, action?: 'join' | 'leave') => 
  api.post<User>('/users/join-group', { userId, code, groupName, action })

export default api

// Made with Bob
