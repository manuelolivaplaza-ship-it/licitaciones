'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Sliders,
  Key,
  Users,
  Bell,
  Plus,
  Trash2,
  Save,
  Check,
  Shield,
  HelpCircle,
  Eye,
  EyeOff,
  Sparkles,
  Award,
  DollarSign,
  AlertCircle,
  Briefcase,
  Globe,
  Loader2
} from 'lucide-react';
import { REGIONES_CHILE } from '@/types';
import {
  INDUSTRY_CATEGORIES,
  CERTIFICATIONS_LIST,
  TIPOS_LICITACION_LABELS
} from '@/types/company';
import type {
  CompanyProfile,
  CompanySize,
  RevenueRange,
  ExperienceLevel,
  TipoLicitacion
} from '@/types/company';

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'interests' | 'credentials' | 'team' | 'notifications'>('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active User Context
  const [companyId, setCompanyId] = useState<string>('');
  
  // --- Profile State ---
  const [companyName, setCompanyName] = useState('');
  const [companyRut, setCompanyRut] = useState('');
  const [contactName, setContactName] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');

  // --- Business Profile State ---
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedSubcats, setSelectedSubcats] = useState<string[]>([]);
  const [companyDescription, setCompanyDescription] = useState('');
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [newSpecialization, setNewSpecialization] = useState('');
  const [productsServices, setProductsServices] = useState<string[]>([]);
  const [newProductService, setNewProductService] = useState('');

  // --- Capabilities State ---
  const [certifications, setCertifications] = useState<string[]>([]);
  const [yearsExperience, setYearsExperience] = useState(0);
  const [companySize, setCompanySize] = useState<CompanySize>('1-10');
  const [annualRevenue, setAnnualRevenue] = useState<RevenueRange>('bajo_100m');
  const [previousContracts, setPreviousContracts] = useState(0);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('sin_experiencia');
  const [maxContractCapacity, setMaxContractCapacity] = useState(0);

  // --- Search Preferences State ---
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>([]);
  const [newExcludeKeyword, setNewExcludeKeyword] = useState('');
  const [minAmount, setMinAmount] = useState<number>(0);
  const [maxAmount, setMaxAmount] = useState<number>(0);
  const [selectedTipos, setSelectedTipos] = useState<TipoLicitacion[]>([]);

  // --- Credentials State ---
  const [chilecompraTicket, setChilecompraTicket] = useState('');
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [showTicket, setShowTicket] = useState(false);
  const [showORKey, setShowORKey] = useState(false);
  const [selectedLLM, setSelectedLLM] = useState('meta-llama/llama-3-70b-instruct:free');

  // --- Team State (interactive local mock) ---
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string; email: string; role: string; status: string }[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Gestor');

  // --- Notifications State ---
  const [notifInApp, setNotifInApp] = useState(true);
  const [notifEmailInstant, setNotifEmailInstant] = useState(true);
  const [notifEmailDaily, setNotifEmailDaily] = useState(false);
  const [notifDeadline, setNotifDeadline] = useState(true);
  const [notifCompetitor, setNotifCompetitor] = useState(true);

  // 1. Fetch Company profile on Mount
  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          throw new Error('No se pudo verificar la sesión actual.');
        }
        const data = await response.json();
        if (data.authenticated && data.company) {
          const profile: CompanyProfile = data.company;
          setCompanyId(profile.id);
          
          // Basic
          setCompanyName(profile.name);
          setCompanyRut(profile.rut);
          setContactName(profile.contactName || '');
          setCompanyPhone(profile.phone || '');
          setCompanyEmail(profile.email);
          
          // Business
          setSelectedIndustry(profile.industry || '');
          setSelectedSubcats(profile.subCategories || []);
          setCompanyDescription(profile.description || '');
          setSpecializations(profile.specializations || []);
          setProductsServices(profile.productsServices || []);
          
          // Capabilities
          setCertifications(profile.certifications || []);
          setYearsExperience(profile.yearsExperience || 0);
          setCompanySize(profile.employeeCount || '1-10');
          setAnnualRevenue(profile.annualRevenue || 'bajo_100m');
          setPreviousContracts(profile.previousPublicContracts || 0);
          setExperienceLevel(profile.experienceLevel || 'sin_experiencia');
          setMaxContractCapacity(profile.maxContractCapacity || 0);

          // Preferences
          setKeywords(profile.keywords || []);
          setExcludeKeywords(profile.excludeKeywords || []);
          setSelectedRegions(profile.regions || []);
          setMinAmount(profile.montoMin || 0);
          setMaxAmount(profile.montoMax || 0);
          setSelectedTipos(profile.tiposLicitacion || []);

          // Credentials & Notifications
          setNotifInApp(profile.alertMinScore ? profile.alertMinScore >= 40 : true);
          setNotifEmailInstant(profile.alertFrequency === 'instant');
          setNotifEmailDaily(profile.alertFrequency === 'daily');

          // Load local keys
          const storedTicket = localStorage.getItem('licitahub_chilecompra_ticket');
          const storedKey = localStorage.getItem('licitahub_openrouter_key');
          setChilecompraTicket(storedTicket || 'FBF43419-C347-4C92-9F1F-EC13B3D37911');
          setOpenrouterKey(storedKey || 'sk-or-v1-bc3b94e22e...');
          
          // Load local team members
          const storedTeam = localStorage.getItem('licitahub_team');
          if (storedTeam) {
            setTeamMembers(JSON.parse(storedTeam));
          } else {
            const initialTeam = [
              { id: '1', name: profile.contactName || 'Manuel Espinoza', email: profile.email, role: 'Administrador', status: 'Activo' },
              { id: '2', name: 'Constanza Rojas', email: 'constanza@empresa.cl', role: 'Gestor', status: 'Activo' },
              { id: '3', name: 'Andrés Vera', email: 'andres@empresa.cl', role: 'Revisor', status: 'Invitado' },
            ];
            setTeamMembers(initialTeam);
            localStorage.setItem('licitahub_team', JSON.stringify(initialTeam));
          }
        }
      } catch (err: any) {
        console.error('Configuracion: Load error:', err);
        setErrorMsg('Error al cargar perfil de empresa. Asegúrate de haber iniciado sesión.');
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  // Get active industry subcategories
  const activeIndustryObj = INDUSTRY_CATEGORIES.find(ind => ind.name === selectedIndustry || ind.code === selectedIndustry);
  const activeSubcategories = activeIndustryObj ? activeIndustryObj.subcats : [];

  // --- Handlers ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;

    setIsSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    // Sync credentials with local storage
    if (chilecompraTicket) localStorage.setItem('licitahub_chilecompra_ticket', chilecompraTicket);
    if (openrouterKey) localStorage.setItem('licitahub_openrouter_key', openrouterKey);

    const alertFreq = notifEmailInstant ? 'instant' : notifEmailDaily ? 'daily' : 'weekly';

    try {
      const response = await fetch(`/api/companies/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: companyName,
          rut: companyRut,
          contactName,
          phone: companyPhone,
          
          // Business profile
          industry: selectedIndustry,
          industryCode: activeIndustryObj?.code || '',
          subCategories: selectedSubcats,
          description: companyDescription,
          specializations,
          productsServices,
          
          // Capabilities
          certifications,
          yearsExperience,
          employeeCount: companySize,
          annualRevenue,
          previousPublicContracts: previousContracts,
          experienceLevel,
          maxContractCapacity,
          
          // Search preferences
          keywords,
          excludeKeywords,
          regions: selectedRegions,
          montoMin: minAmount,
          montoMax: maxAmount,
          tiposLicitacion: selectedTipos,
          
          // Alert config
          alertFrequency: alertFreq,
          alertMinScore: notifInApp ? 60 : 0,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar datos en el servidor.');
      }

      const data = await response.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        throw new Error(data.error || 'No se pudo guardar la configuración.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar los cambios.');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Tag Input Handlers ---
  const handleAddKeyword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newKeyword.trim()) {
      e.preventDefault();
      const val = newKeyword.trim().toLowerCase();
      if (!keywords.includes(val)) {
        setKeywords([...keywords, val]);
      }
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  const handleAddExcludeKeyword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newExcludeKeyword.trim()) {
      e.preventDefault();
      const val = newExcludeKeyword.trim().toLowerCase();
      if (!excludeKeywords.includes(val)) {
        setExcludeKeywords([...excludeKeywords, val]);
      }
      setNewExcludeKeyword('');
    }
  };

  const handleRemoveExcludeKeyword = (kw: string) => {
    setExcludeKeywords(excludeKeywords.filter((k) => k !== kw));
  };

  const handleAddSpecialization = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newSpecialization.trim()) {
      e.preventDefault();
      const val = newSpecialization.trim();
      if (!specializations.includes(val)) {
        setSpecializations([...specializations, val]);
      }
      setNewSpecialization('');
    }
  };

  const handleRemoveSpecialization = (spec: string) => {
    setSpecializations(specializations.filter((s) => s !== spec));
  };

  const handleAddProductService = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newProductService.trim()) {
      e.preventDefault();
      const val = newProductService.trim();
      if (!productsServices.includes(val)) {
        setProductsServices([...productsServices, val]);
      }
      setNewProductService('');
    }
  };

  const handleRemoveProductService = (ps: string) => {
    setProductsServices(productsServices.filter((item) => item !== ps));
  };

  // --- Select Grid Toggles ---
  const handleToggleRegion = (reg: string) => {
    setSelectedRegions(prev =>
      prev.includes(reg) ? prev.filter(r => r !== reg) : [...prev, reg]
    );
  };

  const handleToggleCertification = (cert: string) => {
    setCertifications(prev =>
      prev.includes(cert) ? prev.filter(c => c !== cert) : [...prev, cert]
    );
  };

  const handleToggleTipo = (tipo: TipoLicitacion) => {
    setSelectedTipos(prev =>
      prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo]
    );
  };

  const handleToggleSubcat = (subcat: string) => {
    setSelectedSubcats(prev =>
      prev.includes(subcat) ? prev.filter(s => s !== subcat) : [...prev, subcat]
    );
  };

  // --- Team Member Handlers ---
  const handleAddTeamMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName || !newMemberEmail) return;

    const newList = [
      ...teamMembers,
      {
        id: String(Date.now()),
        name: newMemberName,
        email: newMemberEmail,
        role: newMemberRole,
        status: 'Invitado',
      },
    ];
    setTeamMembers(newList);
    localStorage.setItem('licitahub_team', JSON.stringify(newList));
    setNewMemberName('');
    setNewMemberEmail('');
  };

  const handleDeleteMember = (id: string, name: string) => {
    if (teamMembers.length <= 1) {
      alert('Debe haber al menos un miembro en el equipo.');
      return;
    }
    if (confirm(`¿Estás seguro de que deseas revocar el acceso de ${name}?`)) {
      const newList = teamMembers.filter((m) => m.id !== id);
      setTeamMembers(newList);
      localStorage.setItem('licitahub_team', JSON.stringify(newList));
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#1890ff]" />
        <p className="text-xs font-bold text-text-muted">Cargando la configuración de tu empresa...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative z-10">
      
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] right-[-10%] h-[350px] w-[350px] rounded-full bg-[#1890ff]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] h-[350px] w-[350px] rounded-full bg-[#ec4899]/5 blur-[120px] pointer-events-none" />

      {/* Header Panel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border-primary/50 pb-5">
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">Configuración del Sistema</h1>
          <p className="text-xs font-bold text-text-muted mt-0.5">
            Administra el perfil legal de tu empresa, credenciales seguras, áreas de búsqueda inteligente y equipo.
          </p>
        </div>
        
        {activeTab !== 'team' && (
          <Button
            onClick={handleSave}
            loading={isSaving}
            className={`font-black uppercase text-xs tracking-wider shadow-lg py-5 px-6 min-w-[160px] transition-all cursor-pointer ${
              saveSuccess
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/10'
                : 'bg-gradient-to-r from-[#1890ff] to-[#ec4899] text-white hover:opacity-90 shadow-[#1890ff]/10'
            }`}
          >
            {saveSuccess ? (
              <>
                <Check className="mr-2 h-4 w-4" /> ¡Guardado!
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Guardar Cambios
              </>
            )}
          </Button>
        )}
      </div>

      {/* Message Notifications (Success/Error) */}
      {saveSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-fade-in">
          <Check className="h-4 w-4" />
          <span>La configuración de tu empresa ha sido guardada y sincronizada correctamente. Los algoritmos de IA y matching han sido recalibrados.</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-400 text-xs font-bold animate-fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Tabs Layout */}
      <div className="grid gap-6 md:grid-cols-4">
        
        {/* Navigation Sidebar */}
        <div className="flex flex-col gap-2 md:col-span-1">
          {[
            { id: 'profile', label: 'Empresa y Capacidades', icon: Building2, desc: 'Identidad, rubros, certificaciones' },
            { id: 'interests', label: 'Búsqueda Inteligente', icon: Sliders, desc: 'Keywords, regiones, filtros base' },
            { id: 'credentials', label: 'APIs y Modelos IA', icon: Key, desc: 'Claves seguras de integración' },
            { id: 'team', label: 'Equipo y Permisos', icon: Users, desc: 'Colaboradores y roles' },
            { id: 'notifications', label: 'Alertas y Notificaciones', icon: Bell, desc: 'Email, plazos y reportes' },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setErrorMsg(null); }}
                className={`flex flex-col text-left p-4 rounded-3xl border transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'bg-[#1890ff]/10 text-[#1890ff] dark:text-[#00f2fe] border-[#1890ff]/30 shadow-md shadow-[#1890ff]/5'
                    : 'bg-white/40 dark:bg-slate-950/40 border-border-primary/60 text-text-secondary hover:bg-slate-100 dark:hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <tab.icon className={`h-4.5 w-4.5 ${isActive ? 'text-[#1890ff] dark:text-[#00f2fe]' : 'text-slate-400'}`} />
                  <span className="text-xs font-black uppercase tracking-wide">{tab.label}</span>
                </div>
                <span className="text-[10px] text-text-light font-semibold mt-1 pl-7 leading-none">{tab.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Content Pane */}
        <div className="md:col-span-3">
          <form onSubmit={handleSave} className="space-y-6">
            
            {/* Tab: Profile & Capabilities */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-fade-in">
                {/* Basic Legal profile */}
                <Card className="rounded-3xl border border-border-primary bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl p-6 relative overflow-hidden shadow-xl">
                  <CardHeader className="p-0 pb-4 mb-4 border-b border-border-primary/50">
                    <CardTitle className="text-sm font-extrabold text-text-primary flex items-center gap-2">
                      <Building2 className="h-4.5 w-4.5 text-[#1890ff]" />
                      Identidad Legal e Información Básica
                    </CardTitle>
                    <CardDescription className="text-xs font-bold text-text-muted mt-1">
                      Especifica los datos oficiales de tu sociedad comercial. Estos valores se inyectan en los anexos pre-redactados.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">Razón Social</label>
                        <Input
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="bg-white/40 dark:bg-slate-950/40 border-border-primary text-xs font-bold text-text-primary py-2.5 rounded-xl placeholder:text-slate-400 focus:border-[#1890ff]/40"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">RUT de la Empresa</label>
                        <Input
                          value={companyRut}
                          onChange={(e) => setCompanyRut(e.target.value)}
                          placeholder="76.123.456-7"
                          className="bg-white/40 dark:bg-slate-950/40 border-border-primary text-xs font-bold text-text-primary py-2.5 rounded-xl placeholder:text-slate-400 focus:border-[#1890ff]/40"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">Representante Legal</label>
                        <Input
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="Nombre del apoderado"
                          className="bg-white/40 dark:bg-slate-950/40 border-border-primary text-xs font-bold text-text-primary py-2.5 rounded-xl placeholder:text-slate-400"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">Teléfono de Contacto</label>
                        <Input
                          value={companyPhone}
                          onChange={(e) => setCompanyPhone(e.target.value)}
                          placeholder="+56 9..."
                          className="bg-white/40 dark:bg-slate-950/40 border-border-primary text-xs font-bold text-text-primary py-2.5 rounded-xl placeholder:text-slate-400"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">Email Corporativo</label>
                        <Input
                          type="email"
                          value={companyEmail}
                          onChange={(e) => setCompanyEmail(e.target.value)}
                          className="bg-white/40 dark:bg-slate-950/40 border-border-primary text-xs font-bold text-text-primary py-2.5 rounded-xl placeholder:text-slate-400"
                          required
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Business Profile (Industry & Tags) */}
                <Card className="rounded-3xl border border-border-primary bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl p-6 relative overflow-hidden shadow-xl">
                  <CardHeader className="p-0 pb-4 mb-4 border-b border-border-primary/50">
                    <CardTitle className="text-sm font-extrabold text-text-primary flex items-center gap-2">
                      <Briefcase className="h-4.5 w-4.5 text-violet-500" />
                      Perfil de Negocio y Clasificación ONU
                    </CardTitle>
                    <CardDescription className="text-xs font-bold text-text-muted mt-1">
                      Indica tus rubros principales y especialidades comerciales. Esto calibra la ponderación de match y scoring semántico.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 space-y-5">
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">Rubro Principal de la Empresa</label>
                      <select
                        value={selectedIndustry}
                        onChange={(e) => { setSelectedIndustry(e.target.value); setSelectedSubcats([]); }}
                        className="h-10 w-full rounded-xl border border-border-primary/80 bg-white/40 dark:bg-slate-950/45 px-3 text-xs font-bold text-text-primary outline-none transition-colors focus:border-[#1890ff]/40"
                      >
                        <option value="">Selecciona tu sector comercial principal...</option>
                        {INDUSTRY_CATEGORIES.map((ind) => (
                          <option key={ind.code} value={ind.name}>{ind.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Subcategories multi-checkboxes */}
                    {activeSubcategories.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider block">Sub-categorías Específicas</label>
                        <div className="grid gap-2 sm:grid-cols-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar border border-border-primary/40 rounded-2xl p-3 bg-white/20 dark:bg-slate-950/20">
                          {activeSubcategories.map((subcat) => {
                            const isChecked = selectedSubcats.includes(subcat);
                            return (
                              <button
                                key={subcat}
                                type="button"
                                onClick={() => handleToggleSubcat(subcat)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all ${
                                  isChecked
                                    ? 'border-[#1890ff]/30 bg-[#1890ff]/10 text-[#1890ff] dark:text-[#00f2fe] font-black'
                                    : 'border-border-primary/60 bg-white/10 dark:bg-slate-950/10 text-text-secondary hover:bg-slate-50 dark:hover:bg-white/[0.01]'
                                }`}
                              >
                                <div className={`h-4 w-4 shrink-0 rounded flex items-center justify-center border ${isChecked ? 'bg-[#1890ff] border-[#1890ff] text-white' : 'border-border-primary bg-white dark:bg-slate-900'}`}>
                                  {isChecked && <Check className="h-3 w-3" />}
                                </div>
                                <span className="text-[10px] font-bold truncate">{subcat}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">Descripción de tu Actividad (IA context)</label>
                      <textarea
                        value={companyDescription}
                        onChange={(e) => setCompanyDescription(e.target.value)}
                        placeholder="Describe detalladamente qué hace tu empresa, cuáles son tus fortalezas técnicas y qué te diferencia. Esta información es analizada semánticamente por la IA..."
                        rows={3}
                        className="w-full p-3 rounded-2xl border border-border-primary bg-white/40 dark:bg-slate-950/40 text-xs font-semibold text-text-primary leading-relaxed focus:outline-none focus:border-[#1890ff]/40"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Specializations Tags */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider block">Servicios o Áreas Especializadas</label>
                        <Input
                          placeholder="Ej: Ciberseguridad, redacción técnica... (ENTER)"
                          value={newSpecialization}
                          onChange={(e) => setNewSpecialization(e.target.value)}
                          onKeyDown={handleAddSpecialization}
                          className="bg-white/40 dark:bg-slate-950/40 border-border-primary text-xs font-bold text-text-primary py-2.5 rounded-xl placeholder:text-slate-400"
                        />
                        <div className="flex flex-wrap gap-1.5">
                          {specializations.map((spec) => (
                            <Badge
                              key={spec}
                              variant="purple"
                              className="flex items-center gap-1.5 py-1 px-2.5 border border-[#1890ff]/20 bg-[#1890ff]/10 text-[#1890ff]"
                            >
                              <span className="font-extrabold text-[10px] uppercase">{spec}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSpecialization(spec)}
                                className="rounded-full p-0.5 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Products/Services */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider block">Productos o Suministros Frecuentes</label>
                        <Input
                          placeholder="Ej: Servidores Cisco, Boletas de garantía... (ENTER)"
                          value={newProductService}
                          onChange={(e) => setNewProductService(e.target.value)}
                          onKeyDown={handleAddProductService}
                          className="bg-white/40 dark:bg-slate-950/40 border-border-primary text-xs font-bold text-text-primary py-2.5 rounded-xl placeholder:text-slate-400"
                        />
                        <div className="flex flex-wrap gap-1.5">
                          {productsServices.map((ps) => (
                            <Badge
                              key={ps}
                              variant="purple"
                              className="flex items-center gap-1.5 py-1 px-2.5 border border-[#1890ff]/20 bg-[#1890ff]/10 text-[#1890ff]"
                            >
                              <span className="font-extrabold text-[10px] uppercase">{ps}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveProductService(ps)}
                                className="rounded-full p-0.5 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                  </CardContent>
                </Card>

                {/* Capabilities (Certifications, Experience, Size) */}
                <Card className="rounded-3xl border border-border-primary bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl p-6 relative overflow-hidden shadow-xl">
                  <CardHeader className="p-0 pb-4 mb-4 border-b border-border-primary/50">
                    <CardTitle className="text-sm font-extrabold text-text-primary flex items-center gap-2">
                      <Award className="h-4.5 w-4.5 text-emerald-500 dark:text-emerald-450" />
                      Capacidades Operativas e Idoneidad Técnica
                    </CardTitle>
                    <CardDescription className="text-xs font-bold text-text-muted mt-1">
                      Certificados, personal y rango de facturación de tu empresa. Elemento crítico para superar evaluaciones de bases.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 space-y-5">
                    
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">Años de Trayectoria</label>
                        <Input
                          type="number"
                          value={yearsExperience}
                          onChange={(e) => setYearsExperience(parseInt(e.target.value) || 0)}
                          className="bg-white/40 dark:bg-slate-950/40 border-border-primary text-xs font-bold text-text-primary py-2.5 rounded-xl"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">Tamaño de la Empresa</label>
                        <select
                          value={companySize}
                          onChange={(e) => setCompanySize(e.target.value as CompanySize)}
                          className="h-10 w-full rounded-xl border border-border-primary/80 bg-white/40 dark:bg-slate-950/45 px-3 text-xs font-bold text-text-primary outline-none transition-colors"
                        >
                          <option value="1-10">Micro (1–10 trabajadores)</option>
                          <option value="11-50">Pequeña (11–50 trabajadores)</option>
                          <option value="51-200">Mediana A (51–200 trabajadores)</option>
                          <option value="201-500">Mediana B (201–500 trabajadores)</option>
                          <option value="500+">Gran Empresa (&gt;500 trabajadores)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">Ingresos Anuales Rango</label>
                        <select
                          value={annualRevenue}
                          onChange={(e) => setAnnualRevenue(e.target.value as RevenueRange)}
                          className="h-10 w-full rounded-xl border border-border-primary/80 bg-white/40 dark:bg-slate-950/45 px-3 text-xs font-bold text-text-primary outline-none transition-colors"
                        >
                          <option value="bajo_100m">Bajo $100M CLP</option>
                          <option value="100m_500m">$100M - $500M CLP</option>
                          <option value="500m_1b">$500M - $1.000M CLP</option>
                          <option value="1b_5b">$1.000M - $5.000M CLP</option>
                          <option value="sobre_5b">Sobre $5.000M CLP</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">Licitaciones Adjudicadas Previas</label>
                        <Input
                          type="number"
                          value={previousContracts}
                          onChange={(e) => setPreviousContracts(parseInt(e.target.value) || 0)}
                          className="bg-white/40 dark:bg-slate-950/40 border-border-primary text-xs font-bold text-text-primary py-2.5 rounded-xl"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">Nivel de Postulación</label>
                        <select
                          value={experienceLevel}
                          onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                          className="h-10 w-full rounded-xl border border-border-primary/80 bg-white/40 dark:bg-slate-950/45 px-3 text-xs font-bold text-text-primary outline-none transition-colors"
                        >
                          <option value="sin_experiencia">Sin Experiencia Previa</option>
                          <option value="principiante">Principiante (1-5 ofertas)</option>
                          <option value="intermedio">Intermedio (5-20 ofertas)</option>
                          <option value="avanzado">Avanzado (20-100 ofertas)</option>
                          <option value="experto">Experto (&gt;100 ofertas)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">Capacidad Máxima Contrato (CLP)</label>
                        <Input
                          type="number"
                          value={maxContractCapacity}
                          onChange={(e) => setMaxContractCapacity(parseInt(e.target.value) || 0)}
                          className="bg-white/40 dark:bg-slate-950/40 border-border-primary text-xs font-bold text-text-primary py-2.5 rounded-xl"
                        />
                      </div>
                    </div>

                    {/* Certifications Grid */}
                    <div className="space-y-3.5 pt-2">
                      <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider block">Certificaciones Técnicas Vigentes</label>
                      <div className="grid gap-2 sm:grid-cols-2 max-h-48 overflow-y-auto pr-1.5 custom-scrollbar border border-border-primary/50 rounded-2xl p-4 bg-white/20 dark:bg-slate-950/20">
                        {CERTIFICATIONS_LIST.map((cert) => {
                          const isChecked = certifications.includes(cert);
                          return (
                            <button
                              key={cert}
                              type="button"
                              onClick={() => handleToggleCertification(cert)}
                              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${
                                isChecked
                                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 font-black'
                                  : 'border-border-primary/60 bg-white/10 dark:bg-slate-950/10 text-text-secondary hover:bg-slate-50 dark:hover:bg-white/[0.01]'
                              }`}
                            >
                              <div className={`h-4.5 w-4.5 shrink-0 rounded flex items-center justify-center border ${isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-border-primary bg-white dark:bg-slate-900'}`}>
                                {isChecked && <Check className="h-3 w-3" />}
                              </div>
                              <span className="text-[10px] font-bold leading-tight">{cert}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tab: Búsqueda Inteligente (Filtros y Keywords) */}
            {activeTab === 'interests' && (
              <div className="space-y-6 animate-fade-in">
                {/* Keywords Settings */}
                <Card className="rounded-3xl border border-border-primary bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl p-6 relative overflow-hidden shadow-xl">
                  <CardHeader className="p-0 pb-4 mb-4 border-b border-border-primary/50">
                    <CardTitle className="text-sm font-extrabold text-text-primary flex items-center gap-2">
                      <Sparkles className="h-4.5 w-4.5 text-[#1890ff]" />
                      Conceptos y Palabras de Búsqueda
                    </CardTitle>
                    <CardDescription className="text-xs font-bold text-text-muted mt-1">
                      Define los términos que la IA debe monitorizar en el portal ChileCompra. Puedes agregar exclusiones para omitir ruido comercial.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 space-y-5">
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Interés Keywords */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider block">Palabras Clave de Interés</label>
                        <Input
                          placeholder="Ej: diseño de software, soporte cloud... (ENTER)"
                          value={newKeyword}
                          onChange={(e) => setNewKeyword(e.target.value)}
                          onKeyDown={handleAddKeyword}
                          className="bg-white/40 dark:bg-slate-950/40 border-border-primary text-xs font-bold text-text-primary py-2.5 rounded-xl placeholder:text-slate-400"
                        />
                        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                          {keywords.map((kw) => (
                            <Badge
                              key={kw}
                              variant="purple"
                              className="flex items-center gap-1 py-1 px-2.5 border border-[#1890ff]/20 bg-[#1890ff]/10 text-[#1890ff]"
                            >
                              <span className="font-extrabold text-[9px] uppercase tracking-wide">{kw}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveKeyword(kw)}
                                className="rounded-full p-0.5 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Excluir Keywords */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider block">Términos Excluidos (Negativas)</label>
                        <Input
                          placeholder="Ej: capacitación, licencias oem... (ENTER)"
                          value={newExcludeKeyword}
                          onChange={(e) => setNewExcludeKeyword(e.target.value)}
                          onKeyDown={handleAddExcludeKeyword}
                          className="bg-white/40 dark:bg-slate-950/40 border-border-primary text-xs font-bold text-text-primary py-2.5 rounded-xl placeholder:text-slate-400"
                        />
                        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                          {excludeKeywords.map((kw) => (
                            <Badge
                              key={kw}
                              variant="danger"
                              className="flex items-center gap-1 py-1 px-2.5 border border-red-500/20 bg-red-500/10 text-red-500"
                            >
                              <span className="font-extrabold text-[9px] uppercase tracking-wide">{kw}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveExcludeKeyword(kw)}
                                className="rounded-full p-0.5 text-slate-400 hover:text-red-650 transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                  </CardContent>
                </Card>

                {/* Amount ranges */}
                <Card className="rounded-3xl border border-border-primary bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl p-6 relative overflow-hidden shadow-xl">
                  <CardHeader className="p-0 pb-4 mb-4 border-b border-border-primary/50">
                    <CardTitle className="text-sm font-extrabold text-text-primary flex items-center gap-2">
                      <DollarSign className="h-4.5 w-4.5 text-emerald-500" />
                      Umbrales Presupuestarios (CLP)
                    </CardTitle>
                    <CardDescription className="text-xs font-bold text-text-muted mt-1">
                      Filtra las licitaciones públicas de acuerdo a tu presupuesto óptimo de postulación.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 grid gap-4 sm:grid-cols-2 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">Monto de Licitación Mínimo</label>
                      <Input
                        type="number"
                        value={minAmount}
                        onChange={(e) => setMinAmount(parseInt(e.target.value) || 0)}
                        className="bg-white/40 dark:bg-slate-950/40 border-border-primary text-xs font-bold text-text-primary py-2.5 rounded-xl placeholder:text-slate-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">Monto de Licitación Máximo</label>
                      <Input
                        type="number"
                        value={maxAmount}
                        onChange={(e) => setMaxAmount(parseInt(e.target.value) || 0)}
                        className="bg-white/40 dark:bg-slate-950/40 border-border-primary text-xs font-bold text-text-primary py-2.5 rounded-xl placeholder:text-slate-400"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Tipos de Licitaciones */}
                <Card className="rounded-3xl border border-border-primary bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl p-6 relative overflow-hidden shadow-xl">
                  <CardHeader className="p-0 pb-4 mb-4 border-b border-border-primary/50">
                    <CardTitle className="text-sm font-extrabold text-text-primary flex items-center gap-2">
                      <Sliders className="h-4.5 w-4.5 text-[#1890ff]" />
                      Mecanismos y Tipos de Convocatoria
                    </CardTitle>
                    <CardDescription className="text-xs font-bold text-text-muted mt-1">
                      Selecciona las clases de licitación pública que tu empresa desea adjudicar en Mercado Público.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="grid gap-2.5 sm:grid-cols-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                      {(Object.entries(TIPOS_LICITACION_LABELS) as [TipoLicitacion, string][]).map(([key, label]) => {
                        const isChecked = selectedTipos.includes(key);
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleToggleTipo(key)}
                            className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                              isChecked
                                ? 'border-[#1890ff]/30 bg-[#1890ff]/10 text-[#1890ff] dark:text-[#00f2fe] font-black shadow-sm'
                                : 'border-border-primary/65 bg-white/10 dark:bg-slate-950/10 text-text-secondary hover:bg-slate-50 dark:hover:bg-white/[0.01]'
                            }`}
                          >
                            <div className={`h-4.5 w-4.5 shrink-0 rounded flex items-center justify-center border ${isChecked ? 'bg-[#1890ff] border-[#1890ff] text-white' : 'border-border-primary bg-white dark:bg-slate-900'}`}>
                              {isChecked && <Check className="h-3 w-3" />}
                            </div>
                            <div className="space-y-0.5 truncate">
                              <p className="text-[10px] font-extrabold font-mono text-[#1890ff] dark:text-[#00f2fe]">{key}</p>
                              <p className="text-[10px] font-bold text-text-primary truncate">{label}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Region Checkboxes */}
                <Card className="rounded-3xl border border-border-primary bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl p-6 relative overflow-hidden shadow-xl">
                  <CardHeader className="p-0 pb-4 mb-4 border-b border-border-primary/50">
                    <CardTitle className="text-sm font-extrabold text-text-primary flex items-center gap-2">
                      <Globe className="h-4.5 w-4.5 text-blue-500" />
                      Regiones de Cobertura Logística
                    </CardTitle>
                    <CardDescription className="text-xs font-bold text-text-muted mt-1">
                      Elige las regiones de Chile donde tu empresa tiene capacidad y viabilidad para cumplir contratos públicos.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="grid gap-2 sm:grid-cols-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                      {REGIONES_CHILE.map((reg) => {
                        const isChecked = selectedRegions.includes(reg.name);
                        return (
                          <button
                            key={reg.code}
                            type="button"
                            onClick={() => handleToggleRegion(reg.name)}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${
                              isChecked
                                ? 'border-[#1890ff]/30 bg-[#1890ff]/10 text-[#1890ff] dark:text-[#00f2fe] font-black'
                                : 'border-border-primary/60 bg-white/10 dark:bg-slate-950/10 text-text-secondary hover:bg-slate-50 dark:hover:bg-white/[0.01]'
                            }`}
                          >
                            <span className="text-[10px] font-extrabold font-mono text-text-light">{reg.code}</span>
                            <span className="text-[10px] font-bold truncate">{reg.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tab: Credentials */}
            {activeTab === 'credentials' && (
              <Card className="rounded-3xl border border-border-primary bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl p-6 relative overflow-hidden shadow-xl animate-fade-in">
                <CardHeader className="p-0 pb-4 mb-4 border-b border-border-primary/50">
                  <CardTitle className="text-sm font-extrabold text-text-primary flex items-center gap-2">
                    <Key className="h-4.5 w-4.5 text-violet-500 animate-pulse" />
                    Llaves de Acceso y Modelos LLM (IA)
                  </CardTitle>
                  <CardDescription className="text-xs font-bold text-text-muted mt-1">
                    Configura tus tokens e identificadores oficiales para realizar peticiones directas a Mercado Público y procesar el motor cognitivo de scoring.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 space-y-5">
                  
                  {/* MercadoPublico Ticket */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                        Ticket de Acceso ChileCompra (API)
                        <span title="Este ticket se inyecta en la API pública de ChileCompra para consultar licitaciones en vivo.">
                          <HelpCircle className="h-3.5 w-3.5 text-text-muted cursor-help" />
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowTicket(!showTicket)}
                        className="text-[10px] font-extrabold text-[#1890ff] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {showTicket ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        {showTicket ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </div>
                    <Input
                      type={showTicket ? 'text' : 'password'}
                      value={chilecompraTicket}
                      onChange={(e) => setChilecompraTicket(e.target.value)}
                      className="bg-white/40 dark:bg-slate-950/40 border-border-primary text-xs font-mono font-bold text-text-primary py-2.5 rounded-xl focus:border-[#1890ff]/40"
                    />
                  </div>

                  {/* OpenRouter Key */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                        API Key de OpenRouter (Motor IA)
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowORKey(!showORKey)}
                        className="text-[10px] font-extrabold text-[#1890ff] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {showORKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        {showORKey ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </div>
                    <Input
                      type={showORKey ? 'text' : 'password'}
                      value={openrouterKey}
                      onChange={(e) => setOpenrouterKey(e.target.value)}
                      className="bg-white/40 dark:bg-slate-950/40 border-border-primary text-xs font-mono font-bold text-text-primary py-2.5 rounded-xl focus:border-[#1890ff]/40"
                    />
                  </div>

                  {/* LLM selection */}
                  <div className="space-y-2 pt-4 border-t border-border-primary/50">
                    <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">
                      Modelo Predeterminado para Scoring Semántico
                    </label>
                    <select
                      value={selectedLLM}
                      onChange={(e) => setSelectedLLM(e.target.value)}
                      className="h-10 w-full rounded-xl border border-border-primary/80 bg-white/40 dark:bg-slate-950/45 px-3 text-xs font-bold text-text-primary outline-none transition-colors"
                    >
                      <option value="meta-llama/llama-3-70b-instruct:free">Llama 3 70B Instruct (Gratuito y Recomendado)</option>
                      <option value="google/gemini-flash-1.5:free">Gemini 1.5 Flash (Gratuito, Rápido y conciso)</option>
                      <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet (Máxima Precisión - Modelo Corporativo)</option>
                      <option value="openai/gpt-4o-mini">GPT-4o Mini (Equilibrado)</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tab: Team and Roles */}
            {activeTab === 'team' && (
              <div className="space-y-6 animate-fade-in">
                {/* Invite Members form */}
                <Card className="rounded-3xl border border-border-primary bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl p-6 relative overflow-hidden shadow-xl">
                  <CardHeader className="p-0 pb-4 mb-4 border-b border-border-primary/50">
                    <CardTitle className="text-sm font-extrabold text-text-primary flex items-center gap-2">
                      <Plus className="h-4.5 w-4.5 text-[#1890ff]" />
                      Invitar Colaborador al Espacio
                    </CardTitle>
                    <CardDescription className="text-xs font-bold text-text-muted mt-1">
                      Agrega a ingenieros de propuestas, directores comerciales o revisores para colaborar en el pipeline.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="grid gap-4 sm:grid-cols-3 sm:items-end">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">Nombre Completo</label>
                        <Input
                          placeholder="Ej: Manuel Espinoza"
                          value={newMemberName}
                          onChange={(e) => setNewMemberName(e.target.value)}
                          className="bg-white/40 dark:bg-slate-950/40 border-border-primary text-xs font-bold text-text-primary py-2.5 rounded-xl"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">Correo Electrónico</label>
                        <Input
                          type="email"
                          placeholder="ejemplo@empresa.cl"
                          value={newMemberEmail}
                          onChange={(e) => setNewMemberEmail(e.target.value)}
                          className="bg-white/40 dark:bg-slate-950/40 border-border-primary text-xs font-bold text-text-primary py-2.5 rounded-xl"
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="space-y-1.5 flex-1">
                          <label className="text-[10px] font-extrabold text-text-secondary uppercase tracking-wider font-semibold">Rol Asignado</label>
                          <select
                            value={newMemberRole}
                            onChange={(e) => setNewMemberRole(e.target.value)}
                            className="h-10 w-full rounded-xl border border-border-primary/80 bg-white/40 dark:bg-slate-950/45 px-3 text-xs font-bold text-text-primary outline-none"
                          >
                            <option value="Administrador">Administrador</option>
                            <option value="Gestor">Gestor Comercial</option>
                            <option value="Revisor">Revisor de Bases</option>
                          </select>
                        </div>
                        <button
                          onClick={handleAddTeamMember}
                          type="button"
                          className="h-10 px-5 rounded-xl bg-gradient-to-r from-[#1890ff] to-[#ec4899] hover:opacity-90 text-white font-black text-xs uppercase tracking-wide shadow-md shadow-[#1890ff]/10 cursor-pointer flex items-center justify-center"
                        >
                          <Plus className="mr-1 h-4 w-4" /> Invitar
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Team members list */}
                <Card className="rounded-3xl border border-border-primary bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl overflow-hidden shadow-xl">
                  <CardHeader className="p-6 pb-4 border-b border-border-primary/50">
                    <CardTitle className="text-sm font-extrabold text-text-primary flex items-center gap-2">
                      <Users className="h-4.5 w-4.5 text-[#1890ff]" />
                      Colaboradores Activos en tu Cuenta
                    </CardTitle>
                    <CardDescription className="text-xs font-bold text-text-muted mt-1">
                      Usuarios autorizados para ver propuestas, descargar anexos redactados y auditar adjudicaciones.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-border-primary bg-white/40 dark:bg-slate-950/40 text-text-secondary font-black uppercase tracking-wider">
                            <th className="p-4">Colaborador</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Rol Asignado</th>
                            <th className="p-4">Estado</th>
                            <th className="p-4 text-right">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-primary/50">
                          {teamMembers.map((member) => (
                            <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.015] transition-colors duration-200">
                              <td className="p-4 font-extrabold text-text-primary flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#1890ff]/20 to-[#ec4899]/20 border border-border-primary flex items-center justify-center text-xs font-black text-text-primary">
                                  {member.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                {member.name}
                              </td>
                              <td className="p-4 text-text-muted font-semibold font-mono">{member.email}</td>
                              <td className="p-4">
                                <Badge variant="outline" className="bg-[#1890ff]/5 text-[#1890ff] border-[#1890ff]/10 font-bold uppercase text-[9px]">
                                  {member.role}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <Badge
                                  variant={member.status === 'Activo' ? 'success' : 'warning'}
                                  className="font-extrabold text-[9px] uppercase"
                                >
                                  {member.status}
                                </Badge>
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMember(member.id, member.name)}
                                  className="text-red-500 hover:text-red-650 hover:bg-red-500/10 p-2 rounded-xl border border-transparent hover:border-red-500/10 transition-all cursor-pointer"
                                  title="Revocar acceso"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tab: Notification settings */}
            {activeTab === 'notifications' && (
              <Card className="rounded-3xl border border-border-primary bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl p-6 relative overflow-hidden shadow-xl animate-fade-in">
                <CardHeader className="p-0 pb-4 mb-4 border-b border-border-primary/50">
                  <CardTitle className="text-sm font-extrabold text-text-primary flex items-center gap-2">
                    <Bell className="h-4.5 w-4.5 text-[#1890ff]" />
                    Configuración de Canales y Alertas
                  </CardTitle>
                  <CardDescription className="text-xs font-bold text-text-muted mt-1">
                    Administra las vías de envío para los resúmenes diarios, notificaciones instantáneas de IA y recordatorios de vencimiento.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                  {/* Option 1: In App matches */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/20 dark:bg-slate-900/10 border border-border-primary/60 hover:border-border-primary/90 transition-colors">
                    <div className="space-y-0.5 max-w-[80%]">
                      <p className="text-xs font-black text-text-primary uppercase tracking-wide">Alertas en la Plataforma (Push In-app)</p>
                      <p className="text-[11px] text-text-light leading-relaxed font-semibold">Notificar visualmente dentro del dashboard del sistema cuando haya una coincidencia relevante &gt; 60.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifInApp}
                      onChange={(e) => setNotifInApp(e.target.checked)}
                      className="h-4 w-4 rounded border-border-primary bg-[#1890ff]/10 text-[#1890ff] focus:ring-[#1890ff]/30 cursor-pointer"
                    />
                  </div>

                  {/* Option 2: Email instant */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/20 dark:bg-slate-900/10 border border-border-primary/60 hover:border-border-primary/90 transition-colors">
                    <div className="space-y-0.5 max-w-[80%]">
                      <p className="text-xs font-black text-text-primary uppercase tracking-wide">Notificación Inmediata por Correo</p>
                      <p className="text-[11px] text-text-light leading-relaxed font-semibold">Despacha un mail individual al instante si la IA detecta un match con Score &gt; 80 (Máxima Calificación).</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifEmailInstant}
                      onChange={(e) => {
                        setNotifEmailInstant(e.target.checked);
                        if (e.target.checked) setNotifEmailDaily(false);
                      }}
                      className="h-4 w-4 rounded border-border-primary bg-[#1890ff]/10 text-[#1890ff] focus:ring-[#1890ff]/30 cursor-pointer"
                    />
                  </div>

                  {/* Option 3: Daily summary */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/20 dark:bg-slate-900/10 border border-border-primary/60 hover:border-border-primary/90 transition-colors">
                    <div className="space-y-0.5 max-w-[80%]">
                      <p className="text-xs font-black text-text-primary uppercase tracking-wide">Resumen Diario Consolidado</p>
                      <p className="text-[11px] text-text-light leading-relaxed font-semibold">Recibe todas las mañanas una minuta por correo con las nuevas licitaciones encontradas en tus subcategorías.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifEmailDaily}
                      onChange={(e) => {
                        setNotifEmailDaily(e.target.checked);
                        if (e.target.checked) setNotifEmailInstant(false);
                      }}
                      className="h-4 w-4 rounded border-border-primary bg-[#1890ff]/10 text-[#1890ff] focus:ring-[#1890ff]/30 cursor-pointer"
                    />
                  </div>

                  {/* Option 4: Deadlines */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/20 dark:bg-slate-900/10 border border-border-primary/60 hover:border-border-primary/90 transition-colors">
                    <div className="space-y-0.5 max-w-[80%]">
                      <p className="text-xs font-black text-text-primary uppercase tracking-wide">Recordatorio Crítico de Plazos de Cierre</p>
                      <p className="text-[11px] text-text-light leading-relaxed font-semibold">Desencadena un correo de advertencia 48h y 24h antes del vencimiento de licitaciones marcadas como favoritas.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifDeadline}
                      onChange={(e) => setNotifDeadline(e.target.checked)}
                      className="h-4 w-4 rounded border-border-primary bg-[#1890ff]/10 text-[#1890ff] focus:ring-[#1890ff]/30 cursor-pointer"
                    />
                  </div>

                  {/* Option 5: Competitor Alerts */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/20 dark:bg-slate-900/10 border border-border-primary/60 hover:border-border-primary/90 transition-colors">
                    <div className="space-y-0.5 max-w-[80%]">
                      <p className="text-xs font-black text-text-primary uppercase tracking-wide">Monitoreo de Adjudicaciones Competitivas</p>
                      <p className="text-[11px] text-text-light leading-relaxed font-semibold">Avisar inmediatamente si un rival agregado en tu panel de Competidores se adjudica una oferta pública en tu sector.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifCompetitor}
                      onChange={(e) => setNotifCompetitor(e.target.checked)}
                      className="h-4 w-4 rounded border-border-primary bg-[#1890ff]/10 text-[#1890ff] focus:ring-[#1890ff]/30 cursor-pointer"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

          </form>
        </div>
      </div>
    </div>
  );
}
