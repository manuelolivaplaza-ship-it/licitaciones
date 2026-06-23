'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ChevronRight } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center bg-background px-4 py-12 sm:px-6 lg:px-8 overflow-hidden select-none">
      {/* Dynamic Multi-chromatic Mesh background */}
      <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
        {/* Custom floating animations */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes auth-orb-1 {
            0% { transform: translate(0, 0) scale(1) rotate(0deg); }
            33% { transform: translate(60px, -60px) scale(1.15) rotate(120deg); }
            66% { transform: translate(-40px, 30px) scale(0.9) rotate(240deg); }
            100% { transform: translate(0, 0) scale(1) rotate(360deg); }
          }
          @keyframes auth-orb-2 {
            0% { transform: translate(0, 0) scale(1) rotate(360deg); }
            33% { transform: translate(-50px, 50px) scale(0.85) rotate(240deg); }
            66% { transform: translate(40px, -30px) scale(1.1) rotate(120deg); }
            100% { transform: translate(0, 0) scale(1) rotate(0deg); }
          }
          @keyframes auth-orb-3 {
            0% { transform: translate(0, 0) scale(1) rotate(0deg); }
            50% { transform: translate(50px, 40px) scale(1.08) rotate(180deg); }
            100% { transform: translate(0, 0) scale(1) rotate(360deg); }
          }
          .animate-auth-orb-1 { animation: auth-orb-1 25s ease-in-out infinite; }
          .animate-auth-orb-2 { animation: auth-orb-2 20s ease-in-out infinite; }
          .animate-auth-orb-3 { animation: auth-orb-3 28s ease-in-out infinite; }
        `}} />

        {/* Mesh background blending */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#eaf6ff] via-slate-50 via-[#f0f4ff] to-[#f8fafc] dark:from-[#020a17] dark:via-[#020617] dark:via-[#051126] dark:to-[#01040a] opacity-100" />
        
        {/* Animated colorful orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] animate-auth-orb-1 opacity-45 dark:opacity-30">
          <div className="w-full h-full bg-[#1890ff] rounded-full blur-[110px]" />
        </div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] max-w-[500px] max-h-[500px] animate-auth-orb-2 opacity-40 dark:opacity-25">
          <div className="w-full h-full bg-[#ec4899] rounded-full blur-[100px]" />
        </div>
        <div className="absolute top-[30%] right-[-5%] w-[45vw] h-[45vw] max-w-[450px] max-h-[450px] animate-auth-orb-3 opacity-35 dark:opacity-20">
          <div className="w-full h-full bg-[#a855f7] rounded-full blur-[120px]" />
        </div>
        <div className="absolute bottom-[20%] left-[-5%] w-[40vw] h-[40vw] max-w-[400px] max-h-[400px] animate-auth-orb-1 opacity-40 dark:opacity-20">
          <div className="w-full h-full bg-[#00E1D9] rounded-full blur-[90px]" />
        </div>
      </div>

      {/* Theme toggle in corner for auth views */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Main card container */}
      <div className="relative w-full max-w-md space-y-8 z-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
        
        {/* Branding header */}
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="group flex items-center gap-2 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1890ff] to-[#a855f7] shadow-lg shadow-[#1890ff]/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-[#1890ff] via-[#a855f7] to-[#ec4899] bg-clip-text text-transparent font-display">
              LicitaHub
            </span>
          </Link>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Automatización de Licitaciones Chile
          </p>
        </div>

        {/* Content body */}
        <div className="relative glass rounded-2xl p-6 sm:p-8 shadow-[0_20px_50px_-12px_rgba(24,144,255,0.15)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] border border-slate-200/50 dark:border-white/10 overflow-hidden">
          {/* Subtle top border gradient line */}
          <div className="absolute top-0 inset-x-0 h-[2.5px] bg-gradient-to-r from-[#00E1D9] via-[#1890ff] via-[#a855f7] to-[#ec4899]" />
          {children}
        </div>

        {/* Bottom footer links */}
        <div className="flex items-center justify-center gap-6 text-xs text-text-muted">
          <Link href="#" className="hover:text-text-primary transition-colors">Términos de servicio</Link>
          <span>•</span>
          <Link href="#" className="hover:text-text-primary transition-colors">Política de privacidad</Link>
          <span>•</span>
          <Link href="#" className="hover:text-text-primary transition-colors">Soporte Técnico</Link>
        </div>
      </div>
    </div>
  );
}
