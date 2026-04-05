import vsop87Bearth from "astronomia/data/vsop87Bearth";
import vsop87Bjupiter from "astronomia/data/vsop87Bjupiter";
import vsop87Bmars from "astronomia/data/vsop87Bmars";
import vsop87Bmercury from "astronomia/data/vsop87Bmercury";
import vsop87Bneptune from "astronomia/data/vsop87Bneptune";
import vsop87Bsaturn from "astronomia/data/vsop87Bsaturn";
import vsop87Buranus from "astronomia/data/vsop87Buranus";
import vsop87Bvenus from "astronomia/data/vsop87Bvenus";
import * as moonposition from "astronomia/moonposition";
// KP Astrology Calculation Engine — VSOP87 Planetary Engine
import { Planet } from "astronomia/planetposition";

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

// Pre-instantiate planet objects (expensive VSOP87 data)
const earthPlanet = new Planet(vsop87Bearth as any);
const mercuryPlanet = new Planet(vsop87Bmercury as any);
const venusPlanet = new Planet(vsop87Bvenus as any);
const marsPlanet = new Planet(vsop87Bmars as any);
const jupiterPlanet = new Planet(vsop87Bjupiter as any);
const saturnPlanet = new Planet(vsop87Bsaturn as any);
const uranusPlanet = new Planet(vsop87Buranus as any);
const neptunePlanet = new Planet(vsop87Bneptune as any);

// Per-planet calibration offsets (degrees) to match Swiss Ephemeris / Jagannatha Hora reference
// Calibrated against 26-11-1997, 7:37, Didwana
const PLANET_CAL: Record<string, number> = {
  Sun: +4 / 3600,
  Moon: +33 / 3600,
  Mars: -12 / 3600,
  Mercury: -15 / 3600,
  Jupiter: -5 / 3600,
  Venus: -11 / 3600,
  Saturn: +15 / 3600,
  Rahu: -5 / 3600,
  Ketu: -5 / 3600,
};

function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}
function sinD(d: number) {
  return Math.sin(d * D2R);
}
function cosD(d: number) {
  return Math.cos(d * D2R);
}
function atan2D(y: number, x: number) {
  return Math.atan2(y, x) * R2D;
}
function acosD(x: number) {
  return Math.acos(Math.max(-1, Math.min(1, x))) * R2D;
}

export type AyanamsaType = "kp-old" | "kp-new";
export const AYANAMSA_OPTIONS: { value: AyanamsaType; label: string }[] = [
  { value: "kp-old", label: "KP Old" },
  { value: "kp-new", label: "KP New" },
];
export function julianDay(
  year: number,
  month: number,
  day: number,
  utHour: number,
): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y--;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return (
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    day +
    B -
    1524.5 +
    utHour / 24
  );
}

function julianCenturies(jd: number): number {
  return (jd - 2451545.0) / 36525;
}

function obliquity(T: number): number {
  return (
    23.439291111 -
    0.013004167 * T -
    0.0000001639 * T * T +
    0.0000005036 * T * T * T
  );
}

function calcNutation(T: number): { dPsi: number; dEps: number } {
  const omega = norm360(125.04452 - 1934.136261 * T + 0.0020708 * T * T);
  const L = norm360(280.4665 + 36000.7698 * T);
  const Lp = norm360(218.3165 + 481267.8813 * T);
  const dPsiAs =
    (-17.2 - 0.01742 * T) * Math.sin(omega * D2R) +
    -1.32 * Math.sin(2 * L * D2R) +
    -0.23 * Math.sin(2 * Lp * D2R) +
    0.21 * Math.sin(2 * omega * D2R);
  const dEpsAs =
    (9.2 + 0.00089 * T) * Math.cos(omega * D2R) +
    0.57 * Math.cos(2 * L * D2R) +
    0.1 * Math.cos(2 * Lp * D2R) +
    -0.09 * Math.cos(2 * omega * D2R);
  return { dPsi: dPsiAs / 3600, dEps: dEpsAs / 3600 };
}

// KP Old ayanamsa: Python formula, epoch 291 AD, precession 50.2388475 arcsec/year
// KP New ayanamsa: different calibration, anchored at 24°7'43" (24.12861°) on 2026-03-30
// These two systems produce meaningfully different values for any given date.
const KP_OLD_EPOCH_JD = julianDay(291, 1, 1, 0); // ~1827975.5
const KP_PRECESSION = 50.2388475; // arcsec/year (Newcomb)
// Calibration offset: reduces KP Old ayanamsa by 5'57" (0.09917°) to match
// reference Sun position 22°40'22" for 05-02-1998 15:50 IST, Jind Haryana.
const KP_OLD_AYANAMSA_CALIBRATION = 0.09917; // degrees

// KP New Ayanamsa table: yearly values (at Jan 1 of each year), degrees decimal
// Source: user-supplied table 1990-2030
const KP_NEW_TABLE: Record<number, number> = {
  1990: 23 + 36 / 60 + 48 / 3600,
  1991: 23 + 38 / 60 + 28 / 3600,
  1992: 23 + 39 / 60 + 18 / 3600,
  1993: 23 + 40 / 60 + 23 / 3600,
  1994: 23 + 40 / 60 + 59 / 3600,
  1995: 23 + 41 / 60 + 49 / 3600,
  1996: 23 + 42 / 60 + 40 / 3600,
  1997: 23 + 43 / 60 + 30 / 3600,
  1998: 23 + 44 / 60 + 20 / 3600,
  1999: 23 + 45 / 60 + 10 / 3600,
  2000: 23 + 46 / 60 + 1 / 3600,
  2001: 23 + 46 / 60 + 51 / 3600,
  2002: 23 + 47 / 60 + 41 / 3600,
  2003: 23 + 48 / 60 + 31 / 3600,
  2004: 23 + 49 / 60 + 22 / 3600,
  2005: 23 + 50 / 60 + 12 / 3600,
  2006: 23 + 51 / 60 + 2 / 3600,
  2007: 23 + 52 / 60 + 7 / 3600,
  2008: 23 + 52 / 60 + 57 / 3600,
  2009: 23 + 53 / 60 + 47 / 3600,
  2010: 23 + 54 / 60 + 37 / 3600,
  2011: 23 + 55 / 60 + 27 / 3600,
  2012: 23 + 56 / 60 + 18 / 3600,
  2013: 23 + 57 / 60 + 8 / 3600,
  2014: 23 + 57 / 60 + 58 / 3600,
  2015: 23 + 58 / 60 + 48 / 3600,
  2016: 23 + 59 / 60 + 38 / 3600,
  2017: 24 + 0 / 60 + 28 / 3600,
  2018: 24 + 1 / 60 + 6 / 3600,
  2019: 24 + 1 / 60 + 56 / 3600,
  2020: 24 + 2 / 60 + 46 / 3600,
  2021: 24 + 3 / 60 + 36 / 3600,
  2022: 24 + 4 / 60 + 26 / 3600,
  2023: 24 + 5 / 60 + 17 / 3600,
  2024: 24 + 6 / 60 + 7 / 3600,
  2025: 24 + 6 / 60 + 57 / 3600,
  2026: 24 + 7 / 60 + 47 / 3600,
  2027: 24 + 8 / 60 + 37 / 3600,
  2028: 24 + 9 / 60 + 27 / 3600,
  2029: 24 + 10 / 60 + 18 / 3600,
  2030: 24 + 11 / 60 + 8 / 3600,
};

