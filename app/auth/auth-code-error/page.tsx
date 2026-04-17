import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Compass, AlertTriangle } from "lucide-react";

export default function AuthErrorPage() {
    return (
        <div className="min-h-screen bg-scout-gradient-soft flex flex-col items-center justify-center p-4 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-display font-bold text-scout-900 mb-2">Erro de Autenticação</h1>
            <p className="text-scout-600 mb-8 max-w-sm">
                Ocorreu um problema ao processar seu login. O link pode ter expirado ou já foi utilizado.
            </p>
            <div className="flex gap-3">
                <Link href="/login">
                    <Button variant="scout">Tentar Novamente</Button>
                </Link>
                <Link href="/">
                    <Button variant="outline" className="border-scout-200 text-scout-700">
                        <Compass className="w-4 h-4 mr-2" /> Início
                    </Button>
                </Link>
            </div>
        </div>
    );
}
