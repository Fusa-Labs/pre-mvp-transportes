/**
 * pois-source — snapshot de POIs OSM (public/data/pois.json) cacheado
 * para el planificador. Misma fuente que MapCanvas; una sola bajada por
 * sesión (el módulo memoiza la promesa). Si la red falla, la búsqueda
 * sigue sin POIs — nunca rompe el planner.
 */

let poisPromise: Promise<Array<{ type: string; name?: string; lat: number; lng: number }>> | null =
  null;

export function loadPlannerPois(): Promise<
  Array<{ type: string; name?: string; lat: number; lng: number }>
> {
  if (!poisPromise) {
    poisPromise = fetch('/data/pois.json')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data: { pois?: Array<{ type: string; name?: string; lat: number; lng: number }> }) =>
        data.pois ?? [],
      )
      .catch((err: unknown) => {
        poisPromise = null;
        console.warn('pois.json no disponible para el planner:', err instanceof Error ? err.message : err);
        return [];
      });
  }
  return poisPromise;
}