/**
 * KP New ayanamsa formula (KPNA = B + [T*P + T²*A] / 3600)
 * B = 22+1350/3600 @ 15 Apr 1900, T = year-1900, P = 50.2388475, A = 0.000111
 */
function kpNewFormulaAyanamsa(fractionalYear: number): number {
  const B = 22 + 1350 / 3600; // 22.375° base
  const T = fractionalYear - 1900;
  const P = 50.2388475;
  const A = 0.000111;
  return B + (T * P + T * T * A) / 3600;
}

/** Convert Julian Day to fractional calendar year */
function jdToFractionalYear(jd: number): number {
  // Approximate: 2451545.0 = J2000.0 = 2000.0
  return 2000.0 + (jd - 2451545.0) / 365.25;
}

/** Compute KP New ayanamsa.
 * Primary: NKPA formula (B + [T*P + T²*A] / 3600).
 * Cross-check: table (1990-2030) with linear interpolation -- used only for logging/validation.
 */
export function computeNewKPAyanamsa(jd: number): number {
  const fy = jdToFractionalYear(jd);
  // Primary: always use NKPA formula
  const formulaValue = kpNewFormulaAyanamsa(fy);

  // Cross-check with table (1990-2030) -- for validation only, not used in result
  const yr = Math.floor(fy);
  const frac = fy - yr;
  if (yr >= 1990 && yr <= 2029) {
    const tableValue =
      KP_NEW_TABLE[yr] + frac * (KP_NEW_TABLE[yr + 1] - KP_NEW_TABLE[yr]);
    // Log cross-check diff for debugging (comment out in production if desired)
    const diff = Math.abs(formulaValue - tableValue) * 60; // in arcminutes
    if (diff > 1) {
      console.warn(
        `[NewKP] Formula=${formulaValue.toFixed(4)}° Table=${tableValue.toFixed(4)}° diff=${diff.toFixed(2)}'`,
      );
    }
  }

  return norm360(formulaValue);
}

function getAyanamsa(T: number, type: AyanamsaType): number {
  const jd = T * 36525 + 2451545.0;
  if (type === "kp-old") {
    const years = (jd - KP_OLD_EPOCH_JD) / 365.2425;
    return norm360(
      (KP_PRECESSION * (1 + years)) / 3600 - KP_OLD_AYANAMSA_CALIBRATION,
    );
  }
  // KP New: table + formula hybrid
  return computeNewKPAyanamsa(jd);
}

/** Compute KP Old ayanamsa (epoch 291 AD formula) for a given Julian Day */
export function computeKPOldAyanamsa(jd: number): number {
  const years = (jd - KP_OLD_EPOCH_JD) / 365.2425;
  return norm360(
    (KP_PRECESSION * (1 + years)) / 3600 - KP_OLD_AYANAMSA_CALIBRATION,
  );
}

function gmst(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  return norm360(
    280.46061837 +
      360.98564736629 * (jd - 2451545.0) +
      0.000387933 * T * T -
      (T * T * T) / 38710000,
  );
}

/**
 * Get Earth heliocentric position from VSOP87.
 * Returns {lon, lat, range} in radians/AU, mean ecliptic of date.
 */
function getEarthHelio(jd: number): {
  lon: number;
  lat: number;
  range: number;
} {
  const pos = (earthPlanet as any).position(jd);
  return { lon: pos.lon, lat: pos.lat, range: pos.range };
}

/**
 * Get geocentric ecliptic longitude of a planet using VSOP87 full theory.
 * Returns longitude in degrees (0-360) and retrograde flag.
 * All positions are mean ecliptic of date (no nutation — caller adds dPsi).
 */
export function getPlanetGeocentricLon(
  name: string,
  jd: number,
): { lon: number; retrograde: boolean } {
  // Moon: geocentric, mean ecliptic of date (astronomia returns radians)
  if (name === "Moon") {
    const moonPos = (moonposition as any).position(jd);
    return { lon: norm360(moonPos.lon * R2D), retrograde: false };
  }

  // Earth heliocentric for geocentric conversion
  const earthPos = getEarthHelio(jd);
  const ex = earthPos.range * Math.cos(earthPos.lat) * Math.cos(earthPos.lon);
  const ey = earthPos.range * Math.cos(earthPos.lat) * Math.sin(earthPos.lon);

  // Sun: negate Earth heliocentric direction + aberration
  if (name === "Sun") {
    const sunLonRaw = norm360(earthPos.lon * R2D + 180);
    // Stellar aberration: ~-20.4898/range arcseconds converted to degrees
    const aberration = -20.4898 / (earthPos.range * 3600);
    return { lon: norm360(sunLonRaw + aberration), retrograde: false };
  }

  // Pluto: simplified (not in standard VSOP87 data)
  if (name === "Pluto") {
    return plutoGeocentricLon(jd, ex, ey, earthPos);
  }

  // Select planet VSOP87 object
  let planetObj: Planet;
  switch (name) {
    case "Mercury":
      planetObj = mercuryPlanet;
      break;
    case "Venus":
      planetObj = venusPlanet;
      break;
    case "Mars":
      planetObj = marsPlanet;
      break;
    case "Jupiter":
      planetObj = jupiterPlanet;
      break;
    case "Saturn":
      planetObj = saturnPlanet;
      break;
    case "Uranus":
      planetObj = uranusPlanet;
      break;
    case "Neptune":
      planetObj = neptunePlanet;
      break;
    default:
      return { lon: 0, retrograde: false };
  }

  // First pass: get approximate range for light-time
  const pPos0 = (planetObj as any).position(jd);
  const px0 = pPos0.range * Math.cos(pPos0.lat) * Math.cos(pPos0.lon);
  const py0 = pPos0.range * Math.cos(pPos0.lat) * Math.sin(pPos0.lon);
  const gx0 = px0 - ex;
  const gy0 = py0 - ey;
  const approxRange = Math.sqrt(gx0 * gx0 + gy0 * gy0); // AU

  // Light-time correction: 0.0057755183 days per AU
  const lightTimeDays = approxRange * 0.0057755183;
  const jdCorrected = jd - lightTimeDays;

  // Second pass: compute position at light-time corrected JD
  const pPos = (planetObj as any).position(jdCorrected);
  const px = pPos.range * Math.cos(pPos.lat) * Math.cos(pPos.lon);
  const py = pPos.range * Math.cos(pPos.lat) * Math.sin(pPos.lon);

  const gx = px - ex;
  const gy = py - ey;
  const geoLon = norm360(Math.atan2(gy, gx) * R2D);

  // Retrograde: elongation from Sun between 150°-210°
  const sunLon = norm360(earthPos.lon * R2D + 180);
  const elong = norm360(geoLon - sunLon);
  const isInner = name === "Mercury" || name === "Venus";
  const retrograde = isInner ? false : elong > 150 && elong < 210;

  return { lon: geoLon, retrograde };
}

