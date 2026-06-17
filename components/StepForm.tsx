"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Schema Definitions
const step1Schema = z.object({
    linha: z.string().min(1, "Selecione uma linha"),
    ramo: z.string().min(1, "Selecione um ramo"),
    nivel: z.string().min(1, "Selecione um nível"),
});

const step2Schema = z.object({
    titulo: z.string().min(5, "O título deve ter pelo menos 5 caracteres"),
    tema: z.string().optional(),
});

const step3Schema = z.object({
    duracao: z.string().min(1, "Informe a duração"),
    participantes: z.string().min(1, "Informe os participantes"),
    local: z.string().min(1, "Informe o local"),
});

const step4Schema = z.object({
    contexto: z.string().min(10, "Descreva o contexto (mín. 10 chars)"),
    enfase: z.string().min(3, "Qual a ênfase?"),
    desafios: z.string().min(10, "Cite desafios reais (mín. 10 chars)"),
    observacoes: z.string().optional(),
});

const formSchema = step1Schema.merge(step2Schema).merge(step3Schema).merge(step4Schema);

type FormData = z.infer<typeof formSchema>;

const STEPS = [
    { id: 1, title: "Dados Básicos", fields: ["linha", "ramo", "nivel"] },
    { id: 2, title: "Atividade", fields: ["titulo", "tema"] },
    { id: 3, title: "Logística", fields: ["duracao", "participantes", "local"] },
    { id: 4, title: "Contexto", fields: ["contexto", "enfase", "desafios"] },
];

interface StepFormProps {
    onComplete: (data: FormData) => void;
}

