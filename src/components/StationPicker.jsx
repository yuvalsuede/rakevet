import React, { useState, useRef, useEffect } from 'react';
import { sortedStations } from '../data/stations';

const BLUE = '#0B3D91';
const BLUE_PALE = '#E3F2FD';
const BLUE_DARK = '#062555';
const GRAY_MED = '#9E9E9E';
const WHITE = '#FFFFFF';

/**
 * Searchable station dropdown picker
 * @param {Object} props
 * @param {string} props.value - Station ID
 * @param {function} props.onChange - Callback with station ID
 * @param {string} props.label - Field label
 * @param {React.ReactNode} props.icon - Leading icon
 * @param {boolean} props.active - Whether this field is visually active
 */
export default function StationPicker({ value, onChange, label, icon, active }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const selectedStation = sortedStations.find(s => s.id === value);

  const filtered = query.trim()
    ? sortedStations.filter(s =>
        s.nameHe.includes(query) || s.nameEn.toLowerCase().includes(query.toLowerCase())
      )
    : sortedStations;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus input when opening
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <label style={{ fontSize: 12, color: GRAY_MED, marginBottom: 4, display: 'block' }}>
        {label}
      </label>
      <div
        onClick={() => { setOpen(true); setQuery(''); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 10,
          border: `2px solid ${active ? BLUE : '#E0E0E0'}`,
          background: active ? BLUE_PALE + '44' : WHITE,
          cursor: 'pointer',
        }}
      >
        {icon}
        {open ? (
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חפש תחנה..."
            style={{
              border: 'none', outline: 'none', background: 'transparent',
              fontSize: 16, fontWeight: 600, color: BLUE_DARK, width: '100%',
              fontFamily: 'inherit',
            }}
          />
        ) : (
          <span style={{ fontSize: 16, fontWeight: 600, color: BLUE_DARK }}>
            {selectedStation ? selectedStation.nameHe : 'בחר תחנה'}
          </span>
        )}
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: WHITE, borderRadius: '0 0 12px 12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          maxHeight: 250, overflowY: 'auto',
          border: `1px solid #E0E0E0`, borderTop: 'none',
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', color: GRAY_MED, fontSize: 14 }}>
              לא נמצאו תחנות
            </div>
          ) : (
            filtered.map(station => (
              <div
                key={station.id}
                onClick={() => {
                  onChange(station.id);
                  setOpen(false);
                  setQuery('');
                }}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  background: station.id === value ? BLUE_PALE : 'transparent',
                  borderBottom: '1px solid #F5F5F5',
                  fontSize: 14, fontWeight: station.id === value ? 700 : 400,
                  color: BLUE_DARK,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = BLUE_PALE + '66'}
                onMouseLeave={(e) => e.currentTarget.style.background = station.id === value ? BLUE_PALE : 'transparent'}
              >
                {station.nameHe}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
