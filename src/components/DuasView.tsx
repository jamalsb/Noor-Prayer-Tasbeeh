import React, { useState } from 'react';
import { Language } from '../types';
import { DAILY_DUAS, DuaItem } from '../data/duasData';
import { BookOpen, Copy, Check, Search, Share2 } from 'lucide-react';

interface DuasViewProps {
  language: Language;
}

export const DuasView: React.FC<DuasViewProps> = ({ language }) => {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Adhkar' },
    { id: 'morning', label: 'Morning' },
    { id: 'evening', label: 'Evening' },
    { id: 'prayer', label: 'After Prayer' },
    { id: 'protection', label: 'Protection' },
  ];

  const filteredDuas = DAILY_DUAS.filter((dua) => {
    const matchesCategory = filter === 'all' || dua.category === filter;
    const matchesSearch =
      dua.title.toLowerCase().includes(search.toLowerCase()) ||
      dua.arabic.includes(search) ||
      dua.urdu.includes(search) ||
      dua.translation.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopy = (dua: DuaItem) => {
    const textToCopy = `${dua.title}\n\n${dua.arabic}\n\n${dua.transliteration}\n\nTranslation: ${dua.translation}\nUrdu: ${dua.urdu}\n\nReference: ${dua.reference}\n(Shared from Noor - Prayer & Tasbeeh)`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(dua.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 space-y-4">
      {/* Search & Filter Header */}
      <div className="bg-[#082216] border border-[#16422d] rounded-2xl p-4 shadow-lg shadow-black/30 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7da090]" />
          <input
            type="text"
            placeholder="Search duas, keywords, or meanings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0d2e1f] border border-[#16422d] focus:border-[#d4af37] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-[#7da090] focus:outline-none"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filter === c.id
                  ? 'bg-[#d4af37] text-[#061a12] font-bold shadow-sm'
                  : 'bg-[#0d2e1f] text-[#a1beaf] hover:text-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Duas List */}
      <div className="space-y-3">
        {filteredDuas.map((dua) => (
          <div
            key={dua.id}
            className="bg-[#082216] border border-[#16422d] hover:border-[#1f5a3e] rounded-2xl p-5 shadow-md transition-all space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-[#d4af37] shrink-0" />
                <h3 className="font-semibold text-sm text-[#f3cf65]">
                  {dua.title}
                </h3>
              </div>
              <button
                onClick={() => handleCopy(dua)}
                title="Copy Dua"
                className="p-1.5 rounded-lg bg-[#0d2e1f] hover:bg-[#15462f] text-[#c0d4ca] hover:text-[#f3cf65] border border-[#16422d] transition-colors cursor-pointer shrink-0"
              >
                {copiedId === dua.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>

            {/* Arabic Script */}
            <div className="bg-[#051810]/70 border border-[#123824] rounded-xl p-4 text-center">
              <p className="font-arabic text-2xl md:text-3xl text-[#f3cf65] font-bold leading-loose tracking-wide" dir="rtl">
                {dua.arabic}
              </p>
            </div>

            {/* Transliteration */}
            <p className="text-xs text-[#c0d4ca] italic leading-relaxed">
              {dua.transliteration}
            </p>

            {/* Translation & Urdu */}
            <div className="pt-2 border-t border-[#16422d]/70 space-y-1.5 text-xs">
              <p className="text-[#e2ece6] font-medium leading-relaxed">
                {language === 'ur' ? dua.urdu : dua.translation}
              </p>
              {language !== 'ur' && (
                <p className="text-[#9bb8aa] font-arabic text-sm text-right leading-relaxed" dir="rtl">
                  {dua.urdu}
                </p>
              )}
            </div>

            {/* Reference */}
            <div className="flex items-center justify-between text-[11px] text-[#7da090] pt-1">
              <span>Ref: {dua.reference}</span>
              {dua.target && (
                <span className="text-[#d4af37] font-semibold">
                  Recite {dua.target}x
                </span>
              )}
            </div>
          </div>
        ))}

        {filteredDuas.length === 0 && (
          <div className="text-center py-10 bg-[#082216]/50 rounded-2xl border border-[#16422d] text-[#8caea0] text-xs">
            No supplications found matching "{search}".
          </div>
        )}
      </div>
    </div>
  );
};