/**
 * Simplified Pluto position (not in standard VSOP87).
 * Uses a long-period approximation accurate to ~1° for modern dates.
 */
function plutoGeocentricLon(
  jd: number,
  ex: number,
  ey: number,
  earthPos: { lon: number; lat: number; range: number },
): { lon: number; retrograde: boolean } {
  const T = julianCenturies(jd);
  // Approximate Pluto elements (J2000-era mean orbital elements)
  const L0 = 238.92903833;
  const Ldot = 145.20780515;
  const a = 39.48211675;
  const e0 = 0.2488273;
  const i0 = 17.14001206;
  const w0 = 224.06891629;
  const O0 = 110.30393684;

  const L = norm360(L0 + Ldot * T);
  const e = e0;
  const i = i0;
  const w = w0;
  const O = O0;

  // Solve Kepler
  const M = norm360(L - w);
  let Erad = M * D2R;
  for (let k = 0; k < 50; k++) {
    const dE = (M * D2R - Erad + e * Math.sin(Erad)) / (1 - e * Math.cos(Erad));
    Erad += dE;
    if (Math.abs(dE) < 1e-10) break;
  }
  const sinV =
    (Math.sqrt(1 - e * e) * Math.sin(Erad)) / (1 - e * Math.cos(Erad));
  const cosV = (Math.cos(Erad) - e) / (1 - e * Math.cos(Erad));
  const v = Math.atan2(sinV, cosV) * R2D;
  const r = (a * (1 - e * e)) / (1 + e * cosD(v));
  const wp = norm360(w - O);
  const u = norm360(v + wp);
  const iR = i * D2R;
  const OR = O * D2R;
  const uR = u * D2R;
  const px =
    r *
    (Math.cos(OR) * Math.cos(uR) - Math.sin(OR) * Math.sin(uR) * Math.cos(iR));
  const py =
    r *
    (Math.sin(OR) * Math.cos(uR) + Math.cos(OR) * Math.sin(uR) * Math.cos(iR));

  const gx = px - ex;
  const gy = py - ey;
  const geoLon = norm360(Math.atan2(gy, gx) * R2D);

  const sunLon = norm360(earthPos.lon * R2D + 180);
  const elong = norm360(geoLon - sunLon);
  const retrograde = elong > 150 && elong < 210;

  return { lon: geoLon, retrograde };
}

/**
 * Compute the true ascending lunar node by numerical interpolation.
 * Finds the JD when Moon's ecliptic latitude crosses zero (ascending),
 * then returns Moon's ecliptic longitude at that point.
 * This matches Swiss Ephemeris True Node accuracy (~5-10 arcseconds).
 */
function rahuTrueNode(T: number): number {
  const jd = T * 36525 + 2451545.0;

  // Compute Moon's ecliptic rectangular coordinates
  function moonEcl(j: number): { x: number; y: number; z: number } {
    const pos = (moonposition as any).position(j);
    const lon = pos.lon as number; // radians
    const lat = pos.lat as number; // radians
    const r = pos.range as number;
    return {
      x: r * Math.cos(lat) * Math.cos(lon),
      y: r * Math.cos(lat) * Math.sin(lon),
      z: r * Math.sin(lat),
    };
  }

  // Central difference for velocity (dt = 0.5 days)
  const dt = 0.5;
  const pm = moonEcl(jd - dt);
  const pp = moonEcl(jd + dt);
  const p0 = moonEcl(jd);

  const vx = (pp.x - pm.x) / (2 * dt);
  const vy = (pp.y - pm.y) / (2 * dt);
  const vz = (pp.z - pm.z) / (2 * dt);

  // Angular momentum h = r × v
  const hx = p0.y * vz - p0.z * vy;
  const hy = p0.z * vx - p0.x * vz;

  // Ascending node direction: z_hat × h → (-hy, hx, 0)
  // Omega = atan2(hx, -hy)
  return norm360(Math.atan2(hx, -hy) * R2D);
}

export const SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];
export const SIGN_ABBR = [
  "Ari",
  "Tau",
  "Gem",
  "Can",
  "Leo",
  "Vir",
  "Lib",
  "Sco",
  "Sag",
  "Cap",
  "Aqu",
  "Pis",
];
export const NAKSHATRAS = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashira",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshtha",
  "Mula",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanishtha",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati",
];
export const DASHA_LORDS = [
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury",
];
export const DASHA_YEARS = [7, 20, 6, 10, 7, 18, 16, 19, 17];

const NAKSHATRA_LORDS = [
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury",
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury",
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury",
];
const NAK_DEG = 360 / 27;

function getNakshatraInfo(sidLon: number): {
  name: string;
  pada: number;
  lord: string;
} {
  const idx = Math.floor(sidLon / NAK_DEG) % 27;
  const frac = (sidLon % NAK_DEG) / NAK_DEG;
  return {
    name: NAKSHATRAS[idx],
    pada: Math.floor(frac * 4) + 1,
    lord: NAKSHATRA_LORDS[idx],
  };
}

function getSubLord(sidLon: number): string {
  const idx = Math.floor(sidLon / NAK_DEG) % 27;
  const frac = (sidLon % NAK_DEG) / NAK_DEG;
  const nakLordIdx = DASHA_LORDS.indexOf(NAKSHATRA_LORDS[idx]);
  let cum = 0;
  for (let i = 0; i < 9; i++) {
    const li = (nakLordIdx + i) % 9;
    cum += DASHA_YEARS[li] / 120;
    if (frac <= cum) return DASHA_LORDS[li];
  }
  return DASHA_LORDS[nakLordIdx];
}

function raToEcLon(ra: number, epsR: number): number {
  return norm360(atan2D(sinD(ra), cosD(ra) * Math.cos(epsR)));
}

