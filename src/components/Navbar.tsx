import React from 'react';
import { Language, TabType } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { Volume2, VolumeX, Smartphone, Globe } from 'lucide-react';

interface NavbarProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  isVibrationEnabled: boolean;
  onToggleVibration: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  language,
  onLanguageChange,
  activeTab,
  onTabChange,
  isSoundEnabled,
  onToggleSound,
  isVibrationEnabled,
  onToggleVibration,
}) => {
  const t = TRANSLATIONS[language];

  return (
    <header className="sticky top-0 z-40 bg-[#061a12]/95 backdrop-blur-md border-b border-[#16422d]/70 transition-all">
      <div className="max-w-5xl mx-auto px-4 h-15 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#9a761e] flex items-center justify-center shadow-sm shadow-[#d4af37]/20 border border-[#f3cf65]/40 text-[#061a12] font-bold">
            <span className="font-arabic text-base">ن</span>
          </div>
          <div className="flex flex-col">
            <span className="font-display tracking-wider text-base font-bold text-[#f3cf65] whitespace-nowrap">
              NOOR
            </span>
            <span className="text-[10px] text-[#a1beaf] -mt-1 tracking-tight">
              {t.appSubtitle}
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (hidden on mobile, visible on desktop/tablet) */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-[#c0d4ca]">
          <button
            onClick={() => onTabChange('prayer')}
            className={`transition-colors whitespace-nowrap py-1 cursor-pointer ${
              activeTab === 'prayer'
                ? 'text-[#f3cf65] font-semibold border-b-2 border-[#d4af37]'
                : 'hover:text-[#f3cf65]'
            }`}
          >
            {t.prayerTab}
          </button>
          <button
            onClick={() => onTabChange('tasbeeh')}
            className={`transition-colors whitespace-nowrap py-1 cursor-pointer ${
              activeTab === 'tasbeeh'
                ? 'text-[#f3cf65] font-semibold border-b-2 border-[#d4af37]'
                : 'hover:text-[#f3cf65]'
            }`}
          >
            {t.tasbeehTab}
          </button>
          <button
            onClick={() => onTabChange('qibla')}
            className={`transition-colors whitespace-nowrap py-1 cursor-pointer ${
              activeTab === 'qibla'
                ? 'text-[#f3cf65] font-semibold border-b-2 border-[#d4af37]'
                : 'hover:text-[#f3cf65]'
            }`}
          >
            {t.qiblaTab}
          </button>
          <button
            onClick={() => onTabChange('duas')}
            className={`transition-colors whitespace-nowrap py-1 cursor-pointer ${
              activeTab === 'duas'
                ? 'text-[#f3cf65] font-semibold border-b-2 border-[#d4af37]'
                : 'hover:text-[#f3cf65]'
            }`}
          >
            {t.duasTab}
          </button>
        </nav>

        {/* Zone 3: Toggles & Language Selector */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Sound Toggle Button */}
          <button
            onClick={onToggleSound}
            title={isSoundEnabled ? 'Sound On' : 'Sound Off'}
            aria-label="Toggle Sound"
            className={`p-2 rounded-lg text-xs font-medium transition-colors border cursor-pointer ${
              isSoundEnabled
                ? 'bg-[#103a27] text-[#f3cf65] border-[#d4af37]/40'
                : 'bg-[#082216] text-[#719283] border-[#16422d]'
            }`}
          >
            {isSoundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Vibration Toggle Button */}
          <button
            onClick={onToggleVibration}
            title={isVibrationEnabled ? 'Vibration On' : 'Vibration Off'}
            aria-label="Toggle Vibration"
            className={`p-2 rounded-lg text-xs font-medium transition-colors border cursor-pointer ${
              isVibrationEnabled
                ? 'bg-[#103a27] text-[#f3cf65] border-[#d4af37]/40'
                : 'bg-[#082216] text-[#719283] border-[#16422d]'
            }`}
          >
            <Smartphone size={16} />
          </button>

          {/* Language Picker Dropdown */}
          <div className="relative inline-flex items-center">
            <label htmlFor="language-select" className="sr-only">
              {t.language}
            </label>
            <div className="flex items-center bg-[#0d2e1f] border border-[#1d4f37] hover:border-[#d4af37]/50 rounded-lg px-2.5 py-1.5 gap-1.5 transition-colors">
              <Globe size={14} className="text-[#d4af37] shrink-0" />
              <select
                id="language-select"
                value={language}
                onChange={(e) => onLanguageChange(e.target.value as Language)}
                className="bg-transparent text-xs font-medium text-[#f1ede2] focus:outline-none cursor-pointer pr-1"
              >
                <option value="en" className="bg-[#0b281d] text-white">English</option>
                <option value="ur" className="bg-[#0b281d] text-white">اردو</option>
                <option value="ar" className="bg-[#0b281d] text-white">العربية</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
