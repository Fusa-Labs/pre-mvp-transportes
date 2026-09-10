/**
 * Informes de servicio (mock) — enriquece una Alert del catálogo con
 * todo lo que muestra el informe: motivo extendido, tramos afectados,
 * líneas alternativas (combinaciones) y timeline del incidente.
 *
 * TODO determinístico: nada de Date.now() en la salida — los horarios
 * salen del campo `since` de la alerta con offsets fijos.
 */

import { MOCK_ALERTS, MOCK_LINES, MOCK_LINE_STOPS, MOCK_STOPS } from '@/mock/data';
import type { Alert, Line } from '@/lib/data-service';
import { combinationsByStop } from './schedules';

export const TIPO_LABEL: Record<Alert['type'], string> = {
  delay: 'Retraso en el servicio',
  suspension: 'Servicio suspendido',
  route_change: 'Desvío en el recorrido',
};

/** Motivo extendido por tipo de incidencia. */
const MOTIVO_EXTENDIDO: Record<Alert['type'], string> = {
  delay:
    'El personal de vía está trabajando en la zona y los colectivos circulando demoran su paso. La normalización es progresiva: los primeros servicios ya están recuperando frecuencia.',
  suspension:
    'No hay servicio en el tramo afectado hasta nuevo aviso. Se recomienda planificar el viaje con líneas alternativas y volver a consultar antes de salir.',
  route_change:
    'Los colectivos circulan por el recorrido alternativo y las paradas del tramo desviado no efectúan ascenso ni descenso. Consultá las paradas activas más abajo.',
};

export interface ReportAlternativa {
  lineId: string;
  shortName: string;
  color: string;
  stopName: string;
}

export interface ReportTimelineItem {
  hora: string;
  label: string;
}

export interface ServiceReport {
  alert: Alert;
  line: Line;
  tipoLabel: string;
  motivo: string;
  /** Tramos/paradas afectadas (segmento central del recorrido). */
  afectados: { stopId: string; name: string }[];
  alternativas: ReportAlternativa[];
  timeline: ReportTimelineItem[];
  /** true si la incidencia ya está cerrada (estado "Normalizado"). */
  resolved: boolean;
}

/** Catálogo completo (activas + normalizadas), en el orden del mock. */
export function getAlertsCatalog(): Alert[] {
  return [...MOCK_ALERTS];
}

/** Búsqueda directa por id (para resolver /alerta/[id] sin escanear el catálogo). */
export function getAlertById(id: string): Alert | null {
  return MOCK_ALERTS.find((a) => a.id === id) ?? null;
}

/** Alerta activa para una línea. Las normalizadas se ignoran: el banner
 *  del detalle de línea y la campana del header solo cuentan activas. */
export function getAlertForLine(lineId: string): Alert | null {
  return (
    MOCK_ALERTS.find((a) => a.lineId === lineId && a.status !== 'resolved') ??
    null
  );
}

export function isResolved(a: Alert): boolean {
  return a.status === 'resolved';
}

/** Suma minutos a un horario "HH:MM" (wrap de día no aplica en la demo). */
function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = Math.min(23 * 60 + 59, h * 60 + m + minutes);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function buildServiceReport(alertId: string): ServiceReport | null {
  const alert = MOCK_ALERTS.find((a) => a.id === alertId);
  const line = alert ? MOCK_LINES.find((l) => l.id === alert.lineId) : undefined;
  if (!alert || !line) return null;

  // Tramos afectados: segmento central del recorrido (sin cabeceras)
  const stopIds = MOCK_LINE_STOPS[alert.lineId] ?? [];
  const afectados = stopIds
    .slice(1, Math.max(2, stopIds.length - 1))
    .map((id) => {
      const stop = MOCK_STOPS.find((s) => s.id === id);
      return stop ? { stopId: stop.id, name: stop.name } : null;
    })
    .filter((s): s is { stopId: string; name: string } => s !== null);

  // Alternativas: combinaciones de ESTA línea con otras (por parada compartida)
  const alternativas: ReportAlternativa[] = combinationsByStop()
    .filter((c) => c.stop.lineIds.includes(alert.lineId))
    .flatMap((c) =>
      c.lines
        .filter((l) => l.id !== alert.lineId)
        .map((l) => ({
          lineId: l.id,
          shortName: l.shortName,
          color: l.color,
          stopName: c.stop.name,
        })),
    );

  // Timeline del incidente (determinística a partir de `since`)
  const resolved = alert.status === 'resolved';
  const timeline: ReportTimelineItem[] = [];
  if (alert.since) {
    if (resolved) {
      timeline.push({
        hora: addMinutes(alert.since, -120),
        label: 'Reportado por el personal de vía',
      });
      timeline.push({
        hora: addMinutes(alert.since, -90),
        label: 'Confirmado por Monitoreo',
      });
    } else {
      timeline.push({ hora: alert.since, label: 'Reportado por el personal de vía' });
      timeline.push({ hora: addMinutes(alert.since, 12), label: 'Confirmado por Monitoreo' });
    }
  }
  if (resolved) {
    timeline.push({
      hora: alert.since ?? '—',
      label: 'Servicio normalizado',
    });
  } else {
    timeline.push({
      hora: 'Ahora',
      label:
        alert.type === 'suspension'
          ? 'Sin servicio en el tramo afectado'
          : alert.type === 'route_change'
            ? 'Recorrido alterado en curso'
            : 'Servicio operando con demoras',
    });
  }

  return {
    alert,
    line,
    tipoLabel: resolved ? 'Servicio normalizado' : TIPO_LABEL[alert.type],
    motivo: resolved
      ? `${alert.description} La incidencia quedó cerrada y los servicios de la línea circulan con frecuencias normales en todo el recorrido. Ante cualquier novedad, esta pantalla vuelve a actualizarse.`
      : `${alert.description} ${MOTIVO_EXTENDIDO[alert.type]}`,
    afectados,
    alternativas,
    timeline,
    resolved,
  };
}
