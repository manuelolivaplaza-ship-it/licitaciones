import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { CompanyProfile, CompanyMatch, SyncState } from '@/types/company';

// ============================================================
// JSON File Store — Persistencia local sin Supabase
// ============================================================

const DATA_DIR = path.join(process.cwd(), 'data');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJSON<T>(filename: string, fallback: T): T {
  ensureDataDir();
  const filepath = path.join(DATA_DIR, filename);
  try {
    if (fs.existsSync(filepath)) {
      const raw = fs.readFileSync(filepath, 'utf-8');
      return JSON.parse(raw) as T;
    }
  } catch (e) {
    console.warn(`Error reading ${filename}:`, e);
  }
  return fallback;
}

function writeJSON<T>(filename: string, data: T): void {
  ensureDataDir();
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
}

// ============================================================
// Password Hashing (simple, no bcrypt dependency needed)
// ============================================================

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const testHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === testHash;
}

// ============================================================
// Company Store
// ============================================================

const COMPANIES_FILE = 'companies.json';

const PROGRAMBI_DEFAULT_PROFILE: CompanyProfile = {
  id: 'programbi-id',
  name: 'ProgramBi',
  rut: '76.123.456-K',
  email: 'contacto@programbi.com',
  contactName: 'Manuel',
  phone: '+56 9 1234 5678',
  passwordHash: '', // Will be hashed dynamically
  industry: 'Educación y Capacitación',
  industryCode: 'EDUC',
  subCategories: ['Capacitación empresarial', 'E-learning'],
  description: 'Programbi.com ofrece capacitaciones, cursos, asesorías y consultoría en programación y análisis de datos en tecnologías como Power BI, SQL, Python, Excel, inteligencia artificial y automatización de procesos. Nos enfocamos en capacitar personal de minería y empresas en el análisis y modelamiento de datos.',
  specializations: ['Power BI', 'SQL Server', 'Python', 'Excel', 'Big Data', 'Inteligencia Artificial', 'RPA', 'Analítica Minera'],
  productsServices: ['Cursos de Programación', 'Capacitaciones de Datos', 'Consultoría en Power BI', 'Asesoría en IA y Automatización'],
  certifications: ['NCh 2728 (Gestión de Calidad Chile)', 'Registro de Proveedores del Estado'],
  yearsExperience: 8,
  employeeCount: '11-50',
  annualRevenue: '100m_500m',
  previousPublicContracts: 12,
  experienceLevel: 'intermedio',
  maxContractCapacity: 50000000,
  keywords: ['curso', 'capacitación', 'e-learning', 'formación', 'diplomado', 'taller', 'programación', 'power bi', 'sql', 'python', 'excel', 'computación', 'desarrollo de software', 'analítica', 'clases', 'aula', 'educación', 'rpa', 'automatización', 'javascript', 'typescript', 'react', 'node.js', 'next.js', 'nextjs', 'web', 'frontend', 'backend', 'fullstack', 'desarrollo móvil', 'scrum', 'devops', 'cloud', 'aws', 'azure', 'gcp', 'big data', 'ciencia de datos', 'inteligencia artificial', 'machine learning', 'ia', 'databases', 'base de datos', 'postgresql', 'mysql', 'power automate', 'scrum master', 'metodologías ágiles', 'tecnología', 'informática', 'tics', 'relatoría', 'clases de programación', 'capacitación ti', 'capacitación digital', 'alfabetización digital', 'seguridad de la información', 'ciberseguridad'],
  excludeKeywords: ['obras', 'construcción', 'pavimento', 'limpieza', 'vestuario', 'alimentos', 'aseo', 'guardias', 'camiones', 'transporte', 'insumos médicos', 'reactivo', 'reactivos', 'laboratorio', 'residencias', 'extintor', 'extintores', 'redes húmedas', 'emulsión', 'emulsion', 'asfalto', 'asfáltica', 'asfaltica', 'gases', 'imprenta', 'impresos', 'tóner', 'toner', 'tintas', 'tinta'],
  regions: ['Metropolitana de Santiago', 'Valparaíso', 'Biobío', 'Antofagasta'],
  montoMin: 1000000,
  montoMax: 100000000,
  tiposLicitacion: ['L1', 'LE', 'LP', 'CO'],
  alertFrequency: 'instant',
  alertMinScore: 60,
  createdAt: '2026-05-30T02:34:11.962Z',
  updatedAt: '2026-05-30T02:34:12.037Z'
};

