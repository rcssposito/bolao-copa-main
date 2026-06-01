-- Bolão Copa - Database Schema
-- Execute este script no Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    pontos_total INTEGER DEFAULT 0,
    ultimo_palpite_casa INTEGER,
    ultimo_palpite_fora INTEGER,
    grupo VARCHAR(50),
    pagou BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: matches
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_api INTEGER UNIQUE NOT NULL,
    time_casa VARCHAR(100) NOT NULL,
    time_fora VARCHAR(100) NOT NULL,
    data TIMESTAMP WITH TIME ZONE NOT NULL,
    placar_casa INTEGER,
    placar_fora INTEGER,
    status VARCHAR(20) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'FINISHED', 'LIVE', 'POSTPONED')),
    is_last_match BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: bets
CREATE TABLE IF NOT EXISTS bets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES users(id) ON DELETE CASCADE,
    jogo_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    palpite_casa INTEGER NOT NULL CHECK (palpite_casa >= 0),
    palpite_fora INTEGER NOT NULL CHECK (palpite_fora >= 0),
    resultado_radio VARCHAR(10) NOT NULL CHECK (resultado_radio IN ('CASA', 'EMPATE', 'FORA')),
    pontos INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(usuario_id, jogo_id)
);

-- Table: config
CREATE TABLE IF NOT EXISTS config (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default pot value
INSERT INTO config (key, value) 
VALUES ('pot_value', '50')
ON CONFLICT (key) DO NOTHING;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_data ON matches(data);
CREATE INDEX IF NOT EXISTS idx_matches_is_last ON matches(is_last_match);
CREATE INDEX IF NOT EXISTS idx_bets_usuario ON bets(usuario_id);
CREATE INDEX IF NOT EXISTS idx_bets_jogo ON bets(jogo_id);
CREATE INDEX IF NOT EXISTS idx_users_grupo ON users(grupo);
CREATE INDEX IF NOT EXISTS idx_users_pagou ON users(pagou);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at on matches
CREATE TRIGGER update_matches_updated_at 
    BEFORE UPDATE ON matches 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update updated_at on config
CREATE TRIGGER update_config_updated_at 
    BEFORE UPDATE ON config 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for now - adjust based on your auth strategy)
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on matches" ON matches FOR ALL USING (true);
CREATE POLICY "Allow all operations on bets" ON bets FOR ALL USING (true);
CREATE POLICY "Allow all operations on config" ON config FOR ALL USING (true);

-- Sample data for testing (optional)
-- Uncomment to insert sample users
/*
INSERT INTO users (nome, grupo, pagou) VALUES
    ('João Silva', 'A', true),
    ('Maria Santos', 'A', true),
    ('Pedro Costa', 'B', false),
    ('Ana Oliveira', 'B', true);
*/

-- Made with Bob
