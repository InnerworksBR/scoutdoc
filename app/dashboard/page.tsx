import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Compass, Plus, Search, FileText, MoreVertical, Calendar } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { signout } from "@/app/login/actions";
import { redirect } from "next/navigation";
import DocumentCard from "@/components/DocumentCard";

export default async function Dashboard() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: documents, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });

    return (
        <div className="min-h-screen bg-sand-50 font-body flex flex-col">
            {/* Navigation (Simplified for Dashboard) */}
            <nav className="border-b border-sand-200 bg-white sticky top-0 z-30">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center space-x-2 text-forest-700">
                        <Compass className="w-6 h-6" strokeWidth={2} />
                        <span className="font-display font-bold text-lg">ScoutDoc.AI</span>
                    </Link>
                    <div className="flex items-center space-x-4">
                        <div className="hidden md:flex flex-col items-end mr-2">
                            <span className="text-xs font-semibold text-forest-800">{user.email}</span>
                            <span className="text-[10px] text-forest-400">UEB Account</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-forest-100 flex items-center justify-center text-forest-700 font-bold text-xs ring-2 ring-white">
                            {user.email?.[0].toUpperCase() || "U"}
                        </div>
                        <form action={signout}>
                            <Button variant="ghost" size="sm" className="text-forest-600 hover:text-forest-800 text-xs">
                                Sair
                            </Button>
                        </form>
                    </div>
                </div>
            </nav>

            <main className="container mx-auto px-4 py-8 flex-1">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-forest-900">Meus Documentos</h1>
                        <p className="text-forest-600">Gerencie seus planos e atividades.</p>
                    </div>
                    <Link href="/pud/new">
                        <Button variant="scout" className="shadow-lg shadow-forest-200/50">
                            <Plus className="w-4 h-4 mr-2" /> Novo PUD
                        </Button>
                    </Link>
                </div>

                {/* Filter Bar */}
                <div className="flex items-center space-x-2 mb-6 max-w-md">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-400" />
                        <Input placeholder="Buscar documentos..." className="pl-9 bg-white border-sand-200" />
                    </div>
                </div>

                {/* Document Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {documents?.map((doc) => (
                        <DocumentCard key={doc.id} doc={doc} />
                    ))}

                    {/* Empty State */}
                    {(!documents || documents.length === 0) && (
                        <div className="col-span-full border-2 border-dashed border-sand-300 rounded-lg p-12 flex flex-col items-center justify-center text-center">
                            <div className="p-4 bg-sand-100 rounded-full mb-4">
                                <FileText className="w-8 h-8 text-forest-400" />
                            </div>
                            <h3 className="font-display font-bold text-lg text-forest-800">Nenhum documento ainda</h3>
                            <p className="text-forest-500 mb-6 max-w-sm">Comece criando seu primeiro Plano de Unidade Didática agora mesmo.</p>
                            <Link href="/pud/new">
                                <Button variant="outline">Criar PUD</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