const DEMO_DEFAULT_PROFILE: CompanyProfile = {
  id: 'demo-company-id',
  name: 'Demo Licitaciones Ltda.',
  rut: '76.999.888-7',
  email: 'demo@licitahub.cl',
  contactName: 'Usuario Demo',
  phone: '+56 9 9999 8888',
  passwordHash: '', // Will be hashed dynamically
  industry: 'Educación y Capacitación',
  industryCode: 'EDUC',
  subCategories: ['Capacitación empresarial', 'E-learning'],
  description: 'Empresa demo para realizar pruebas en el portal de licitaciones.',
  specializations: ['Power BI', 'SQL Server', 'Python', 'Excel'],
  productsServices: ['Cursos de Programación', 'Capacitaciones de Datos'],
  certifications: ['Registro de Proveedores del Estado'],
  yearsExperience: 5,
  employeeCount: '1-10',
  annualRevenue: 'bajo_100m',
  previousPublicContracts: 3,
  experienceLevel: 'principiante',
  maxContractCapacity: 10000000,
  keywords: ['curso', 'capacitación', 'e-learning', 'formación', 'taller', 'programación', 'power bi', 'sql', 'python', 'excel'],
  excludeKeywords: ['obras', 'construcción', 'limpieza', 'aseo'],
  regions: ['Metropolitana de Santiago'],
  montoMin: 500000,
  montoMax: 50000000,
  tiposLicitacion: ['L1', 'LE', 'CO'],
  alertFrequency: 'instant',
  alertMinScore: 60,
  createdAt: '2026-05-30T02:34:11.962Z',
  updatedAt: '2026-05-30T02:34:12.037Z'
};

export function getCompanies(): CompanyProfile[] {
  const companies = readJSON<CompanyProfile[]>(COMPANIES_FILE, []);
  let hasProgramBi = companies.some(c => c.id === 'programbi-id' || c.email === 'contacto@programbi.com');
  let hasDemo = companies.some(c => c.id === 'demo-company-id' || c.email === 'demo@licitahub.cl');

  if (!hasProgramBi || !hasDemo) {
    const nextCompanies = [...companies];
    if (!hasProgramBi) {
      nextCompanies.push({
        ...PROGRAMBI_DEFAULT_PROFILE,
        passwordHash: hashPassword('programbi123')
      });
    }
    if (!hasDemo) {
      nextCompanies.push({
        ...DEMO_DEFAULT_PROFILE,
        passwordHash: hashPassword('demo1234')
      });
    }
    writeJSON(COMPANIES_FILE, nextCompanies);
    return nextCompanies;
  }

  return companies;
}

export function getCompanyById(id: string): CompanyProfile | null {
  const companies = getCompanies();
  return companies.find(c => c.id === id) || null;
}

export function getCompanyByEmail(email: string): CompanyProfile | null {
  const companies = getCompanies();
  return companies.find(c => c.email.toLowerCase() === email.toLowerCase()) || null;
}

export function getCompanyByRut(rut: string): CompanyProfile | null {
  const companies = getCompanies();
  return companies.find(c => c.rut === rut) || null;
}

export function saveCompany(company: CompanyProfile): CompanyProfile {
  const companies = getCompanies();
  const existingIdx = companies.findIndex(c => c.id === company.id);
  
  if (existingIdx >= 0) {
    companies[existingIdx] = { ...company, updatedAt: new Date().toISOString() };
  } else {
    company.id = company.id || crypto.randomUUID();
    company.createdAt = company.createdAt || new Date().toISOString();
    company.updatedAt = new Date().toISOString();
    companies.push(company);
  }
  
  writeJSON(COMPANIES_FILE, companies);
  return company;
}

export function deleteCompany(id: string): boolean {
  const companies = getCompanies();
  const filtered = companies.filter(c => c.id !== id);
  if (filtered.length !== companies.length) {
    writeJSON(COMPANIES_FILE, filtered);
    return true;
  }
  return false;
}

/**
 * Find companies whose categories/industry match a given licitación.
 * Returns companies that have ANY overlap with the licitación's category.
 */
