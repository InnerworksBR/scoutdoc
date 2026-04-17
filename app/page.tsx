import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Compass, FileText, Sparkles, MessageSquare, BookOpen } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-cream-50 flex flex-col font-body selection:bg-scout-200 selection:text-scout-900">
      {/* Navigation */}
      <nav className="border-b border-cream-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-scout-700">
            <Compass className="w-6 h-6" strokeWidth={2} />
            <span className="font-display font-bold text-xl tracking-tight">
              ScoutDoc<span className="text-azure-500">.AI</span>
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-sm font-medium text-scout-600 hover:text-scout-800 transition-colors">
              Entrar
            </Link>
            <Link href="/dashboard">
              <Button variant="scout" size="sm">
                Acessar Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col">
        <section className="relative py-20 lg:py-32 overflow-hidden">
          {/* Background Decor */}
          <div className="absolute inset-0 -z-10 bg-scout-gradient-soft" />
          <div className="absolute top-20 right-0 w-96 h-96 bg-azure-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-gold-300/20 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center gap-12 text-center lg:text-left">
            <div className="flex-1 space-y-8">
              <div className="inline-flex items-center space-x-2 bg-white border border-scout-100 rounded-full px-4 py-1.5 shadow-sm">
                <Sparkles className="w-4 h-4 text-gold-500" />
                <span className="text-xs font-semibold text-scout-700 uppercase tracking-wider">IA para Escotistas</span>
              </div>

              <h1 className="text-4xl lg:text-6xl font-display font-bold text-scout-900 leading-[1.1]">
                Planeje suas atividades <br className="hidden lg:block" />
                <span className="text-scout-gradient">
                  em minutos, não horas.
                </span>
              </h1>

              <p className="text-lg text-scout-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Gere Planos de Unidade Didática (PUD) completos, tecnicamente precisos e alinhados com o POR. Deixe a burocracia com a IA e foque na aventura.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link href="/pud/new">
                  <Button variant="scout" size="lg" className="w-full sm:w-auto text-lg h-14 px-8 shadow-scout-200/50 shadow-lg">
                    Criar Novo PUD <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/assistants">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 border-azure-300 text-azure-700 hover:bg-azure-50 hover:text-azure-900">
                    <MessageSquare className="mr-2 w-5 h-5" /> Assistentes IA
                  </Button>
                </Link>
              </div>

              <div className="pt-4 flex items-center justify-center lg:justify-start gap-8 text-scout-400/80 opacity-70">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5" />
                  <span className="font-display font-bold text-sm">UEB Padrão</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Compass className="w-5 h-5" />
                  <span className="font-display font-bold text-sm">Método Escoteiro</span>
                </div>
              </div>
            </div>

            {/* Visual Card */}
            <div className="flex-1 w-full max-w-lg lg:max-w-none relative">
              <div className="relative z-10 bg-white rounded-xl shadow-2xl border border-cream-200 p-6 rotate-y-[-10deg] rotate-x-[5deg] hover:rotate-y-[0deg] hover:rotate-x-[0deg] transition-transform duration-700 ease-out">
                {/* Gradient stripe at top */}
                <div className="h-1.5 bg-scout-gradient rounded-full mb-4" />
                <div className="space-y-4">
                  <div className="h-8 w-1/3 bg-scout-100 rounded animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-cream-100 rounded" />
                    <div className="h-4 w-5/6 bg-cream-100 rounded" />
                    <div className="h-4 w-4/6 bg-cream-100 rounded" />
                  </div>
                  <div className="p-4 bg-scout-50 rounded-lg border border-scout-100 flex items-start gap-3">
                    <div className="p-2 bg-white rounded-md shadow-sm">
                      <FileText className="w-6 h-6 text-azure-500" />
                    </div>
                    <div className="space-y-1">
                      <div className="h-3 w-24 bg-scout-200 rounded" />
                      <div className="h-2 w-48 bg-azure-200/50 rounded" />
                    </div>
                  </div>
                </div>
                <div className="absolute -right-12 -bottom-12 w-24 h-24 bg-gold-500/20 rounded-full blur-xl" />
              </div>

              {/* Floating Badge */}
              <div className="absolute -left-8 top-1/2 bg-white py-2 px-4 rounded-lg shadow-lg border border-cream-200 flex items-center gap-2 animate-bounce duration-[3000ms]">
                <div className="w-2 h-2 rounded-full bg-scout-500" />
                <span className="text-xs font-bold text-scout-800">100% Validado</span>
              </div>

              <div className="absolute -right-4 bottom-8 bg-azure-500 text-white py-2 px-4 rounded-lg shadow-lg flex items-center gap-2">
                <MessageSquare className="w-3 h-3" />
                <span className="text-xs font-bold">Assistente disponível</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-cream-200 shadow-sm hover:shadow-md hover:border-scout-200 transition-all">
              <div className="w-10 h-10 bg-scout-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-5 h-5 text-scout-600" />
              </div>
              <h3 className="font-display font-bold text-scout-900 mb-2">Gerar PUDs</h3>
              <p className="text-sm text-scout-600">Crie planos completos em minutos com IA alinhada às normas da UEB.</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-cream-200 shadow-sm hover:shadow-md hover:border-azure-200 transition-all">
              <div className="w-10 h-10 bg-azure-100 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="w-5 h-5 text-azure-600" />
              </div>
              <h3 className="font-display font-bold text-scout-900 mb-2">Assistentes IA</h3>
              <p className="text-sm text-scout-600">Tire dúvidas com agentes especializados nas normas e metodologias escoteiras.</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-cream-200 shadow-sm hover:shadow-md hover:border-gold-300 transition-all">
              <div className="w-10 h-10 bg-gold-300/30 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5 text-gold-600" />
              </div>
              <h3 className="font-display font-bold text-scout-900 mb-2">Base de Conhecimento</h3>
              <p className="text-sm text-scout-600">Documentos oficiais integrados: POR, PNAME e Matriz de Formação.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 text-center border-t border-cream-200">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Compass className="w-4 h-4 text-scout-400" />
          <span className="font-display font-bold text-scout-700">ScoutDoc.AI</span>
        </div>
        <p className="text-scout-400 text-sm">© 2026 ScoutDoc AI. Sempre Alerta para Servir.</p>
      </footer>
    </div>
  );
}
