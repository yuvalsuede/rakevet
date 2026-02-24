import React, { useState, useRef, useCallback } from 'react';
import { SearchIcon, ListIcon, XIcon } from './Icons';

const BLUE = '#0B3D91';
const BLUE_DARK = '#062555';
const BLUE_PALE = '#E3F2FD';
const ACCENT = '#FF6F00';
const GRAY_MED = '#9E9E9E';
const GRAY_DARK = '#616161';
const WHITE = '#FFFFFF';

// Map station schematic IDs → Israel Railways API IDs
const MAP_ID_TO_API = {
  nahariya: '1600', ako: '1500', kmotzkin: '1400', karmiel: '1840', ahihud: '1820',
  khaim: '700', hutsot: '1300', levhamifrats: '1220', haifa: '2100', batgalim: '2200',
  hofcarmel: '2300', yokneam: '1240', afula: '1260', betshean: '1280',
  atlit: '2500', binyamina: '2800', caesarea: '2820', hadera: '3100', netanya: '3300',
  betyehoshua: '3400', hodsharon: '9200', kfarsava: '8700', roshaayin: '8800',
  petahtikva: '4250', petahtikva_ka: '4170', bnei_brak: '4100',
  hertsliya: '3500', ta_uni: '3600', ta_savidor: '3700', ta_shalom: '4600', ta_hagana: '4900',
  holon_jct: '4640', holon_wolf: '4660', batyam_y: '4680', batyam_k: '4690',
  rishon_md: '9800', yavne_w: '9000',
  airport: '8600', jlm_navon: '680', paatei_modiin: '300', modiin: '400',
  beit_shemesh: '6300', jlm_malha: '6700',
  lod: '5000', kfar_habad: '4800', ramla: '5010', rehovot: '5200', yavne_e: '5410',
  beer_yaakov: '5300', rishon_hr: '9100',
  ashdod: '5800', ashkelon: '5900', sderot: '9600', netivot: '9650', ofakim: '9700',
  kgat: '7000', lehavim: '8550', bs_north: '7300', bs_center: '7320', dimona: '7500',
};

// Line colors — must match lines.js IDs
const LC = {
  coast: '#1565C0',
  jlm: '#C62828',
  valley: '#2E7D32',
  modiin: '#FF6F00',
  south: '#6A1B9A',
  karmiel: '#00838F',
  raanana: '#E91E63',
  'nahariya-modiin': '#7CB342',
  'binyamina-ashkelon': '#1E88E5',
  'herzliya-beersheva': '#EF6C00',
  'jlm-old': '#F48FB1',
  rishon: '#9C27B0',
  dimona: '#795548',
  'haifa-local': '#FF8A80',
  night: '#263238',
};

