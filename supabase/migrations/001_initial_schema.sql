-- Create extension for UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table for User/Company Profiles
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- references auth.users when real auth is used
    name TEXT NOT NULL,
    industry TEXT NOT NULL,
    size TEXT NOT NULL,
    keywords TEXT[] DEFAULT '{}',
    region TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table for Raw Licitaciones from ChileCompra
CREATE TABLE IF NOT EXISTS public.licitaciones (
    id TEXT PRIMARY KEY, -- CodigoExterno
    nombre TEXT NOT NULL,
    estado TEXT NOT NULL,
    descripcion TEXT,
    fecha_cierre TIMESTAMP WITH TIME ZONE,
    fecha_publicacion TIMESTAMP WITH TIME ZONE,
    monto_estimado DECIMAL,
    moneda TEXT DEFAULT 'CLP',
    organismo TEXT,
    region TEXT,
    raw_data JSONB NOT NULL, -- The full JSON from ChileCompra
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table for AI Matches
CREATE TABLE IF NOT EXISTS public.company_licitacion_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    licitacion_id TEXT REFERENCES public.licitaciones(id) ON DELETE CASCADE,
    score INTEGER NOT NULL, -- 0-100
    recommendation_level TEXT NOT NULL, -- 'alta', 'media', 'baja', 'descartada'
    insights TEXT,
    matched_keywords TEXT[] DEFAULT '{}',
    is_saved BOOLEAN DEFAULT false,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, licitacion_id)
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_licitaciones_estado ON public.licitaciones(estado);
CREATE INDEX IF NOT EXISTS idx_matches_company ON public.company_licitacion_matches(company_id);
CREATE INDEX IF NOT EXISTS idx_matches_score ON public.company_licitacion_matches(score DESC);

-- RLS Setup (Row Level Security)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licitaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_licitacion_matches ENABLE ROW LEVEL SECURITY;

-- Everyone can read licitaciones
CREATE POLICY "Public licitaciones are viewable by everyone." 
ON public.licitaciones FOR SELECT USING (true);

-- Companies can be read/written by their owners
CREATE POLICY "Users can manage their own companies." 
ON public.companies FOR ALL USING (auth.uid() = user_id);

-- Matches can be read/written by their company owners
CREATE POLICY "Users can manage matches for their companies." 
ON public.company_licitacion_matches FOR ALL 
USING (
    company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())
);
