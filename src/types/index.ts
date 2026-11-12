export type Language = 'en' | 'ur' | 'ar';

export type TabType = 'tasbeeh' | 'prayer' | 'qibla' | 'duas';

export interface ZikrItem {
  id: string;
  name: string;
  arabic: string;
  transliteration: string;
  urdu: string;
  translation: string;
  defaultTarget: number;
  virtue?: string;
}

export interface CityInfo {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  timezone: string;
  urduName: string;
  arabicName: string;
}

export interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
  Midnight: string;
  Firstthird?: string;
  Lastthird?: string;
}

export interface HijriDateInfo {
  date: string;
  format: string;
  day: string;
  weekday: {
    en: string;
    ar: string;
  };
  month: {
    number: number;
    en: string;
    ar: string;
  };
  year: string;
  designation: {
    abbreviated: string;
    expanded: string;
  };
  holidays: string[];
}

export interface GregorianDateInfo {
  date: string;
  day: string;
  weekday: {
    en: string;
  };
  month: {
    number: number;
    en: string;
  };
  year: string;
}

export interface AladhanResponseData {
  timings: PrayerTimings;
  date: {
    readable: string;
    timestamp: string;
    gregorian: GregorianDateInfo;
    hijri: HijriDateInfo;
  };
  meta: {
    latitude: number;
    longitude: number;
    timezone: string;
    method: {
      id: number;
      name: string;
    };
    school?: {
      id: number;
      name: string;
    };
  };
}

export interface CalculationMethod {
  id: number;
  name: string;
  description: string;
}

export interface TasbeehRecord {
  zikrId: string;
  count: number;
  laps: number;
  target: number;
  lastUpdated: number;
}