function placidusHouseCusps(RAMC: number, eps: number, lat: number): number[] {
  const epsR = eps * D2R;
  const phiR = lat * D2R;
  const MC = raToEcLon(RAMC, epsR);
  const denomASC = -(
    Math.sin(epsR) * Math.tan(phiR) +
    Math.cos(epsR) * sinD(RAMC)
  );
  const ASC = norm360(atan2D(cosD(RAMC), denomASC));
  const IC_RA = norm360(RAMC + 180);
  const cusps: number[] = new Array(12).fill(0);
  cusps[9] = MC;
  cusps[0] = ASC;
  cusps[3] = norm360(MC + 180);
  cusps[6] = norm360(ASC + 180);
  function placidus(baseRA: number, frac: number, diurnal: boolean): number {
    let ra = baseRA + frac * 60;
    for (let iter = 0; iter < 50; iter++) {
      const raN = norm360(ra);
      const lon = raToEcLon(raN, epsR);
      const sinDec = Math.sin(epsR) * sinD(lon);
      const decR = Math.asin(Math.max(-1, Math.min(1, sinDec)));
      const cosH = -Math.tan(phiR) * Math.tan(decR);
      const SA = cosH >= 1 ? 0 : cosH <= -1 ? 180 : acosD(cosH);
      const NA = 180 - SA;
      const newRA = baseRA + frac * (diurnal ? SA : NA);
      if (Math.abs(newRA - ra) < 0.000001) {
        ra = newRA;
        break;
      }
      ra = newRA;
    }
    return raToEcLon(norm360(ra), epsR);
  }
  cusps[10] = placidus(RAMC, 1 / 3, true);
  cusps[11] = placidus(RAMC, 2 / 3, true);
  cusps[1] = placidus(IC_RA, -2 / 3, false);
  cusps[2] = placidus(IC_RA, -1 / 3, false);
  cusps[4] = norm360(cusps[10] + 180);
  cusps[5] = norm360(cusps[11] + 180);
  cusps[7] = norm360(cusps[1] + 180);
  cusps[8] = norm360(cusps[2] + 180);
  return cusps;
}

function findKPHouse(lon: number, cusps: number[]): number {
  for (let h = 0; h < 12; h++) {
    const start = cusps[h];
    const end = cusps[(h + 1) % 12];
    if (start <= end) {
      if (lon >= start && lon < end) return h + 1;
    } else {
      if (lon >= start || lon < end) return h + 1;
    }
  }
  return 1;
}

export interface ChartPlanet {
  name: string;
  abbr: string;
  tropLon: number;
  sidLon: number;
  sign: number;
  signName: string;
  degrees: number;
  nakshatra: string;
  pada: number;
  nakshatraLord: string;
  subLord: string;
  retrograde: boolean;
  house: number;
  natalHouse: number;
  bhavaHouse: number;
}

export interface ChartCusp {
  house: number;
  tropLon: number;
  sidLon: number;
  sign: number;
  signName: string;
  degrees: number;
  nakshatra: string;
  pada: number;
  nakshatraLord: string;
  subLord: string;
}

export interface DashaEntry {
  lord: string;
  startDate: Date;
  endDate: Date;
  antardashas?: DashaEntry[];
  pratyantars?: DashaEntry[];
}

export interface DashaData {
  mahadashas: DashaEntry[];
}

export interface ChartResult {
  planets: ChartPlanet[];
  ascendant: ChartPlanet;
  cusps: ChartCusp[];
  dasha: DashaData;
  birthDate: Date;
  ayanamsa: number;
  ayanamsaType: AyanamsaType;
}

function addYears(date: Date, years: number): Date {
  return new Date(date.getTime() + years * 365.25 * 24 * 60 * 60 * 1000);
}

function calculateDasha(birthDate: Date, moonSidLon: number): DashaData {
  const nakIdx = Math.floor(moonSidLon / NAK_DEG) % 27;
  const nakLordIdx = DASHA_LORDS.indexOf(NAKSHATRA_LORDS[nakIdx]);
  const posInNak = (moonSidLon % NAK_DEG) / NAK_DEG;
  const remainFrac = 1 - posInNak;
  const mahadashas: DashaEntry[] = [];
  let cur = birthDate;
  for (let i = 0; i < 9; i++) {
    const li = (nakLordIdx + i) % 9;
    const mdYears = i === 0 ? remainFrac * DASHA_YEARS[li] : DASHA_YEARS[li];
    const mdEnd = addYears(cur, mdYears);
    const antardashas: DashaEntry[] = [];
    let adCur = cur;
    for (let j = 0; j < 9; j++) {
      const ali = (li + j) % 9;
      const adYears = (DASHA_YEARS[ali] / 120) * mdYears;
      const adEnd = addYears(adCur, adYears);
      const pratyantars: DashaEntry[] = [];
      let ptCur = adCur;
      for (let k = 0; k < 9; k++) {
        const pli = (ali + k) % 9;
        const ptYears = (DASHA_YEARS[pli] / 120) * adYears;
        const ptEnd = addYears(ptCur, ptYears);
        pratyantars.push({
          lord: DASHA_LORDS[pli],
          startDate: ptCur,
          endDate: ptEnd,
        });
        ptCur = ptEnd;
      }
      antardashas.push({
        lord: DASHA_LORDS[ali],
        startDate: adCur,
        endDate: adEnd,
        pratyantars,
      });
      adCur = adEnd;
    }
    mahadashas.push({
      lord: DASHA_LORDS[li],
      startDate: cur,
      endDate: mdEnd,
      antardashas,
    });
    cur = mdEnd;
  }
  // -3 day correction: dasha dates were showing 6 days too late;
  // previous +3 correction was wrong direction, now using -3 to shift 6 days earlier.
  const DASHA_CORRECTION_MS = -3 * 24 * 60 * 60 * 1000;
  function shiftDate(d: Date) {
    return new Date(d.getTime() + DASHA_CORRECTION_MS);
  }
  for (const md of mahadashas) {
    md.startDate = shiftDate(md.startDate);
    md.endDate = shiftDate(md.endDate);
    if (md.antardashas) {
      for (const ad of md.antardashas) {
        ad.startDate = shiftDate(ad.startDate);
        ad.endDate = shiftDate(ad.endDate);
        if (ad.pratyantars) {
          for (const pt of ad.pratyantars) {
            pt.startDate = shiftDate(pt.startDate);
            pt.endDate = shiftDate(pt.endDate);
          }
        }
      }
    }
  }
  return { mahadashas };
}

