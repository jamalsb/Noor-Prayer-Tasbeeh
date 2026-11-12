import React, { useState, useEffect, useCallback, useId } from 'react';
import { ZikrItem, Language } from '../types';
import { POPULAR_AZKAR } from '../data/azkar';
import { TRANSLATIONS } from '../data/translations';
import { playBeadClickSound, playCompletionChime, triggerHaptic } from '../utils/audio';
import { RotateCcw, Plus, Undo2, Award, ChevronDown, Check } from 'lucide-react';

interface TasbeehViewProps {
  language: Language;
  isSoundEnabled: boolean;
  isVibrationEnabled: boolean;
}

const STORAGE_KEY = 'noor_tasbeeh_state_v1';
const CUSTOM_AZKAR_KEY = 'noor_custom_azkar_v1';

export const TasbeehView: React.FC<TasbeehViewProps> = ({
  language,
  isSoundEnabled,
  isVibrationEnabled,
}) => {
  const t = TRANSLATIONS[language];
  const zikrSelectId = useId();
  const targetSelectId = useId();

  // Load custom azkar if any
  const [azkarList, setAzkarList] = useState<ZikrItem[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_AZKAR_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return [...POPULAR_AZKAR, ...parsed];
      }
    } catch (e) {
      console.error(e);
    }
    return POPULAR_AZKAR;
  });

  // Selected zikr
  const [selectedZikrId, setSelectedZikrId] = useState<string>('subhanallah');
  
  // Counts & Laps
  const [count, setCount] = useState<number>(0);
  const [target, setTarget] = useState<number>(33);
  const [lap, setLap] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);

  // UI state
  const [isPressing, setIsPressing] = useState<boolean>(false);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [customName, setCustomName] = useState('');
  const [customArabic, setCustomArabic] = useState('');
  const [customMeaning, setCustomMeaning] = useState('');
  const [customTargetVal, setCustomTargetVal] = useState<number>(33);
  const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null);

  // Get active Zikr item
  const currentZikr = azkarList.find((z) => z.id === selectedZikrId) || azkarList[0];

  // Load saved state on mount or when zikr changes
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(`${STORAGE_KEY}_${selectedZikrId}`);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setCount(parsed.count ?? 0);
        setTarget(parsed.target ?? currentZikr.defaultTarget);
        setLap(parsed.lap ?? 0);
        setTotalCount(parsed.totalCount ?? 0);
      } else {
        setCount(0);
        setTarget(currentZikr.defaultTarget);
        setLap(0);
        setTotalCount(0);
      }
    } catch (e) {
      console.error('Failed to load tasbeeh state', e);
    }
  }, [selectedZikrId, currentZikr.defaultTarget]);

  // Persist current state in localStorage
  const saveState = useCallback(
    (newCount: number, newTarget: number, newLap: number, newTotal: number) => {
      try {
        localStorage.setItem(
          `${STORAGE_KEY}_${selectedZikrId}`,
          JSON.stringify({
            count: newCount,
            target: newTarget,
            lap: newLap,
            totalCount: newTotal,
            updatedAt: Date.now(),
          })
        );
      } catch (e) {
        console.error('Failed to save tasbeeh state', e);
      }
    },
    [selectedZikrId]
  );

  // Tap handler (increment)
  const handleTap = useCallback(() => {
    // 1. Audio feedback
    if (isSoundEnabled) {
      playBeadClickSound();
    }

    // 2. Vibration feedback (using navigator.vibrate as requested)
    if (isVibrationEnabled) {
      triggerHaptic(30);
    }

    // 3. Increment math
    const nextCount = count + 1;
    const nextTotal = totalCount + 1;

    if (target > 0 && nextCount >= target) {
      // Completed a cycle/lap!
      const nextLap = lap + 1;
      setCount(0);
      setLap(nextLap);
      setTotalCount(nextTotal);
      saveState(0, target, nextLap, nextTotal);

      // Play completion chime & stronger haptic
      if (isSoundEnabled) playCompletionChime();
      if (isVibrationEnabled) triggerHaptic(80);

      setCelebrationMessage(`${t.completedLap} (${nextLap})`);
      setTimeout(() => setCelebrationMessage(null), 3000);
    } else {
      setCount(nextCount);
      setTotalCount(nextTotal);
      saveState(nextCount, target, lap, nextTotal);
    }
  }, [count, target, lap, totalCount, isSoundEnabled, isVibrationEnabled, saveState, t.completedLap]);

  // Decrement / Undo
  const handleUndo = () => {
    if (count > 0) {
      const nextCount = count - 1;
      const nextTotal = Math.max(0, totalCount - 1);
      setCount(nextCount);
      setTotalCount(nextTotal);
      saveState(nextCount, target, lap, nextTotal);
      if (isVibrationEnabled) triggerHaptic(15);
    }
  };

  // Reset current count
  const handleReset = () => {
    setCount(0);
    setLap(0);
    saveState(0, target, 0, totalCount);
    setShowResetModal(false);
    if (isVibrationEnabled) triggerHaptic(40);
  };

  // Keyboard shortcut listener for spacebar and 'R'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        handleTap();
      } else if (e.key === 'r' || e.key === 'R') {
        setShowResetModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTap]);

  // Target change
  const handleTargetChange = (newTarget: number) => {
    setTarget(newTarget);
    saveState(count, newTarget, lap, totalCount);
  };

  // Custom Dhikr creation
  const handleCreateCustomZikr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newZikr: ZikrItem = {
      id: `custom_${Date.now()}`,
      name: customName.trim(),
      arabic: customArabic.trim() || customName.trim(),
      transliteration: customName.trim(),
      urdu: customMeaning.trim() || customName.trim(),
      translation: customMeaning.trim() || customName.trim(),
      defaultTarget: customTargetVal > 0 ? customTargetVal : 33,
    };

    const updated = [...azkarList, newZikr];
    setAzkarList(updated);

    try {
      const savedCustoms = updated.filter((z) => z.id.startsWith('custom_'));
      localStorage.setItem(CUSTOM_AZKAR_KEY, JSON.stringify(savedCustoms));
    } catch (err) {
      console.error(err);
    }

    setSelectedZikrId(newZikr.id);
    setCount(0);
    setLap(0);
    setTarget(newZikr.defaultTarget);
    setShowCustomModal(false);
    setCustomName('');
    setCustomArabic('');
    setCustomMeaning('');
  };

  // Circular progress calculation
  const progressPercent = target > 0 ? Math.min(100, (count / target) * 100) : 0;
  const radius = 108;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-4 flex flex-col items-center">
      {/* Top Zikr Selector Bar */}
      <div className="w-full bg-[#082216] border border-[#16422d] rounded-2xl p-4 shadow-lg shadow-black/30 mb-5 transition-all">
        <div className="flex items-center justify-between gap-3 mb-2">
          <label htmlFor={zikrSelectId} className="text-xs font-semibold uppercase tracking-wider text-[#d4af37]">
            {t.selectZikr}
          </label>
          <button
            onClick={() => setShowCustomModal(true)}
            className="flex items-center gap-1 text-xs text-[#f3cf65] hover:text-white transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>{t.customZikr}</span>
          </button>
        </div>

        {/* Dropdown for selecting Zikr */}
        <div className="relative">
          <select
            id={zikrSelectId}
            value={selectedZikrId}
            onChange={(e) => setSelectedZikrId(e.target.value)}
            className="w-full appearance-none bg-[#0d2e1f] text-white border border-[#1d4f37] rounded-xl py-3 px-4 pr-10 text-sm font-medium focus:outline-none focus:border-[#d4af37] cursor-pointer shadow-inner"
          >
            {azkarList.map((item) => (
              <option key={item.id} value={item.id} className="bg-[#0b281d] text-white">
                {item.name} ({item.arabic})
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#d4af37]">
            <ChevronDown size={18} />
          </div>
        </div>

        {/* Selected Zikr Display Cards */}
        <div className="mt-4 text-center">
          <p className="font-arabic text-3xl md:text-4xl text-[#f3cf65] font-bold leading-relaxed tracking-wide drop-shadow-sm">
            {currentZikr.arabic}
          </p>
          <p className="text-sm font-medium text-[#e2ece6] mt-1 tracking-wide">
            {currentZikr.transliteration}
          </p>
          <p className="text-xs text-[#9bb8aa] mt-0.5">
            {language === 'ur' ? currentZikr.urdu : currentZikr.translation}
          </p>
          {currentZikr.virtue && (
            <p className="text-[11px] text-[#d4af37]/80 italic mt-2 border-t border-[#16422d]/70 pt-2">
              "{currentZikr.virtue}"
            </p>
          )}
        </div>
      </div>

      {/* Target Selector Bar */}
      <div className="w-full flex items-center justify-between bg-[#082216]/80 border border-[#16422d] rounded-xl px-4 py-2.5 mb-6 text-xs text-[#c0d4ca]">
        <div className="flex items-center gap-2">
          <span className="text-[#a1beaf]">{t.target}:</span>
          <div className="flex items-center gap-1.5">
            {[33, 99, 100].map((val) => (
              <button
                key={val}
                onClick={() => handleTargetChange(val)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  target === val
                    ? 'bg-[#d4af37] text-[#061a12] font-bold shadow-sm'
                    : 'bg-[#0d2e1f] text-[#a1beaf] hover:text-white'
                }`}
              >
                {val}
              </button>
            ))}
            <button
              onClick={() => handleTargetChange(0)}
              className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                target === 0
                  ? 'bg-[#d4af37] text-[#061a12] font-bold shadow-sm'
                  : 'bg-[#0d2e1f] text-[#a1beaf] hover:text-white'
              }`}
            >
              ∞
            </button>
          </div>
        </div>

        {/* Lap Badge */}
        <div className="flex items-center gap-1.5 text-[#f3cf65] font-medium">
          <Award size={15} />
          <span>
            {t.lap}: <span className="tabular-nums font-bold text-white">{lap}</span>
          </span>
        </div>
      </div>

      {/* Celebration Banner */}
      {celebrationMessage && (
        <div className="mb-4 py-2 px-4 bg-gradient-to-r from-[#d4af37]/20 via-[#d4af37]/40 to-[#d4af37]/20 border border-[#d4af37] rounded-xl text-center text-[#f3cf65] font-semibold text-sm animate-pulse">
          ✨ {celebrationMessage}
        </div>
      )}

      {/* Main Circular Tasbeeh Button */}
      <div className="relative flex items-center justify-center my-2 select-none">
        {/* Outer Circular SVG Progress Ring */}
        <svg className="w-72 h-72 md:w-80 md:h-80 -rotate-90 pointer-events-none" viewBox="0 0 240 240">
          {/* Background Track */}
          <circle
            cx="120"
            cy="120"
            r={radius}
            fill="none"
            stroke="#133d2a"
            strokeWidth="10"
            className="opacity-70"
          />
          {/* Progress Stroke */}
          <circle
            cx="120"
            cy="120"
            r={radius}
            fill="none"
            stroke="url(#goldGradient)"
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={target > 0 ? strokeDashoffset : 0}
            strokeLinecap="round"
            className="transition-all duration-150 ease-out"
          />
          {/* Gradients */}
          <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#d4af37" />
              <stop offset="100%" stopColor="#9a761e" />
            </linearGradient>
          </defs>
        </svg>

        {/* Large Tap Button */}
        <button
          type="button"
          onClick={handleTap}
          onMouseDown={() => setIsPressing(true)}
          onMouseUp={() => setIsPressing(false)}
          onTouchStart={() => setIsPressing(true)}
          onTouchEnd={() => setIsPressing(false)}
          aria-label={t.tapToCount}
          className={`absolute w-56 h-56 md:w-62 md:h-62 rounded-full cursor-pointer flex flex-col items-center justify-center transition-all duration-100 ease-out shadow-2xl ${
            isPressing
              ? 'scale-95 shadow-[inset_0_8px_20px_rgba(0,0,0,0.8),0_0_20px_rgba(212,175,55,0.6)] bg-gradient-to-br from-[#072418] via-[#0b2f1f] to-[#04160e]'
              : 'scale-100 shadow-[0_15px_35px_rgba(0,0,0,0.6),0_0_25px_rgba(212,175,55,0.25)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.8),0_0_35px_rgba(212,175,55,0.4)] bg-gradient-to-br from-[#0e3725] via-[#092619] to-[#051810]'
          } border-2 border-[#d4af37]/70 active:border-[#f3cf65]`}
        >
          {/* Subtle Islamic rosette / star emblem in center background */}
          <div className="absolute inset-4 rounded-full border border-[#d4af37]/20 pointer-events-none flex items-center justify-center">
            <div className="w-40 h-40 rounded-full border border-dashed border-[#d4af37]/15" />
          </div>

          {/* Current Count Display */}
          <span className="font-display font-extrabold text-5xl md:text-6xl text-[#f3cf65] tracking-tight tabular-nums drop-shadow-[0_2px_10px_rgba(212,175,55,0.4)]">
            {count}
          </span>

          {/* Subtext Target */}
          <span className="text-xs font-semibold text-[#8caea0] mt-1 tracking-wider uppercase">
            {target > 0 ? `${count} / ${target}` : t.tapToCount}
          </span>

          <span className="text-[10px] text-[#d4af37]/60 mt-1 uppercase tracking-widest">
            {t.tapToCount}
          </span>
        </button>
      </div>

      {/* Control Buttons (Reset, Undo, Storage Indicator) */}
      <div className="w-full flex items-center justify-between gap-3 mt-6">
        {/* Undo button */}
        <button
          onClick={handleUndo}
          disabled={count === 0}
          className={`flex items-center gap-1.5 py-2.5 px-4 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
            count > 0
              ? 'bg-[#082216] hover:bg-[#0e3825] text-[#c0d4ca] border-[#16422d]'
              : 'bg-[#061810]/50 text-[#4d6b5d] border-[#112f20] cursor-not-allowed opacity-50'
          }`}
        >
          <Undo2 size={16} />
          <span>{t.undo}</span>
        </button>

        {/* Saved status text */}
        <div className="flex items-center gap-1.5 text-[11px] text-[#7da090]">
          <Check size={14} className="text-[#d4af37]" />
          <span>{t.savedAutomatically}</span>
        </div>

        {/* Reset button */}
        <button
          onClick={() => setShowResetModal(true)}
          className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#082216] hover:bg-red-950/40 text-red-300 border border-red-900/40 hover:border-red-700/60 text-xs font-medium transition-all cursor-pointer"
        >
          <RotateCcw size={16} />
          <span>{t.reset}</span>
        </button>
      </div>

      {/* Total Sessions Counter */}
      <div className="w-full mt-5 bg-[#082216]/60 border border-[#16422d]/60 rounded-xl p-3 flex items-center justify-between text-xs text-[#a1beaf]">
        <span>{t.totalTaps}:</span>
        <span className="tabular-nums font-bold text-[#f3cf65] text-sm">{totalCount}</span>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#082216] border border-[#d4af37]/40 rounded-2xl p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-800/60 flex items-center justify-center mx-auto mb-3 text-red-400">
              <RotateCcw size={22} />
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              {t.resetConfirmTitle}
            </h3>
            <p className="text-xs text-[#a1beaf] mb-6">
              {t.resetConfirmDesc}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#0d2e1f] hover:bg-[#133d2a] text-[#c0d4ca] text-xs font-semibold border border-[#16422d] cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-semibold cursor-pointer shadow-lg shadow-red-900/30"
              >
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Dhikr Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#082216] border border-[#d4af37]/50 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-[#f3cf65] mb-4 text-center">
              {t.customZikr}
            </h3>
            <form onSubmit={handleCreateCustomZikr} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#c0d4ca] mb-1">
                  {t.customZikrName}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ya Hayyu Ya Qayyum"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-[#0d2e1f] border border-[#16422d] focus:border-[#d4af37] rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c0d4ca] mb-1">
                  Arabic Text (Optional)
                </label>
                <input
                  type="text"
                  dir="rtl"
                  placeholder="يَا حَيُّ يَا قَيُّومُ"
                  value={customArabic}
                  onChange={(e) => setCustomArabic(e.target.value)}
                  className="w-full bg-[#0d2e1f] border border-[#16422d] focus:border-[#d4af37] rounded-xl px-3 py-2 text-sm text-white focus:outline-none font-arabic text-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c0d4ca] mb-1">
                  Meaning / Translation (Optional)
                </label>
                <input
                  type="text"
                  placeholder="O Ever-Living, O Sustainer"
                  value={customMeaning}
                  onChange={(e) => setCustomMeaning(e.target.value)}
                  className="w-full bg-[#0d2e1f] border border-[#16422d] focus:border-[#d4af37] rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor={targetSelectId} className="block text-xs font-medium text-[#c0d4ca] mb-1">
                  {t.customTarget}
                </label>
                <input
                  id={targetSelectId}
                  type="number"
                  min="1"
                  max="10000"
                  value={customTargetVal}
                  onChange={(e) => setCustomTargetVal(parseInt(e.target.value) || 33)}
                  className="w-full bg-[#0d2e1f] border border-[#16422d] focus:border-[#d4af37] rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#0d2e1f] hover:bg-[#133d2a] text-[#c0d4ca] text-xs font-semibold border border-[#16422d] cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#d4af37] hover:bg-[#f3cf65] text-[#061a12] text-xs font-bold shadow-lg shadow-[#d4af37]/30 cursor-pointer"
                >
                  {t.addCustom}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
