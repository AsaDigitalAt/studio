'use client';

import { Button } from "@/components/ui/button";
import { Check, Plus } from "lucide-react";

interface SuccessViewProps {
  onReset: () => void;
}

export default function SuccessView({ onReset }: SuccessViewProps) {
  return (
    <div className="bg-gradient-to-br from-zinc-900/50 to-black/50 border border-white/10 rounded-3xl p-10 text-center space-y-6 animate-in zoom-in-95 duration-500 backdrop-blur-2xl shadow-2xl">
      <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 shadow-[0_0_30px_-10px_rgba(16,185,129,0.3)]">
        <Check size={40} />
      </div>
      <div>
        <h3 className="text-2xl font-semibold text-white mb-2">Transmissão Completa</h3>
        <p className="text-zinc-400">
          Os dados foram capturados e arquivados no núcleo.
        </p>
      </div>
      <Button
        onClick={onReset}
        className="mt-6 inline-flex items-center gap-2 bg-white text-black px-8 py-3.5 rounded-xl font-bold hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 h-auto text-base"
      >
        <Plus size={20} />
        Nova Extração
      </Button>
    </div>
  );
}
