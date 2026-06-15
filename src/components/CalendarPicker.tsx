import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { toDateKey } from "../lib/format";
import { cn } from "../lib/utils";

type CalendarPickerProps = {
  value: string;
  onChange: (dateKey: string) => void;
};

export function CalendarPicker({ value, onChange }: CalendarPickerProps) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const days = Array.from({ length: 31 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return date;
  });

  const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(today);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" disabled aria-label="Mês anterior">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <p className="text-sm font-bold capitalize text-slate-900">{monthLabel}</p>
        <Button variant="ghost" size="icon" disabled aria-label="Próximo mês">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-500">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((day, index) => (
          <span key={`${day}-${index}`}>{day}</span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {days.map((date) => {
          const key = toDateKey(date);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={cn(
                "aspect-square rounded-md text-sm font-semibold text-slate-700 transition hover:bg-green-50",
                key === value && "bg-green-600 text-white hover:bg-green-600",
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
