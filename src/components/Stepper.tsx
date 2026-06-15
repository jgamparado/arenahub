import { Check } from "lucide-react";
import { cn } from "../lib/utils";

const steps = ["Quadra", "Data e horário", "Dados"];

export function Stepper({ current }: { current: number }) {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-lg bg-white p-2 shadow-soft ring-1 ring-slate-200">
      {steps.map((step, index) => {
        const active = index === current;
        const done = index < current;
        return (
          <div
            key={step}
            className={cn(
              "flex min-h-12 items-center justify-center gap-2 rounded-md px-2 text-center text-xs font-bold sm:text-sm",
              active && "bg-green-600 text-white",
              done && "bg-amber-100 text-amber-900",
              !active && !done && "text-slate-500",
            )}
          >
            <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/25 ring-1 ring-current/20")}>
              {done ? <Check className="h-4 w-4" /> : index + 1}
            </span>
            <span className="hidden sm:inline">{step}</span>
          </div>
        );
      })}
    </div>
  );
}
