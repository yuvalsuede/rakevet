// Full station list — extracted from sh0oki/israel-rail-api (official API IDs)
// Verified against the Python library source: stations.py
// Each station has: id (string matching API), nameHe (Hebrew), nameEn (English)

const STATIONS = [
  // Tel Aviv cluster
  { id: '3700', nameHe: 'תל אביב - סבידור מרכז', nameEn: 'Tel Aviv - Savidor Center' },
  { id: '4600', nameHe: 'תל אביב - השלום', nameEn: 'Tel Aviv - HaShalom' },
  { id: '3600', nameHe: 'תל אביב - אוניברסיטה', nameEn: 'Tel Aviv - University' },
  { id: '4900', nameHe: 'תל אביב - ההגנה', nameEn: 'Tel Aviv - HaHagana' },

  // North of Tel Aviv
  { id: '3500', nameHe: 'הרצליה', nameEn: 'Herzliya' },
  { id: '3400', nameHe: 'בית יהושע', nameEn: 'Bet Yehoshua' },
  { id: '3300', nameHe: 'נתניה', nameEn: 'Netanya' },
  { id: '3310', nameHe: 'נתניה - ספיר', nameEn: 'Netanya - Sapir' },
  { id: '3100', nameHe: 'חדרה - מערב', nameEn: 'Hadera - West' },
  { id: '2820', nameHe: 'קיסריה - פרדס חנה', nameEn: 'Caesarea - Pardes Hana' },
  { id: '2800', nameHe: 'בנימינה', nameEn: 'Binyamina' },
  { id: '2500', nameHe: 'עתלית', nameEn: 'Atlit' },

  // Haifa cluster
  { id: '2100', nameHe: 'חיפה - מרכז השמונה', nameEn: 'Haifa Center - HaShmona' },
  { id: '2300', nameHe: 'חיפה - חוף הכרמל', nameEn: 'Haifa - Hof HaCarmel' },
  { id: '2200', nameHe: 'חיפה - בת גלים', nameEn: 'Haifa - Bat Galim' },
  { id: '1300', nameHe: 'חוצות המפרץ', nameEn: 'Hutsot HaMifrats' },
  { id: '1220', nameHe: 'לב המפרץ', nameEn: 'Lev HaMifrats' },
  { id: '700', nameHe: 'קריית חיים', nameEn: 'Kiryat Hayim' },
  { id: '1400', nameHe: 'קריית מוצקין', nameEn: 'Kiryat Motzkin' },

  // North
  { id: '1500', nameHe: 'עכו', nameEn: 'Ako' },
  { id: '1600', nameHe: 'נהריה', nameEn: 'Nahariya' },

  // Karmiel line
  { id: '1820', nameHe: 'אחיהוד', nameEn: 'Ahihud' },
  { id: '1840', nameHe: 'כרמיאל', nameEn: 'Karmiel' },

  // Valley line
  { id: '1240', nameHe: 'יקנעם - כפר יהושע', nameEn: 'Yokneam - Kfar Yehoshua' },
  { id: '1250', nameHe: 'מגדל העמק - כפר ברוך', nameEn: 'Migdal HaEmek - Kfar Baruch' },
  { id: '1260', nameHe: 'עפולה - ר. איתן', nameEn: 'Afula - R. Eitan' },
  { id: '1280', nameHe: 'בית שאן', nameEn: 'Beit Shean' },

  // Dan region (east)
  { id: '4100', nameHe: 'בני ברק', nameEn: 'Bnei Brak' },
  { id: '4250', nameHe: 'פתח תקווה - סגולה', nameEn: 'Petah Tikva - Segula' },
  { id: '4170', nameHe: 'פתח תקווה - קריית אריה', nameEn: 'Petah Tikva - Kiryat Arye' },
  { id: '8700', nameHe: 'כפר סבא - נורדאו', nameEn: 'Kfar Sava - Nordau' },
  { id: '9200', nameHe: 'הוד השרון - סוקולוב', nameEn: 'Hod HaSharon - Sokolov' },
  { id: '8800', nameHe: 'ראש העין - צפון', nameEn: 'Rosh HaAyin - North' },
  { id: '2940', nameHe: 'רעננה - מערב', nameEn: 'Raanana - West' },
  { id: '2960', nameHe: 'רעננה - דרום', nameEn: 'Raanana - South' },

  // South of Tel Aviv
  { id: '4640', nameHe: 'חולון - צומת', nameEn: 'Holon Junction' },
  { id: '4660', nameHe: 'חולון - וולפסון', nameEn: 'Holon - Wolfson' },
  { id: '4680', nameHe: 'בת ים - יוספטל', nameEn: 'Bat Yam - Yoseftal' },
  { id: '4690', nameHe: 'בת ים - קוממיות', nameEn: 'Bat Yam - Komemiyut' },

  // Central / Lod
  { id: '5000', nameHe: 'לוד', nameEn: 'Lod' },
  { id: '5150', nameHe: 'לוד - גני אביב', nameEn: 'Lod - Gane Aviv' },
  { id: '5010', nameHe: 'רמלה', nameEn: 'Ramla' },
  { id: '4800', nameHe: 'כפר חב"ד', nameEn: 'Kfar Habad' },
  { id: '9100', nameHe: 'ראשון לציון - הראשונים', nameEn: 'Rishon LeTsiyon - HaRishonim' },
  { id: '9800', nameHe: 'ראשון לציון - משה דיין', nameEn: 'Rishon LeTsiyon - Moshe Dayan' },

  // Jerusalem
  { id: '680', nameHe: 'ירושלים - יצחק נבון', nameEn: 'Jerusalem - Yitzhak Navon' },
  { id: '6700', nameHe: 'ירושלים - מלחה', nameEn: 'Jerusalem - Malha' },
  { id: '8600', nameHe: 'נתב"ג', nameEn: 'Ben Gurion Airport' },
  { id: '6300', nameHe: 'בית שמש', nameEn: 'Beit Shemesh' },

  // Modi'in
  { id: '400', nameHe: 'מודיעין - מרכז', nameEn: 'Modiin - Center' },
  { id: '300', nameHe: 'פאתי מודיעין', nameEn: 'Paatei Modiin' },

  // South
  { id: '5300', nameHe: 'באר יעקב', nameEn: 'Beer Yaakov' },
  { id: '5200', nameHe: 'רחובות', nameEn: 'Rehovot' },
  { id: '5410', nameHe: 'יבנה - מזרח', nameEn: 'Yavne - East' },
  { id: '9000', nameHe: 'יבנה - מערב', nameEn: 'Yavne - West' },
  { id: '6900', nameHe: 'מזכרת בתיה', nameEn: 'Mazkeret Batya' },
  { id: '5800', nameHe: 'אשדוד עד הלום', nameEn: 'Ashdod - Ad Halom' },
  { id: '6150', nameHe: 'קריית מלאכי - יואב', nameEn: 'Kiryat Malakhi - Yoav' },
  { id: '5900', nameHe: 'אשקלון', nameEn: 'Ashkelon' },
  { id: '7000', nameHe: 'קריית גת', nameEn: 'Kiryat Gat' },
  { id: '8550', nameHe: 'להבים - רהט', nameEn: 'Lehavim - Rahat' },

  // Beer Sheva
  { id: '7300', nameHe: 'באר שבע - צפון/אוניברסיטה', nameEn: 'Beer Sheva - North/University' },
  { id: '7320', nameHe: 'באר שבע - מרכז', nameEn: 'Beer Sheva - Center' },
  { id: '7500', nameHe: 'דימונה', nameEn: 'Dimona' },

  // Western Negev
  { id: '9600', nameHe: 'שדרות', nameEn: 'Sderot' },
  { id: '9650', nameHe: 'נתיבות', nameEn: 'Netivot' },
  { id: '9700', nameHe: 'אופקים', nameEn: 'Ofakim' },
];

// Create lookup maps for fast access
export const stationById = {};
export const stationsByNameHe = {};
STATIONS.forEach(s => {
  stationById[s.id] = s;
  stationsByNameHe[s.nameHe] = s;
});

// Get station name by ID (with fallback)
export function getStationName(id) {
  const s = stationById[String(id)];
  return s ? s.nameHe : `תחנה ${id}`;
}

// Sort stations alphabetically by Hebrew name for pickers
export const sortedStations = [...STATIONS].sort((a, b) =>
  a.nameHe.localeCompare(b.nameHe, 'he')
);

export default STATIONS;
