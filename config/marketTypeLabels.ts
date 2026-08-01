/**
 * Localized market-type labels — single source of truth for UI copy.
 * On-chain sub-markets use canonical keys (e.g. btts:yes); never embed locale here in chain data.
 * Generated baseline translations; refine per locale over time.
 */
import type { Locale } from "./locales";

export interface MarketTypeLocaleLabels {
  title: string;
  tabLabel: string;
  outcomes: Record<string, string>;
}

export type MarketTypeLabelsMap = Record<
  string,
  Partial<Record<Locale, MarketTypeLocaleLabels>> & {
    en: MarketTypeLocaleLabels;
  }
>;

export const marketTypeLabels = {
  beat: {
    en: {
      title: "To Win",
      tabLabel: "Beat",
      outcomes: {
        yes: "Yes",
        no: "No",
      },
    },
    nl: {
      title: "Wint",
      tabLabel: "Beat",
      outcomes: {
        yes: "Ja",
        no: "Nee",
      },
    },
  },
  "1x2": {
    en: {
      title: "Match Result (1X2)",
      tabLabel: "1X2",
      outcomes: {
        home: "Home",
        draw: "Draw",
        away: "Away"
      }
    },
    nl: {
      title: "Wedstrijdresultaat (1X2)",
      tabLabel: "1X2",
      outcomes: {
        home: "Thuis",
        draw: "Gelijk",
        away: "Uit"
      }
    },
    de: {
      title: "Spielergebnis (1X2)",
      tabLabel: "1X2",
      outcomes: {
        home: "Heim",
        draw: "Unentschieden",
        away: "Auswärts"
      }
    },
    es: {
      title: "Resultado del partido (1X2)",
      tabLabel: "1X2",
      outcomes: {
        home: "Local",
        draw: "Empate",
        away: "Visitante"
      }
    },
    fr: {
      title: "Résultat du match (1X2)",
      tabLabel: "1X2",
      outcomes: {
        home: "Domicile",
        draw: "Nul",
        away: "Extérieur"
      }
    },
    it: {
      title: "Esito della partita (1X2)",
      tabLabel: "1X2",
      outcomes: {
        home: "Casa",
        draw: "Pareggio",
        away: "Trasferta"
      }
    },
    pt: {
      title: "Resultado do jogo (1X2)",
      tabLabel: "1X2",
      outcomes: {
        home: "Casa",
        draw: "Empate",
        away: "Fora"
      }
    },
    tr: {
      title: "Maç Sonucu (1X2)",
      tabLabel: "1X2",
      outcomes: {
        home: "Ev Sahibi",
        draw: "Beraberlik",
        away: "Deplasman"
      }
    },
    id: {
      title: "Hasil Pertandingan (1X2)",
      tabLabel: "1X2",
      outcomes: {
        home: "Tuan Rumah",
        draw: "Seri",
        away: "Tandang"
      }
    },
    th: {
      title: "ผลการแข่งขัน (1X2)",
      tabLabel: "1X2",
      outcomes: {
        home: "เจ้าบ้าน",
        draw: "เสมอ",
        away: "ทีมเยือน"
      }
    },
    vi: {
      title: "Kết quả trận đấu (1X2)",
      tabLabel: "1X2",
      outcomes: {
        home: "Chủ nhà",
        draw: "Hòa",
        away: "Khách"
      }
    },
    ru: {
      title: "Исход матча (1X2)",
      tabLabel: "1X2",
      outcomes: {
        home: "П1",
        draw: "Ничья",
        away: "П2"
      }
    },
    "pt-BR": {
      title: "Resultado da partida (1X2)",
      tabLabel: "1X2",
      outcomes: {
        home: "Casa",
        draw: "Empate",
        away: "Fora"
      }
    },
    zh: {
      title: "比赛结果 (1X2)",
      tabLabel: "1X2",
      outcomes: {
        home: "主胜",
        draw: "平局",
        away: "客胜"
      }
    },
    ja: {
      title: "試合結果 (1X2)",
      tabLabel: "1X2",
      outcomes: {
        home: "ホーム",
        draw: "引き分け",
        away: "アウェイ"
      }
    },
    ko: {
      title: "경기 결과 (1X2)",
      tabLabel: "1X2",
      outcomes: {
        home: "홈",
        draw: "무승부",
        away: "원정"
      }
    },
    ar: {
      title: "نتيجة المباراة (1X2)",
      tabLabel: "1X2",
      outcomes: {
        home: "فوز المضيف",
        draw: "تعادل",
        away: "فوز الضيف"
      }
    },
    hi: {
      title: "मैच परिणाम (1X2)",
      tabLabel: "1X2",
      outcomes: {
        home: "घरेलू",
        draw: "ड्रॉ",
        away: "अवे"
      }
    },
    bn: {
      title: "ম্যাচের ফলাফল (1X2)",
      tabLabel: "1X2",
      outcomes: {
        home: "হোম",
        draw: "ড্র",
        away: "অ্যাওয়ে"
      }
    },
    ur: {
      title: "میچ کا نتیجہ (1X2)",
      tabLabel: "1X2",
      outcomes: {
        home: "ہوم",
        draw: "ڈرا",
        away: "اے وے"
      }
    },
    fa: {
      title: "نتیجه مسابقه (1X2)",
      tabLabel: "1X2",
      outcomes: {
        home: "میزبان",
        draw: "مساوی",
        away: "مهمان"
      }
    },
    pl: {
      title: "Wynik meczu (1X2)",
      tabLabel: "1X2",
      outcomes: {
        home: "Gospodarze",
        draw: "Remis",
        away: "Goście"
      }
    },
    el: {
      title: "Αποτέλεσμα αγώνα (1X2)",
      tabLabel: "1X2",
      outcomes: {
        home: "Έδρα",
        draw: "Ισοπαλία",
        away: "Εκτός"
      }
    },
    sv: {
      title: "Matchresultat (1X2)",
      tabLabel: "1X2",
      outcomes: {
        home: "Hemma",
        draw: "Oavgjort",
        away: "Borta"
      }
    },
    no: {
      title: "Kampresultat (1X2)",
      tabLabel: "1X2",
      outcomes: {
        home: "Hjemme",
        draw: "Uavgjort",
        away: "Borte"
      }
    },
    da: {
      title: "Kampresultat (1X2)",
      tabLabel: "1X2",
      outcomes: {
        home: "Hjemme",
        draw: "Uafgjort",
        away: "Ude"
      }
    },
    fi: {
      title: "Ottelun tulos (1X2)",
      tabLabel: "1X2",
      outcomes: {
        home: "Koti",
        draw: "Tasapeli",
        away: "Vieras"
      }
    }
  },
  btts: {
    en: {
      title: "Both Teams To Score",
      tabLabel: "BTTS",
      outcomes: {
        yes: "Yes",
        no: "No"
      }
    },
    nl: {
      title: "Beide Teams Scoren",
      tabLabel: "Beide Scoren",
      outcomes: {
        yes: "Ja",
        no: "Nee"
      }
    },
    de: {
      title: "Beide Teams treffen",
      tabLabel: "Beide treffen",
      outcomes: {
        yes: "Ja",
        no: "Nein"
      }
    },
    es: {
      title: "Ambos equipos marcan",
      tabLabel: "Ambos marcan",
      outcomes: {
        yes: "Sí",
        no: "No"
      }
    },
    fr: {
      title: "Les deux équipes marquent",
      tabLabel: "Deux équipes marquent",
      outcomes: {
        yes: "Oui",
        no: "Non"
      }
    },
    it: {
      title: "Entrambe le squadre segnano",
      tabLabel: "Entrambe segnano",
      outcomes: {
        yes: "Sì",
        no: "No"
      }
    },
    pt: {
      title: "Ambas as equipas marcam",
      tabLabel: "Ambas marcam",
      outcomes: {
        yes: "Sim",
        no: "Não"
      }
    },
    tr: {
      title: "Karşılıklı Gol",
      tabLabel: "KG",
      outcomes: {
        yes: "Var",
        no: "Yok"
      }
    },
    id: {
      title: "Kedua Tim Mencetak Gol",
      tabLabel: "Kedua Tim Gol",
      outcomes: {
        yes: "Ya",
        no: "Tidak"
      }
    },
    th: {
      title: "ทั้งสองทีมทำประตู",
      tabLabel: "สองทีมยิง",
      outcomes: {
        yes: "ใช่",
        no: "ไม่"
      }
    },
    vi: {
      title: "Cả hai đội ghi bàn",
      tabLabel: "Hai đội ghi bàn",
      outcomes: {
        yes: "Có",
        no: "Không"
      }
    },
    ru: {
      title: "Обе забьют",
      tabLabel: "ОЗ",
      outcomes: {
        yes: "Да",
        no: "Нет"
      }
    },
    "pt-BR": {
      title: "Ambas as equipes marcam",
      tabLabel: "Ambas marcam",
      outcomes: {
        yes: "Sim",
        no: "Não"
      }
    },
    zh: {
      title: "双方球队进球",
      tabLabel: "双方进球",
      outcomes: {
        yes: "是",
        no: "否"
      }
    },
    ja: {
      title: "両チーム得点",
      tabLabel: "両得点",
      outcomes: {
        yes: "はい",
        no: "いいえ"
      }
    },
    ko: {
      title: "양팀 모두 득점",
      tabLabel: "양팀 득점",
      outcomes: {
        yes: "예",
        no: "아니오"
      }
    },
    ar: {
      title: "كلا الفريقين يسجل",
      tabLabel: "كلا يسجل",
      outcomes: {
        yes: "نعم",
        no: "لا"
      }
    },
    hi: {
      title: "दोनों टीमें गोल करेंगी",
      tabLabel: "दोनों गोल",
      outcomes: {
        yes: "हाँ",
        no: "नहीं"
      }
    },
    bn: {
      title: "উভয় দল গোল করবে",
      tabLabel: "উভয় গোল",
      outcomes: {
        yes: "হ্যাঁ",
        no: "না"
      }
    },
    ur: {
      title: "دونوں ٹیمیں گول کریں گی",
      tabLabel: "دونوں گول",
      outcomes: {
        yes: "ہاں",
        no: "نہیں"
      }
    },
    fa: {
      title: "هر دو تیم گل می‌زنند",
      tabLabel: "هر دو گل",
      outcomes: {
        yes: "بله",
        no: "خیر"
      }
    },
    pl: {
      title: "Obie drużyny strzelą",
      tabLabel: "Obie strzelą",
      outcomes: {
        yes: "Tak",
        no: "Nie"
      }
    },
    el: {
      title: "Να σκοράρουν και οι δύο",
      tabLabel: "Και οι δύο",
      outcomes: {
        yes: "Ναι",
        no: "Όχι"
      }
    },
    sv: {
      title: "Båda lagen gör mål",
      tabLabel: "Båda gör mål",
      outcomes: {
        yes: "Ja",
        no: "Nej"
      }
    },
    no: {
      title: "Begge lag scorer",
      tabLabel: "Begge scorer",
      outcomes: {
        yes: "Ja",
        no: "Nei"
      }
    },
    da: {
      title: "Begge hold scorer",
      tabLabel: "Begge scorer",
      outcomes: {
        yes: "Ja",
        no: "Nej"
      }
    },
    fi: {
      title: "Molemmat joukkueet tekevät maalin",
      tabLabel: "Molemmat maaliin",
      outcomes: {
        yes: "Kyllä",
        no: "Ei"
      }
    }
  },
  ou15: {
    en: {
      title: "Total Goals Over/Under 1.5",
      tabLabel: "O/U 1.5",
      outcomes: {
        over: "Over",
        under: "Under"
      }
    },
    nl: {
      title: "Totaal Goals Over/Under 1.5",
      tabLabel: "O/U 1.5",
      outcomes: {
        over: "Over",
        under: "Under"
      }
    },
    de: {
      title: "Gesamttore Über/Unter 1.5",
      tabLabel: "Ü/U 1.5",
      outcomes: {
        over: "Über",
        under: "Unter"
      }
    },
    es: {
      title: "Total goles Más/Menos 1.5",
      tabLabel: "M/M 1.5",
      outcomes: {
        over: "Más",
        under: "Menos"
      }
    },
    fr: {
      title: "Total buts Plus/Moins 1.5",
      tabLabel: "P/M 1.5",
      outcomes: {
        over: "Plus",
        under: "Moins"
      }
    },
    it: {
      title: "Totale gol Over/Under 1.5",
      tabLabel: "O/U 1.5",
      outcomes: {
        over: "Over",
        under: "Under"
      }
    },
    pt: {
      title: "Total golos Mais/Menos 1.5",
      tabLabel: "M/M 1.5",
      outcomes: {
        over: "Mais",
        under: "Menos"
      }
    },
    tr: {
      title: "Toplam Gol Alt/Üst 1.5",
      tabLabel: "A/Ü 1.5",
      outcomes: {
        over: "Üst",
        under: "Alt"
      }
    },
    id: {
      title: "Total Gol Over/Under 1.5",
      tabLabel: "O/U 1.5",
      outcomes: {
        over: "Over",
        under: "Under"
      }
    },
    th: {
      title: "รวมประตู สูง/ต่ำ 1.5",
      tabLabel: "สูง/ต่ำ 1.5",
      outcomes: {
        over: "สูง",
        under: "ต่ำ"
      }
    },
    vi: {
      title: "Tổng bàn thắng Trên/Dưới 1.5",
      tabLabel: "T/D 1.5",
      outcomes: {
        over: "Trên",
        under: "Dưới"
      }
    },
    ru: {
      title: "Тотал больше/меньше 1.5",
      tabLabel: "ТБ/ТМ 1.5",
      outcomes: {
        over: "Больше",
        under: "Меньше"
      }
    },
    "pt-BR": {
      title: "Total de gols Mais/Menos 1.5",
      tabLabel: "M/M 1.5",
      outcomes: {
        over: "Mais",
        under: "Menos"
      }
    },
    zh: {
      title: "总进球 大/小 1.5",
      tabLabel: "大/小 1.5",
      outcomes: {
        over: "大",
        under: "小"
      }
    },
    ja: {
      title: "総得点 オーバー/アンダー 1.5",
      tabLabel: "O/U 1.5",
      outcomes: {
        over: "オーバー",
        under: "アンダー"
      }
    },
    ko: {
      title: "총 득점 오버/언더 1.5",
      tabLabel: "O/U 1.5",
      outcomes: {
        over: "오버",
        under: "언더"
      }
    },
    ar: {
      title: "مجموع الأهداف أكثر/أقل 1.5",
      tabLabel: "أ/أ 1.5",
      outcomes: {
        over: "أكثر",
        under: "أقل"
      }
    },
    hi: {
      title: "कुल गोल ओवर/अंडर 1.5",
      tabLabel: "O/U 1.5",
      outcomes: {
        over: "ओवर",
        under: "अंडर"
      }
    },
    bn: {
      title: "মোট গোল ওভার/আন্ডার 1.5",
      tabLabel: "O/U 1.5",
      outcomes: {
        over: "ওভার",
        under: "আন্ডার"
      }
    },
    ur: {
      title: "کل گول اوور/انڈر 1.5",
      tabLabel: "O/U 1.5",
      outcomes: {
        over: "اوور",
        under: "انڈر"
      }
    },
    fa: {
      title: "مجموع گل بالا/پایین 1.5",
      tabLabel: "O/U 1.5",
      outcomes: {
        over: "بالا",
        under: "پایین"
      }
    },
    pl: {
      title: "Suma bramek powyżej/poniżej 1.5",
      tabLabel: "O/U 1.5",
      outcomes: {
        over: "Powyżej",
        under: "Poniżej"
      }
    },
    el: {
      title: "Σύνολο γκολ Over/Under 1.5",
      tabLabel: "O/U 1.5",
      outcomes: {
        over: "Over",
        under: "Under"
      }
    },
    sv: {
      title: "Totalt antal mål Över/Under 1.5",
      tabLabel: "Ö/U 1.5",
      outcomes: {
        over: "Över",
        under: "Under"
      }
    },
    no: {
      title: "Totalt antall mål Over/Under 1.5",
      tabLabel: "O/U 1.5",
      outcomes: {
        over: "Over",
        under: "Under"
      }
    },
    da: {
      title: "Samlet antal mål Over/Under 1.5",
      tabLabel: "O/U 1.5",
      outcomes: {
        over: "Over",
        under: "Under"
      }
    },
    fi: {
      title: "Maalit yhteensä yli/alle 1.5",
      tabLabel: "Y/A 1.5",
      outcomes: {
        over: "Yli",
        under: "Alle"
      }
    }
  },
  ou25: {
    en: {
      title: "Total Goals Over/Under 2.5",
      tabLabel: "O/U 2.5",
      outcomes: {
        over: "Over",
        under: "Under"
      }
    },
    nl: {
      title: "Totaal Goals Over/Under 2.5",
      tabLabel: "O/U 2.5",
      outcomes: {
        over: "Over",
        under: "Under"
      }
    },
    de: {
      title: "Gesamttore Über/Unter 2.5",
      tabLabel: "Ü/U 2.5",
      outcomes: {
        over: "Über",
        under: "Unter"
      }
    },
    es: {
      title: "Total goles Más/Menos 2.5",
      tabLabel: "M/M 2.5",
      outcomes: {
        over: "Más",
        under: "Menos"
      }
    },
    fr: {
      title: "Total buts Plus/Moins 2.5",
      tabLabel: "P/M 2.5",
      outcomes: {
        over: "Plus",
        under: "Moins"
      }
    },
    it: {
      title: "Totale gol Over/Under 2.5",
      tabLabel: "O/U 2.5",
      outcomes: {
        over: "Over",
        under: "Under"
      }
    },
    pt: {
      title: "Total golos Mais/Menos 2.5",
      tabLabel: "M/M 2.5",
      outcomes: {
        over: "Mais",
        under: "Menos"
      }
    },
    tr: {
      title: "Toplam Gol Alt/Üst 2.5",
      tabLabel: "A/Ü 2.5",
      outcomes: {
        over: "Üst",
        under: "Alt"
      }
    },
    id: {
      title: "Total Gol Over/Under 2.5",
      tabLabel: "O/U 2.5",
      outcomes: {
        over: "Over",
        under: "Under"
      }
    },
    th: {
      title: "รวมประตู สูง/ต่ำ 2.5",
      tabLabel: "สูง/ต่ำ 2.5",
      outcomes: {
        over: "สูง",
        under: "ต่ำ"
      }
    },
    vi: {
      title: "Tổng bàn thắng Trên/Dưới 2.5",
      tabLabel: "T/D 2.5",
      outcomes: {
        over: "Trên",
        under: "Dưới"
      }
    },
    ru: {
      title: "Тотал больше/меньше 2.5",
      tabLabel: "ТБ/ТМ 2.5",
      outcomes: {
        over: "Больше",
        under: "Меньше"
      }
    },
    "pt-BR": {
      title: "Total de gols Mais/Menos 2.5",
      tabLabel: "M/M 2.5",
      outcomes: {
        over: "Mais",
        under: "Menos"
      }
    },
    zh: {
      title: "总进球 大/小 2.5",
      tabLabel: "大/小 2.5",
      outcomes: {
        over: "大",
        under: "小"
      }
    },
    ja: {
      title: "総得点 オーバー/アンダー 2.5",
      tabLabel: "O/U 2.5",
      outcomes: {
        over: "オーバー",
        under: "アンダー"
      }
    },
    ko: {
      title: "총 득점 오버/언더 2.5",
      tabLabel: "O/U 2.5",
      outcomes: {
        over: "오버",
        under: "언더"
      }
    },
    ar: {
      title: "مجموع الأهداف أكثر/أقل 2.5",
      tabLabel: "أ/أ 2.5",
      outcomes: {
        over: "أكثر",
        under: "أقل"
      }
    },
    hi: {
      title: "कुल गोल ओवर/अंडर 2.5",
      tabLabel: "O/U 2.5",
      outcomes: {
        over: "ओवर",
        under: "अंडर"
      }
    },
    bn: {
      title: "মোট গোল ওভার/আন্ডার 2.5",
      tabLabel: "O/U 2.5",
      outcomes: {
        over: "ওভার",
        under: "আন্ডার"
      }
    },
    ur: {
      title: "کل گول اوور/انڈر 2.5",
      tabLabel: "O/U 2.5",
      outcomes: {
        over: "اوور",
        under: "انڈر"
      }
    },
    fa: {
      title: "مجموع گل بالا/پایین 2.5",
      tabLabel: "O/U 2.5",
      outcomes: {
        over: "بالا",
        under: "پایین"
      }
    },
    pl: {
      title: "Suma bramek powyżej/poniżej 2.5",
      tabLabel: "O/U 2.5",
      outcomes: {
        over: "Powyżej",
        under: "Poniżej"
      }
    },
    el: {
      title: "Σύνολο γκολ Over/Under 2.5",
      tabLabel: "O/U 2.5",
      outcomes: {
        over: "Over",
        under: "Under"
      }
    },
    sv: {
      title: "Totalt antal mål Över/Under 2.5",
      tabLabel: "Ö/U 2.5",
      outcomes: {
        over: "Över",
        under: "Under"
      }
    },
    no: {
      title: "Totalt antall mål Over/Under 2.5",
      tabLabel: "O/U 2.5",
      outcomes: {
        over: "Over",
        under: "Under"
      }
    },
    da: {
      title: "Samlet antal mål Over/Under 2.5",
      tabLabel: "O/U 2.5",
      outcomes: {
        over: "Over",
        under: "Under"
      }
    },
    fi: {
      title: "Maalit yhteensä yli/alle 2.5",
      tabLabel: "Y/A 2.5",
      outcomes: {
        over: "Yli",
        under: "Alle"
      }
    }
  },
  ou35: {
    en: {
      title: "Total Goals Over/Under 3.5",
      tabLabel: "O/U 3.5",
      outcomes: {
        over: "Over",
        under: "Under"
      }
    },
    nl: {
      title: "Totaal Goals Over/Under 3.5",
      tabLabel: "O/U 3.5",
      outcomes: {
        over: "Over",
        under: "Under"
      }
    },
    de: {
      title: "Gesamttore Über/Unter 3.5",
      tabLabel: "Ü/U 3.5",
      outcomes: {
        over: "Über",
        under: "Unter"
      }
    },
    es: {
      title: "Total goles Más/Menos 3.5",
      tabLabel: "M/M 3.5",
      outcomes: {
        over: "Más",
        under: "Menos"
      }
    },
    fr: {
      title: "Total buts Plus/Moins 3.5",
      tabLabel: "P/M 3.5",
      outcomes: {
        over: "Plus",
        under: "Moins"
      }
    },
    it: {
      title: "Totale gol Over/Under 3.5",
      tabLabel: "O/U 3.5",
      outcomes: {
        over: "Over",
        under: "Under"
      }
    },
    pt: {
      title: "Total golos Mais/Menos 3.5",
      tabLabel: "M/M 3.5",
      outcomes: {
        over: "Mais",
        under: "Menos"
      }
    },
    tr: {
      title: "Toplam Gol Alt/Üst 3.5",
      tabLabel: "A/Ü 3.5",
      outcomes: {
        over: "Üst",
        under: "Alt"
      }
    },
    id: {
      title: "Total Gol Over/Under 3.5",
      tabLabel: "O/U 3.5",
      outcomes: {
        over: "Over",
        under: "Under"
      }
    },
    th: {
      title: "รวมประตู สูง/ต่ำ 3.5",
      tabLabel: "สูง/ต่ำ 3.5",
      outcomes: {
        over: "สูง",
        under: "ต่ำ"
      }
    },
    vi: {
      title: "Tổng bàn thắng Trên/Dưới 3.5",
      tabLabel: "T/D 3.5",
      outcomes: {
        over: "Trên",
        under: "Dưới"
      }
    },
    ru: {
      title: "Тотал больше/меньше 3.5",
      tabLabel: "ТБ/ТМ 3.5",
      outcomes: {
        over: "Больше",
        under: "Меньше"
      }
    },
    "pt-BR": {
      title: "Total de gols Mais/Menos 3.5",
      tabLabel: "M/M 3.5",
      outcomes: {
        over: "Mais",
        under: "Menos"
      }
    },
    zh: {
      title: "总进球 大/小 3.5",
      tabLabel: "大/小 3.5",
      outcomes: {
        over: "大",
        under: "小"
      }
    },
    ja: {
      title: "総得点 オーバー/アンダー 3.5",
      tabLabel: "O/U 3.5",
      outcomes: {
        over: "オーバー",
        under: "アンダー"
      }
    },
    ko: {
      title: "총 득점 오버/언더 3.5",
      tabLabel: "O/U 3.5",
      outcomes: {
        over: "오버",
        under: "언더"
      }
    },
    ar: {
      title: "مجموع الأهداف أكثر/أقل 3.5",
      tabLabel: "أ/أ 3.5",
      outcomes: {
        over: "أكثر",
        under: "أقل"
      }
    },
    hi: {
      title: "कुल गोल ओवर/अंडर 3.5",
      tabLabel: "O/U 3.5",
      outcomes: {
        over: "ओवर",
        under: "अंडर"
      }
    },
    bn: {
      title: "মোট গোল ওভার/আন্ডার 3.5",
      tabLabel: "O/U 3.5",
      outcomes: {
        over: "ওভার",
        under: "আন্ডার"
      }
    },
    ur: {
      title: "کل گول اوور/انڈر 3.5",
      tabLabel: "O/U 3.5",
      outcomes: {
        over: "اوور",
        under: "انڈر"
      }
    },
    fa: {
      title: "مجموع گل بالا/پایین 3.5",
      tabLabel: "O/U 3.5",
      outcomes: {
        over: "بالا",
        under: "پایین"
      }
    },
    pl: {
      title: "Suma bramek powyżej/poniżej 3.5",
      tabLabel: "O/U 3.5",
      outcomes: {
        over: "Powyżej",
        under: "Poniżej"
      }
    },
    el: {
      title: "Σύνολο γκολ Over/Under 3.5",
      tabLabel: "O/U 3.5",
      outcomes: {
        over: "Over",
        under: "Under"
      }
    },
    sv: {
      title: "Totalt antal mål Över/Under 3.5",
      tabLabel: "Ö/U 3.5",
      outcomes: {
        over: "Över",
        under: "Under"
      }
    },
    no: {
      title: "Totalt antall mål Over/Under 3.5",
      tabLabel: "O/U 3.5",
      outcomes: {
        over: "Over",
        under: "Under"
      }
    },
    da: {
      title: "Samlet antal mål Over/Under 3.5",
      tabLabel: "O/U 3.5",
      outcomes: {
        over: "Over",
        under: "Under"
      }
    },
    fi: {
      title: "Maalit yhteensä yli/alle 3.5",
      tabLabel: "Y/A 3.5",
      outcomes: {
        over: "Yli",
        under: "Alle"
      }
    }
  },
  double_chance: {
    en: {
      title: "Double Chance",
      tabLabel: "Double Chance",
      outcomes: {
        "12": "12",
        "1x": "1X",
        x2: "X2"
      }
    },
    nl: {
      title: "Dubbele Kans",
      tabLabel: "Dubbele Kans",
      outcomes: {
        "12": "12",
        "1x": "1X",
        x2: "X2"
      }
    },
    de: {
      title: "Doppelte Chance",
      tabLabel: "Doppelte Chance",
      outcomes: {
        "12": "12",
        "1x": "1X",
        x2: "X2"
      }
    },
    es: {
      title: "Doble oportunidad",
      tabLabel: "Doble oportunidad",
      outcomes: {
        "12": "12",
        "1x": "1X",
        x2: "X2"
      }
    },
    fr: {
      title: "Double chance",
      tabLabel: "Double chance",
      outcomes: {
        "12": "12",
        "1x": "1X",
        x2: "X2"
      }
    },
    it: {
      title: "Doppia chance",
      tabLabel: "Doppia chance",
      outcomes: {
        "12": "12",
        "1x": "1X",
        x2: "X2"
      }
    },
    pt: {
      title: "Dupla hipótese",
      tabLabel: "Dupla hipótese",
      outcomes: {
        "12": "12",
        "1x": "1X",
        x2: "X2"
      }
    },
    tr: {
      title: "Çifte Şans",
      tabLabel: "Çifte Şans",
      outcomes: {
        "12": "12",
        "1x": "1X",
        x2: "X2"
      }
    },
    id: {
      title: "Peluang Ganda",
      tabLabel: "Peluang Ganda",
      outcomes: {
        "12": "12",
        "1x": "1X",
        x2: "X2"
      }
    },
    th: {
      title: "ดับเบิลแชนซ์",
      tabLabel: "ดับเบิลแชนซ์",
      outcomes: {
        "12": "12",
        "1x": "1X",
        x2: "X2"
      }
    },
    vi: {
      title: "Cơ hội kép",
      tabLabel: "Cơ hội kép",
      outcomes: {
        "12": "12",
        "1x": "1X",
        x2: "X2"
      }
    },
    ru: {
      title: "Двойной шанс",
      tabLabel: "Двойной шанс",
      outcomes: {
        "12": "12",
        "1x": "1X",
        x2: "X2"
      }
    },
    "pt-BR": {
      title: "Dupla chance",
      tabLabel: "Dupla chance",
      outcomes: {
        "12": "12",
        "1x": "1X",
        x2: "X2"
      }
    },
    zh: {
      title: "双重机会",
      tabLabel: "双重机会",
      outcomes: {
        "12": "12",
        "1x": "1X",
        x2: "X2"
      }
    },
    ja: {
      title: "ダブルチャンス",
      tabLabel: "ダブルチャンス",
      outcomes: {
        "12": "12",
        "1x": "1X",
        x2: "X2"
      }
    },
    ko: {
      title: "더블 찬스",
      tabLabel: "더블 찬스",
      outcomes: {
        "12": "12",
        "1x": "1X",
        x2: "X2"
      }
    },
    ar: {
      title: "فرصة مزدوجة",
      tabLabel: "فرصة مزدوجة",
      outcomes: {
        "12": "12",
        "1x": "1X",
        x2: "X2"
      }
    },
    hi: {
      title: "डबल चांस",
      tabLabel: "डबल चांस",
      outcomes: {
        "12": "12",
        "1x": "1X",
        x2: "X2"
      }
    },
    bn: {
      title: "ডাবল চান্স",
      tabLabel: "ডাবল চান্স",
      outcomes: {
        "12": "12",
        "1x": "1X",
        x2: "X2"
      }
    },
    ur: {
      title: "ڈبل چانس",
      tabLabel: "ڈبل چانس",
      outcomes: {
        "12": "12",
        "1x": "1X",
        x2: "X2"
      }
    },
    fa: {
      title: "شانس دوگانه",
      tabLabel: "شانس دوگانه",
      outcomes: {
        "12": "12",
        "1x": "1X",
        x2: "X2"
      }
    },
    pl: {
      title: "Podwójna szansa",
      tabLabel: "Podwójna szansa",
      outcomes: {
        "12": "12",
        "1x": "1X",
        x2: "X2"
      }
    },
    el: {
      title: "Διπλή ευκαιρία",
      tabLabel: "Διπλή ευκαιρία",
      outcomes: {
        "12": "12",
        "1x": "1X",
        x2: "X2"
      }
    },
    sv: {
      title: "Dubbelchans",
      tabLabel: "Dubbelchans",
      outcomes: {
        "12": "12",
        "1x": "1X",
        x2: "X2"
      }
    },
    no: {
      title: "Dobbel sjanse",
      tabLabel: "Dobbel sjanse",
      outcomes: {
        "12": "12",
        "1x": "1X",
        x2: "X2"
      }
    },
    da: {
      title: "Dobbelt chance",
      tabLabel: "Dobbelt chance",
      outcomes: {
        "12": "12",
        "1x": "1X",
        x2: "X2"
      }
    },
    fi: {
      title: "Tuplamahdollisuus",
      tabLabel: "Tuplamahdollisuus",
      outcomes: {
        "12": "12",
        "1x": "1X",
        x2: "X2"
      }
    }
  },
  dnb: {
    en: {
      title: "Draw No Bet",
      tabLabel: "Draw No Bet",
      outcomes: {
        home: "Home",
        away: "Away"
      }
    },
    nl: {
      title: "Draw No Bet",
      tabLabel: "Draw No Bet",
      outcomes: {
        home: "Thuis",
        away: "Uit"
      }
    },
    de: {
      title: "Draw No Bet",
      tabLabel: "Draw No Bet",
      outcomes: {
        home: "Heim",
        away: "Auswärts"
      }
    },
    es: {
      title: "Empate no válido",
      tabLabel: "Empate no válido",
      outcomes: {
        home: "Local",
        away: "Visitante"
      }
    },
    fr: {
      title: "Remboursé si nul",
      tabLabel: "Remboursé si nul",
      outcomes: {
        home: "Domicile",
        away: "Extérieur"
      }
    },
    it: {
      title: "Draw No Bet",
      tabLabel: "Draw No Bet",
      outcomes: {
        home: "Casa",
        away: "Trasferta"
      }
    },
    pt: {
      title: "Empate anula",
      tabLabel: "Empate anula",
      outcomes: {
        home: "Casa",
        away: "Fora"
      }
    },
    tr: {
      title: "Beraberlikte İade",
      tabLabel: "Beraberlikte İade",
      outcomes: {
        home: "Ev Sahibi",
        away: "Deplasman"
      }
    },
    id: {
      title: "Draw No Bet",
      tabLabel: "Draw No Bet",
      outcomes: {
        home: "Tuan Rumah",
        away: "Tandang"
      }
    },
    th: {
      title: "เสมอคืนเงิน",
      tabLabel: "เสมอคืนเงิน",
      outcomes: {
        home: "เจ้าบ้าน",
        away: "ทีมเยือน"
      }
    },
    vi: {
      title: "Hòa hoàn tiền",
      tabLabel: "Hòa hoàn tiền",
      outcomes: {
        home: "Chủ nhà",
        away: "Khách"
      }
    },
    ru: {
      title: "Фора 0 (ничья — возврат)",
      tabLabel: "DNB",
      outcomes: {
        home: "П1",
        away: "П2"
      }
    },
    "pt-BR": {
      title: "Empate anula",
      tabLabel: "Empate anula",
      outcomes: {
        home: "Casa",
        away: "Fora"
      }
    },
    zh: {
      title: "平局退款",
      tabLabel: "平局退款",
      outcomes: {
        home: "主胜",
        away: "客胜"
      }
    },
    ja: {
      title: "ドロー・ノー・ベット",
      tabLabel: "DNB",
      outcomes: {
        home: "ホーム",
        away: "アウェイ"
      }
    },
    ko: {
      title: "무승부 환불",
      tabLabel: "DNB",
      outcomes: {
        home: "홈",
        away: "원정"
      }
    },
    ar: {
      title: "تعادل بدون رهان",
      tabLabel: "DNB",
      outcomes: {
        home: "المضيف",
        away: "الضيف"
      }
    },
    hi: {
      title: "ड्रॉ नो बेट",
      tabLabel: "DNB",
      outcomes: {
        home: "घरेलू",
        away: "अवे"
      }
    },
    bn: {
      title: "ড্র নো বেট",
      tabLabel: "DNB",
      outcomes: {
        home: "হোম",
        away: "অ্যাওয়ে"
      }
    },
    ur: {
      title: "ڈرا نو بیٹ",
      tabLabel: "DNB",
      outcomes: {
        home: "ہوم",
        away: "اے وے"
      }
    },
    fa: {
      title: "تساوی بدون شرط",
      tabLabel: "DNB",
      outcomes: {
        home: "میزبان",
        away: "مهمان"
      }
    },
    pl: {
      title: "Zakład bez remisu",
      tabLabel: "DNB",
      outcomes: {
        home: "Gospodarze",
        away: "Goście"
      }
    },
    el: {
      title: "Draw No Bet",
      tabLabel: "DNB",
      outcomes: {
        home: "Έδρα",
        away: "Εκτός"
      }
    },
    sv: {
      title: "Draw No Bet",
      tabLabel: "DNB",
      outcomes: {
        home: "Hemma",
        away: "Borta"
      }
    },
    no: {
      title: "Draw No Bet",
      tabLabel: "DNB",
      outcomes: {
        home: "Hjemme",
        away: "Borte"
      }
    },
    da: {
      title: "Draw No Bet",
      tabLabel: "DNB",
      outcomes: {
        home: "Hjemme",
        away: "Ude"
      }
    },
    fi: {
      title: "Draw No Bet",
      tabLabel: "DNB",
      outcomes: {
        home: "Koti",
        away: "Vieras"
      }
    }
  }
} as const satisfies MarketTypeLabelsMap;
