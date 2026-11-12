/**
 * Qibla calculation utilities
 * Kaaba coordinates: 21.422487° N, 39.826206° E (Makkah, Saudi Arabia)
 */

export const KAABA_COORDS = {
  latitude: 21.422487,
  longitude: 39.826206,
};

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Calculates the forward azimuth bearing (0-360 degrees) towards the Kaaba
 */
export function calculateQiblaDirection(latitude: number, longitude: number): number {
  const phi1 = toRadians(latitude);
  const lambda1 = toRadians(longitude);
  const phi2 = toRadians(KAABA_COORDS.latitude);
  const lambda2 = toRadians(KAABA_COORDS.longitude);

  const deltaLambda = lambda2 - lambda1;

  const y = Math.sin(deltaLambda);
  const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(deltaLambda);

  let qibla = toDegrees(Math.atan2(y, x));
  qibla = (qibla + 360) % 360;

  return Math.round(qibla * 10) / 10;
}

/**
 * Calculates the distance to the Kaaba in kilometers using the Haversine formula
 */
export function calculateDistanceToKaaba(latitude: number, longitude: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = toRadians(KAABA_COORDS.latitude - latitude);
  const dLon = toRadians(KAABA_COORDS.longitude - longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(latitude)) *
      Math.cos(toRadians(KAABA_COORDS.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Returns cardinal direction label for any angle (e.g. 268° -> "W" or "WNW")
 */
export function getCardinalDirection(angle: number, lang: 'en' | 'ur' | 'ar' = 'en'): string {
  const normalized = (angle % 360 + 360) % 360;
  const directionsEn = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const directionsUr = ['شمال', 'شمال مشرق', 'مشرق', 'جنوب مشرق', 'جنوب', 'جنوب مغرب', 'مغرب', 'شمال مغرب'];
  const directionsAr = ['شمال', 'شمال شرقي', 'شرق', 'جنوب شرقي', 'جنوب', 'جنوب غربي', 'غرب', 'شمال غربي'];

  const index = Math.round(normalized / 45) % 8;

  if (lang === 'ur') return directionsUr[index];
  if (lang === 'ar') return directionsAr[index];
  return directionsEn[index];
}

/**
 * Computes angular difference between two angles (returns value in -180 to +180)
 */
export function getAngleDifference(target: number, current: number): number {
  let diff = (target - current + 180) % 360 - 180;
  if (diff < -180) diff += 360;
  return diff;
}
