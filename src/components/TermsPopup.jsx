import React from 'react';
import { ShieldIcon } from './Icons';

const BLUE = '#0B3D91';
const BLUE_LIGHT = '#1565C0';
const BLUE_DARK = '#062555';
const GRAY_MED = '#9E9E9E';
const GRAY_DARK = '#616161';
const WHITE = '#FFFFFF';

export default function TermsPopup({ onAccept }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div dir="rtl" style={{
        background: WHITE, borderRadius: 20, padding: 28,
        maxWidth: 440, width: '100%', maxHeight: '85vh', overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <ShieldIcon size={24} color={BLUE} />
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: BLUE_DARK }}>
            תנאי שימוש ופרטיות
          </h2>
        </div>

        <div style={{ fontSize: 14, lineHeight: 1.7, color: GRAY_DARK }}>
          <p style={{ marginTop: 0 }}>
            רקבת הוא שירות חינמי ובלתי תלוי לתכנון נסיעות ברכבת ישראל. אינו קשור לרכבת ישראל בע"מ.
          </p>
          <p>
            המידע מתקבל ישירות מ-API של רכבת ישראל ומוצג כפי שהוא — ללא אחריות לדיוק. מומלץ לאמת מול rail.co.il.
          </p>
          <p style={{ marginBottom: 0 }}>
            לא אוספים מידע אישי, אין עוגיות מעקב, אין פרסומות.
          </p>
        </div>

        <button onClick={onAccept} style={{
          width: '100%', padding: 16, marginTop: 20,
          background: `linear-gradient(135deg, ${BLUE}, ${BLUE_LIGHT})`,
          color: WHITE, border: 'none', borderRadius: 12,
          fontSize: 16, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(11,61,145,0.3)',
        }}>
          קראתי ואני מסכים/ה לתנאי השימוש
        </button>

        <p style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: GRAY_MED }}>
          ההסכמה תישמר בדפדפן. לא נשאל שוב.
        </p>
      </div>
    </div>
  );
}
