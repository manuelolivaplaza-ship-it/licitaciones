'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  User, Mail, Lock, Building, ChevronRight, ChevronLeft,
  Briefcase, Globe, Tag, Check, Plus, Trash2, CheckCircle,
  Phone, Award, Users, TrendingUp, Target, Shield, Search,
  DollarSign, MapPin, FileText, Sparkles,
} from 'lucide-react';
import { REGIONES_CHILE } from '@/types';
import {
  INDUSTRY_CATEGORIES, CERTIFICATIONS_LIST, TIPOS_LICITACION_LABELS,
  type CompanySize, type RevenueRange, type ExperienceLevel, type TipoLicitacion,
} from '@/types/company';

const TOTAL_STEPS = 5;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // --- Step 1: User Profile ---
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // --- Step 2: Company ---
  const [companyName, setCompanyName] = useState('');
  const [rut, setRut] = useState('');
  const [phone, setPhone] = useState('');

  // --- Step 3: Business Profile ---
  const [industry, setIndustry] = useState('');
  const [industryCode, setIndustryCode] = useState('');
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [newSpec, setNewSpec] = useState('');
  const [productsServices, setProductsServices] = useState<string[]>([]);
  const [newProduct, setNewProduct] = useState('');

  // --- Step 4: Capabilities ---
  const [certifications, setCertifications] = useState<string[]>([]);
  const [yearsExperience, setYearsExperience] = useState(0);
  const [employeeCount, setEmployeeCount] = useState<CompanySize>('1-10');
  const [annualRevenue, setAnnualRevenue] = useState<RevenueRange>('bajo_100m');
  const [previousContracts, setPreviousContracts] = useState(0);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('sin_experiencia');

  // --- Step 5: Search Preferences ---
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>([]);
  const [newExclude, setNewExclude] = useState('');
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [montoMin, setMontoMin] = useState('');
  const [montoMax, setMontoMax] = useState('');
  const [tiposLicitacion, setTiposLicitacion] = useState<TipoLicitacion[]>([]);

  // Get available subcategories based on selected industry
  const currentSubcats = INDUSTRY_CATEGORIES.find(c => c.code === industryCode)?.subcats || [];

  // --- Tag handlers ---
  const addTag = (list: string[], setter: (v: string[]) => void, value: string) => {
    const v = value.trim().toLowerCase();
    if (v && !list.includes(v)) setter([...list, v]);
  };
  const removeTag = (list: string[], setter: (v: string[]) => void, value: string) => {
    setter(list.filter(t => t !== value));
  };

  const handleIndustryChange = (code: string) => {
    const cat = INDUSTRY_CATEGORIES.find(c => c.code === code);
    setIndustryCode(code);
    setIndustry(cat?.name || '');
    setSubCategories([]); // Reset subcategories when industry changes
  };

  const toggleSubCategory = (sc: string) => {
    setSubCategories(prev =>
      prev.includes(sc) ? prev.filter(s => s !== sc) : [...prev, sc]
    );
  };

  const toggleCert = (cert: string) => {
    setCertifications(prev =>
      prev.includes(cert) ? prev.filter(c => c !== cert) : [...prev, cert]
    );
  };

  const toggleRegion = (reg: string) => {
    setSelectedRegions(prev =>
      prev.includes(reg) ? prev.filter(r => r !== reg) : [...prev, reg]
    );
  };

  const toggleTipo = (tipo: TipoLicitacion) => {
    setTiposLicitacion(prev =>
      prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo]
    );
  };

  // --- Navigation ---
  const canAdvance = () => {
    switch (step) {
      case 1: return contactName && email && password.length >= 8;
      case 2: return companyName && rut;
      case 3: return industryCode && industry;
      case 4: return true; // Optional
      case 5: return true; // Optional
      default: return false;
    }
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (canAdvance() && step < TOTAL_STEPS) setStep(step + 1);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactName, email, password,
          companyName, rut, phone,
          industry, industryCode, subCategories,
          description, specializations, productsServices,
          certifications, yearsExperience, employeeCount,
          annualRevenue, previousPublicContracts: previousContracts,
          experienceLevel,
          keywords, excludeKeywords,
          regions: selectedRegions,
          montoMin: montoMin ? parseInt(montoMin) : 0,
          montoMax: montoMax ? parseInt(montoMax) : 0,
          tiposLicitacion,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        localStorage.setItem('licitahub_company', JSON.stringify(data.company));
        localStorage.setItem('licitahub_token', data.token);
        router.push('/dashboard');
      } else {
        setError(data.error || 'Error al registrar');
      }
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Shared input class ---
  const inputClass = 'pl-11 h-11 rounded-xl bg-white/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-white/10 text-sm focus-visible:ring-[#1890ff]/20 focus-visible:border-[#1890ff] transition-all';
  const labelClass = 'text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400';
  const selectClass = 'w-full h-11 bg-white/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-white/10 rounded-xl pl-11 pr-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#1890ff] focus:ring-2 focus:ring-[#1890ff]/20 transition-all font-semibold cursor-pointer';

  const stepTitles = [
    'Ingresa tus datos personales de acceso.',
    'Ingresa los datos comerciales de tu empresa.',
    'Define el perfil de negocio y especialización.',
    'Detalla las capacidades y certificaciones.',
    'Configura tus preferencias de búsqueda y alertas.',
  ];

  const stepIcons = [User, Building, Briefcase, Award, Search];

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="space-y-1">
        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-display leading-tight">Registrar Empresa</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {stepTitles[step - 1]}
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-1">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
          <div key={s} className="flex-1 flex items-center gap-1">
            <div className={`h-2 rounded-full flex-1 transition-colors ${
              s <= step ? 'bg-gradient-to-r from-[#1890ff] to-[#a855f7]' : 'bg-slate-200 dark:bg-slate-800/80'
            }`} />
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold text-right">Paso {step} de {TOTAL_STEPS}</p>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-500 dark:text-red-400">
          <span>{error}</span>
        </div>
      )}

      {/* ═══════════════ STEP 1: Personal Data ═══════════════ */}
      {step === 1 && (
        <form onSubmit={handleNext} className="space-y-4">
          <div className="space-y-3.5">
            <div className="space-y-1">
              <label className={labelClass}>Nombre Completo</label>
              <div className="relative group">
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-[#1890ff] transition-colors" />
                <Input type="text" placeholder="Juan Pérez" value={contactName} onChange={(e) => setContactName(e.target.value)} className={inputClass} required />
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Correo Electrónico Corporativo</label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-[#1890ff] transition-colors" />
                <Input type="email" placeholder="juan@empresa.cl" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Contraseña</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-[#1890ff] transition-colors" />
                <Input type="password" placeholder="Mínimo 8 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} minLength={8} required />
              </div>
            </div>
          </div>
          <Button type="submit" className="w-full h-11 bg-[#1890ff] hover:bg-[#007cdb] text-white font-bold shadow-lg shadow-[#1890ff]/25 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer">
            Siguiente Paso <ChevronRight className="h-4 w-4" />
          </Button>
        </form>
      )}

      {/* ═══════════════ STEP 2: Company Data ═══════════════ */}
      {step === 2 && (
        <form onSubmit={handleNext} className="space-y-4">
          <div className="space-y-3.5">
            <div className="space-y-1">
              <label className={labelClass}>Razón Social</label>
              <div className="relative group">
                <Building className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-[#1890ff] transition-colors" />
                <Input type="text" placeholder="Mi Empresa SpA" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputClass} required />
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelClass}>RUT de la Empresa</label>
              <div className="relative group">
                <Globe className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-[#1890ff] transition-colors" />
                <Input type="text" placeholder="76.123.456-7" value={rut} onChange={(e) => setRut(e.target.value)} className={inputClass} required />
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Teléfono Corporativo</label>
              <div className="relative group">
                <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-[#1890ff] transition-colors" />
                <Input type="tel" placeholder="+56 9 1234 5678" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => setStep(1)} className="flex-1 h-11 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-white/5 rounded-xl font-bold">
              <ChevronLeft className="mr-1.5 h-4 w-4" /> Atrás
            </Button>
            <Button type="submit" className="flex-1 h-11 bg-[#1890ff] hover:bg-[#007cdb] text-white font-bold shadow-lg shadow-[#1890ff]/25 rounded-xl transition-all active:scale-[0.98] cursor-pointer">
              Siguiente <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </form>
      )}

      {/* ═══════════════ STEP 3: Business Profile ═══════════════ */}
      {step === 3 && (
        <form onSubmit={handleNext} className="space-y-4">
          <div className="space-y-3.5">
            {/* Industry */}
            <div className="space-y-1">
              <label className={labelClass}><Briefcase className="inline h-3.5 w-3.5 text-[#1890ff] mr-1" />Rubro Principal</label>
              <div className="relative group">
                <Briefcase className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-[#1890ff] transition-colors z-10" />
                <select value={industryCode} onChange={(e) => handleIndustryChange(e.target.value)} className={selectClass} required>
                  <option value="" className="bg-white dark:bg-slate-900">Selecciona un rubro...</option>
                  {INDUSTRY_CATEGORIES.map(cat => (
                    <option key={cat.code} value={cat.code} className="bg-white dark:bg-slate-900">{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sub-categories */}
            {currentSubcats.length > 0 && (
              <div className="space-y-1.5">
                <label className={labelClass}>Sub-categorías (selecciona todas las que apliquen)</label>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1 border border-slate-200 dark:border-white/10 rounded-xl p-2 bg-white/40 dark:bg-slate-950/40">
                  {currentSubcats.map((sc) => {
                    const checked = subCategories.includes(sc);
                    return (
                      <button key={sc} type="button" onClick={() => toggleSubCategory(sc)}
                        className={`flex items-center justify-between text-left px-2 py-1.5 rounded-lg text-[11px] border transition-all ${
                          checked ? 'border-[#1890ff]/40 bg-[#1890ff]/5 text-[#1890ff] dark:text-indigo-400 font-bold' : 'border-transparent text-slate-500 hover:bg-slate-100/50 dark:hover:bg-white/5'
                        }`}
                      >
                        <span className="truncate">{sc}</span>
                        {checked && <Check className="h-3.5 w-3.5 text-[#1890ff] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-1">
              <label className={labelClass}>Descripción de tu empresa</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="¿Qué hace tu empresa? ¿Qué servicios o productos ofrece? Esto ayuda a la IA a encontrar licitaciones más relevantes."
                className="w-full rounded-xl bg-white/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-white/10 text-sm p-3 min-h-[80px] focus:outline-none focus:border-[#1890ff] focus:ring-2 focus:ring-[#1890ff]/20 transition-all resize-none placeholder:text-slate-400"
              />
            </div>

            {/* Specializations */}
            <div className="space-y-1">
              <label className={labelClass}>Especializaciones</label>
              <div className="relative group">
                <Target className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-[#1890ff] transition-colors" />
                <Input placeholder="Ej: redes cisco (Enter para agregar)" value={newSpec}
                  onChange={(e) => setNewSpec(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(specializations, setSpecializations, newSpec); setNewSpec(''); } }}
                  className={inputClass} />
              </div>
              {specializations.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {specializations.map(s => (
                    <Badge key={s} variant="purple" className="flex items-center gap-1 pl-2.5 py-0.5 border border-[#1890ff]/15 bg-[#1890ff]/5 text-[#1890ff] dark:text-indigo-400 rounded-lg">
                      {s}
                      <button type="button" onClick={() => removeTag(specializations, setSpecializations, s)} className="text-[#1890ff] hover:text-[#007cdb]"><Trash2 className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Products/Services */}
            <div className="space-y-1">
              <label className={labelClass}>Productos / Servicios principales</label>
              <div className="relative group">
                <FileText className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-[#1890ff] transition-colors" />
                <Input placeholder="Ej: soporte ti (Enter para agregar)" value={newProduct}
                  onChange={(e) => setNewProduct(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(productsServices, setProductsServices, newProduct); setNewProduct(''); } }}
                  className={inputClass} />
              </div>
              {productsServices.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {productsServices.map(p => (
                    <Badge key={p} variant="info" className="flex items-center gap-1 pl-2.5 py-0.5 rounded-lg">
                      {p}
                      <button type="button" onClick={() => removeTag(productsServices, setProductsServices, p)} className="hover:text-white"><Trash2 className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => setStep(2)} className="flex-1 h-11 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-white/5 rounded-xl font-bold">
              <ChevronLeft className="mr-1.5 h-4 w-4" /> Atrás
            </Button>
            <Button type="submit" className="flex-1 h-11 bg-[#1890ff] hover:bg-[#007cdb] text-white font-bold shadow-lg shadow-[#1890ff]/25 rounded-xl transition-all active:scale-[0.98] cursor-pointer">
              Siguiente <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </form>
      )}

      {/* ═══════════════ STEP 4: Capabilities ═══════════════ */}
      {step === 4 && (
        <form onSubmit={handleNext} className="space-y-4">
          <div className="space-y-3.5">
            {/* Certifications */}
            <div className="space-y-1.5">
              <label className={labelClass}><Shield className="inline h-3.5 w-3.5 text-[#1890ff] mr-1" />Certificaciones</label>
              <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto pr-1 border border-slate-200 dark:border-white/10 rounded-xl p-2 bg-white/40 dark:bg-slate-950/40">
                {CERTIFICATIONS_LIST.map(cert => {
                  const checked = certifications.includes(cert);
                  return (
                    <button key={cert} type="button" onClick={() => toggleCert(cert)}
                      className={`flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg text-[11px] border transition-all ${
                        checked ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 font-bold' : 'border-transparent text-slate-500 hover:bg-slate-100/50 dark:hover:bg-white/5'
                      }`}
                    >
                      <span className="truncate">{cert}</span>
                      {checked && <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className={labelClass}>Años de experiencia</label>
                <div className="relative group">
                  <TrendingUp className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 z-10" />
                  <Input type="number" min={0} max={100} value={yearsExperience} onChange={(e) => setYearsExperience(parseInt(e.target.value) || 0)} className={inputClass} />
                </div>
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Contratos públicos previos</label>
                <div className="relative group">
                  <FileText className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 z-10" />
                  <Input type="number" min={0} value={previousContracts} onChange={(e) => setPreviousContracts(parseInt(e.target.value) || 0)} className={inputClass} />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelClass}>Tamaño de empresa</label>
              <div className="relative group">
                <Users className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 z-10" />
                <select value={employeeCount} onChange={(e) => setEmployeeCount(e.target.value as CompanySize)} className={selectClass}>
                  <option value="1-10">1-10 empleados</option>
                  <option value="11-50">11-50 empleados</option>
                  <option value="51-200">51-200 empleados</option>
                  <option value="201-500">201-500 empleados</option>
                  <option value="500+">Más de 500 empleados</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelClass}>Nivel de experiencia en licitaciones</label>
              <div className="relative group">
                <Award className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 z-10" />
                <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)} className={selectClass}>
                  <option value="sin_experiencia">Sin experiencia</option>
                  <option value="principiante">Principiante (1-2 licitaciones)</option>
                  <option value="intermedio">Intermedio (3-10 licitaciones)</option>
                  <option value="avanzado">Avanzado (11-50 licitaciones)</option>
                  <option value="experto">Experto (50+ licitaciones)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => setStep(3)} className="flex-1 h-11 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-white/5 rounded-xl font-bold">
              <ChevronLeft className="mr-1.5 h-4 w-4" /> Atrás
            </Button>
            <Button type="submit" className="flex-1 h-11 bg-[#1890ff] hover:bg-[#007cdb] text-white font-bold shadow-lg shadow-[#1890ff]/25 rounded-xl transition-all active:scale-[0.98] cursor-pointer">
              Siguiente <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </form>
      )}

      {/* ═══════════════ STEP 5: Search Preferences ═══════════════ */}
      {step === 5 && (
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-3.5">
            {/* Keywords */}
            <div className="space-y-1">
              <label className={labelClass}><Tag className="inline h-3.5 w-3.5 text-[#1890ff] mr-1" />Palabras clave de interés</label>
              <div className="relative group">
                <Plus className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-[#1890ff] transition-colors" />
                <Input placeholder="Ej: software (Enter)" value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(keywords, setKeywords, newKeyword); setNewKeyword(''); } }}
                  className={inputClass} />
              </div>
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {keywords.map(kw => (
                    <Badge key={kw} variant="purple" className="flex items-center gap-1 pl-2.5 py-0.5 border border-[#1890ff]/15 bg-[#1890ff]/5 text-[#1890ff] dark:text-indigo-400 rounded-lg">
                      {kw}
                      <button type="button" onClick={() => removeTag(keywords, setKeywords, kw)}><Trash2 className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Exclude keywords */}
            <div className="space-y-1">
              <label className={labelClass}>Palabras clave a EXCLUIR</label>
              <div className="relative group">
                <Trash2 className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-red-400 transition-colors" />
                <Input placeholder="Ej: vehículo (Enter para excluir)" value={newExclude}
                  onChange={(e) => setNewExclude(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(excludeKeywords, setExcludeKeywords, newExclude); setNewExclude(''); } }}
                  className={inputClass} />
              </div>
              {excludeKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {excludeKeywords.map(ek => (
                    <Badge key={ek} variant="danger" className="flex items-center gap-1 pl-2.5 py-0.5 rounded-lg">
                      {ek}
                      <button type="button" onClick={() => removeTag(excludeKeywords, setExcludeKeywords, ek)}><Trash2 className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Regions */}
            <div className="space-y-1.5">
              <label className={labelClass}><MapPin className="inline h-3.5 w-3.5 text-[#1890ff] mr-1" />Regiones donde opera</label>
              <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1 border border-slate-200 dark:border-white/10 rounded-xl p-2 bg-white/40 dark:bg-slate-950/40">
                {REGIONES_CHILE.map(reg => {
                  const checked = selectedRegions.includes(reg.name);
                  return (
                    <button key={reg.code} type="button" onClick={() => toggleRegion(reg.name)}
                      className={`flex items-center justify-between text-left px-2 py-1.5 rounded-lg text-[11px] border transition-all ${
                        checked ? 'border-[#1890ff]/40 bg-[#1890ff]/5 text-[#1890ff] dark:text-indigo-400 font-bold' : 'border-transparent text-slate-500 hover:bg-slate-100/50 dark:hover:bg-white/5'
                      }`}
                    >
                      <span className="truncate">{reg.name}</span>
                      {checked && <Check className="h-3.5 w-3.5 text-[#1890ff] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Monto range */}
            <div className="space-y-1">
              <label className={labelClass}><DollarSign className="inline h-3.5 w-3.5 text-[#1890ff] mr-1" />Rango de monto de interés (CLP)</label>
              <div className="flex items-center gap-2">
                <Input type="number" placeholder="Mínimo" value={montoMin} onChange={(e) => setMontoMin(e.target.value)} className="flex-1 h-10 rounded-xl bg-white/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-white/10 text-sm px-3 focus:outline-none focus:border-[#1890ff]" />
                <span className="text-slate-400 text-xs">a</span>
                <Input type="number" placeholder="Máximo" value={montoMax} onChange={(e) => setMontoMax(e.target.value)} className="flex-1 h-10 rounded-xl bg-white/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-white/10 text-sm px-3 focus:outline-none focus:border-[#1890ff]" />
              </div>
            </div>

            {/* Tipos de licitación */}
            <div className="space-y-1.5">
              <label className={labelClass}>Tipos de licitación de interés</label>
              <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto pr-1 border border-slate-200 dark:border-white/10 rounded-xl p-2 bg-white/40 dark:bg-slate-950/40">
                {(Object.entries(TIPOS_LICITACION_LABELS) as [TipoLicitacion, string][]).map(([code, label]) => {
                  const checked = tiposLicitacion.includes(code);
                  return (
                    <button key={code} type="button" onClick={() => toggleTipo(code)}
                      className={`flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg text-[11px] border transition-all ${
                        checked ? 'border-[#1890ff]/40 bg-[#1890ff]/5 text-[#1890ff] dark:text-indigo-400 font-bold' : 'border-transparent text-slate-500 hover:bg-slate-100/50 dark:hover:bg-white/5'
                      }`}
                    >
                      <span className="truncate"><span className="font-mono mr-1">{code}</span>{label}</span>
                      {checked && <Check className="h-3.5 w-3.5 text-[#1890ff] shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setStep(4)} className="flex-1 h-11 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-white/5 rounded-xl font-bold">
              <ChevronLeft className="mr-1.5 h-4 w-4" /> Atrás
            </Button>
            <Button type="submit" loading={isLoading}
              className="flex-1 h-11 bg-[#1890ff] hover:bg-[#007cdb] text-white font-bold shadow-lg shadow-[#1890ff]/25 rounded-xl transition-all active:scale-[0.98] cursor-pointer">
              <Sparkles className="h-4 w-4 mr-1.5" /> Registrarse
            </Button>
          </div>
        </form>
      )}

      {/* Divider */}
      <div className="relative flex items-center justify-center py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-white/10" />
        </div>
        <span className="relative bg-background dark:bg-slate-900 px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          ¿Ya tienes cuenta?
        </span>
      </div>
      <div className="text-center">
        <Link href="/login" className="text-xs font-black text-[#1890ff] hover:text-[#007cdb] transition-colors">
          Iniciar sesión aquí
        </Link>
      </div>
    </div>
  );
}
