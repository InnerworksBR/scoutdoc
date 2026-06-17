import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import { Button } from "@/components/ui/button";

/* Ícone escoteiro inline (paths do design ScoutDoc 2026) */
function ScoutIcon({ paths, stroke, className }: { paths: string[]; stroke: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

const FEATURES = [
  { color: "#b0dd43", stroke: "#16302b", paths: ["M6.5 3.5 V20.5", "M6.5 4.5 H17.5 L14.5 8.5 L17.5 12.5 H6.5"], title: "Gerar PUDs", text: "Planos completos em minutos, alinhados às normas e à andragogia da UEB." },
  { color: "#02a1d9", stroke: "#ffffff", paths: ["M4.5 6.5 L12 9.5 L19.5 6.5", "M12 9.5 L8.8 18 a3.4 3.4 0 0 0 6.4 0 Z", "M12 13.6 a1.1 1.1 0 1 0 0.02 0 Z"], title: "Assistentes IA", text: "Especialistas escoteiros que respondem com base no POR, PNAME e Matriz." },
  { color: "#ffda3e", stroke: "#16302b", paths: ["M12 21 a9 9 0 1 1 0 -18 a9 9 0 0 1 0 18 Z", "M15.2 8.8 L10.8 13.2 L8.8 15.2 L13.2 10.8 Z"], title: "Base de Conhecimento", text: "Documentos oficiais sempre citados — confiança técnica em cada parágrafo." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white overflow-hidden animate-sd-in">
      {/* ===== Nav ===== */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b-2 border-cream-200">
        <div className="max-w-[1200px] mx-auto h-[74px] px-6 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/brand/emblema.png" alt="Escoteiros do Brasil" width={40} height={40} className="h-10 w-auto" priority />
            <span className="font-display font-semibold text-[23px] text-scout-600 tracking-tight">ScoutDoc</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/login" className="font-display font-medium text-base text-royal">Entrar</Link>
            <Link href="/dashboard">
              <Button variant="scout" size="sm" className="px-5">Acessar</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ===== Hero ===== */}
      <div className="relative max-w-[1200px] mx-auto px-6 sm:px-8 pt-16 pb-10 grid lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
        {/* onda de fundo */}
        <svg viewBox="0 0 1200 600" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <linearGradient id="lw1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#b0dd43" /><stop offset="0.5" stopColor="#08ba54" /><stop offset="1" stopColor="#02a1d9" /></linearGradient>
            <linearGradient id="lw2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ffda3e" /><stop offset="1" stopColor="#08ba54" /></linearGradient>
          </defs>
          <path d="M-60,150 C200,60 360,250 640,170 S1080,70 1320,180" fill="none" stroke="url(#lw1)" strokeWidth="30" strokeLinecap="round" opacity="0.16" />
          <path d="M-60,470 C240,560 520,400 760,470 S1120,560 1320,440" fill="none" stroke="url(#lw2)" strokeWidth="26" strokeLinecap="round" opacity="0.16" />
        </svg>

        {/* Texto */}
        <div className="relative z-[2]">
          <div className="inline-flex items-center gap-2 bg-gold-500 border-[2.5px] border-ink text-ink rounded-full px-4 py-1.5 font-display font-semibold text-[13px] sd-shadow-sm -rotate-2">✦ IA a serviço do escotismo</div>
          <h1 className="font-display font-semibold text-[44px] sm:text-[60px] leading-[1.02] tracking-tight text-ink mt-6">
            Planeje a aventura,<br />não a <span className="text-scout-600">papelada.</span>
          </h1>
          <p className="text-lg leading-relaxed text-[#45564f] max-w-[500px] mt-6 font-medium">
            Gere Planos de Unidade Didática alinhados ao POR e à Matriz de Formação, e converse com assistentes escoteiros movidos a IA. Menos burocracia, mais trilha.
          </p>
          <div className="flex gap-4 mt-8 flex-wrap">
            <Link href="/dashboard"><Button variant="scout" size="lg">Começar agora →</Button></Link>
            <Link href="/assistants"><Button variant="outline" size="lg" className="text-royal border-royal">Ver assistentes</Button></Link>
          </div>
          <div className="flex items-center gap-4 mt-9">
            <Image src="/brand/logo-horizontal.png" alt="Escoteiros do Brasil" width={120} height={34} className="h-[34px] w-auto" />
            <span className="text-[13px] text-[#6a7a73] font-semibold max-w-[220px] leading-snug">Feito para Chefes e Dirigentes do movimento.</span>
          </div>
        </div>

        {/* Preview sticker */}
        <div className="relative z-[2]">
          <div className="relative bg-white border-[3px] border-ink rounded-[24px] shadow-[8px_9px_0_#16302b] p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-[46px] h-[46px] rounded-[13px] bg-scout-600 border-[2.5px] border-ink flex items-center justify-center text-white">
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none"><rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2" /><line x1="8.5" y1="8" x2="15.5" y2="8" stroke="currentColor" strokeWidth="2" /><line x1="8.5" y1="12" x2="15.5" y2="12" stroke="currentColor" strokeWidth="2" /></svg>
              </div>
              <div>
                <div className="font-display font-semibold text-base text-ink">PUD · Pioneirismo</div>
                <div className="text-xs text-[#6a7a73] font-semibold">Ramo Escoteiro · 90 min</div>
              </div>
              <div className="ml-auto font-display font-semibold text-[11px] text-ink bg-lime border-2 border-ink px-2.5 py-1 rounded-full">Pronto</div>
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="h-[11px] w-[82%] bg-cream-200 rounded-md" />
              <div className="h-[11px] w-[96%] bg-cream-100 rounded-md" />
              <div className="h-[11px] w-[58%] bg-cream-100 rounded-md" />
            </div>
            <div className="mt-4 bg-[#eefbf2] border-2 border-[#b6e9c8] rounded-[14px] p-3.5 flex gap-3 items-center">
              <div className="w-[38px] h-[38px] rounded-full bg-royal border-[2.5px] border-ink flex items-center justify-center text-white font-display font-semibold text-[11px]">POR</div>
              <div className="flex-1"><div className="h-[9px] w-1/2 bg-lime rounded-md mb-1.5" /><div className="h-2 w-[78%] bg-azure-200 rounded-md" /></div>
            </div>
          </div>
          {/* stickers flutuantes */}
          <div style={{ "--r": "-8deg", transform: "rotate(-8deg)" } as CSSProperties} className="animate-sd-float absolute -left-7 top-8 z-[3] w-[84px] h-[84px] rounded-full bg-gold-500 border-[3px] border-ink shadow-[3px_4px_0_#16302b] flex items-center justify-center">
            <ScoutIcon paths={["M12 21 a9 9 0 1 1 0 -18 a9 9 0 0 1 0 18 Z", "M15.2 8.8 L10.8 13.2 L8.8 15.2 L13.2 10.8 Z"]} stroke="#16302b" className="w-10 h-10" />
          </div>
          <div style={{ "--r": "6deg", transform: "rotate(6deg)" } as CSSProperties} className="animate-sd-float absolute -right-4 bottom-4 z-[3] bg-azure-500 text-white border-[3px] border-ink shadow-[3px_4px_0_#16302b] px-4 py-2.5 rounded-[14px] font-display font-semibold text-[13px] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-lime" /> Assistente online
          </div>
        </div>
      </div>

      {/* ===== Features ===== */}
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8 pt-8 pb-16">
        <h2 className="font-display font-semibold text-sm text-scout-600 uppercase tracking-[0.14em] mb-6">Sua mochila de ferramentas</h2>
        <div className="grid md:grid-cols-3 gap-[18px]">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white border-[3px] border-ink rounded-[20px] p-6 shadow-[5px_5px_0_#16302b]">
              <div className="w-[52px] h-[52px] rounded-[15px] border-[2.5px] border-ink flex items-center justify-center mb-4" style={{ background: f.color }}>
                <ScoutIcon paths={f.paths} stroke={f.stroke} className="w-[27px] h-[27px]" />
              </div>
              <h3 className="font-display font-semibold text-[19px] text-ink mb-2">{f.title}</h3>
              <p className="text-sm leading-relaxed text-[#5a6a63] font-medium">{f.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ===== Footer ===== */}
      <div className="relative bg-scout-gradient py-10 px-8 text-center overflow-hidden">
        <div className="relative z-[2]">
          <div className="font-display font-semibold text-2xl text-white">ScoutDoc</div>
          <div className="text-[13px] text-[#dff3e6] font-semibold mt-1">Escotismo é caminho que nos une · © 2026</div>
        </div>
      </div>
    </div>
  );
}
