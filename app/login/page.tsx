"use client";

import Image from "next/image";
import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { login, signup } from "./actions";

export default function LoginPage() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [isLogin, setIsLogin] = useState(true);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
            const action = isLogin ? login : signup;
            const result = await action(formData);
            if (result?.error) {
                setError(result.error);
            }
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-7 relative overflow-hidden bg-scout-gradient animate-sd-in">
            {/* ondas */}
            <svg viewBox="0 0 1000 800" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                    <linearGradient id="lgw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#b0dd43" /></linearGradient>
                </defs>
                <path d="M-50,200 C220,120 360,300 620,210 S1000,120 1120,230" fill="none" stroke="url(#lgw)" strokeWidth="40" strokeLinecap="round" opacity="0.12" />
                <path d="M-50,560 C240,640 520,470 760,560 S1080,650 1120,520" fill="none" stroke="#ffffff" strokeWidth="34" strokeLinecap="round" opacity="0.1" />
            </svg>

            <div className="relative z-[2] w-full max-w-[420px]">
                <div className="text-center mb-6">
                    <div className="w-[92px] h-[92px] mx-auto mb-3.5 rounded-[26px] bg-white border-[3px] border-ink shadow-[4px_5px_0_#16302b] flex items-center justify-center">
                        <Image src="/brand/emblema.png" alt="Escoteiros do Brasil" width={58} height={58} className="h-[58px] w-auto" priority />
                    </div>
                    <h1 className="font-display font-semibold text-3xl text-white">{isLogin ? "Bem-vindo de volta" : "Crie sua conta"}</h1>
                    <p className="text-[#e3f6ea] text-[15px] mt-1.5 font-medium">{isLogin ? "Acesse e continue a trilha." : "Exclusivo para a comunidade UEB."}</p>
                </div>

                <div className="bg-white border-[3px] border-ink rounded-[24px] p-7 shadow-[6px_7px_0_#16302b]">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="email">E-mail (@escoteiros.org.br)</Label>
                            <Input id="email" name="email" type="email" placeholder="seu.nome@escoteiros.org.br" required disabled={isPending} />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Senha</Label>
                                <span className="text-xs text-azure-500 font-bold cursor-pointer">Esqueceu?</span>
                            </div>
                            <Input id="password" name="password" type="password" placeholder="••••••••" required disabled={isPending} />
                        </div>
                        {error && (
                            <div className="p-3 text-sm text-red-700 bg-red-50 border-2 border-red-200 rounded-[13px] font-medium">
                                {error}
                            </div>
                        )}
                        <Button className="w-full h-[52px] text-[17px]" variant="scout" type="submit" disabled={isPending}>
                            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? "Entrar →" : "Criar conta →")}
                        </Button>
                    </form>
                    <p className="text-center text-[13px] text-[#6a7a73] mt-4.5 font-medium">
                        {isLogin ? "Não tem conta? " : "Já tem conta? "}
                        <button
                            type="button"
                            onClick={() => { setIsLogin(!isLogin); setError(null); }}
                            className="text-scout-600 font-bold hover:underline focus:outline-none"
                        >
                            {isLogin ? "Cadastre-se" : "Entrar"}
                        </button>
                    </p>
                </div>

                <p className="text-center text-[#dff3e6] text-xs mt-5 font-semibold">Sempre Alerta para Servir · © 2026</p>
            </div>
        </div>
    );
}
