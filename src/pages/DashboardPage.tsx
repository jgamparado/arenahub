import { useMemo, useState } from "react";
import { Loader2, MessageCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Table, Td, Th } from "../components/ui/table";
import { useCourts } from "../hooks/useCourts";
import { useAllReservations, useCancelReservation, useTodayReservations } from "../hooks/useReservations";
import { dateLabel, shortTime, toDateKey, whatsappLink } from "../lib/format";
import type { ReservationStatus } from "../lib/types";

export default function DashboardPage() {
  const [tab, setTab] = useState<"today" | "all">("today");
  const [courtId, setCourtId] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<ReservationStatus | "all">("all");
  const [page, setPage] = useState(1);

  const todayReservations = useTodayReservations();
  const courts = useCourts(false);
  const allReservations = useAllReservations({ courtId, date, status, page });
  const cancelReservation = useCancelReservation();
  const totalPages = useMemo(() => Math.max(1, Math.ceil((allReservations.data?.count ?? 0) / 20)), [allReservations.data?.count]);

  async function cancel(id: string) {
    try {
      await cancelReservation.mutateAsync(id);
      toast.success("Reserva cancelada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível cancelar.");
    }
  }

  return (
    <DashboardLayout title="Reservas">
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <Button variant={tab === "today" ? "default" : "secondary"} onClick={() => setTab("today")}>
            Reservas de hoje
          </Button>
          <Button variant={tab === "all" ? "default" : "secondary"} onClick={() => setTab("all")}>
            Todas as reservas
          </Button>
        </div>

        {tab === "today" && (
          <div className="space-y-4">
            <Card>
              <CardContent className="flex items-center justify-between gap-3 p-5">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-600">Hoje</p>
                  <p className="mt-1 text-3xl font-extrabold text-slate-950">{todayReservations.data?.length ?? 0}</p>
                </div>
                <Badge>{dateLabel(toDateKey(new Date()))}</Badge>
              </CardContent>
            </Card>

            {todayReservations.isLoading ? (
              <div className="grid place-items-center rounded-lg border border-slate-200 bg-white p-10">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {(todayReservations.data ?? []).map((reservation) => (
                  <Card key={reservation.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between gap-2">
                        <span>{reservation.courts?.name}</span>
                        <Badge variant="amber">{reservation.time_slots && shortTime(reservation.time_slots.start_time)}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="font-bold text-slate-950">{reservation.client_name}</p>
                        <a
                          className="mt-1 inline-flex items-center gap-2 text-sm font-bold text-green-700"
                          href={whatsappLink(reservation.client_phone, `Olá, ${reservation.client_name}! Sobre sua reserva na ${reservation.courts?.name}.`)}
                          target="_blank"
                        >
                          <MessageCircle className="h-4 w-4" />
                          {reservation.client_phone}
                        </a>
                      </div>
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => cancel(reservation.id)}
                        disabled={cancelReservation.isPending}
                      >
                        <XCircle className="h-4 w-4" />
                        Cancelar reserva
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {!todayReservations.isLoading && (todayReservations.data ?? []).length === 0 && (
              <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm font-medium text-slate-600">
                Nenhuma reserva confirmada para hoje.
              </p>
            )}
          </div>
        )}

        {tab === "all" && (
          <div className="space-y-4">
            <Card>
              <CardContent className="grid gap-3 p-5 md:grid-cols-4">
                <Select value={courtId} onChange={(event) => { setCourtId(event.target.value); setPage(1); }}>
                  <option value="">Todas as quadras</option>
                  {(courts.data ?? []).map((court) => (
                    <option key={court.id} value={court.id}>{court.name}</option>
                  ))}
                </Select>
                <Input type="date" value={date} onChange={(event) => { setDate(event.target.value); setPage(1); }} />
                <Select value={status} onChange={(event) => { setStatus(event.target.value as ReservationStatus | "all"); setPage(1); }}>
                  <option value="all">Todos os status</option>
                  <option value="confirmed">Confirmadas</option>
                  <option value="cancelled">Canceladas</option>
                </Select>
                <Button variant="secondary" onClick={() => { setCourtId(""); setDate(""); setStatus("all"); setPage(1); }}>
                  Limpar filtros
                </Button>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <thead>
                    <tr>
                      <Th>Data</Th>
                      <Th>Horário</Th>
                      <Th>Quadra</Th>
                      <Th>Cliente</Th>
                      <Th>Telefone</Th>
                      <Th>Status</Th>
                      <Th>Ação</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {(allReservations.data?.data ?? []).map((reservation) => (
                      <tr key={reservation.id}>
                        <Td>{new Intl.DateTimeFormat("pt-BR").format(new Date(`${reservation.date}T12:00:00`))}</Td>
                        <Td>{reservation.time_slots && `${shortTime(reservation.time_slots.start_time)}-${shortTime(reservation.time_slots.end_time)}`}</Td>
                        <Td>{reservation.courts?.name}</Td>
                        <Td className="font-bold text-slate-950">{reservation.client_name}</Td>
                        <Td>
                          <a
                            className="font-bold text-green-700"
                            href={whatsappLink(reservation.client_phone, `Olá, ${reservation.client_name}! Sobre sua reserva na ${reservation.courts?.name}.`)}
                            target="_blank"
                          >
                            {reservation.client_phone}
                          </a>
                        </Td>
                        <Td>
                          <Badge variant={reservation.status === "confirmed" ? "default" : "muted"}>
                            {reservation.status === "confirmed" ? "Confirmada" : "Cancelada"}
                          </Badge>
                        </Td>
                        <Td>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={reservation.status !== "confirmed" || cancelReservation.isPending}
                            onClick={() => cancel(reservation.id)}
                          >
                            Cancelar
                          </Button>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              {allReservations.isLoading && (
                <div className="grid place-items-center p-8">
                  <Loader2 className="h-7 w-7 animate-spin text-green-600" />
                </div>
              )}
              {!allReservations.isLoading && (allReservations.data?.data ?? []).length === 0 && (
                <p className="p-6 text-sm font-medium text-slate-600">Nenhuma reserva encontrada.</p>
              )}
            </Card>
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
                Anterior
              </Button>
              <span className="text-sm font-bold text-slate-700">
                Página {page} de {totalPages}
              </span>
              <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
