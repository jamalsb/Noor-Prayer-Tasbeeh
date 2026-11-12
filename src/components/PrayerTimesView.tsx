import React, { useState, useEffect, useCallback, useId } from 'react';
import { Language, CityInfo, AladhanResponseData, PrayerTimings } from '../types';
import { POPULAR_CITIES, CALCULATION_METHODS } from '../data/cities';
import { TRANSLATIONS } from '../data/translations';
import { playAdhanTone } from '../utils/audio';
import { 
  MapPin, 
  RotateCw, 
  Volume2, 
  Sun, 
  Sunrise, 
  Sunset, 
  Moon, 
  Clock, 
  Compass, 
  ChevronDown, 
  Calendar,
  AlertCircle 
} from 'lucide-react';

interface PrayerTimesViewProps {
  language: Language;
  selectedCity: CityInfo;
  onSelectCity: (city: CityInfo) => void;
  onNavigateToQibla?: () => void;
}

const CACHE_KEY = 'noor_prayer_times_cache_v2';
const METHOD_KEY = 'noor_prayer_method_v1';
const SCHOOL_KEY = 'noor_prayer_school_v1';

export const PrayerTimesView: React.FC<PrayerTimesViewProps> = ({
  language,
  selectedCity,
  onSelectCity,
  onNavigateToQibla,
}) => {
  const t = TRANSLATIONS[language];
  const citySelectId = useId();
  const methodSelectId = useId();
  const schoolSelectId = useId();

  // Settings
  const [calculationMethod, setCalculationMethod] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(METHOD_KEY);
      return saved ? parseInt(saved, 10) : 1; // Default: Karachi (id: 1)
    } catch {
      return 1;
    }
  });

  const [school, setSchool] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(SCHOOL_KEY);
      return saved ? parseInt(saved, 10) : 1; // Default: Hanafi (id: 1 in Aladhan)
    } catch {
      return 1;
    }
  });

  // State
  const [prayerData, setPrayerData] = useState<AladhanResponseData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [isPlayingAdhan, setIsPlayingAdhan] = useState<boolean>(false);

  // Clock tick every second for live countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch prayer times from Aladhan API
  const fetchPrayerTimes = useCallback(
    async (city: CityInfo, methodId: number, schoolId: number) => {
      setLoading(true);
      setError(null);

      // Check offline cache first
      const cacheKey = `${CACHE_KEY}_${city.id}_${methodId}_${schoolId}`;
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          // If cached today, show immediately
          setPrayerData(parsed.data);
        }
      } catch (err) {
        console.error(err);
      }

      try {
        // Fetch from Aladhan API
        // HTTPS ensures no mixed-content blocks
        const url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(
          city.name
        )}&country=${encodeURIComponent(city.country)}&method=${methodId}&school=${schoolId}`;

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        const json = await res.json();
        if (json && json.data) {
          setPrayerData(json.data);
          // Update cache
          localStorage.setItem(
            cacheKey,
            JSON.stringify({ data: json.data, timestamp: Date.now() })
          );
        } else {
          throw new Error('Invalid response structure from Aladhan');
        }
      } catch (err) {
        console.warn('Aladhan fetch error, falling back to cache or backup', err);
        // If we don't have cached data yet, show error message
        if (!prayerData) {
          setError(
            'Unable to fetch live timings from Aladhan API. Please check internet connection.'
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [prayerData]
  );

  // Load when city, method, or school changes
  useEffect(() => {
    fetchPrayerTimes(selectedCity, calculationMethod, school);
  }, [selectedCity, calculationMethod, school, fetchPrayerTimes]);

  // Handle method change
  const handleMethodChange = (id: number) => {
    setCalculationMethod(id);
    localStorage.setItem(METHOD_KEY, id.toString());
  };

  // Handle school change (0: Shafi, 1: Hanafi)
  const handleSchoolChange = (val: number) => {
    setSchool(val);
    localStorage.setItem(SCHOOL_KEY, val.toString());
  };

  // GPS Location detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const res = await fetch(
            `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=${calculationMethod}&school=${school}`
          );
          const json = await res.json();
          if (json && json.data) {
            setPrayerData(json.data);
            // Create a custom detected city info
            const detectedCity: CityInfo = {
              id: 'gps-current-loc',
              name: json.data.meta.timezone?.split('/')[1]?.replace(/_/g, ' ') || 'My Location',
              country: json.data.meta.timezone?.split('/')[0] || 'Current',
              countryCode: 'GPS',
              latitude: lat,
              longitude: lng,
              timezone: json.data.meta.timezone || 'UTC',
              urduName: 'موجودہ مقام',
              arabicName: 'الموقع الحالي',
            };
            onSelectCity(detectedCity);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (err) => {
        console.warn(err);
        setIsDetectingLocation(false);
        alert('Could not access GPS location. Please select your city from the list.');
      },
      { timeout: 10000 }
    );
  };

  // Play gentle Adhan tone preview
  const handlePlayAdhan = () => {
    setIsPlayingAdhan(true);
    playAdhanTone();
    setTimeout(() => setIsPlayingAdhan(false), 3500);
  };

  // Parse time string "HH:MM" or "HH:MM (PKT)" to Date object today
  const parsePrayerTimeToDate = (timeStr?: string): Date | null => {
    if (!timeStr) return null;
    const clean = timeStr.split(' ')[0]; // remove timezone string if present
    const [hours, minutes] = clean.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;

    const d = new Date(currentTime);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  // Compute active and next prayer
  const timings = prayerData?.timings;
  
  const mainPrayers: { key: keyof PrayerTimings; name: string; urduName: string; arabicName: string; icon: React.ReactNode }[] = [
    { key: 'Fajr', name: t.fajr, urduName: 'فجر', arabicName: 'الفجر', icon: <Moon size={18} /> },
    { key: 'Sunrise', name: t.sunrise, urduName: 'طلوع', arabicName: 'الشروق', icon: <Sunrise size={18} /> },
    { key: 'Dhuhr', name: t.dhuhr, urduName: 'ظہر', arabicName: 'الظهر', icon: <Sun size={18} /> },
    { key: 'Asr', name: t.asr, urduName: 'عصر', arabicName: 'العصر', icon: <Sun size={18} /> },
    { key: 'Maghrib', name: t.maghrib, urduName: 'مغرب', arabicName: 'المغرب', icon: <Sunset size={18} /> },
    { key: 'Isha', name: t.isha, urduName: 'عشاء', arabicName: 'العشاء', icon: <Moon size={18} /> },
  ];

  let nextPrayerInfo: { name: string; key: string; date: Date; diffMs: number } | null = null;
  let activePrayerKey: string | null = null;

  if (timings) {
    const prayerMoments = [
      { key: 'Fajr', name: t.fajr, date: parsePrayerTimeToDate(timings.Fajr) },
      { key: 'Sunrise', name: t.sunrise, date: parsePrayerTimeToDate(timings.Sunrise) },
      { key: 'Dhuhr', name: t.dhuhr, date: parsePrayerTimeToDate(timings.Dhuhr) },
      { key: 'Asr', name: t.asr, date: parsePrayerTimeToDate(timings.Asr) },
      { key: 'Maghrib', name: t.maghrib, date: parsePrayerTimeToDate(timings.Maghrib) },
      { key: 'Isha', name: t.isha, date: parsePrayerTimeToDate(timings.Isha) },
    ].filter((p): p is { key: string; name: string; date: Date } => p.date !== null);

    // Sort chronologically
    prayerMoments.sort((a, b) => a.date.getTime() - b.date.getTime());

    const nowMs = currentTime.getTime();

    // Find next upcoming prayer
    for (const p of prayerMoments) {
      if (p.date.getTime() > nowMs) {
        nextPrayerInfo = {
          name: p.name,
          key: p.key,
          date: p.date,
          diffMs: p.date.getTime() - nowMs,
        };
        break;
      }
    }

    // If all passed today, next is tomorrow's Fajr
    if (!nextPrayerInfo && prayerMoments.length > 0) {
      const tomorrowFajr = new Date(prayerMoments[0].date);
      tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
      nextPrayerInfo = {
        name: prayerMoments[0].name,
        key: prayerMoments[0].key,
        date: tomorrowFajr,
        diffMs: tomorrowFajr.getTime() - nowMs,
      };
    }

    // Find active prayer window
    for (let i = 0; i < prayerMoments.length; i++) {
      const currentP = prayerMoments[i];
      const nextP = prayerMoments[i + 1];
      if (nextP) {
        if (nowMs >= currentP.date.getTime() && nowMs < nextP.date.getTime()) {
          activePrayerKey = currentP.key;
          break;
        }
      } else {
        // After Isha
        if (nowMs >= currentP.date.getTime()) {
          activePrayerKey = currentP.key;
        }
      }
    }
  }

  // Format countdown string
  const formatCountdown = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format display time to 12-hour AM/PM
  const format12Hour = (timeStr?: string) => {
    if (!timeStr) return '--:--';
    const clean = timeStr.split(' ')[0];
    const [hours24, minutes] = clean.split(':').map(Number);
    if (isNaN(hours24)) return timeStr;
    const period = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 flex flex-col space-y-4">
      {/* City & Location Selector Bar */}
      <div className="bg-[#082216] border border-[#16422d] rounded-2xl p-4 shadow-lg shadow-black/30">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1">
            <label htmlFor={citySelectId} className="block text-xs font-semibold uppercase tracking-wider text-[#d4af37] mb-1.5 flex items-center gap-1.5">
              <MapPin size={14} />
              <span>{t.selectCity}</span>
            </label>
            <div className="relative">
              <select
                id={citySelectId}
                value={selectedCity.id}
                onChange={(e) => {
                  const found = POPULAR_CITIES.find((c) => c.id === e.target.value);
                  if (found) onSelectCity(found);
                }}
                className="w-full appearance-none bg-[#0d2e1f] text-white border border-[#1d4f37] rounded-xl py-2.5 px-3 pr-9 text-sm font-medium focus:outline-none focus:border-[#d4af37] cursor-pointer"
              >
                {selectedCity.id === 'gps-current-loc' && (
                  <option value="gps-current-loc">
                    📍 {selectedCity.name} ({selectedCity.country})
                  </option>
                )}
                <optgroup label="Pakistan" className="bg-[#0b281d] font-semibold text-[#d4af37]">
                  {POPULAR_CITIES.filter((c) => c.countryCode === 'PK').map((c) => (
                    <option key={c.id} value={c.id} className="text-white">
                      {c.name} ({c.urduName})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Middle East & Holy Cities" className="bg-[#0b281d] font-semibold text-[#d4af37]">
                  {POPULAR_CITIES.filter((c) => ['SA', 'AE', 'TR', 'EG'].includes(c.countryCode)).map((c) => (
                    <option key={c.id} value={c.id} className="text-white">
                      {c.name} - {c.country}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="International" className="bg-[#0b281d] font-semibold text-[#d4af37]">
                  {POPULAR_CITIES.filter((c) => !['PK', 'SA', 'AE', 'TR', 'EG'].includes(c.countryCode)).map((c) => (
                    <option key={c.id} value={c.id} className="text-white">
                      {c.name} - {c.country}
                    </option>
                  ))}
                </optgroup>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#d4af37]">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>

          {/* Action buttons: GPS Detect & Refresh */}
          <div className="flex items-center gap-2 self-end sm:self-auto pt-1 sm:pt-4">
            <button
              onClick={handleDetectLocation}
              disabled={isDetectingLocation}
              title={t.detectLocation}
              className="flex items-center gap-1.5 py-2.5 px-3 bg-[#0d2e1f] hover:bg-[#15462f] text-[#c0d4ca] hover:text-[#f3cf65] border border-[#16422d] rounded-xl text-xs font-medium transition-colors cursor-pointer shrink-0"
            >
              <MapPin size={15} className={isDetectingLocation ? 'animate-bounce text-[#d4af37]' : ''} />
              <span className="hidden sm:inline">{t.detectLocation}</span>
            </button>

            <button
              onClick={() => fetchPrayerTimes(selectedCity, calculationMethod, school)}
              disabled={loading}
              title={t.refreshTimes}
              className="p-2.5 bg-[#0d2e1f] hover:bg-[#15462f] text-[#c0d4ca] hover:text-[#f3cf65] border border-[#16422d] rounded-xl text-xs font-medium transition-colors cursor-pointer shrink-0"
            >
              <RotateCw size={16} className={loading ? 'animate-spin text-[#d4af37]' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Hero Next Prayer & Hijri Date Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0c3322] via-[#082216] to-[#04140d] border border-[#d4af37]/40 rounded-3xl p-5 shadow-2xl text-center">
        {/* Subtle decorative Islamic arch background */}
        <div className="absolute inset-0 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none" />

        {/* Hijri & Gregorian Dates */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-[#a1beaf] mb-3 relative z-10">
          <div className="flex items-center gap-1.5 bg-[#061c12]/80 px-3 py-1 rounded-full border border-[#184e3a]">
            <Calendar size={13} className="text-[#d4af37]" />
            <span className="font-arabic font-semibold text-white">
              {prayerData?.date.hijri
                ? `${prayerData.date.hijri.day} ${prayerData.date.hijri.month.ar || prayerData.date.hijri.month.en} ${prayerData.date.hijri.year} هـ`
                : '1448 AH'}
            </span>
          </div>
          <span className="text-[#527766]">·</span>
          <span className="text-[#c0d4ca] text-xs">
            {prayerData?.date.readable || currentTime.toLocaleDateString(undefined, { dateStyle: 'full' })}
          </span>
        </div>

        {/* Next Prayer Countdown */}
        {nextPrayerInfo ? (
          <div className="py-2 relative z-10">
            <span className="text-xs uppercase tracking-widest text-[#d4af37] font-semibold">
              {t.nextPrayer}: {nextPrayerInfo.name}
            </span>
            <div className="font-display font-black text-4xl sm:text-5xl text-[#f3cf65] my-2 tabular-nums drop-shadow-[0_2px_12px_rgba(212,175,55,0.4)]">
              {formatCountdown(nextPrayerInfo.diffMs)}
            </div>
            <div className="text-xs text-[#9bb8aa] flex items-center justify-center gap-2">
              <Clock size={13} />
              <span>
                {nextPrayerInfo.name} at{' '}
                <strong className="text-white">{format12Hour(timings?.[nextPrayerInfo.key as keyof PrayerTimings])}</strong>
              </span>
            </div>
          </div>
        ) : (
          <div className="py-4">
            <span className="text-sm text-[#c0d4ca]">{t.prayerTimes}</span>
          </div>
        )}

        {/* Audio Adhan tone preview button */}
        <div className="mt-3 flex items-center justify-center gap-3 relative z-10">
          <button
            onClick={handlePlayAdhan}
            disabled={isPlayingAdhan}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer ${
              isPlayingAdhan
                ? 'bg-[#d4af37] text-[#061a12] border-[#f3cf65] font-bold animate-pulse'
                : 'bg-[#082619] hover:bg-[#103a27] text-[#f3cf65] border-[#d4af37]/40'
            }`}
          >
            <Volume2 size={14} />
            <span>{isPlayingAdhan ? 'Playing...' : t.adthanPreview}</span>
          </button>

          {onNavigateToQibla && (
            <button
              onClick={onNavigateToQibla}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#082619] hover:bg-[#103a27] text-[#c0d4ca] hover:text-[#f3cf65] border border-[#16422d] text-xs font-medium transition-all cursor-pointer"
            >
              <Compass size={14} className="text-[#d4af37]" />
              <span>{t.qiblaTab}</span>
            </button>
          )}
        </div>
      </div>

      {/* Error message banner if API failed */}
      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl flex items-center gap-2 text-xs text-red-300">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Daily Prayer Timings Cards List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {mainPrayers.map((prayer) => {
          const rawTime = timings ? timings[prayer.key] : undefined;
          const formattedTime = format12Hour(rawTime);
          const isActive = activePrayerKey === prayer.key;
          const isNext = nextPrayerInfo?.key === prayer.key;

          return (
            <div
              key={prayer.key}
              className={`relative overflow-hidden rounded-2xl p-4 transition-all border ${
                isActive
                  ? 'bg-gradient-to-br from-[#103e29] to-[#0a271a] border-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.25)]'
                  : isNext
                  ? 'bg-[#0b281d] border-[#d4af37]/50 shadow-md'
                  : 'bg-[#082216] border-[#16422d] hover:border-[#1e543a]'
              }`}
            >
              {/* Active or Next Indicator */}
              {isActive && (
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#d4af37] text-[#061a12] text-[10px] font-extrabold uppercase tracking-wider">
                  {t.live}
                </div>
              )}
              {isNext && !isActive && (
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#0d3b25] text-[#f3cf65] border border-[#d4af37]/40 text-[10px] font-bold uppercase tracking-wider">
                  Next
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2 rounded-xl border ${
                      isActive
                        ? 'bg-[#d4af37] text-[#061a12] border-[#f3cf65]'
                        : 'bg-[#0d2e1f] text-[#d4af37] border-[#184e3a]'
                    }`}
                  >
                    {prayer.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-white flex items-center gap-1.5">
                      <span>{language === 'ur' ? prayer.urduName : language === 'ar' ? prayer.arabicName : prayer.name}</span>
                      <span className="font-arabic text-xs text-[#9bb8aa]">({prayer.arabicName})</span>
                    </h3>
                    <p className="text-[11px] text-[#7da090]">
                      {prayer.key === 'Sunrise' ? 'Ishraq begins' : 'Obligatory Salah'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-display font-bold text-lg md:text-xl text-[#f3cf65] tabular-nums tracking-tight">
                    {formattedTime}
                  </span>
                  <span className="block text-[10px] text-[#82a494] tabular-nums">
                    {rawTime?.split(' ')[0] || '--:--'} (24h)
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Timings (Imsak & Midnight) */}
      {timings && (
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="bg-[#082216]/70 border border-[#16422d] rounded-xl p-3 flex items-center justify-between text-xs">
            <span className="text-[#a1beaf]">Imsak (Sahoor End):</span>
            <span className="font-semibold text-white tabular-nums">{format12Hour(timings.Imsak)}</span>
          </div>
          <div className="bg-[#082216]/70 border border-[#16422d] rounded-xl p-3 flex items-center justify-between text-xs">
            <span className="text-[#a1beaf]">{t.midnight}:</span>
            <span className="font-semibold text-white tabular-nums">{format12Hour(timings.Midnight)}</span>
          </div>
        </div>
      )}

      {/* Prayer Settings Accordion / Options */}
      <details className="bg-[#082216] border border-[#16422d] rounded-2xl p-4 text-xs group">
        <summary className="font-semibold text-[#c0d4ca] hover:text-[#f3cf65] cursor-pointer flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock size={15} className="text-[#d4af37]" />
            <span>Calculation Method & Jurisprudence</span>
          </span>
          <ChevronDown size={16} className="text-[#a1beaf] transition-transform group-open:rotate-180" />
        </summary>

        <div className="pt-4 space-y-3 border-t border-[#16422d] mt-3">
          {/* Method selector */}
          <div>
            <label htmlFor={methodSelectId} className="block text-[#a1beaf] mb-1 font-medium">
              {t.calculationMethod}
            </label>
            <select
              id={methodSelectId}
              value={calculationMethod}
              onChange={(e) => handleMethodChange(Number(e.target.value))}
              className="w-full bg-[#0d2e1f] text-white border border-[#16422d] rounded-xl py-2 px-3 focus:outline-none focus:border-[#d4af37]"
            >
              {CALCULATION_METHODS.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#0b281d]">
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* School selector */}
          <div>
            <label htmlFor={schoolSelectId} className="block text-[#a1beaf] mb-1 font-medium">
              {t.juristicMethod}
            </label>
            <div className="grid grid-cols-2 gap-2" id={schoolSelectId}>
              <button
                type="button"
                onClick={() => handleSchoolChange(1)}
                className={`py-2 px-3 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                  school === 1
                    ? 'bg-[#d4af37] text-[#061a12] border-[#f3cf65] font-bold'
                    : 'bg-[#0d2e1f] text-[#c0d4ca] border-[#16422d]'
                }`}
              >
                {t.hanafi}
              </button>
              <button
                type="button"
                onClick={() => handleSchoolChange(0)}
                className={`py-2 px-3 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                  school === 0
                    ? 'bg-[#d4af37] text-[#061a12] border-[#f3cf65] font-bold'
                    : 'bg-[#0d2e1f] text-[#c0d4ca] border-[#16422d]'
                }`}
              >
                {t.standard}
              </button>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
};
