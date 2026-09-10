/**
 * Billboard del colectivo isométrico — rotación relativa a la cámara.
 *
 * El sprite isométrico (`busIsoSvg`) es un billboard: NO rota en el plano
 * del mapa (ahí es donde "se daba vuelta" al cruzar esquinas o al rotar
 * la cámara), sino que queda plano contra la pantalla y gira en ese plano
 * según el rumbo RELATIVO a la cámara: heading − camBearing.
 *
 * El arte del sprite mira hacia la derecha, así que un rumbo relativo 0°
 * (bus alejándose hacia arriba de la pantalla) exige un offset de −90°.
 * La normalización a [−180, 180) evita el salto 359→0 en animaciones.
 */

/** Rotación de pantalla (deg clockwise desde arriba) del billboard isométrico. */
export function isoBillboardRotation(headingDeg: number, camBearingDeg: number): number {
  return normalizeDegrees(headingDeg - camBearingDeg - 90);
}

/**
 * Rotación map-aligned de la sombra: la elipse tiene su eje largo
 * horizontal, por lo que necesita el mismo offset de −90° para quedar
 * alineada al rumbo del vehículo sobre la calle.
 */
export function shadowRotation(headingDeg: number): number {
  return normalizeDegrees(headingDeg - 90);
}

function normalizeDegrees(deg: number): number {
  return ((deg + 180) % 360 + 360) % 360 - 180;
}
