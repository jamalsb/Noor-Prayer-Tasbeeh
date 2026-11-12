export interface DuaItem {
  id: string;
  category: 'morning' | 'evening' | 'prayer' | 'protection' | 'names';
  title: string;
  arabic: string;
  transliteration: string;
  urdu: string;
  translation: string;
  reference: string;
  target?: number;
}

export const DAILY_DUAS: DuaItem[] = [
  {
    id: 'ayat-ul-kursi',
    category: 'prayer',
    title: 'Ayat-ul-Kursi (The Throne Verse)',
    arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ',
    transliteration: 'Allāhu lā ilāha illā huwa l-ḥayyu l-qayyūm, lā taʾkhudhuhū sinatun walā nawm...',
    urdu: 'اللہ کے سوا کوئی معبود نہیں، وہ ہمیشہ زندہ اور سب کا نگہبان ہے۔ اسے نہ اونگھ آتی ہے نہ نیند...',
    translation: 'Allah! There is no deity except Him, the Ever-Living, the Sustainer of all existence. Neither drowsiness overtakes Him nor sleep...',
    reference: 'Surah Al-Baqarah (2:255)',
  },
  {
    id: 'sayyidul-istighfar',
    category: 'morning',
    title: 'Sayyid al-Istighfar (Chief of Prayers for Forgiveness)',
    arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ',
    transliteration: 'Allāhumma anta rabbī lā ilāha illā ant, khalaqtanī wa-anā ʿabduk, wa-anā ʿalā ʿahdika wa-waʿdika mastataʿt...',
    urdu: 'اے اللہ! تو میرا رب ہے، تیرے سوا کوئی معبود نہیں، تو نے مجھے پیدا کیا اور میں تیرا بندہ ہوں...',
    translation: 'O Allah, You are my Lord, there is no god but You. You created me and I am Your servant, and I abide by Your covenant and promise as best I can...',
    reference: 'Sahih al-Bukhari 6306',
  },
  {
    id: 'protection-dua',
    category: 'protection',
    title: 'Dua Against All Harm',
    arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
    transliteration: "Bismillāhilladhī lā yaḍurru ma'asmihī shay'un fil-arḍi wa lā fis-samā'i wa huwas-Samī'ul-'Alīm",
    urdu: 'اللہ کے نام سے جس کے نام کی برکت سے زمین اور آسمان کی کوئی چیز نقصان نہیں پہنچا سکتی، اور وہ خوب سننے والا، خوب جاننے والا ہے۔',
    translation: 'In the name of Allah, with Whose name nothing can cause harm in the earth nor in the heavens, and He is the All-Hearing, the All-Knowing.',
    reference: 'Sunan Abi Dawud (Recite 3x morning & evening)',
    target: 3,
  },
  {
    id: 'evening-protection',
    category: 'evening',
    title: 'Evening Supplication for Refuge',
    arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    transliteration: "A'ūdhu bi-kalimāti Llāhit-tāmmāti min sharri mā khalaq",
    urdu: 'میں اللہ کے مکمل کلمات کے ذریعے پناہ مانگتا ہوں ہر اس چیز کے شر سے جو اس نے پیدا کی۔',
    translation: 'I seek refuge in the perfect words of Allah from the evil of what He has created.',
    reference: 'Sahih Muslim 2709 (Recite 3x in evening)',
    target: 3,
  },
  {
    id: 'anxiety-ease',
    category: 'protection',
    title: 'Dua for Ease and Removal of Anxiety',
    arabic: 'اللَّهُمَّ رَحْمَتَكَ أَرْجُو فَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ، وَأَصْلِحْ لِي شَأْنِي كُلَّهُ، لَا إِلَهَ إِلَّا أَنْتَ',
    transliteration: "Allāhumma raḥmataka arjū falā takilnī ilā nafsī ṭarfata 'ayn, wa-aṣliḥ lī sha'nī kullah, lā ilāha illā ant",
    urdu: 'اے اللہ! میں تیری رحمت کا امیدوار ہوں، مجھے ایک پل کے لیے بھی میرے نفس کے حوالے نہ فرما، اور میرے تمام معاملات سنوار دے۔',
    translation: 'O Allah, it is Your mercy that I hope for, so do not leave me in charge of my affairs even for a blink of an eye, and rectify all my affairs. None has the right to be worshipped except You.',
    reference: 'Sunan Abi Dawud 5090',
  },
];
