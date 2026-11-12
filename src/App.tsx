/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Language, TabType, CityInfo } from './types';
import { POPULAR_CITIES } from './data/cities';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { TasbeehView } from './components/TasbeehView';
import { PrayerTimesView } from './components/PrayerTimesView';
import { QiblaView } from './components/QiblaView';
import { DuasView } from './components/DuasView';

const APP_LANG_KEY = 'noor_language_pref_v1';
const APP_CITY_KEY = 'noor_city_pref_v1';
const APP_SOUND_KEY = 'noor_sound_pref_v1';
const APP_VIBE_KEY = 'noor_vibration_pref_v1';

export default function App() {
  // 1. Language state (en, ur, ar)
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(APP_LANG_KEY);
      if (saved === 'en' || saved === 'ur' || saved === 'ar') {
        return saved;
      }
    } catch (e) {
      console.error(e);
    }
    return 'en';
  });

  // 2. Active Tab
  const [activeTab, setActiveTab] = useState<TabType>('tasbeeh');

  // 3. Selected City (default: Karachi, Pakistan)
  const [selectedCity, setSelectedCity] = useState<CityInfo>(() => {
    try {
      const saved = localStorage.getItem(APP_CITY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const match = POPULAR_CITIES.find((c) => c.id === parsed.id);
        if (match) return match;
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return POPULAR_CITIES[0]; // Karachi, Pakistan
  });

  // 4. Sound & Vibration preferences
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(APP_SOUND_KEY);
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [isVibrationEnabled, setIsVibrationEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(APP_VIBE_KEY);
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  // Handle language change and set document dir="rtl" or "ltr"
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem(APP_LANG_KEY, lang);
  };

  useEffect(() => {
    const isRtl = language === 'ur' || language === 'ar';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Handle city selection
  const handleSelectCity = (city: CityInfo) => {
    setSelectedCity(city);
    try {
      localStorage.setItem(APP_CITY_KEY, JSON.stringify(city));
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle sound
  const handleToggleSound = () => {
    setIsSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(APP_SOUND_KEY, next.toString());
      return next;
    });
  };

  // Toggle vibration
  const handleToggleVibration = () => {
    setIsVibrationEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(APP_VIBE_KEY, next.toString());
      return next;
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#05160e] text-[#f2eee3] islamic-pattern pb-20 md:pb-8 selection:bg-[#d4af37]/30 selection:text-[#f3cf65]">
      {/* Top App Header */}
      <Navbar
        language={language}
        onLanguageChange={handleLanguageChange}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isSoundEnabled={isSoundEnabled}
        onToggleSound={handleToggleSound}
        isVibrationEnabled={isVibrationEnabled}
        onToggleVibration={handleToggleVibration}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-2 sm:px-4 py-4">
        {activeTab === 'tasbeeh' && (
          <TasbeehView
            language={language}
            isSoundEnabled={isSoundEnabled}
            isVibrationEnabled={isVibrationEnabled}
          />
        )}

        {activeTab === 'prayer' && (
          <PrayerTimesView
            language={language}
            selectedCity={selectedCity}
            onSelectCity={handleSelectCity}
            onNavigateToQibla={() => setActiveTab('qibla')}
          />
        )}

        {activeTab === 'qibla' && (
          <QiblaView
            language={language}
            selectedCity={selectedCity}
            onSelectCity={handleSelectCity}
            isVibrationEnabled={isVibrationEnabled}
          />
        )}

        {activeTab === 'duas' && (
          <DuasView language={language} />
        )}
      </main>

      {/* Bottom Navigation for Mobile Devices */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        language={language}
      />
    </div>
  );
}
