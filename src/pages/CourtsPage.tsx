import { FormEvent, useMemo, useState } from "react";
import { Clock, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { SportIcon } from "../components/SportIcon";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { useCourts, useCreateCourt, useUpdateCourt } from "../hooks/useCourts";
import { useCreateTimeSlot, useDeleteTimeSlot, useTimeSlots } from "../hooks/useTimeSlots";
import { currency, shortTime } from "../lib/format";
import { sportLabels, weekdays, type Court, type SportType } from "../lib/types";

export default function CourtsPage() {
  const courts = useCourts(false);
  const createCourt = useCreateCourt();
  const updateCourt = useUpdateCourt();
  const [name, setName] = useState("");
  const [sportType, setSportType] = useState<SportType>("beach_tennis");
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);

  async function addCourt(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      toast.error("Informe o nome da quadra.");
      return;
    }
    try {
      await createCourt.mutateAsync({ name: name.trim(), sport_type: sportType });
      setName("");
      setSportType("beach_tennis");
      toast.success("Quadra adicionada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível adicionar.");
    }
  }

  async function toggleCourt(court: Court) {
    try {
      await updateCourt.mutateAsync({ id: court.id, active: !court.active });
      toast.success(court.active ? "Quadra desativada." : "Quadra ativada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar.");
    }
  }

  return (
    <DashboardLayout title="Gerenciar quadras">
      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Adicionar quadra</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={addCourt}>
              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-800">Nome</span>
                <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex: Quadra 4" />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-800">Tipo de esporte</span>
                <Select value={sportType} onChange={(event) => setSportType(event.target.value as SportType)}>
                  <option value="beach_tennis">Beach tennis</option>
                  <option value="futevolei">Futevôlei</option>
                  <option value="volei_praia">Vôlei de praia</option>
                </Select>
              </label>
              <Button className="w-full" disabled={createCourt.isPending}>
                {createCourt.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                Adicionar
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-3 md:grid-cols-2">
          {(courts.data ?? []).map((court) => (
            <Card key={court.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-700">
                      <SportIcon sport={court.sport_type} className="h-6 w-6" />
                    </span>
                    <div>
                      <CardTitle>{court.name}</CardTitle>
                      <p className="text-sm font-semibold text-slate-500">{sportLabels[court.sport_type]}</p>
                    </div>
                  </div>
                  <Badge variant={court.active ? "default" : "muted"}>{court.active ? "Ativa" : "Inativa"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-2 sm:grid-cols-2">
                <Button variant="secondary" onClick={() => toggleCourt(court)} disabled={updateCourt.isPending}>
                  {court.active ? "Desativar" : "Ativar"}
                </Button>
                <Button onClick={() => setSelectedCourt(court)}>
                  <Clock className="h-4 w-4" />
                  Gerenciar horários
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <ScheduleDialog court={selectedCourt} onClose={() => setSelectedCourt(null)} />
    </DashboardLayout>
  );
}

function ScheduleDialog({ court, onClose }: { court: Court | null; onClose: () => void }) {
  const [weekday, setWeekday] = useState(1);
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("08:00");
  const [price, setPrice] = useState("50");
  const slots = useTimeSlots(court?.id);
  const createSlot = useCreateTimeSlot();
  const deleteSlot = useDeleteTimeSlot();

  const groupedSlots = useMemo(() => {
    const map = new Map<number, NonNullable<typeof slots.data>>();
    (slots.data ?? []).forEach((slot) => {
      map.set(slot.weekday, [...(map.get(slot.weekday) ?? []), slot]);
    });
    return map;
  }, [slots.data]);

  async function addSlot(event: FormEvent) {
    event.preventDefault();
    if (!court) return;
    try {
      await createSlot.mutateAsync({
        court_id: court.id,
        weekday,
        start_time: startTime,
        end_time: endTime,
        price: Number(price),
      });
      toast.success("Horário adicionado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível adicionar horário.");
    }
  }

  async function removeSlot(id: string) {
    if (!court) return;
    try {
      await deleteSlot.mutateAsync({ id, court_id: court.id });
      toast.success("Horário removido.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível remover horário.");
    }
  }

  return (
    <Dialog open={Boolean(court)} onOpenChange={(open) => !open && onClose()} title={court ? `Horários - ${court.name}` : "Horários"} className="max-w-4xl">
      {court && (
        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <form className="space-y-3 rounded-lg border border-slate-200 p-4" onSubmit={addSlot}>
            <p className="font-extrabold text-slate-950">Adicionar horário</p>
            <Select value={weekday} onChange={(event) => setWeekday(Number(event.target.value))}>
              {weekdays.map((day, index) => (
                <option key={day} value={index}>{day}</option>
              ))}
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <Input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
              <Input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
            </div>
            <Input type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} />
            <Button className="w-full" disabled={createSlot.isPending}>
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </form>

          <div className="space-y-3">
            {slots.isLoading ? (
              <div className="grid place-items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              </div>
            ) : (
              weekdays.map((day, index) => (
                <div key={day} className="rounded-lg border border-slate-200 p-3">
                  <p className="mb-2 text-sm font-extrabold text-slate-800">{day}</p>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {(groupedSlots.get(index) ?? []).map((slot) => (
                      <div key={slot.id} className="flex items-center justify-between gap-2 rounded-md bg-slate-50 p-2">
                        <span className="text-sm font-bold text-slate-700">
                          {shortTime(slot.start_time)}-{shortTime(slot.end_time)} · {currency(slot.price)}
                        </span>
                        <Button variant="ghost" size="icon" onClick={() => removeSlot(slot.id)} aria-label="Remover horário">
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                    {(groupedSlots.get(index) ?? []).length === 0 && (
                      <span className="text-sm text-slate-400">Sem horários</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
}