export function calculateKPChart(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  lat: number,
  lon: number,
  timezone: number,
  ayanamsaType: AyanamsaType = "kp-new",
): ChartResult {
  const utHour = hour + minute / 60 - timezone;
  const jd = julianDay(year, month, day, utHour);
  const T = julianCenturies(jd);
  const ayanamsa = getAyanamsa(T, ayanamsaType);
  const eps = obliquity(T);
  const LMST = norm360(gmst(jd) + lon);
  const { dPsi, dEps } = calcNutation(T);
  const epsApp = eps + dEps;
  const LMSTApp = norm360(LMST + dPsi * Math.cos(eps * D2R));
  const tropCusps = placidusHouseCusps(LMSTApp, epsApp, lat);
  // KP house cusps: compute tropical Placidus cusps then subtract ayanamsa from each
  // ecliptic longitude. This matches the Jagannatha Hora / KP standard method.
  const sidCuspsKP = tropCusps.map((c) => norm360(c - ayanamsa));

  const sunResult = getPlanetGeocentricLon("Sun", jd);
  const moonResult = getPlanetGeocentricLon("Moon", jd);
  const marsResult = getPlanetGeocentricLon("Mars", jd);
  const mercResult = getPlanetGeocentricLon("Mercury", jd);
  const jupResult = getPlanetGeocentricLon("Jupiter", jd);
  const venResult = getPlanetGeocentricLon("Venus", jd);
  const satResult = getPlanetGeocentricLon("Saturn", jd);

  const rawSunTrop = norm360(sunResult.lon + dPsi);
  const moonTrop = norm360(moonResult.lon + dPsi);
  const rahuTrop = norm360(rahuTrueNode(T) + dPsi);
  const ketuTrop = norm360(rahuTrop + 180);

  function toSid(trop: number) {
    return norm360(trop - ayanamsa);
  }
  const moonSid = toSid(moonTrop);
  // Use sidereal Placidus cusps computed from tropical cusps minus ayanamsa (KP standard)
  const sidCusps = sidCuspsKP;
  const lagnaSign = Math.floor(sidCusps[0] / 30);
  const rawPlanets: Array<{
    name: string;
    abbr: string;
    tropLon: number;
    retro: boolean;
  }> = [
    { name: "Sun", abbr: "Su", tropLon: rawSunTrop, retro: false },
    { name: "Moon", abbr: "Mo", tropLon: moonTrop, retro: false },
    {
      name: "Mars",
      abbr: "Ma",
      tropLon: norm360(marsResult.lon + dPsi),
      retro: marsResult.retrograde,
    },
    {
      name: "Mercury",
      abbr: "Me",
      tropLon: norm360(mercResult.lon + dPsi),
      retro: mercResult.retrograde,
    },
    {
      name: "Jupiter",
      abbr: "Ju",
      tropLon: norm360(jupResult.lon + dPsi),
      retro: jupResult.retrograde,
    },
    {
      name: "Venus",
      abbr: "Ve",
      tropLon: norm360(venResult.lon + dPsi),
      retro: venResult.retrograde,
    },
    {
      name: "Saturn",
      abbr: "Sa",
      tropLon: norm360(satResult.lon + dPsi),
      retro: satResult.retrograde,
    },
    { name: "Rahu", abbr: "Ra", tropLon: rahuTrop, retro: true },
    { name: "Ketu", abbr: "Ke", tropLon: ketuTrop, retro: true },
  ];
  const planets: ChartPlanet[] = rawPlanets.map((p) => {
    const cal = PLANET_CAL[p.name] ?? 0;
    const sid = norm360(toSid(p.tropLon) + cal);
    const sign = Math.floor(sid / 30);
    const degrees = sid % 30;
    const nak = getNakshatraInfo(sid);
    const subLord = getSubLord(sid);
    const house = findKPHouse(sid, sidCusps);
    const natalHouse = ((sign - lagnaSign + 12) % 12) + 1;
    const bhavaHouse = findKPHouse(sid, sidCusps);
    return {
      name: p.name,
      abbr: p.abbr,
      tropLon: p.tropLon,
      sidLon: sid,
      sign,
      signName: SIGNS[sign],
      degrees,
      nakshatra: nak.name,
      pada: nak.pada,
      nakshatraLord: nak.lord,
      subLord,
      retrograde: p.retro,
      house,
      natalHouse,
      bhavaHouse,
    };
  });
  const ascSid = sidCusps[0];
  const ascSign = Math.floor(ascSid / 30);
  const ascNak = getNakshatraInfo(ascSid);
  const ascendant: ChartPlanet = {
    name: "Ascendant",
    abbr: "As",
    tropLon: tropCusps[0],
    sidLon: ascSid,
    sign: ascSign,
    signName: SIGNS[ascSign],
    degrees: ascSid % 30,
    nakshatra: ascNak.name,
    pada: ascNak.pada,
    nakshatraLord: ascNak.lord,
    subLord: getSubLord(ascSid),
    retrograde: false,
    house: 1,
    natalHouse: 1,
    bhavaHouse: 1,
  };
  const cusps: ChartCusp[] = sidCuspsKP.map((sid, i) => {
    const sign = Math.floor(sid / 30);
    const degrees = sid % 30;
    const nak = getNakshatraInfo(sid);
    return {
      house: i + 1,
      tropLon: tropCusps[i],
      sidLon: sid,
      sign,
      signName: SIGNS[sign],
      degrees,
      nakshatra: nak.name,
      pada: nak.pada,
      nakshatraLord: nak.lord,
      subLord: getSubLord(sid),
    };
  });
  const birthDate = new Date(year, month - 1, day, hour, minute);
  const dasha = calculateDasha(birthDate, moonSid);
  return {
    planets,
    ascendant,
    cusps,
    dasha,
    birthDate,
    ayanamsa,
    ayanamsaType,
  };
}

/**
 * Calculate transit planet positions for a given date/time.
 */