// Station positions on the schematic map
const MAP_STATIONS = [
  // North
  { id: 'nahariya', name: 'נהריה', x: 180, y: 30, anchor: 'start', lines: ['coast', 'nahariya-modiin', 'night'] },
  { id: 'ako', name: 'עכו', x: 180, y: 65, anchor: 'start', lines: ['coast', 'nahariya-modiin', 'night'] },
  { id: 'kmotzkin', name: 'ק. מוצקין', x: 180, y: 95, anchor: 'start', lines: ['coast', 'nahariya-modiin', 'haifa-local', 'night'] },
  { id: 'karmiel', name: 'כרמיאל', x: 330, y: 50, anchor: 'end', lines: ['karmiel'] },
  { id: 'ahihud', name: 'אחיהוד', x: 310, y: 80, anchor: 'end', lines: ['karmiel'] },

  // Haifa cluster
  { id: 'khaim', name: 'ק. חיים', x: 220, y: 110, anchor: 'end', lines: ['coast', 'nahariya-modiin', 'haifa-local'] },
  { id: 'hutsot', name: 'חוצות המפרץ', x: 220, y: 125, anchor: 'end', lines: ['coast', 'nahariya-modiin', 'haifa-local'] },
  { id: 'levhamifrats', name: 'לב המפרץ', x: 220, y: 140, anchor: 'end', lines: ['nahariya-modiin', 'karmiel', 'valley', 'haifa-local'] },
  { id: 'haifa', name: 'חיפה מרכז', x: 180, y: 155, anchor: 'start', lines: ['coast', 'valley', 'karmiel', 'nahariya-modiin', 'haifa-local', 'night'], major: true },
  { id: 'batgalim', name: 'בת גלים', x: 180, y: 175, anchor: 'start', lines: ['nahariya-modiin', 'haifa-local'] },
  { id: 'hofcarmel', name: 'חוף הכרמל', x: 180, y: 195, anchor: 'start', lines: ['coast', 'nahariya-modiin', 'haifa-local', 'night'] },

  // Valley line
  { id: 'yokneam', name: 'יקנעם', x: 320, y: 155, anchor: 'end', lines: ['valley'] },
  { id: 'afula', name: 'עפולה', x: 360, y: 185, anchor: 'end', lines: ['valley'] },
  { id: 'betshean', name: 'בית שאן', x: 390, y: 220, anchor: 'end', lines: ['valley'] },

  // Coast mid
  { id: 'atlit', name: 'עתלית', x: 170, y: 215, anchor: 'start', lines: ['coast', 'nahariya-modiin'] },
  { id: 'binyamina', name: 'בנימינה', x: 160, y: 240, anchor: 'start', lines: ['coast', 'nahariya-modiin', 'binyamina-ashkelon', 'night'] },
  { id: 'caesarea', name: 'קיסריה-פ"ח', x: 155, y: 260, anchor: 'start', lines: ['coast', 'binyamina-ashkelon'] },
  { id: 'hadera', name: 'חדרה', x: 150, y: 280, anchor: 'start', lines: ['coast', 'binyamina-ashkelon', 'night'] },
  { id: 'netanya', name: 'נתניה', x: 140, y: 310, anchor: 'start', lines: ['coast', 'binyamina-ashkelon', 'night'] },
  { id: 'betyehoshua', name: 'בית יהושע', x: 135, y: 330, anchor: 'start', lines: ['binyamina-ashkelon'] },

  // Raanana / East line
  { id: 'hodsharon', name: 'הוד השרון', x: 255, y: 340, anchor: 'end', lines: ['raanana'] },
  { id: 'kfarsava', name: 'כפר סבא', x: 270, y: 360, anchor: 'end', lines: ['raanana'] },
  { id: 'roshaayin', name: 'ראש העין', x: 290, y: 385, anchor: 'end', lines: ['raanana'] },
  { id: 'petahtikva', name: 'פ"ת סגולה', x: 280, y: 408, anchor: 'end', lines: ['raanana'] },
  { id: 'petahtikva_ka', name: 'פ"ת ק. אריה', x: 265, y: 428, anchor: 'end', lines: ['raanana'] },
  { id: 'bnei_brak', name: 'בני ברק', x: 250, y: 448, anchor: 'end', lines: ['raanana'] },

  // Herzliya + TA cluster
  { id: 'hertsliya', name: 'הרצליה', x: 125, y: 355, anchor: 'start', lines: ['coast', 'jlm', 'binyamina-ashkelon', 'herzliya-beersheva', 'night'] },
  { id: 'ta_uni', name: 'ת"א אוניברסיטה', x: 115, y: 385, anchor: 'start', lines: ['coast', 'jlm', 'nahariya-modiin', 'binyamina-ashkelon', 'herzliya-beersheva', 'raanana', 'night'] },
  { id: 'ta_savidor', name: 'ת"א סבידור', x: 110, y: 415, anchor: 'start', lines: ['coast', 'jlm', 'modiin', 'nahariya-modiin', 'binyamina-ashkelon', 'herzliya-beersheva', 'raanana', 'jlm-old', 'night'], major: true },
  { id: 'ta_shalom', name: 'ת"א השלום', x: 105, y: 440, anchor: 'start', lines: ['coast', 'jlm', 'modiin', 'nahariya-modiin', 'binyamina-ashkelon', 'herzliya-beersheva', 'raanana', 'jlm-old', 'night'] },
  { id: 'ta_hagana', name: 'ת"א ההגנה', x: 100, y: 465, anchor: 'start', lines: ['coast', 'jlm', 'modiin', 'south', 'nahariya-modiin', 'binyamina-ashkelon', 'herzliya-beersheva', 'raanana', 'jlm-old', 'rishon', 'night'], major: true },

  // Bat Yam / Holon / Rishon branch (raanana line extends south)
  { id: 'holon_jct', name: 'חולון צומת', x: 72, y: 492, anchor: 'start', lines: ['raanana'] },
  { id: 'holon_wolf', name: 'חולון וולפסון', x: 62, y: 512, anchor: 'start', lines: ['raanana'] },
  { id: 'batyam_y', name: 'בת ים יוספטל', x: 52, y: 532, anchor: 'start', lines: ['raanana'] },
  { id: 'batyam_k', name: 'בת ים קוממיות', x: 45, y: 552, anchor: 'start', lines: ['raanana'] },
  { id: 'rishon_md', name: 'ראשל"צ מ. דיין', x: 55, y: 575, anchor: 'start', lines: ['raanana'] },
  { id: 'yavne_w', name: 'יבנה מערב', x: 70, y: 598, anchor: 'start', lines: ['raanana'] },

  // Airport / Jerusalem express
  { id: 'airport', name: 'נתב"ג', x: 200, y: 495, anchor: 'end', lines: ['jlm', 'nahariya-modiin'] },
  { id: 'jlm_navon', name: 'ירושלים נבון', x: 330, y: 495, anchor: 'end', lines: ['jlm'], major: true },

  // Modi'in branch
  { id: 'paatei_modiin', name: 'פאתי מודיעין', x: 260, y: 515, anchor: 'end', lines: ['modiin', 'nahariya-modiin'] },
  { id: 'modiin', name: 'מודיעין', x: 285, y: 540, anchor: 'end', lines: ['modiin', 'nahariya-modiin'] },

  // Jerusalem old line (via Beit Shemesh)
  { id: 'beit_shemesh', name: 'בית שמש', x: 310, y: 540, anchor: 'end', lines: ['jlm-old'] },
  { id: 'jlm_malha', name: 'ירושלים מלחה', x: 360, y: 560, anchor: 'end', lines: ['jlm-old'], major: true },

  // Central / Lod area
  { id: 'lod', name: 'לוד', x: 155, y: 520, anchor: 'start', lines: ['coast', 'modiin', 'south', 'binyamina-ashkelon', 'jlm-old'], major: true },
  { id: 'kfar_habad', name: 'כפר חב"ד', x: 145, y: 498, anchor: 'start', lines: ['rishon'] },
  { id: 'ramla', name: 'רמלה', x: 150, y: 545, anchor: 'start', lines: ['coast', 'jlm-old'] },
  { id: 'rehovot', name: 'רחובות', x: 140, y: 570, anchor: 'start', lines: ['coast', 'binyamina-ashkelon'] },
  { id: 'yavne_e', name: 'יבנה מזרח', x: 130, y: 595, anchor: 'start', lines: ['coast', 'binyamina-ashkelon'] },

  // Rishon short line
  { id: 'beer_yaakov', name: 'באר יעקב', x: 155, y: 550, anchor: 'end', lines: ['coast', 'south', 'binyamina-ashkelon', 'rishon'] },
  { id: 'rishon_hr', name: 'ראשל"צ הראשונים', x: 175, y: 575, anchor: 'end', lines: ['rishon'] },

  // South
  { id: 'ashdod', name: 'אשדוד', x: 115, y: 625, anchor: 'start', lines: ['coast', 'south', 'binyamina-ashkelon'] },
  { id: 'ashkelon', name: 'אשקלון', x: 105, y: 655, anchor: 'start', lines: ['coast', 'south', 'binyamina-ashkelon'] },
  { id: 'sderot', name: 'שדרות', x: 120, y: 685, anchor: 'start', lines: ['south'] },
  { id: 'netivot', name: 'נתיבות', x: 140, y: 710, anchor: 'start', lines: ['south'] },
  { id: 'ofakim', name: 'אופקים', x: 165, y: 735, anchor: 'start', lines: ['south'] },

  // Beer Sheva corridor (coast express + herzliya-beersheva)
  { id: 'kgat', name: 'קריית גת', x: 170, y: 660, anchor: 'end', lines: ['coast', 'herzliya-beersheva'] },
  { id: 'lehavim', name: 'להבים - רהט', x: 195, y: 690, anchor: 'end', lines: ['coast'] },
  { id: 'bs_north', name: 'ב"ש צפון', x: 220, y: 720, anchor: 'end', lines: ['coast', 'herzliya-beersheva', 'dimona', 'night'], major: true },
  { id: 'bs_center', name: 'ב"ש מרכז', x: 240, y: 750, anchor: 'end', lines: ['coast', 'herzliya-beersheva', 'night'], major: true },
  { id: 'dimona', name: 'דימונה', x: 285, y: 770, anchor: 'end', lines: ['dimona'] },
];

