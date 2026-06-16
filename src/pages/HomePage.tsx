import { useMemo, useState } from "react";
import { ArrowLeft, CalendarCheck, Loader2, MessageCircle, RotateCcw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AppLogo } from "../components/AppLogo";
import { CalendarPicker } from "../components/CalendarPicker";
import { SportIcon } from "../components/SportIcon";
import { Stepper } from "../components/Stepper";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Skeleton } from "../components/ui/skeleton";
import { useCourts } from "../hooks/useCourts";
import { useCreateReservation, useReservationsForDay } from "../hooks/useReservations";
import { useTimeSlots } from "../hooks/useTimeSlots";
import { currency, dateLabel, formatPhoneInput, shortTime, toBrazilWhatsApp, toDateKey, whatsappLink } from "../lib/format";
import { sportLabels, type Court, type Reservation, type TimeSlot } from "../lib/types";
import { cn } from "../lib/utils";

export default function HomePage() {
  const [step, setStep] = useState(0);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [success, setSuccess] = useState<Reservation | null>(null);

  const courts = useCourts(true);
  const selectedWeekday = useMemo(() => new Date(`${selectedDate}T12:00:00`).getDay(), [selectedDate]);
  const slots = useTimeSlots(selectedCourt?.id, selectedWeekday);
  const reservations = useReservationsForDay(selectedCourt?.id, selectedDate);
  const createReservation = useCreateReservation();

  const occupiedSlots = new Set((reservations.data ?? []).map((reservation) => reservation.slot_id));
  const courtsErrorMessage =
    courts.error instanceof Error ? courts.error.message : "Erro desconhecido ao consultar quadras.";

  function resetFlow() {
    setStep(0);
    setSelectedCourt(null);
    setSelectedSlot(null);
    setClientName("");
    setClientPhone("");
    setSuccess(null);
    setSelectedDate(toDateKey(new Date()));
  }

  async function confirmReservation() {
    if (!selectedCourt || !selectedSlot) return;
    if (new Date(`${selectedDate}T12:00:00`) < new Date(`${toDateKey(new Date())}T12:00:00`)) {
      toast.error("Não é possível reservar em datas passadas.");
      return;
    }
    if (clientName.trim().split(" ").length < 2) {
      toast.error("Informe o nome completo.");
      return;
    }
    const cleanPhone = toBrazilWhatsApp(clientPhone);
    if (cleanPhone.length < 12) {
      toast.error("Informe um WhatsApp válido com DDD.");
      return;
    }

    try {
      const reservation = await createReservation.mutateAsync({
        court_id: selectedCourt.id,
        slot_id: selectedSlot.id,
        date: selectedDate,
        client_name: clientName.trim(),
        client_phone: cleanPhone,
      });
      setSuccess(reservation);
      toast.success("Reserva confirmada!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível confirmar a reserva.";
      toast.error(message.includes("duplicate") ? "Esse horário acabou de ser reservado." : message);
    }
  }

  const successSlot = success?.time_slots ?? selectedSlot;
  const successCourtName = success?.courts?.name ?? selectedCourt?.name ?? "";
  const whatsappMessage =
    success && successSlot
      ? `Olá! Reservei a ${successCourtName} para ${dateLabel(success.date)} às ${shortTime(successSlot.start_time)}. Nome: ${success.client_name}.`
      : "";

  return (
    <main className="min-h-screen sport-surface">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <AppLogo />
        <a href="/login" className="hidden text-sm font-bold text-slate-700 hover:text-green-700 sm:inline">
          Área do gestor
        </a>
      </header>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-12 pt-2 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="space-y-6 lg:sticky lg:top-6">
          <div className="space-y-4">
            <Badge variant="amber">Agendamento online</Badge>
            <h1 className="max-w-xl text-4xl font-extrabold leading-tight text-slate-950 sm:text-5xl">
              Reserve sua quadra em segundos.
            </h1>
            <p className="max-w-lg text-base font-medium leading-7 text-slate-600">
              Escolha a quadra, veja horários livres em tempo real e confirme pelo WhatsApp.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              ["Beach tennis", "Quadras ativas para jogos rápidos."],
              ["Futevôlei", "Horários por dia da semana."],
              ["Vôlei de praia", "Confirmação instantânea."],
            ].map(([title, text]) => (
              <div key={title} className="rounded-lg border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
                <p className="font-bold text-slate-950">{title}</p>
                <p className="mt-1 text-sm text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-white">
            <Stepper current={step} />
          </CardHeader>
          <CardContent className="space-y-5 p-5 sm:p-6">
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <CardTitle>Escolha a quadra</CardTitle>
                  <CardDescription>Somente quadras ativas aparecem para reserva.</CardDescription>
                </div>
                {courts.isLoading ? (
                  <div className="grid gap-3">
                    {[1, 2, 3].map((item) => (
                      <Skeleton key={item} className="h-24" />
                    ))}
                  </div>
                ) : courts.isError ? (
                  <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
                    <p>Não foi possível carregar as quadras.</p>
                    <p className="font-medium">{courtsErrorMessage}</p>
                  </div>
                ) : (courts.data ?? []).length === 0 ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
                    Ainda não há quadras cadastradas no Supabase. Popule o banco com o seed para liberar os horários.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {(courts.data ?? []).map((court) => (
                      <button
                        key={court.id}
                        type="button"
                        onClick={() => {
                          setSelectedCourt(court);
                          setStep(1);
                        }}
                        className="group flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:border-green-500 hover:shadow-md"
                      >
                        <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-green-100 text-green-700 group-hover:bg-green-600 group-hover:text-white">
                          <SportIcon sport={court.sport_type} className="h-7 w-7" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-base font-extrabold text-slate-950">{court.name}</span>
                          <span className="mt-1 block text-sm font-medium text-slate-500">{sportLabels[court.sport_type]}</span>
                        </span>
                        <Badge variant="amber">Livre</Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 1 && selectedCourt && (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>Escolha data e horário</CardTitle>
                    <CardDescription>{selectedCourt.name} - {sportLabels[selectedCourt.sport_type]}</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setStep(0)}>
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </Button>
                </div>

                <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
                  <CalendarPicker
                    value={selectedDate}
                    onChange={(date) => {
                      setSelectedDate(date);
                      setSelectedSlot(null);
                    }}
                  />

                  <div className="space-y-3">
                    <p className="text-sm font-bold capitalize text-slate-800">{dateLabel(selectedDate)}</p>
                    {slots.isLoading || reservations.isLoading ? (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {Array.from({ length: 9 }, (_, index) => (
                          <Skeleton key={index} className="h-16" />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {(slots.data ?? []).map((slot) => {
                          const occupied = occupiedSlots.has(slot.id);
                          const selected = selectedSlot?.id === slot.id;
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              disabled={occupied}
                              onClick={() => {
                                setSelectedSlot(slot);
                                setStep(2);
                              }}
                              className={cn(
                                "min-h-16 rounded-md border p-3 text-left transition",
                                occupied && "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400",
                                selected && "border-green-600 bg-green-50 text-green-900",
                                !occupied && !selected && "border-slate-200 bg-white hover:border-green-500 hover:bg-green-50",
                              )}
                            >
                              <span className="block text-sm font-extrabold">
                                {shortTime(slot.start_time)}-{shortTime(slot.end_time)}
                              </span>
                              <span className="mt-1 block text-xs font-bold">{occupied ? "Ocupado" : currency(slot.price)}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {!slots.isLoading && (slots.data ?? []).length === 0 && (
                      <p className="rounded-md bg-amber-50 p-3 text-sm font-medium text-amber-900">
                        Não há horários cadastrados para este dia.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && selectedCourt && selectedSlot && (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>Dados do cliente</CardTitle>
                    <CardDescription>
                      {selectedCourt.name}, {dateLabel(selectedDate)}, {shortTime(selectedSlot.start_time)}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </Button>
                </div>
                <div className="grid gap-4">
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-slate-800">Nome completo</span>
                    <Input value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="Ex: Ana Souza" />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-bold text-slate-800">WhatsApp</span>
                    <Input
                      value={clientPhone}
                      onChange={(event) => setClientPhone(formatPhoneInput(event.target.value))}
                      inputMode="tel"
                      placeholder="(35) 99999-9999"
                    />
                  </label>
                </div>
                <Button className="w-full" size="lg" onClick={confirmReservation} disabled={createReservation.isPending}>
                  {createReservation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                  Confirmar reserva
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Dialog open={Boolean(success)} onOpenChange={(open) => !open && setSuccess(null)} title="Reserva confirmada">
        {success && successSlot && (
          <div className="space-y-5">
            <div className="rounded-lg bg-green-50 p-4 text-green-900">
              <CalendarCheck className="mb-3 h-8 w-8" />
              <p className="text-lg font-extrabold">{successCourtName}</p>
              <p className="mt-1 text-sm font-semibold capitalize">
                {dateLabel(success.date)} às {shortTime(successSlot.start_time)}
              </p>
              <p className="mt-2 text-sm">Nome: {success.client_name}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button onClick={() => window.open(whatsappLink(success.client_phone, whatsappMessage), "_blank")}>
                <MessageCircle className="h-5 w-5" />
                Abrir WhatsApp
              </Button>
              <Button variant="secondary" onClick={resetFlow}>
                <RotateCcw className="h-5 w-5" />
                Fazer nova reserva
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </main>
  );
}