export function findMatchingCompanies(
  licitacionNombre: string,
  licitacionCategories: string[]
): CompanyProfile[] {
  const companies = getCompanies();
  const nombreLower = licitacionNombre.toLowerCase();

  return companies.filter(company => {
    // Check industry match
    const industryMatch = company.industry && 
      nombreLower.includes(company.industry.toLowerCase());

    // Check sub-category match
    const subcatMatch = company.subCategories.some(sc =>
      nombreLower.includes(sc.toLowerCase())
    );

    // Check keywords match
    const keywordMatch = company.keywords.some(kw =>
      nombreLower.includes(kw.toLowerCase())
    );

    // Check specializations match
    const specMatch = company.specializations.some(sp =>
      nombreLower.includes(sp.toLowerCase())
    );

    // Check products/services match
    const productMatch = company.productsServices.some(ps =>
      nombreLower.includes(ps.toLowerCase())
    );

    // Check licitación categories against company categories
    const catMatch = licitacionCategories.some(cat => {
      const catLower = cat.toLowerCase();
      return company.subCategories.some(sc => sc.toLowerCase().includes(catLower) || catLower.includes(sc.toLowerCase())) ||
             company.industry.toLowerCase().includes(catLower) ||
             catLower.includes(company.industry.toLowerCase());
    });

    // Check exclude keywords (reject if any match)
    const excluded = company.excludeKeywords.some(ek =>
      nombreLower.includes(ek.toLowerCase())
    );
    if (excluded) return false;

    return industryMatch || subcatMatch || keywordMatch || specMatch || productMatch || catMatch;
  });
}

// ============================================================
// Match Store
// ============================================================

const MATCHES_FILE = 'matches.json';

export function getMatches(): CompanyMatch[] {
  return readJSON<CompanyMatch[]>(MATCHES_FILE, []);
}

export function getMatchesForCompany(companyId: string): CompanyMatch[] {
  return getMatches().filter(m => m.companyId === companyId);
}

export function getMatchByCompanyAndLicitacion(companyId: string, licitacionCodigo: string): CompanyMatch | null {
  return getMatches().find(m => m.companyId === companyId && m.licitacionCodigo === licitacionCodigo) || null;
}

export function saveMatch(match: CompanyMatch): CompanyMatch {
  const matches = getMatches();
  const existingIdx = matches.findIndex(
    m => m.companyId === match.companyId && m.licitacionCodigo === match.licitacionCodigo
  );
  
  if (existingIdx >= 0) {
    matches[existingIdx] = match;
  } else {
    match.id = match.id || crypto.randomUUID();
    match.matchedAt = match.matchedAt || new Date().toISOString();
    matches.push(match);
  }
  
  writeJSON(MATCHES_FILE, matches);
  return match;
}

export function saveMatchesBatch(newMatches: CompanyMatch[]): void {
  const existing = getMatches();
  
  for (const match of newMatches) {
    const idx = existing.findIndex(
      m => m.companyId === match.companyId && m.licitacionCodigo === match.licitacionCodigo
    );
    if (idx >= 0) {
      existing[idx] = match;
    } else {
      match.id = match.id || crypto.randomUUID();
      match.matchedAt = match.matchedAt || new Date().toISOString();
      existing.push(match);
    }
  }
  
  writeJSON(MATCHES_FILE, existing);
}

// ============================================================
// Sync State Store
// ============================================================

const SYNC_STATE_FILE = 'sync-state.json';

const DEFAULT_SYNC_STATE: SyncState = {
  lastSyncDate: '',
  lastSyncTimestamp: '',
  totalProcessed: 0,
  totalMatched: 0,
  totalAiScored: 0,
  totalIgnored: 0,
  errors: [],
  isRunning: false,
};

export function getSyncState(): SyncState {
  return readJSON<SyncState>(SYNC_STATE_FILE, DEFAULT_SYNC_STATE);
}

export function updateSyncState(updates: Partial<SyncState>): SyncState {
  const current = getSyncState();
  const next = { ...current, ...updates };
  writeJSON(SYNC_STATE_FILE, next);
  return next;
}

// ============================================================
// Session Store (simple token-based sessions)
// ============================================================

const SESSIONS_FILE = 'sessions.json';

interface Session {
  token: string;
  companyId: string;
  email: string;
  contactName: string;
  companyName: string;
  createdAt: string;
  expiresAt: string;
}

export function createSession(company: CompanyProfile): Session {
  const sessions = readJSON<Session[]>(SESSIONS_FILE, []);
  
  const session: Session = {
    token: crypto.randomUUID(),
    companyId: company.id,
    email: company.email,
    contactName: company.contactName,
    companyName: company.name,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
  };
  
  // Remove existing sessions for this company
  const filtered = sessions.filter(s => s.companyId !== company.id);
  filtered.push(session);
  
  writeJSON(SESSIONS_FILE, filtered);
  return session;
}

export function getSession(token: string): Session | null {
  const sessions = readJSON<Session[]>(SESSIONS_FILE, []);
  const session = sessions.find(s => s.token === token);
  
  if (!session) return null;
  if (new Date(session.expiresAt) < new Date()) return null; // expired
  
  return session;
}

export function deleteSession(token: string): void {
  const sessions = readJSON<Session[]>(SESSIONS_FILE, []);
  writeJSON(SESSIONS_FILE, sessions.filter(s => s.token !== token));
}