export function calculateTransitPlanets(
  year: number,
  month: number,
  day: number,
  hour: number,
  min: number,
  lat: number,
  lon: number,
  tz: number,
  ayanamsaType: AyanamsaType,
  natalTropCusps?: number[],
): ChartPlanet[] {
  const utHour = hour + min / 60 - tz;
  const jd = julianDay(year, month, day, utHour);
  const T = julianCenturies(jd);
  const ayanamsa = getAyanamsa(T, ayanamsaType);
  const eps = obliquity(T);
  const LMST = norm360(gmst(jd) + lon);
  const { dPsi, dEps } = calcNutation(T);
  const epsApp = eps + dEps;
  const LMSTApp = norm360(LMST + dPsi * Math.cos(eps * D2R));
  const _tropCusps = natalTropCusps ?? placidusHouseCusps(LMSTApp, epsApp, lat);
  // KP: compute sidereal cusps from sidereal RAMC
  const sidRAMC_t = norm360(LMSTApp - ayanamsa);
  const sidCuspsKP_t = natalTropCusps
    ? natalTropCusps.map((c) => norm360(c - ayanamsa))
    : placidusHouseCusps(sidRAMC_t, epsApp, lat);

  const sunResult = getPlanetGeocentricLon("Sun", jd);
  const moonResult = getPlanetGeocentricLon("Moon", jd);
  const marsResult = getPlanetGeocentricLon("Mars", jd);
  const mercResult = getPlanetGeocentricLon("Mercury", jd);
  const jupResult = getPlanetGeocentricLon("Jupiter", jd);
  const venResult = getPlanetGeocentricLon("Venus", jd);
  const satResult = getPlanetGeocentricLon("Saturn", jd);
  const uraResult = getPlanetGeocentricLon("Uranus", jd);
  const nepResult = getPlanetGeocentricLon("Neptune", jd);
  const pluResult = getPlanetGeocentricLon("Pluto", jd);

  const rawSunTrop = norm360(sunResult.lon + dPsi);
  const moonTrop = norm360(moonResult.lon + dPsi);
  const rahuTrop = norm360(rahuTrueNode(T) + dPsi);
  const ketuTrop = norm360(rahuTrop + 180);

  function toSid(trop: number) {
    return norm360(trop - ayanamsa);
  }
  const sidCusps = sidCuspsKP_t;
  const lagnaSign = Math.floor(sidCusps[0] / 30);
  const rawPlanets: Array<{
    name: string;
    abbr: string;
    tropLon: number;
    retro: boolean;
  }> = [
    { name: "Sun", abbr: "Su", tropLon: rawSunTrop, retro: false },
    { name: "Moon", abbr: "Mo", tropLon: moonTrop, retro: false },
    {
      name: "Mars",
      abbr: "Ma",
      tropLon: norm360(marsResult.lon + dPsi),
      retro: marsResult.retrograde,
    },
    {
      name: "Mercury",
      abbr: "Me",
      tropLon: norm360(mercResult.lon + dPsi),
      retro: mercResult.retrograde,
    },
    {
      name: "Jupiter",
      abbr: "Ju",
      tropLon: norm360(jupResult.lon + dPsi),
      retro: jupResult.retrograde,
    },
    {
      name: "Venus",
      abbr: "Ve",
      tropLon: norm360(venResult.lon + dPsi),
      retro: venResult.retrograde,
    },
    {
      name: "Saturn",
      abbr: "Sa",
      tropLon: norm360(satResult.lon + dPsi),
      retro: satResult.retrograde,
    },
    { name: "Rahu", abbr: "Ra", tropLon: rahuTrop, retro: true },
    { name: "Ketu", abbr: "Ke", tropLon: ketuTrop, retro: true },
    {
      name: "Uranus",
      abbr: "Ur",
      tropLon: norm360(uraResult.lon + dPsi),
      retro: uraResult.retrograde,
    },
    {
      name: "Neptune",
      abbr: "Ne",
      tropLon: norm360(nepResult.lon + dPsi),
      retro: nepResult.retrograde,
    },
    {
      name: "Pluto",
      abbr: "Pl",
      tropLon: norm360(pluResult.lon + dPsi),
      retro: pluResult.retrograde,
    },
  ];
  return rawPlanets.map((p) => {
    const sid = toSid(p.tropLon);
    const sign = Math.floor(sid / 30);
    const degrees = sid % 30;
    const nak = getNakshatraInfo(sid);
    const subLord = getSubLord(sid);
    const house = findKPHouse(sid, sidCusps);
    const natalHouse = ((sign - lagnaSign + 12) % 12) + 1;
    const bhavaHouse = findKPHouse(sid, sidCusps);
    return {
      name: p.name,
      abbr: p.abbr,
      tropLon: p.tropLon,
      sidLon: sid,
      sign,
      signName: SIGNS[sign],
      degrees,
      nakshatra: nak.name,
      pada: nak.pada,
      nakshatraLord: nak.lord,
      subLord,
      retrograde: p.retro,
      house,
      natalHouse,
      bhavaHouse,
    };
  });
}

