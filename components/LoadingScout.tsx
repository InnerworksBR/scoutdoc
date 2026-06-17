"use client";

import Image from "next/image";

export default function LoadingScout() {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center gap-8 bg-scout-gradient relative overflow-hidden">
            <svg viewBox="0 0 400 200" className="w-[360px] max-w-[84vw] relative">
                <path
                    d="M30,150 C120,40 200,180 250,100 T370,60"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray="500"
                    strokeDashoffset="500"
                    style={{ animation: "sd-draw 2.6s ease-in-out infinite" }}
                />
                <circle cx="30" cy="150" r="9" fill="#ffda3e" stroke="#16302b" strokeWidth="3" />
                <circle cx="370" cy="60" r="9" fill="#b0dd43" stroke="#16302b" strokeWidth="3" />
            </svg>

            <div className="flex flex-col items-center gap-3.5">
                <div className="w-[84px] h-[84px] rounded-[24px] bg-white border-[3px] border-ink shadow-[4px_5px_0_#16302b] flex items-center justify-center animate-sd-spin">
                    <Image src="/brand/emblema.png" alt="Escoteiros do Brasil" width={52} height={52} className="h-[52px] w-auto" priority />
                </div>
                <p className="font-display font-semibold text-2xl text-white animate-sd-pulse">Traçando a rota…</p>
                <p className="text-[13px] text-[#e3f6ea] max-w-xs text-center leading-relaxed font-medium">
                    A IA está consultando o POR e a Matriz de Formação para montar seu PUD.
                </p>
            </div>
        </div>
    );
}
