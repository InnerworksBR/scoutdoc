import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Compass, FileText, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-sand-50 flex flex-col font-body selection:bg-forest-200 selection:text-forest-900">
      {/* Navigation */}
      <nav className="border-b border-sand-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-forest-700">
            <Compass className="w-6 h-6" strokeWidth={2} />
            <span className="font-display font-bold text-xl tracking-tight">ScoutDoc<span className="text-forest-400">.AI</span></span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-sm font-medium text-forest-600 hover:text-forest-800 transition-colors">
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
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-forest-100/50 via-sand-50 to-sand-50" />
          <div className="absolute top-20 right-0 w-96 h-96 bg-forest-200/20 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center gap-12 text-center lg:text-left">
            <div className="flex-1 space-y-8">
              <div className="inline-flex items-center space-x-2 bg-white border border-forest-100 rounded-full px-4 py-1.5 shadow-sm">
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-xs font-semibold text-forest-700 uppercase tracking-wider">IA para Escotistas</span>
              </div>

              <h1 className="text-4xl lg:text-6xl font-display font-bold text-forest-900 leading-[1.1]">
                Planeje suas atividades <br className="hidden lg:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-forest-600 to-forest-400">
                  em minutos, não horas.
                </span>
              </h1>

              <p className="text-lg text-forest-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Gere Planos de Unidade Didática (PUD) completos, tecnicamente precisos e alinhados com o POR. Deixe a burocracia com a IA e foque na aventura.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link href="/pud/new">
                  <Button variant="scout" size="lg" className="w-full sm:w-auto text-lg h-14 px-8 shadow-forest-200/50 shadow-lg">
                    Criar Novo PUD <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 border-forest-200 text-forest-700 hover:bg-forest-50 hover:text-forest-900">
                  Ver Exemplos
                </Button>
              </div>

              <div className="pt-8 flex items-center justify-center lg:justify-start gap-8 text-forest-400/80 grayscale opacity-70">
                {/* Mock Logos - Replace with UEB or similar if allowed, or generic badges */}
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-current rounded-full opacity-20" />
                  <span className="font-display font-bold text-sm">UEB Padrão</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-current rounded-full opacity-20" />
                  <span className="font-display font-bold text-sm">Método Escoteiro</span>
                </div>
              </div>
            </div>

            {/* Visual / Abstract Representation of a Document */}
            <div className="flex-1 w-full max-w-lg lg:max-w-none relative perspective-1000">
              <div className="relative z-10 bg-white rounded-xl shadow-2xl border border-sand-200 p-6 rotate-y-[-10deg] rotate-x-[5deg] hover:rotate-y-[0deg] hover:rotate-x-[0deg] transition-transform duration-700 ease-out">
                <div className="space-y-4">
                  <div className="h-8 w-1/3 bg-forest-100 rounded animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-sand-100 rounded" />
                    <div className="h-4 w-5/6 bg-sand-100 rounded" />
                    <div className="h-4 w-4/6 bg-sand-100 rounded" />
                  </div>
                  <div className="p-4 bg-forest-50 rounded-lg border border-forest-100 flex items-start gap-3">
                    <div className="p-2 bg-white rounded-md shadow-sm">
                      <FileText className="w-6 h-6 text-forest-500" />
                    </div>
                    <div className="space-y-1">
                      <div className="h-3 w-24 bg-forest-200 rounded" />
                      <div className="h-2 w-48 bg-forest-200/50 rounded" />
                    </div>
                  </div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute -right-12 -bottom-12 w-24 h-24 bg-accent/20 rounded-full blur-xl" />
              </div>

              {/* Floating Badges */}
              <div className="absolute -left-8 top-1/2 bg-white py-2 px-4 rounded-lg shadow-lg border border-sand-200 flex items-center gap-2 animate-bounce duration-[3000ms]">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs font-bold text-forest-800">100% Validado</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-forest-400 text-sm">
        <p>© 2026 ScoutDoc AI. Sempre Alerta para Servir.</p>
      </footer>
    </div>
  );
}
