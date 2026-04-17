"use client";

import Link from "next/link";
import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Compass, Loader2 } from "lucide-react";
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
        <div className="min-h-screen bg-scout-gradient-soft flex flex-col items-center justify-center p-4">
            <div className="mb-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-scout-gradient rounded-full flex items-center justify-center mb-4 shadow-lg">
                    <Compass className="w-8 h-8 text-white" strokeWidth={1.5} />
                </div>
                <h1 className="text-2xl font-display font-bold text-scout-900">Bem-vindo de volta</h1>
                <p className="text-scout-500 text-sm">Acesse sua conta para continuar planejando.</p>
            </div>

            <Card className="w-full max-w-md shadow-xl border-scout-100 bg-white">
                <CardHeader>
                    <CardTitle className="text-xl">{isLogin ? "Login" : "Cadastro ScoutDoc"}</CardTitle>
                    <CardDescription>{isLogin ? "Entre com suas credenciais UEB." : "Exclusivo para emails @escoteiros.org.br"}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email (@escoteiros.org.br)</Label>
                            <Input id="email" name="email" type="email" placeholder="seu.email@exemplo.com" required disabled={isPending} />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Senha</Label>
                                <Link href="#" className="text-xs text-azure-500 hover:text-azure-700">
                                    Esqueceu?
                                </Link>
                            </div>
                            <Input id="password" name="password" type="password" required disabled={isPending} />
                        </div>
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                                {error}
                            </div>
                        )}
                        <Button className="w-full" variant="scout" type="submit" disabled={isPending}>
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (isLogin ? "Entrar" : "Criar Conta")}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-xs text-muted-foreground">
                        {isLogin ? "Não tem conta? " : "Já tem conta? "}
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-scout-600 font-medium hover:underline focus:outline-none"
                        >
                            {isLogin ? "Cadastre-se" : "Entrar"}
                        </button>
                    </p>
                </CardFooter>
            </Card>

            <div className="mt-8 text-center text-xs text-scout-300">
                <p>© 2026 ScoutDoc AI · Sempre Alerta para Servir</p>
            </div>
        </div>
    );
}