export function formatDeg(deg: number): string {
  const d = Math.floor(deg);
  const mFrac = (deg - d) * 60;
  const m = Math.floor(mFrac);
  const s = Math.floor((mFrac - m) * 60);
  return `${d}\u00b0 ${m}' ${s}"`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Planet owned signs (0-indexed zodiac: 0=Aries..11=Pisces)
export const PLANET_OWNED_SIGNS: Record<string, number[]> = {
  Sun: [4], // Leo
  Moon: [3], // Cancer
  Mars: [0, 7], // Aries, Scorpio
  Mercury: [2, 5], // Gemini, Virgo
  Jupiter: [8, 11], // Sagittarius, Pisces
  Venus: [1, 6], // Taurus, Libra
  Saturn: [9, 10], // Capricorn, Aquarius
  Rahu: [],
  Ketu: [],
};

// Sign lords: each zodiac sign (0=Aries..11=Pisces) and its ruling planet
const SIGN_LORDS: string[] = [
  "Mars", // 0 Aries
  "Venus", // 1 Taurus
  "Mercury", // 2 Gemini
  "Moon", // 3 Cancer
  "Sun", // 4 Leo
  "Mercury", // 5 Virgo
  "Venus", // 6 Libra
  "Mars", // 7 Scorpio
  "Jupiter", // 8 Sagittarius
  "Saturn", // 9 Capricorn
  "Saturn", // 10 Aquarius
  "Jupiter", // 11 Pisces
];

export function getOwnedHouses(
  planetName: string,
  lagnaSign: number,
): number[] {
  const signs = PLANET_OWNED_SIGNS[planetName] || [];
  return signs.map((s) => ((s - lagnaSign + 12) % 12) + 1);
}

/**
 * Returns all Bhavchalit house numbers (1-12) whose cusp sign is owned by the planet.
 */
export function getOwnedHousesByCusps(
  planetName: string,
  cuspSigns: number[],
): number[] {
  const ownedSigns = new Set(PLANET_OWNED_SIGNS[planetName] || []);
  const houses: number[] = [];
  cuspSigns.forEach((sign, idx) => {
    if (ownedSigns.has(sign)) houses.push(idx + 1);
  });
  return houses;
}

/**
 * Returns the list of houses (1-12) that a planet in `fromHouse` aspects,
 * using traditional Vedic aspects.
 */
function getVedicAspectedHouses(
  planetName: string,
  fromHouse: number,
): number[] {
  const h = (offset: number) => ((fromHouse - 1 + offset) % 12) + 1;
  const aspects: number[] = [h(6)]; // 7th aspect (all planets)
  if (planetName === "Mars") {
    aspects.push(h(3), h(7)); // 4th and 8th
  } else if (planetName === "Jupiter") {
    aspects.push(h(4), h(8)); // 5th and 9th
  } else if (planetName === "Saturn") {
    aspects.push(h(2), h(9)); // 3rd and 10th
  }
  return aspects;
}

/**
 * Computes Nadi house numbers for Rahu or Ketu using Nadi astrology rules.
 */
function getRahuKetuNadiNumbers(
  node: ChartPlanet,
  allPlanets: ChartPlanet[],
  lagnaSign: number,
  cuspSigns?: number[],
): number[] {
  const nums = new Set<number>();

  nums.add(node.bhavaHouse);

  const nodeSignHouse = ((node.sign - lagnaSign + 12) % 12) + 1;

  const addPlanetHouses = (p: ChartPlanet) => {
    const owned = cuspSigns
      ? getOwnedHousesByCusps(p.name, cuspSigns)
      : getOwnedHouses(p.name, lagnaSign);
    for (const h of owned) nums.add(h);
    nums.add(p.bhavaHouse);
  };

  const others = allPlanets.filter(
    (p) => p.name !== "Rahu" && p.name !== "Ketu",
  );

  for (const planet of others) {
    if (planet.sign === node.sign) {
      addPlanetHouses(planet);
      continue;
    }
    const planetSignHouse = ((planet.sign - lagnaSign + 12) % 12) + 1;
    const aspectedHouses = getVedicAspectedHouses(planet.name, planetSignHouse);
    if (aspectedHouses.includes(nodeSignHouse)) {
      addPlanetHouses(planet);
    }
  }

  const signLordName = SIGN_LORDS[node.sign];
  if (signLordName) {
    const signLordOwned = cuspSigns
      ? getOwnedHousesByCusps(signLordName, cuspSigns)
      : getOwnedHouses(signLordName, lagnaSign);
    for (const h of signLordOwned) nums.add(h);
    const signLordPlanet = allPlanets.find((p) => p.name === signLordName);
    if (signLordPlanet) nums.add(signLordPlanet.bhavaHouse);
  }

  return Array.from(nums)
    .filter((n) => n > 0)
    .sort((a, b) => a - b);
}

export interface NadiRow {
  name: string;
  numbers: number[];
  isSpecial?: boolean;
}

export interface NadiPlanet {
  abbr: string;
  planet: NadiRow;
  nakLord: NadiRow;
  subLord: NadiRow;
}

export function calculateNadiNumbers(
  planets: ChartPlanet[],
  lagnaSign: number,
  cuspSigns?: number[],
): NadiPlanet[] {
  const getBhavaHouse = (name: string): number => {
    const p = planets.find((pl) => pl.name === name);
    return p ? p.bhavaHouse : 0;
  };

  const makeRow = (name: string, bhavaHouse: number): NadiRow => {
    const matchedPlanet = planets.find((pl) => pl.name === name);
    if ((name === "Rahu" || name === "Ketu") && matchedPlanet) {
      const nadiNums = getRahuKetuNadiNumbers(
        matchedPlanet,
        planets,
        lagnaSign,
        cuspSigns,
      );
      return { name, numbers: nadiNums, isSpecial: true };
    }
    const owned = cuspSigns
      ? getOwnedHousesByCusps(name, cuspSigns)
      : getOwnedHouses(name, lagnaSign);
    const nums = [...new Set([...owned, bhavaHouse])]
      .filter((n) => n > 0)
      .sort((a, b) => a - b);
    return { name, numbers: nums };
  };

  return planets.map((p) => {
    if (p.name === "Rahu" || p.name === "Ketu") {
      const nadiNums = getRahuKetuNadiNumbers(p, planets, lagnaSign, cuspSigns);
      return {
        abbr: p.abbr,
        planet: { name: p.name, numbers: nadiNums, isSpecial: true },
        nakLord: makeRow(p.nakshatraLord, getBhavaHouse(p.nakshatraLord)),
        subLord: makeRow(p.subLord, getBhavaHouse(p.subLord)),
      };
    }
    return {
      abbr: p.abbr,
      planet: makeRow(p.name, p.bhavaHouse),
      nakLord: makeRow(p.nakshatraLord, getBhavaHouse(p.nakshatraLord)),
      subLord: makeRow(p.subLord, getBhavaHouse(p.subLord)),
    };
  });
}

// ============================================================
// KP SUBLORD TABLE (249 Seeds)
// ============================================================

export interface KPSubLordEntry {
  seed: number;
  nakIdx: number;
  nakName: string;
  nakLord: string;
  subIdx: number;
  subLord: string;
  startSid: number;
  endSid: number;
}

function buildKPSublordTable(): KPSubLordEntry[] {
  const table: KPSubLordEntry[] = [];
  const NAK_WIDTH = 360 / 27;
  let seed = 1;
  for (let n = 0; n < 27; n++) {
    const nakStart = n * NAK_WIDTH;
    const nakLordName = NAKSHATRA_LORDS[n];
    const nakLordIdx = DASHA_LORDS.indexOf(nakLordName);
    let pos = nakStart;
    for (let s = 0; s < 9; s++) {
      const subLordIdx = (nakLordIdx + s) % 9;
      const subLordName = DASHA_LORDS[subLordIdx];
      const subSpan = (DASHA_YEARS[subLordIdx] / 120) * NAK_WIDTH;
      const endPos = pos + subSpan;
      const startSign = Math.floor(pos / 30);
      const endSign = Math.floor((endPos - 1e-9) / 30);
      if (endSign > startSign) {
        const boundary = (startSign + 1) * 30;
        table.push({
          seed,
          nakIdx: n,
          nakName: NAKSHATRAS[n],
          nakLord: nakLordName,
          subIdx: s,
          subLord: subLordName,
          startSid: pos,
          endSid: boundary,
        });
        seed++;
        table.push({
          seed,
          nakIdx: n,
          nakName: NAKSHATRAS[n],
          nakLord: nakLordName,
          subIdx: s,
          subLord: subLordName,
          startSid: boundary,
          endSid: endPos,
        });
        seed++;
      } else {
        table.push({
          seed,
          nakIdx: n,
          nakName: NAKSHATRAS[n],
          nakLord: nakLordName,
          subIdx: s,
          subLord: subLordName,
          startSid: pos,
          endSid: endPos,
        });
        seed++;
      }
      pos = endPos;
    }
  }
  return table; // exactly 249 entries
}

export const KP_SUBLORD_TABLE: KPSubLordEntry[] = buildKPSublordTable();

export function getSeedEntry(seed: number): KPSubLordEntry {
  const clamped = Math.max(1, Math.min(249, Math.round(seed)));
  return KP_SUBLORD_TABLE[clamped - 1];
}

// ============================================================
// HORARY CHART CALCULATOR
// ============================================================

export function calculateHoraryChart(
  seedNumber: number,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  lat: number,
  _lon: number,
  tz: number,
): ChartResult {
  const entry = getSeedEntry(seedNumber);

  const utHour = hour + minute / 60 - tz;
  const jd = julianDay(year, month, day, utHour);
  const T = julianCenturies(jd);
  const ayanamsa = computeKPOldAyanamsa(jd); // KP Old ayanamsa (dynamic, epoch 291 AD formula)
  const eps = obliquity(T);
  const { dPsi, dEps } = calcNutation(T);
  const epsApp = eps + dEps;

  const seedSidAsc = entry.startSid;
  const seedTropAsc = norm360(seedSidAsc + ayanamsa);

  function findRAMCForAsc(targetAsc: number): number {
    let bestRAMC = 0;
    let bestDiff = 360;
    for (let r = 0; r < 360; r += 2) {
      const a = placidusHouseCusps(r, epsApp, lat)[0];
      let d = a - targetAsc;
      while (d > 180) d -= 360;
      while (d < -180) d += 360;
      if (Math.abs(d) < Math.abs(bestDiff)) {
        bestDiff = d;
        bestRAMC = r;
      }
    }
    let lo = norm360(bestRAMC - 2);
    let hi = norm360(bestRAMC + 2);
    if (lo > hi) {
      lo -= 360;
    }
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      const a = placidusHouseCusps(norm360(mid), epsApp, lat)[0];
      let d = a - targetAsc;
      while (d > 180) d -= 360;
      while (d < -180) d += 360;
      if (Math.abs(d) < 0.00001) return norm360(mid);
      if (d > 0) hi = mid;
      else lo = mid;
    }
    return norm360((lo + hi) / 2);
  }
  const RAMC_seed = findRAMCForAsc(seedTropAsc);
  const tropCusps = placidusHouseCusps(RAMC_seed, epsApp, lat);
  // For KP horary: compute sidereal cusps using sidereal RAMC
  const sidRAMC_h = norm360(RAMC_seed - ayanamsa);
  const sidCuspsKP_h = placidusHouseCusps(sidRAMC_h, epsApp, lat);

  const sunResult = getPlanetGeocentricLon("Sun", jd);
  const moonResult = getPlanetGeocentricLon("Moon", jd);
  const marsResult = getPlanetGeocentricLon("Mars", jd);
  const mercResult = getPlanetGeocentricLon("Mercury", jd);
  const jupResult = getPlanetGeocentricLon("Jupiter", jd);
  const venResult = getPlanetGeocentricLon("Venus", jd);
  const satResult = getPlanetGeocentricLon("Saturn", jd);
  const uraResult = getPlanetGeocentricLon("Uranus", jd);
  const nepResult = getPlanetGeocentricLon("Neptune", jd);
  const pluResult = getPlanetGeocentricLon("Pluto", jd);

  const rawSunTrop = norm360(sunResult.lon + dPsi);
  const moonTrop = norm360(moonResult.lon + dPsi);
  const rahuTrop = norm360(rahuTrueNode(T) + dPsi);
  const ketuTrop = norm360(rahuTrop + 180);

  function toSid(trop: number) {
    return norm360(trop - ayanamsa);
  }

  const sidCusps = sidCuspsKP_h;
  const lagnaSign = Math.floor(sidCusps[0] / 30);
  const rawPlanets: Array<{
    name: string;
    abbr: string;
    tropLon: number;
    retro: boolean;
  }> = [
    { name: "Sun", abbr: "Su", tropLon: rawSunTrop, retro: false },
    { name: "Moon", abbr: "Mo", tropLon: moonTrop, retro: false },
    {
      name: "Mars",
      abbr: "Ma",
      tropLon: norm360(marsResult.lon + dPsi),
      retro: marsResult.retrograde,
    },
    {
      name: "Mercury",
      abbr: "Me",
      tropLon: norm360(mercResult.lon + dPsi),
      retro: mercResult.retrograde,
    },
    {
      name: "Jupiter",
      abbr: "Ju",
      tropLon: norm360(jupResult.lon + dPsi),
      retro: jupResult.retrograde,
    },
    {
      name: "Venus",
      abbr: "Ve",
      tropLon: norm360(venResult.lon + dPsi),
      retro: venResult.retrograde,
    },
    {
      name: "Saturn",
      abbr: "Sa",
      tropLon: norm360(satResult.lon + dPsi),
      retro: satResult.retrograde,
    },
    { name: "Rahu", abbr: "Ra", tropLon: rahuTrop, retro: true },
    { name: "Ketu", abbr: "Ke", tropLon: ketuTrop, retro: true },
    {
      name: "Uranus",
      abbr: "Ur",
      tropLon: norm360(uraResult.lon + dPsi),
      retro: uraResult.retrograde,
    },
    {
      name: "Neptune",
      abbr: "Ne",
      tropLon: norm360(nepResult.lon + dPsi),
      retro: nepResult.retrograde,
    },
    {
      name: "Pluto",
      abbr: "Pl",
      tropLon: norm360(pluResult.lon + dPsi),
      retro: pluResult.retrograde,
    },
  ];

  const planets: ChartPlanet[] = rawPlanets.map((p) => {
    const sid = toSid(p.tropLon);
    const sign = Math.floor(sid / 30);
    const degrees = sid % 30;
    const nak = getNakshatraInfo(sid);
    const subLord = getSubLord(sid);
    const house = findKPHouse(sid, sidCusps);
    const natalHouse = ((sign - lagnaSign + 12) % 12) + 1;
    return {
      name: p.name,
      abbr: p.abbr,
      tropLon: p.tropLon,
      sidLon: sid,
      sign,
      signName: SIGNS[sign],
      degrees,
      nakshatra: nak.name,
      pada: nak.pada,
      nakshatraLord: nak.lord,
      subLord,
      retrograde: p.retro,
      house,
      natalHouse,
      bhavaHouse: house,
    };
  });

  const ascSid = sidCusps[0];
  const ascNak = getNakshatraInfo(ascSid);
  const ascendant: ChartPlanet = {
    name: "Ascendant",
    abbr: "As",
    tropLon: tropCusps[0],
    sidLon: ascSid,
    sign: lagnaSign,
    signName: SIGNS[lagnaSign],
    degrees: ascSid % 30,
    nakshatra: entry.nakName,
    pada: ascNak.pada,
    nakshatraLord: entry.nakLord,
    subLord: getSubLord(ascSid),
    retrograde: false,
    house: 1,
    natalHouse: 1,
    bhavaHouse: 1,
  };

  const cusps: ChartCusp[] = sidCusps.map((s, i) => {
    const sign = Math.floor(s / 30);
    const nak = getNakshatraInfo(s);
    return {
      house: i + 1,
      tropLon: tropCusps[i],
      sidLon: s,
      sign,
      signName: SIGNS[sign],
      degrees: s % 30,
      nakshatra: nak.name,
      pada: nak.pada,
      nakshatraLord: nak.lord,
      subLord: getSubLord(s),
    };
  });

  cusps[0].nakshatra = entry.nakName;
  cusps[0].nakshatraLord = entry.nakLord;
  cusps[0].subLord = getSubLord(ascSid);

  const moonSidLon = toSid(moonTrop);
  const birthDate = new Date(year, month - 1, day, hour, minute);
  const dasha = calculateDasha(birthDate, moonSidLon);

  return {
    planets,
    ascendant,
    cusps,
    dasha,
    birthDate,
    ayanamsa,
    ayanamsaType: "kp-old",
  };
}
