import { Waves } from "lucide-react";

export function AppLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-arena-green text-white shadow-lg shadow-green-700/20">
        <Waves className="h-6 w-6" />
      </div>
      {!compact && (
        <div>
          <p className="text-xl font-extrabold text-slate-950">ArenaHub</p>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">Areia e esporte</p>
        </div>
      )}
    </div>
  );
}
