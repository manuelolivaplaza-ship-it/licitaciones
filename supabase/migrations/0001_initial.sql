-- Enable pgvector extension for AI semantic search embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tablas principales:

-- 1. organizations: Empresas registradas en la plataforma (Multi-tenant)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rut TEXT UNIQUE,
  industry TEXT,
  regions TEXT[],              -- Regiones de interés (Chile: 16 regiones)
  categories TEXT[],           -- Rubros/categorías de interés (ChileCompra rubros)
  keywords TEXT[],             -- Palabras clave de interés para matching
  min_amount BIGINT DEFAULT 0, -- Monto mínimo de interés en CLP
  max_amount BIGINT,           -- Monto máximo de interés en CLP
  plan TEXT DEFAULT 'free',    -- free, pro, enterprise
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. profiles: Usuarios vinculados a organizaciones
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY, -- Enlazado con auth.users(id) de Supabase
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  full_name TEXT,
  role TEXT DEFAULT 'member',  -- admin, manager, member
  avatar_url TEXT,
  notification_prefs JSONB DEFAULT '{"email": true, "in_app": true, "urgent_only": false}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. licitaciones: Cache local de licitaciones de ChileCompra
CREATE TABLE IF NOT EXISTS licitaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,           -- Código ChileCompra (ej: 1000-8888-LP07)
  nombre TEXT NOT NULL,
  descripcion TEXT,
  estado TEXT NOT NULL,                  -- Publicada, Cerrada, Adjudicada, Desierta, Revocada, Suspendida
  tipo TEXT,                             -- L1, LE, LP, etc.
  organismo TEXT,                        -- Entidad compradora (ej: Municipalidad de Santiago)
  organismo_codigo TEXT,
  region TEXT,
  fecha_publicacion TIMESTAMPTZ,
  fecha_cierre TIMESTAMPTZ,
  fecha_adjudicacion TIMESTAMPTZ,
  monto_estimado BIGINT,
  moneda TEXT DEFAULT 'CLP',
  items JSONB DEFAULT '[]'::jsonb,       -- Detalle de items de la licitación
  adjudicacion JSONB,                    -- Info de adjudicación (empresa ganadora, montos, etc.)
  raw_data JSONB,                        -- Respuesta completa API en crudo
  ai_summary TEXT,                       -- Resumen generado por IA
  ai_score INTEGER DEFAULT 0,            -- Puntaje de relevancia global / IA
  ai_score_keywords TEXT[],              -- Keywords extraídas por IA
  embedding vector(1536),                -- Para búsqueda semántica (OpenAI text-embedding-3-small)
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. saved_licitaciones: Licitaciones guardadas/favoritas por organización (Kanban pipeline)
CREATE TABLE IF NOT EXISTS saved_licitaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  licitacion_id UUID NOT NULL REFERENCES licitaciones(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'saved',           -- saved, reviewing, preparing, submitted, won, lost
  notes TEXT,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  priority TEXT DEFAULT 'medium',        -- low, medium, high, critical
  tags TEXT[] DEFAULT '{}',
  deadline_reminder TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, licitacion_id)
);

-- 5. alerts: Configuración de alertas automáticas por organización
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL,                -- {keywords: [], regions: [], categories: [], minAmount: null}
  frequency TEXT DEFAULT 'instant',      -- instant, daily, weekly
  channels TEXT[] DEFAULT '{in-app}',    -- email, push, in-app
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. alert_matches: Historial de matches de alertas encontradas
CREATE TABLE IF NOT EXISTS alert_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  licitacion_id UUID NOT NULL REFERENCES licitaciones(id) ON DELETE CASCADE,
  matched_at TIMESTAMPTZ DEFAULT now(),
  notified BOOLEAN DEFAULT false,
  UNIQUE(alert_id, licitacion_id)
);

-- 7. competitor_tracking: Seguimiento de competidores monitoreados
CREATE TABLE IF NOT EXISTS competitor_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  competitor_name TEXT NOT NULL,
  competitor_rut TEXT,
  industry TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, competitor_rut)
);

-- 8. activity_log: Log de actividad para auditoría interna del equipo
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,                  -- 'view', 'save', 'change_status', 'create_alert', etc.
  entity_type TEXT,                      -- 'licitacion', 'alert', 'profile', etc.
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. ai_analyses: Cache de análisis avanzados generados por IA
CREATE TABLE IF NOT EXISTS ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  licitacion_id UUID NOT NULL REFERENCES licitaciones(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL,           -- summary, scoring, requirements, risk
  result JSONB NOT NULL,                 -- Estructura de respuesta de la IA
  model_used TEXT,                       -- GPT-4o, Claude-3-5-Sonnet, etc.
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, licitacion_id, analysis_type)
);

-- Habilitar Row Level Security (RLS) en tablas multi-tenant
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_licitaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;

-- Crear políticas básicas de seguridad (RLS Policies)
-- Nota: En producción estas políticas validarán que auth.uid() coincida con el usuario.

-- Ejemplo de políticas (se asume que profiles contiene el organization_id del usuario)
CREATE POLICY org_select_policy ON organizations 
  FOR SELECT USING (id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY profile_policy ON profiles 
  FOR ALL USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()) OR id = auth.uid());

CREATE POLICY saved_licitaciones_policy ON saved_licitaciones 
  FOR ALL USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY alerts_policy ON alerts 
  FOR ALL USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY competitor_tracking_policy ON competitor_tracking 
  FOR ALL USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Índices optimizados para búsquedas
CREATE INDEX IF NOT EXISTS licitaciones_estado_idx ON licitaciones(estado);
CREATE INDEX IF NOT EXISTS licitaciones_region_idx ON licitaciones(region);
CREATE INDEX IF NOT EXISTS licitaciones_fecha_cierre_idx ON licitaciones(fecha_cierre);
CREATE INDEX IF NOT EXISTS licitaciones_monto_estimado_idx ON licitaciones(monto_estimado);
CREATE INDEX IF NOT EXISTS saved_licitaciones_status_idx ON saved_licitaciones(status);

-- Índice para búsqueda de texto completo en licitaciones
CREATE INDEX IF NOT EXISTS licitaciones_fts_idx ON licitaciones USING gin(
  to_tsvector('spanish', coalesce(nombre, '') || ' ' || coalesce(descripcion, ''))
);
