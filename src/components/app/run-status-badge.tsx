'use client';
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

interface RunStatusBadgeProps {
    status: 'processing' | 'completed' | 'failed';
}

export default function RunStatusBadge({ status }: RunStatusBadgeProps) {
    const config = {
        processing: {
            label: "Processando",
            icon: <Loader2 size={12} className="animate-spin" />,
            classes: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        },
        completed: {
            label: "Concluído",
            icon: <CheckCircle size={12} />,
            classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        },
        failed: {
            label: "Falhou",
            icon: <AlertTriangle size={12} />,
            classes: "bg-red-500/10 text-red-400 border-red-500/20",
        },
    };

    const current = config[status];

    if (!current) return null;

    return (
        <span className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider backdrop-blur-md shrink-0",
            current.classes
        )}>
            {current.icon}
            {current.label}
        </span>
    );
};
