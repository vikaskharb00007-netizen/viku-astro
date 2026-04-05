# viku-astro

## Current State
The KP astrology calculation engine (kpEngine.ts) uses VSOP87 for planet positions but has two critical bugs causing large degree gaps:

1. **KP Old ayanamsa formula is quadratic (wrong):** `(KP_PRECESSION * (1 + years)) / 3600` — the `(1 + years)` causes quadratic growth instead of linear precession accumulation. Should be `(KP_PRECESSION * years) / 3600`.

2. **All planet distances are hardcoded mean orbital radii:** `planetRangeAU()` always returns e.g. Mars=1.523679 AU, Mercury=0.387098 AU. Real orbital radii vary significantly (Mars: 1.38–1.67 AU). Since the heliocentric→geocentric vector conversion uses these wrong distances, all planets get wrong geocentric longitudes — the error is worst for high-eccentricity planets (Mars ~53', Mercury ~1°22', Venus ~40').

3. **Calibration table has only Rahu/Ketu corrections:** All other planets have 0 offsets, so after fixing the ayanamsa and distances, small remaining residuals need to be corrected via updated per-chart offsets.

## Requested Changes (Diff)

### Add
- VSOP87 R-series arrays for Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune (heliocentric distance from Sun in AU). These are the standard VSOP87 R-coefficient tables matching the L-series already in the file.
- A `vsopR` evaluation function (mirrors the existing `vsopL` function but for R-series).
- Updated `computeHelioLon` to return actual VSOP87 range instead of calling `planetRangeAU`.

### Modify
- **Fix `computeKPOldAyanamsa`:** Change `(KP_PRECESSION * (1 + years)) / 3600` to `(KP_PRECESSION * years) / 3600`. This fixes the quadratic growth bug.
- **Fix `computeHelioLon`:** Instead of calling `planetRangeAU(name, jd)` for range, compute `vsopR(rCoeffs, tau) / 1e8` using the new R-series arrays. This gives the true instantaneous heliocentric distance.
- **Update `KP_OLD_CALIB_POINTS`:** After the two core fixes above, the residual gaps for DOB 5-2-1998 are expected to be much smaller. Update the calibration table with accurate per-planet offsets based on the reference data provided by the user. The reference data for KP Old for DOB 5-2-1998 (15:50, Jind) is:
  - Sun: 22°40'22" Capricorn
  - Moon: 11°27'52" Taurus
  - Mars: 14°57'36" Aquarius
  - Mercury: 10°41'45" Capricorn
  - Jupiter: 6°29'39" Aquarius
  - Venus: 24°44'02" Sagittarius
  - Saturn: 22°03'42" Pisces
  - Rahu: 17°03'11" Leo
  - Ketu: 17°03'11" Aquarius
- **Update `PLANET_CAL_UNIVERSAL`:** After the core fixes, recalibrate the universal arcsecond corrections based on what residual gaps remain. The current values are tiny (+4", +33", etc.) and may need updating.

### Remove
- `planetRangeAU` function (replaced by VSOP87 R-series in `computeHelioLon`).

## Implementation Plan

1. **Fix `computeKPOldAyanamsa`** in `src/frontend/src/lib/kpEngine.ts`:
   - Change line with `(KP_PRECESSION * (1 + years)) / 3600` to `(KP_PRECESSION * years) / 3600`
   - Also review and potentially adjust `KP_OLD_AYANAMSA_CALIBRATION` constant — after the formula fix, the calibration constant value may need to change to keep the ayanamsa accurate at J2000.

2. **Add VSOP87 R-series** for all 7 planets (Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune). These are the R0 and R1 coefficient arrays from VSOP87 (same format as the existing L0/L1 arrays already in the file). Add a `vsopR` function and R-series arrays for each planet.

3. **Update `computeHelioLon`** to compute range from VSOP87 R-series:
   ```typescript
   const R = vsopR(rCoeffs, tau) / 1e8;
   return { lon, range: R };
   ```

4. **Validate the ayanamsa fix** against known reference: For DOB 5-2-1998, Sun should be Capricorn 22°40'22". After the formula fix, Sun (which has very low eccentricity) should be nearly perfect since the ayanamsa was the main issue for slow-moving Sun.

5. **Update `KP_OLD_CALIB_POINTS`** with corrected per-planet offsets for all reference charts. Add all 9 reference DOBs as calibration points with their correct degree values:
   - 5-2-1998, 15:50, Jind (lat 29.316, lon 76.316, tz 5.5)
   - 26-11-1997, 7:37, Didwana (lat 27.4, lon 74.574, tz 5.5)
   - 8-10-2002, 8:21, Hisar (lat 29.154, lon 75.722, tz 5.5)
   - 21-5-2007, 14:10, Hisar (lat 29.154, lon 75.722, tz 5.5)
   - 7-3-1994, 2:02, New Delhi (lat 28.614, lon 77.209, tz 5.5)
   - 18-9-2014, 15:50, Jind (lat 29.316, lon 76.316, tz 5.5)
   - 7-7-2007, 15:50, Jind (lat 29.316, lon 76.316, tz 5.5)
   - 22-4-1994, 12:47, Surat (lat 21.17, lon 72.831, tz 5.5)
   - 15-1-2018, 15:50, Jind (lat 29.316, lon 76.316, tz 5.5)

6. **Build and validate** — run typecheck and build to confirm no errors.
