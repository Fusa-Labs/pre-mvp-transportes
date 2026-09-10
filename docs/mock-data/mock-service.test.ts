/**
 * Tests — MockDataServiceImpl
 *
 * Valida que el servicio mock cumpla el contrato de DataService
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockDataServiceImpl } from '@/mock/service';
import { setDataService } from '@/lib/data-service';

describe('MockDataServiceImpl', () => {
  let service: MockDataServiceImpl;

  beforeEach(() => {
    service = new MockDataServiceImpl();
    setDataService(service);
  });

  describe('getLines', () => {
    it('debe retornar 5 líneas', async () => {
      const lines = await service.getLines();
      expect(lines).toHaveLength(5);
    });

    it('cada línea debe tener id, name, shortName, color, direction, frequency', async () => {
      const lines = await service.getLines();
      for (const line of lines) {
        expect(line).toHaveProperty('id');
        expect(line).toHaveProperty('name');
        expect(line).toHaveProperty('shortName');
        expect(line).toHaveProperty('color');
        expect(line).toHaveProperty('direction');
        expect(line).toHaveProperty('frequency');
        expect(typeof line.frequency).toBe('number');
      }
    });
  });

  describe('getLine', () => {
    it('debe retornar una línea por id', async () => {
      const line = await service.getLine('line-200');
      expect(line.shortName).toBe('200');
      expect(line.name).toBe('Centro – Sur');
    });

    it('debe lanzar error si la línea no existe', async () => {
      await expect(service.getLine('line-999')).rejects.toThrow(
        'Línea line-999 no encontrada',
      );
    });
  });

  describe('getStops', () => {
    it('debe retornar las paradas', async () => {
      const stops = await service.getStops();
      expect(stops.length).toBeGreaterThan(0);
    });

    it('cada parada debe tener coordenadas', async () => {
      const stops = await service.getStops();
      for (const stop of stops) {
        expect(typeof stop.lat).toBe('number');
        expect(typeof stop.lng).toBe('number');
        expect(stop.lat).toBeLessThan(0); // Buenos Aires está en hemisferio sur
        expect(stop.lng).toBeLessThan(0); // y occidental
      }
    });
  });

  describe('getStopsByLine', () => {
    it('debe retornar solo las paradas de una línea', async () => {
      const stops = await service.getStopsByLine('line-200');
      expect(stops.length).toBeGreaterThan(0);
      for (const stop of stops) {
        expect(stop.lineIds).toContain('line-200');
      }
    });

    it('debe retornar array vacío para línea sin paradas', async () => {
      const stops = await service.getStopsByLine('line-999');
      expect(stops).toHaveLength(0);
    });
  });

  describe('getArrivals', () => {
    it('debe retornar llegadas para una parada', async () => {
      const arrivals = await service.getArrivals('stop-001');
      expect(arrivals.length).toBeGreaterThan(0);
    });

    it('cada llegada debe tener datos válidos', async () => {
      const arrivals = await service.getArrivals('stop-001');
      for (const arrival of arrivals) {
        expect(arrival.lineId).toBeTruthy();
        expect(arrival.lineName).toBeTruthy();
        expect(typeof arrival.etaMin).toBe('number');
        expect(arrival.etaMin).toBeGreaterThanOrEqual(0);
        expect(typeof arrival.live).toBe('boolean');
      }
    });

    it('las llegadas deben estar ordenadas por ETA ascendente', async () => {
      const arrivals = await service.getArrivals('stop-001');
      for (let i = 1; i < arrivals.length; i++) {
        expect(arrivals[i].etaMin).toBeGreaterThanOrEqual(
          arrivals[i - 1].etaMin,
        );
      }
    });
  });

  describe('getAlerts', () => {
    it('debe retornar 5 alertas (4 activas + 1 normalizada)', async () => {
      const alerts = await service.getAlerts();

      expect(alerts).toHaveLength(5);
    });

    it('cada alerta debe tener tipo válido', async () => {
      const alerts = await service.getAlerts();
      const validTypes = ['delay', 'suspension', 'route_change'];
      for (const alert of alerts) {
        expect(validTypes).toContain(alert.type);
      }
    });
  });
});
