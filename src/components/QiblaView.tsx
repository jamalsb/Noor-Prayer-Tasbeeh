import React, { useState, useEffect, useCallback, useId } from 'react';
import { CityInfo, Language } from '../types';
import { POPULAR_CITIES } from '../data/cities';
import { TRANSLATIONS } from '../data/translations';
import { 
  calculateQiblaDirection, 
  calculateDistanceToKaaba, 
  getCardinalDirection, 
  getAngleDifference,
  KAABA_COORDS 
} from '../utils/qibla';
import { triggerHaptic } from '../utils/audio';
import { Compass, MapPin, CheckCircle, Smartphone, Sliders, ChevronDown } from 'lucide-react';

interface QiblaViewProps {
  language: Language;
  selectedCity: CityInfo;
  onSelectCity: (city: CityInfo) => void;
  isVibrationEnabled: boolean;
}

export const QiblaView: React.FC<QiblaViewProps> = ({
  language,
  selectedCity,
  onSelectCity,
  isVibrationEnabled,
}) => {
  const t = TRANSLATIONS[language];
  const qiblaCitySelectId = useId();

  // Compass state
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [hasCompassSensor, setHasCompassSensor] = useState<boolean | null>(null);
  const [permissionRequested, setPermissionRequested] = useState<boolean>(false);
  const [isManualSimulated, setIsManualSimulated] = useState<boolean>(false);
  const [manualHeading, setManualHeading] = useState<number>(0);
  const [isAligned, setIsAligned] = useState<boolean>(false);

  // Calculate Qibla bearing and distance for currently selected city
  const qiblaBearing = calculateQiblaDirection(selectedCity.latitude, selectedCity.longitude);
  const distanceKm = calculateDistanceToKaaba(selectedCity.latitude, selectedCity.longitude);

  // Active heading is sensor heading unless manually simulated
  const activeHeading = isManualSimulated ? manualHeading : deviceHeading;

  // Relative rotation of the pointer needle
  // When needle points to (qiblaBearing - activeHeading), it points to the Kaaba relative to the phone's top
  const needleRotation = (qiblaBearing - activeHeading + 360) % 360;

  // Check alignment within 4 degrees
  const angleDiff = Math.abs(getAngleDifference(qiblaBearing, activeHeading));
  const currentlyAligned = angleDiff <= 4;

  useEffect(() => {
    if (currentlyAligned && !isAligned) {
      setIsAligned(true);
      if (isVibrationEnabled) triggerHaptic(50);
    } else if (!currentlyAligned && isAligned) {
      setIsAligned(false);
    }
  }, [currentlyAligned, isAligned, isVibrationEnabled]);

  // Handle DeviceOrientation event
  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    // iOS Safari uses webkitCompassHeading (0 = North, clockwise)
    const webkitHeading = (e as unknown as { webkitCompassHeading?: number }).webkitCompassHeading;

    if (webkitHeading !== undefined && webkitHeading !== null) {
      setHasCompassSensor(true);
      setDeviceHeading(Math.round(webkitHeading));
    } else if (e.alpha !== null) {
      setHasCompassSensor(true);
      // Android: alpha is angle around z-axis (counter-clockwise)
      // When compass points North, alpha is 0 or 360
      const heading = (360 - e.alpha) % 360;
      setDeviceHeading(Math.round(heading));
    }
  }, []);

  // Request iOS permission if needed
  const requestCompassPermission = async () => {
    setPermissionRequested(true);
    const DeviceOrientation = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };

    if (typeof DeviceOrientation?.requestPermission === 'function') {
      try {
        const response = await DeviceOrientation.requestPermission();
        if (response === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation, true);
        } else {
          setIsManualSimulated(true);
        }
      } catch (err) {
        console.warn('Compass permission error', err);
        setIsManualSimulated(true);
      }
    } else {
      // Standard Android or browsers without requestPermission
      window.addEventListener('deviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation', handleOrientation as EventListener, true);
    }
  };

  useEffect(() => {
    // Try adding listener directly on mount
    const DeviceOrientation = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };

    if (typeof DeviceOrientation?.requestPermission !== 'function') {
      window.addEventListener('deviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation', handleOrientation as EventListener, true);
    }

    // Set a timeout: if no compass event within 2.5 seconds, flag as sensor-unavailable
    const checkTimer = setTimeout(() => {
      setHasCompassSensor((prev) => {
        if (prev === null) {
          setIsManualSimulated(true);
          return false;
        }
        return prev;
      });
    }, 2500);

    return () => {
      clearTimeout(checkTimer);
      window.removeEventListener('deviceorientation', handleOrientation as EventListener, true);
      window.removeEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
    };
  }, [handleOrientation]);

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-4 flex flex-col items-center">
      {/* City Bar */}
      <div className="w-full bg-[#082216] border border-[#16422d] rounded-2xl p-4 shadow-lg shadow-black/30 mb-4">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <label htmlFor={qiblaCitySelectId} className="text-xs font-semibold uppercase tracking-wider text-[#d4af37] flex items-center gap-1.5">
            <MapPin size={14} />
            <span>{t.selectCity}</span>
          </label>
          <span className="text-xs text-[#a1beaf]">
            {distanceKm.toLocaleString()} km to Makkah
          </span>
        </div>

        <div className="relative">
          <select
            id={qiblaCitySelectId}
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
            <optgroup label="Middle East & World" className="bg-[#0b281d] font-semibold text-[#d4af37]">
              {POPULAR_CITIES.filter((c) => c.countryCode !== 'PK').map((c) => (
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

      {/* Alignment Banner */}
      {isAligned ? (
        <div className="w-full mb-4 py-2.5 px-4 bg-gradient-to-r from-emerald-600/30 via-emerald-500/50 to-emerald-600/30 border border-emerald-400 rounded-xl flex items-center justify-center gap-2 text-emerald-200 font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse">
          <CheckCircle size={18} className="text-[#f3cf65]" />
          <span>{t.alignedWithQibla}</span>
        </div>
      ) : (
        <div className="w-full mb-4 py-2 px-4 bg-[#082216]/60 border border-[#16422d] rounded-xl flex items-center justify-between text-xs text-[#a1beaf]">
          <span>{t.qiblaDirection}: <strong className="text-[#f3cf65]">{qiblaBearing}° {getCardinalDirection(qiblaBearing, language)}</strong></span>
          <span>{t.deviceHeading}: <strong className="text-white">{activeHeading}° {getCardinalDirection(activeHeading, language)}</strong></span>
        </div>
      )}

      {/* Main Qibla Compass Dial Container */}
      <div className="relative w-72 h-72 md:w-80 md:h-80 flex items-center justify-center my-4 select-none">
        {/* Glow halo when aligned */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-300 pointer-events-none ${
            isAligned
              ? 'bg-gradient-to-tr from-[#d4af37]/30 to-emerald-500/30 blur-xl scale-105'
              : 'bg-black/30 blur-md'
          }`}
        />

        {/* Outer Golden Compass Housing Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-[#d4af37]/70 bg-gradient-to-br from-[#0c3120] via-[#071f14] to-[#04120c] shadow-[0_15px_35px_rgba(0,0,0,0.8),inset_0_2px_12px_rgba(212,175,55,0.3)] flex items-center justify-center">
          
          {/* Compass Dial Face - Rotates with device heading so North aligns correctly */}
          <div
            className="absolute inset-2 rounded-full border border-[#1d4f37] transition-transform duration-100 ease-out flex items-center justify-center"
            style={{ transform: `rotate(${-activeHeading}deg)` }}
          >
            {/* Degree Tick marks */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <div
                key={deg}
                className="absolute inset-2 flex justify-center"
                style={{ transform: `rotate(${deg}deg)` }}
              >
                <div
                  className={`w-0.5 rounded-full ${
                    deg % 90 === 0 ? 'h-3 bg-[#f3cf65]' : 'h-1.5 bg-[#42735b]'
                  }`}
                />
              </div>
            ))}

            {/* Cardinal Markers on rotating dial */}
            <span className="absolute top-4 text-xs font-bold text-red-400">N</span>
            <span className="absolute right-4 text-xs font-bold text-[#c0d4ca]">E</span>
            <span className="absolute bottom-4 text-xs font-bold text-[#c0d4ca]">S</span>
            <span className="absolute left-4 text-xs font-bold text-[#c0d4ca]">W</span>

            {/* Fixed Kaaba marker on the rotating dial at the exact Qibla degree */}
            <div
              className="absolute inset-0 flex justify-center items-start pt-1 pointer-events-none"
              style={{ transform: `rotate(${qiblaBearing}deg)` }}
            >
              {/* Kaaba Golden Icon on Dial */}
              <div className="flex flex-col items-center">
                <div className="w-5 h-5 bg-[#d4af37] border border-[#fef08a] rounded-sm flex items-center justify-center shadow-lg shadow-[#d4af37]/60">
                  <div className="w-3.5 h-1.5 bg-[#061a12] rounded-xs" />
                </div>
                <span className="text-[9px] font-bold text-[#f3cf65] mt-0.5 tracking-tighter">
                  KAABA
                </span>
              </div>
            </div>
          </div>

          {/* Device Reference Top Arrow (Always points to top of phone) */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-[#f3cf65] z-20" />

          {/* Rotating Qibla Needle (Points toward Kaaba relative to phone top) */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-150 ease-out z-10"
            style={{ transform: `rotate(${needleRotation}deg)` }}
          >
            {/* North-facing golden pointer needle */}
            <div className="relative w-8 h-44 flex flex-col items-center justify-between">
              {/* Golden Pointer Head towards Kaaba */}
              <div className="flex flex-col items-center">
                <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[38px] border-b-[#f3cf65] filter drop-shadow-[0_0_8px_rgba(243,207,101,0.7)]" />
                <div className="w-2.5 h-14 bg-gradient-to-b from-[#f3cf65] to-[#d4af37]" />
              </div>

              {/* Center Pivot Rosette */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-[#d4af37] to-[#805e13] border-2 border-[#fff] shadow-md flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-[#061a12]" />
              </div>

              {/* Counter-weight tail */}
              <div className="flex flex-col items-center">
                <div className="w-2 h-10 bg-[#355f4a] rounded-b-sm" />
                <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[20px] border-t-[#224434]" />
              </div>
            </div>
          </div>

          {/* Central Degree Badge */}
          <div className="absolute bottom-14 z-20 bg-[#061a12]/90 border border-[#16422d] rounded-full px-3 py-0.5 text-center shadow-md">
            <span className="font-display font-bold text-xs text-[#f3cf65] tabular-nums">
              {qiblaBearing}°
            </span>
          </div>
        </div>
      </div>

      {/* Target coordinates badge */}
      <div className="text-center text-xs text-[#8caea0] mt-1">
        <span>Kaaba Coordinates: </span>
        <span className="tabular-nums text-[#c0d4ca]">
          {KAABA_COORDS.latitude.toFixed(4)}° N, {KAABA_COORDS.longitude.toFixed(4)}° E
        </span>
      </div>

      {/* Compass Controls / Simulator / Sensor request */}
      <div className="w-full mt-6 bg-[#082216] border border-[#16422d] rounded-2xl p-4 text-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-white flex items-center gap-1.5">
            <Compass size={15} className="text-[#d4af37]" />
            <span>Compass Mode</span>
          </span>
          <button
            onClick={() => setIsManualSimulated(!isManualSimulated)}
            className="flex items-center gap-1 text-[#f3cf65] hover:text-white transition-colors cursor-pointer"
          >
            <Sliders size={14} />
            <span>{isManualSimulated ? 'Use Sensor' : 'Manual Dial'}</span>
          </button>
        </div>

        {/* If sensor is active but on iOS permission needs click */}
        {!isManualSimulated && (
          <div className="space-y-2">
            <p className="text-[#a1beaf] text-[11px] leading-relaxed">
              {t.compassInstructions}
            </p>
            {!permissionRequested && (
              <button
                type="button"
                onClick={requestCompassPermission}
                className="w-full py-2 px-3 rounded-xl bg-[#0d2e1f] hover:bg-[#15462f] text-[#f3cf65] font-semibold border border-[#d4af37]/40 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Smartphone size={14} />
                <span>{t.enableCompass}</span>
              </button>
            )}
          </div>
        )}

        {/* Manual Rotation Slider for Desktop / Sensor-less Devices */}
        {isManualSimulated && (
          <div className="space-y-2 pt-1 border-t border-[#16422d]">
            <div className="flex items-center justify-between text-[#c0d4ca]">
              <span>Rotate Compass Needle (Simulator):</span>
              <span className="font-bold text-[#f3cf65] tabular-nums">{manualHeading}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="359"
              value={manualHeading}
              onChange={(e) => setManualHeading(parseInt(e.target.value))}
              className="w-full accent-[#d4af37] cursor-pointer"
            />
            <p className="text-[11px] text-[#7da090]">
              {t.simulatedModeNotice}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