const LEGEND = [
  { key: 'coast', label: 'קו חוף' },
  { key: 'jlm', label: 'ירושלים מהיר' },
  { key: 'valley', label: 'קו העמק' },
  { key: 'modiin', label: 'מודיעין' },
  { key: 'south', label: 'דרום' },
  { key: 'karmiel', label: 'כרמיאל' },
  { key: 'raanana', label: 'הוד השרון - יבנה מ׳' },
  { key: 'nahariya-modiin', label: 'נהריה - מודיעין' },
  { key: 'binyamina-ashkelon', label: 'בנימינה - אשקלון' },
  { key: 'herzliya-beersheva', label: 'הרצליה - ב"ש מהיר' },
  { key: 'jlm-old', label: 'ירושלים (בית שמש)' },
  { key: 'rishon', label: 'ראשון לציון' },
  { key: 'dimona', label: 'ב"ש - דימונה' },
  { key: 'haifa-local', label: 'חיפה מקומי' },
  { key: 'night', label: 'קו לילה' },
];

export default function LineMap({ onNavigateToSearch, onNavigateToSchedule }) {
  const [selectedStation, setSelectedStation] = useState(null);

  // Zoom/pan state
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const containerRef = useRef(null);
  const gestureRef = useRef({ startDist: 0, startScale: 1, startX: 0, startY: 0, lastX: 0, lastY: 0, isPinch: false });

  const clampTransform = useCallback((s, x, y) => {
    const scale = Math.min(Math.max(s, 1), 4);
    // When zoomed in, allow panning but keep map within bounds
    const maxPan = (scale - 1) * 200;
    const cx = Math.min(Math.max(x, -maxPan), maxPan);
    const cy = Math.min(Math.max(y, -maxPan), maxPan);
    return { scale, x: cx, y: cy };
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    setTransform(prev => {
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      return clampTransform(prev.scale + delta, prev.x, prev.y);
    });
  }, [clampTransform]);

  const handleTouchStart = useCallback((e) => {
    const g = gestureRef.current;
    if (e.touches.length === 2) {
      g.isPinch = true;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      g.startDist = Math.hypot(dx, dy);
      g.startScale = transform.scale;
      g.startX = transform.x;
      g.startY = transform.y;
      const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      g.lastX = mx;
      g.lastY = my;
    } else if (e.touches.length === 1 && transform.scale > 1) {
      g.isPinch = false;
      g.lastX = e.touches[0].clientX;
      g.lastY = e.touches[0].clientY;
      g.startX = transform.x;
      g.startY = transform.y;
    }
  }, [transform]);

  const handleTouchMove = useCallback((e) => {
    const g = gestureRef.current;
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const newScale = g.startScale * (dist / g.startDist);
      const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const panX = g.startX + (mx - g.lastX);
      const panY = g.startY + (my - g.lastY);
      setTransform(clampTransform(newScale, panX, panY));
    } else if (e.touches.length === 1 && transform.scale > 1 && !g.isPinch) {
      e.preventDefault();
      const panX = g.startX + (e.touches[0].clientX - g.lastX);
      const panY = g.startY + (e.touches[0].clientY - g.lastY);
      setTransform(clampTransform(transform.scale, panX, panY));
    }
  }, [transform, clampTransform]);

  const handleTouchEnd = useCallback(() => {
    gestureRef.current.isPinch = false;
  }, []);

  const handleZoom = useCallback((delta) => {
    setTransform(prev => clampTransform(prev.scale + delta, prev.x, prev.y));
  }, [clampTransform]);

  const handleReset = useCallback(() => {
    setTransform({ scale: 1, x: 0, y: 0 });
  }, []);

  return (
    <div style={{ padding: '20px 16px' }}>
      {/* Legend */}
      <div style={{
        background: WHITE, borderRadius: 12, padding: 12, marginBottom: 16,
        display: 'flex', flexWrap: 'wrap', gap: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}>
        {LEGEND.map(l => (
          <div key={l.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 16, height: 4, borderRadius: 2, background: LC[l.key] }} />
            <span style={{ fontSize: 11, color: GRAY_DARK }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Map container with zoom/pan */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          background: WHITE, borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          touchAction: transform.scale > 1 ? 'none' : 'pan-y', position: 'relative',
        }}
      >
        {/* Zoom controls */}
        <div style={{
          position: 'absolute', top: 10, left: 10, zIndex: 10,
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <button onClick={() => handleZoom(0.3)} style={{
            width: 32, height: 32, borderRadius: 8, border: '1px solid #E0E0E0',
            background: WHITE, fontSize: 18, fontWeight: 700, color: BLUE,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          }}>+</button>
          <button onClick={() => handleZoom(-0.3)} style={{
            width: 32, height: 32, borderRadius: 8, border: '1px solid #E0E0E0',
            background: WHITE, fontSize: 18, fontWeight: 700, color: BLUE,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          }}>-</button>
          {transform.scale > 1 && (
            <button onClick={handleReset} style={{
              width: 32, height: 32, borderRadius: 8, border: '1px solid #E0E0E0',
              background: WHITE, fontSize: 10, fontWeight: 600, color: GRAY_DARK,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            }}>1:1</button>
          )}
        </div>

        <div style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: 'center center',
          transition: gestureRef.current.isPinch ? 'none' : 'transform 0.1s ease-out',
        }}>
        <svg viewBox="10 10 430 790" style={{ width: '100%', height: 'auto', display: 'block' }}>
          {/* === Lines (drawn first — behind everything) === */}

          {/* Coast line: Nahariya → Beer Sheva → Dimona (main trunk) */}
          <polyline points="180,30 180,65 180,95 180,155 180,195 170,215 160,240 155,260 150,280 140,310 125,355 115,385 110,415 105,440 100,465 155,520 150,545 140,570 130,595 115,625 105,655 170,660 195,690 220,720 240,750" fill="none" stroke={LC.coast} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />

          {/* Jerusalem express (A1): Herzliya → Jerusalem Navon */}
          <polyline points="125,355 115,385 110,415 105,440 100,465 200,495 330,495" fill="none" stroke={LC.jlm} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="10,5" />

          {/* Valley line: Haifa → Beit Shean */}
          <polyline points="180,155 320,155 360,185 390,220" fill="none" stroke={LC.valley} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

          {/* Karmiel line: Haifa → Karmiel */}
          <polyline points="180,155 310,80 330,50" fill="none" stroke={LC.karmiel} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

          {/* Modi'in line: TA Savidor → Modi'in */}
          <polyline points="110,415 105,440 100,465 155,520 260,515 285,540" fill="none" stroke={LC.modiin} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

          {/* South line: TA HaHagana → Ofakim */}
          <polyline points="100,465 155,520 115,625 105,655 120,685 140,710 165,735" fill="none" stroke={LC.south} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

          {/* Ra'anana / Hod HaSharon → Yavne West (full cross-metro line) */}
          <polyline points="255,340 270,360 290,385 280,408 265,428 250,448 115,385 110,415 105,440 100,465 72,492 62,512 52,532 45,552 55,575 70,598" fill="none" stroke={LC.raanana} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* Nahariya-Modi'in (lime green, all-stops via airport) */}
          <polyline points="180,30 180,65 180,95 180,155 180,175 180,195 170,215 160,240 115,385 110,415 105,440 100,465 200,495 260,515 285,540" fill="none" stroke={LC['nahariya-modiin']} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />

          {/* Binyamina-Ashkelon */}
          <polyline points="160,240 155,260 150,280 140,310 135,330 125,355 115,385 110,415 105,440 100,465 155,520 140,570 130,595 115,625 105,655" fill="none" stroke={LC['binyamina-ashkelon']} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" strokeDasharray="6,3" />

          {/* Herzliya-Beer Sheva express */}
          <polyline points="125,355 115,385 110,415 105,440 100,465 170,660 220,720 240,750" fill="none" stroke={LC['herzliya-beersheva']} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />

          {/* Jerusalem old (via Beit Shemesh) */}
          <polyline points="110,415 105,440 100,465 155,520 150,545 310,540 360,560" fill="none" stroke={LC['jlm-old']} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4,4" />

          {/* Rishon LeTsiyon short */}
          <polyline points="100,465 145,498 155,550 175,575" fill="none" stroke={LC.rishon} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* Beer Sheva-Dimona */}
          <polyline points="220,720 285,770" fill="none" stroke={LC.dimona} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* Haifa local */}
          <polyline points="180,95 180,155 180,175 180,195" fill="none" stroke={LC['haifa-local']} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" strokeDasharray="3,3" />

          {/* Night service (thin dark overlay) */}
          <polyline points="180,30 180,65 180,95 180,155 180,195 160,240 150,280 140,310 125,355 115,385 110,415 105,440 100,465 220,720 240,750" fill="none" stroke={LC.night} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" strokeDasharray="2,6" />

          {/* Station circles (middle layer) */}
          {MAP_STATIONS.map(s => {
            const sel = selectedStation === s.id;
            const r = s.major ? 8 : 5;
            return (
              <circle
                key={s.id + '_c'}
                cx={s.x} cy={s.y} r={r}
                fill={sel ? ACCENT : WHITE}
                stroke={sel ? ACCENT : LC[s.lines[0]]}
                strokeWidth={sel ? 3 : 2}
                onClick={() => setSelectedStation(sel ? null : s.id)}
                style={{ cursor: 'pointer' }}
              />
            );
          })}

          {/* Labels on TOP with white halo for readability */}
          {MAP_STATIONS.map(s => {
            const sel = selectedStation === s.id;
            const tx = s.anchor === 'end' ? s.x + 12 : s.x - 12;
            const anch = s.anchor === 'end' ? 'start' : 'end';
            return (
              <text
                key={s.id + '_t'}
                x={tx} y={s.y + 4}
                textAnchor={anch}
                fontSize={s.major ? '12' : '10'}
                fill={sel ? ACCENT : BLUE_DARK}
                fontWeight={sel || s.major ? 700 : 500}
                fontFamily="Arial, sans-serif"
                paintOrder="stroke"
                stroke={WHITE}
                strokeWidth="3"
                strokeLinejoin="round"
                onClick={() => setSelectedStation(sel ? null : s.id)}
                style={{ cursor: 'pointer' }}
              >
                {s.name}
              </text>
            );
          })}
        </svg>
        </div>
      </div>

      {/* Selected station popup */}
      {selectedStation && (
        <div style={{
          position: 'sticky', bottom: 16, background: WHITE, borderRadius: 14, padding: 16, marginTop: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)', border: `2px solid ${ACCENT}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: 16, color: BLUE_DARK }}>
              {MAP_STATIONS.find(s => s.id === selectedStation)?.name}
            </h4>
            <button onClick={() => setSelectedStation(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
              <XIcon size={18} color={GRAY_MED} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              onClick={() => onNavigateToSearch?.(MAP_ID_TO_API[selectedStation])}
              style={{
                flex: 1, padding: 10, background: BLUE, color: WHITE,
                border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <SearchIcon size={14} color={WHITE} /> חפש מתחנה זו
            </button>
            <button
              onClick={() => onNavigateToSchedule?.(MAP_ID_TO_API[selectedStation])}
              style={{
                flex: 1, padding: 10, background: BLUE_PALE, color: BLUE,
                border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <ListIcon size={14} color={BLUE} /> לוח יציאות
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