export default function StepForm({ onComplete }: StepFormProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState(0);

    const {
        register,
        handleSubmit,
        trigger,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        mode: "onChange",
    });

    const nextStep = async () => {
        const fields = STEPS[currentStep].fields as (keyof FormData)[];
        const isStepValid = await trigger(fields);

        if (isStepValid) {
            if (currentStep < STEPS.length - 1) {
                setDirection(1);
                setCurrentStep((prev) => prev + 1);
            } else {
                await handleSubmit(onSubmit)();
            }
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setDirection(-1);
            setCurrentStep((prev) => prev - 1);
        }
    };

    const onSubmit: SubmitHandler<FormData> = (data) => {
        onComplete(data);
    };

    const variants = {
        enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (direction: number) => ({ x: direction < 0 ? 50 : -50, opacity: 0 }),
    };

    const selectClass = "w-full h-12 px-3.5 rounded-[13px] border-[2.5px] border-cream-300 bg-cream-50 text-sm font-medium text-scout-800 focus:outline-none focus:border-azure-500 appearance-none";
    const textareaClass = "w-full px-3.5 py-3 rounded-[13px] border-[2.5px] border-cream-300 bg-cream-50 text-sm font-medium text-scout-800 focus:outline-none focus:border-azure-500 resize-none";
    const errClass = "text-red-600 text-xs font-medium";

    return (
        <div className="w-full max-w-[580px] mx-auto">
            {/* Wavy trail progress */}
            <div className="w-full mb-7 relative">
                <svg viewBox="0 0 580 60" preserveAspectRatio="none" className="absolute top-3 left-0 w-full h-10 pointer-events-none">
                    <path d="M40,30 C160,2 200,58 290,30 S420,2 540,30" fill="none" stroke="#d7d3c2" strokeWidth="4" strokeLinecap="round" strokeDasharray="3 9" />
                </svg>
                <div className="relative flex justify-between px-1.5">
                    {STEPS.map((step, index) => {
                        const done = index < currentStep;
                        const on = index <= currentStep;
                        const current = index === currentStep;
                        return (
                            <div key={step.id} className="flex flex-col items-center gap-2 w-[100px]">
                                <div className={cn(
                                    "w-11 h-11 rounded-full border-[3px] border-ink flex items-center justify-center font-display font-semibold text-[17px]",
                                    on ? "bg-scout-600 text-white" : "bg-white text-[#8aa39a]",
                                    current && "shadow-[3px_3px_0_#16302b]"
                                )}>
                                    {done ? "✓" : step.id}
                                </div>
                                <span className={cn(
                                    "font-display font-medium text-xs text-center",
                                    current ? "text-scout-600" : "text-[#6a7a73]"
                                )}>
                                    {step.title}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Form card */}
            <div className="w-full bg-white border-[3px] border-ink rounded-[22px] shadow-[6px_7px_0_#16302b] overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-scout-600 via-azure-500 to-gold-500" />
                <div className="px-7 pt-6 pb-2">
                    <h2 className="font-display font-semibold text-[21px] text-ink">{STEPS[currentStep].title}</h2>
                </div>
                <div className="px-7 pb-6 min-h-[270px]">
                    <AnimatePresence custom={direction} mode="wait">
                        <motion.div
                            key={currentStep}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 },
                            }}
                            className="space-y-[18px]"
                        >
                            {currentStep === 0 && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="linha">Linha de Formação</Label>
                                        <div className="relative">
                                            <select id="linha" {...register("linha")} className={selectClass}>
                                                <option value="">Selecione...</option>
                                                <option value="Escotista">Escotista</option>
                                                <option value="Dirigente">Dirigente</option>
                                            </select>
                                            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8aa39a] pointer-events-none" />
                                        </div>
                                        {errors.linha && <p className={errClass}>{errors.linha.message}</p>}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="ramo">Ramo</Label>
                                        <div className="relative">
                                            <select id="ramo" {...register("ramo")} className={selectClass}>
                                                <option value="">Selecione...</option>
                                                <option value="Lobinho">Lobinho</option>
                                                <option value="Escoteiro">Escoteiro</option>
                                                <option value="Sênior">Sênior</option>
                                                <option value="Pioneiro">Pioneiro</option>
                                            </select>
                                            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8aa39a] pointer-events-none" />
                                        </div>
                                        {errors.ramo && <p className={errClass}>{errors.ramo.message}</p>}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="nivel">Nível</Label>
                                        <div className="relative">
                                            <select id="nivel" {...register("nivel")} className={selectClass}>
                                                <option value="">Selecione...</option>
                                                <option value="Preliminar">Preliminar</option>
                                                <option value="Básico">Básico</option>
                                                <option value="Avançado">Avançado</option>
                                            </select>
                                            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8aa39a] pointer-events-none" />
                                        </div>
                                        {errors.nivel && <p className={errClass}>{errors.nivel.message}</p>}
                                    </div>
                                </>
                            )}

                            {currentStep === 1 && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="titulo">Título da Atividade</Label>
                                        <Input id="titulo" placeholder="Ex: Pioneirismo: Nós e Amarras" {...register("titulo")} />
                                        {errors.titulo && <p className={errClass}>{errors.titulo.message}</p>}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="tema">Tema (Opcional)</Label>
                                        <Input id="tema" placeholder="Ex: Aventura na Selva" {...register("tema")} />
                                    </div>
                                </>
                            )}

                            {currentStep === 2 && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="duracao">Duração Estimada</Label>
                                        <Input id="duracao" placeholder="Ex: 90 minutos" {...register("duracao")} />
                                        {errors.duracao && <p className={errClass}>{errors.duracao.message}</p>}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="participantes">Número de Participantes</Label>
                                        <Input id="participantes" placeholder="Ex: 24 jovens" {...register("participantes")} />
                                        {errors.participantes && <p className={errClass}>{errors.participantes.message}</p>}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="local">Local</Label>
                                        <Input id="local" placeholder="Ex: Sede do Grupo (ao ar livre)" {...register("local")} />
                                        {errors.local && <p className={errClass}>{errors.local.message}</p>}
                                    </div>
                                </>
                            )}

                            {currentStep === 3 && (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="contexto">Contexto de Aplicação</Label>
                                        <textarea
                                            id="contexto"
                                            rows={2}
                                            className={textareaClass}
                                            placeholder="Ex: UEL urbana, patrulha em formação, jovens de 11 a 14 anos."
                                            {...register("contexto")}
                                        />
                                        {errors.contexto && <p className={errClass}>{errors.contexto.message}</p>}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="enfase">Ênfase Educativa</Label>
                                        <Input id="enfase" placeholder="Ex: Trabalho em equipe e liderança" {...register("enfase")} />
                                        {errors.enfase && <p className={errClass}>{errors.enfase.message}</p>}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="desafios">Desafios Reais da UEL</Label>
                                        <textarea
                                            id="desafios"
                                            rows={2}
                                            className={textareaClass}
                                            placeholder="Ex: Jovens dispersos, poucos materiais."
                                            {...register("desafios")}
                                        />
                                        {errors.desafios && <p className={errClass}>{errors.desafios.message}</p>}
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="observacoes">Observações (Opcional)</Label>
                                        <Input id="observacoes" placeholder="Outros detalhes..." {...register("observacoes")} />
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
                <div className="flex justify-between items-center px-7 py-4 border-t-2 border-cream-200 bg-cream-50">
                    <button
                        type="button"
                        onClick={prevStep}
                        disabled={currentStep === 0}
                        className="font-display font-semibold text-[15px] text-[#45564f] disabled:opacity-30 transition-opacity"
                    >
                        ← Voltar
                    </button>
                    <Button onClick={nextStep} variant="scout">
                        {currentStep === STEPS.length - 1 ? "Gerar PUD" : "Próximo"} →
                    </Button>
                </div>
            </div>
        </div>
    );
}
