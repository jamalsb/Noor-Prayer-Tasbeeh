import React from 'react';
import { TabType, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { Clock, Compass, BookOpen, CircleDot } from 'lucide-react';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  language: Language;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  language,
}) => {
  const t = TRANSLATIONS[language];

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: 'prayer',
      label: t.prayerTab,
      icon: <Clock size={20} />,
    },
    {
      id: 'tasbeeh',
      label: t.tasbeehTab,
      icon: <CircleDot size={20} />,
    },
    {
      id: 'qibla',
      label: t.qiblaTab,
      icon: <Compass size={20} />,
    },
    {
      id: 'duas',
      label: t.duasTab,
      icon: <BookOpen size={20} />,
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#061a12]/95 backdrop-blur-md border-t border-[#184e3a] transition-all"
      aria-label="Bottom Navigation"
    >
      <div className="grid grid-cols-4 max-w-md mx-auto px-2 py-1.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center min-h-[50px] rounded-xl transition-all relative cursor-pointer ${
                isActive
                  ? 'text-[#f3cf65]'
                  : 'text-[#82a494] hover:text-[#c4ded3]'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 w-8 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent rounded-full" />
              )}
              <div
                className={`p-1 transition-transform ${
                  isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]' : ''
                }`}
              >
                {tab.icon}
              </div>
              <span
                className={`text-[11px] tracking-tight mt-0.5 whitespace-nowrap ${
                  isActive ? 'font-semibold text-[#f3cf65]' : 'font-medium'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
