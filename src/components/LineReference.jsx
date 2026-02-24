import React, { useState, useRef, useEffect } from 'react';
import { TrainIcon, ChevronDown, ChevronUp } from './Icons';
import { LINES } from '../data/lines';
import { cachedSearchTrains } from '../utils/lineUtils';
import { parseTravels, toTimeStr } from '../utils/railApi';
import { stationsByNameHe, sortedStations } from '../data/stations';

const BLUE = '#0B3D91';
const BLUE_DARK = '#062555';
const GRAY_DARK = '#616161';
const GRAY_MED = '#9E9E9E';
const WHITE = '#FFFFFF';

export default function LineReference() {
  const [expandedLine, setExpandedLine] = useState(null);
  const [scheduleData, setScheduleData] = useState(new Map()); // lineId → array of time strings
  const [loadingSchedule, setLoadingSchedule] = useState(new Map()); // lineId → boolean
  const [scheduleError, setScheduleError] = useState(new Map()); // lineId → error string

  // Station filter state
  const [searchText, setSearchText] = useState('');
  const [selectedStations, setSelectedStations] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered station suggestions based on search text
  const filteredSuggestions = searchText.trim()
    ? sortedStations.filter(
        st =>
          st.nameHe.includes(searchText.trim()) &&
          !selectedStations.some(sel => sel.id === st.id)
      )
    : [];

  // Filter lines based on selected stations
  const filteredLines = selectedStations.length === 0
    ? LINES
    : LINES.filter(line =>
        selectedStations.every(st => line.stations.includes(st.nameHe))
      );

  function handleSelectStation(station) {
    setSelectedStations(prev => [...prev, station]);
    setSearchText('');
    setIsDropdownOpen(false);
    inputRef.current?.focus();
  }

  function handleRemoveStation(stationId) {
    setSelectedStations(prev => prev.filter(s => s.id !== stationId));
  }

  function handleClearAll() {
    setSelectedStations([]);
    setSearchText('');
  }

  async function fetchSchedule(line) {
    // Resolve first and last station IDs
    const firstStationName = line.stations[0];
    const lastStationName = line.stations[line.stations.length - 1];
    const firstStation = stationsByNameHe[firstStationName];
    const lastStation = stationsByNameHe[lastStationName];

    if (!firstStation || !lastStation) {
      setScheduleError(prev => new Map(prev).set(line.id, 'לא נמצאו תחנות'));
      return;
    }

    // Mark loading
    setLoadingSchedule(prev => new Map(prev).set(line.id, true));
    setScheduleError(prev => {
      const next = new Map(prev);
      next.delete(line.id);
      return next;
    });

    try {
      // Use start of today so we get the full day's departures
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const apiResponse = await cachedSearchTrains(firstStation.id, lastStation.id, today);
      const travels = parseTravels(apiResponse);
      const times = travels.map(t => toTimeStr(t.departureTime));

      setScheduleData(prev => new Map(prev).set(line.id, times));
    } catch (err) {
      setScheduleError(prev => new Map(prev).set(line.id, 'שגיאה בטעינת לוח הזמנים'));
    } finally {
      setLoadingSchedule(prev => new Map(prev).set(line.id, false));
    }
  }

  function handleScheduleButtonClick(e, line) {
    e.stopPropagation();
    // If already loaded, toggle off by removing from map
    if (scheduleData.has(line.id)) {
      setScheduleData(prev => {
        const next = new Map(prev);
        next.delete(line.id);
        return next;
      });
      return;
    }
    fetchSchedule(line);
  }

  return (
    <div style={{ padding: '20px 16px' }}>
      {/* Station filter section */}
      <div style={{
        background: WHITE,
        borderRadius: 14,
        padding: 16,
        marginBottom: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}>
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          {/* Search input */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            border: `1px solid ${GRAY_MED}`,
            borderRadius: 10,
            padding: '0 12px',
            background: WHITE,
          }}>
            {/* Search icon */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={GRAY_MED}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0, marginLeft: 8 }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setIsDropdownOpen(e.target.value.trim().length > 0);
              }}
              onFocus={() => {
                if (searchText.trim().length > 0) setIsDropdownOpen(true);
              }}
              placeholder="חפש תחנה..."
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                padding: '10px 8px',
                fontSize: 14,
                background: 'transparent',
                direction: 'rtl',
              }}
            />
          </div>

          {/* Dropdown suggestions */}
          {isDropdownOpen && filteredSuggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: WHITE,
              borderRadius: 10,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              marginTop: 4,
              maxHeight: 200,
              overflowY: 'auto',
              zIndex: 100,
              border: `1px solid #E0E0E0`,
            }}>
              {filteredSuggestions.map(st => (
                <div
                  key={st.id}
                  onClick={() => handleSelectStation(st)}
                  style={{
                    padding: '10px 14px',
                    fontSize: 14,
                    color: BLUE_DARK,
                    cursor: 'pointer',
                    borderBottom: '1px solid #F0F0F0',
                    direction: 'rtl',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = BLUE + '10'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {st.nameHe}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected station chips */}
        {selectedStations.length > 0 && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginTop: 12,
            alignItems: 'center',
            direction: 'rtl',
          }}>
            {selectedStations.map(st => (
              <span
                key={st.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: BLUE + '15',
                  color: BLUE,
                  border: `1px solid ${BLUE}33`,
                  borderRadius: 20,
                  padding: '4px 10px 4px 6px',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {st.nameHe}
                <span
                  onClick={() => handleRemoveStation(st.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: BLUE + '22',
                    cursor: 'pointer',
                    fontSize: 12,
                    lineHeight: 1,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = BLUE + '44'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = BLUE + '22'; }}
                >
                  ✕
                </span>
              </span>
            ))}
            <button
              onClick={handleClearAll}
              style={{
                background: 'transparent',
                border: 'none',
                color: GRAY_MED,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 6,
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = BLUE_DARK; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = GRAY_MED; }}
            >
              נקה הכל
            </button>
          </div>
        )}

        {/* Result count when filtering */}
        {selectedStations.length > 0 && (
          <div style={{
            marginTop: 10,
            fontSize: 12,
            color: GRAY_MED,
            direction: 'rtl',
          }}>
            {filteredLines.length === 0
              ? 'לא נמצאו קווים תואמים'
              : `${filteredLines.length} קווים נמצאו`}
          </div>
        )}
      </div>

      {filteredLines.map((line) => {
        const isExpanded = expandedLine === line.id;
        const times = scheduleData.get(line.id);
        const isLoadingSchedule = loadingSchedule.get(line.id) === true;
        const scheduleErr = scheduleError.get(line.id);
        const scheduleLoaded = times !== undefined;

        return (
          <div key={line.id} style={{
            background: WHITE, borderRadius: 14, marginBottom: 10, overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            border: isExpanded ? `2px solid ${line.color}` : '2px solid transparent',
          }}>
            <div
              onClick={() => setExpandedLine(isExpanded ? null : line.id)}
              style={{ padding: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: line.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <TrainIcon size={20} color={WHITE} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: BLUE_DARK }}>{line.name}</div>
                  <div style={{ fontSize: 13, color: GRAY_MED }}>{line.from} ↔ {line.to}</div>
                </div>
              </div>
              <div style={{
                fontSize: 12, color: line.color, fontWeight: 600,
                background: line.color + '15', padding: '4px 10px', borderRadius: 8,
              }}>
                {line.freq}
              </div>
            </div>

            {isExpanded && (
              <div style={{ padding: '0 16px 16px', borderTop: '1px solid #E0E0E0' }}>
                {/* Station list */}
                <div style={{ display: 'flex', flexDirection: 'column', padding: '12px 0' }}>
                  {line.stations.map((st, si) => {
                    const isTerminal = si === 0 || si === line.stations.length - 1;
                    return (
                      <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20 }}>
                          <div style={{
                            width: isTerminal ? 14 : 10,
                            height: isTerminal ? 14 : 10,
                            borderRadius: '50%',
                            background: isTerminal ? line.color : WHITE,
                            border: `2px solid ${line.color}`,
                          }} />
                          {si < line.stations.length - 1 && (
                            <div style={{ width: 2, height: 20, background: line.color + '44' }} />
                          )}
                        </div>
                        <span style={{
                          fontSize: 14,
                          fontWeight: isTerminal ? 700 : 400,
                          color: isTerminal ? BLUE_DARK : GRAY_DARK,
                          padding: '4px 0',
                        }}>
                          {st}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Schedule section */}
                <div style={{ borderTop: `1px solid ${line.color}22`, paddingTop: 12 }}>
                  <button
                    onClick={(e) => handleScheduleButtonClick(e, line)}
                    disabled={isLoadingSchedule}
                    style={{
                      background: scheduleLoaded ? line.color : line.color + '15',
                      color: scheduleLoaded ? WHITE : line.color,
                      border: `1px solid ${line.color}44`,
                      borderRadius: 8,
                      padding: '6px 14px',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: isLoadingSchedule ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: scheduleLoaded || isLoadingSchedule || scheduleErr ? 10 : 0,
                      transition: 'background 0.15s, color 0.15s',
                      opacity: isLoadingSchedule ? 0.7 : 1,
                    }}
                  >
                    {isLoadingSchedule && (
                      <span style={{
                        display: 'inline-block',
                        width: 12,
                        height: 12,
                        border: `2px solid ${line.color}44`,
                        borderTopColor: line.color,
                        borderRadius: '50%',
                        animation: 'spin 0.7s linear infinite',
                      }} />
                    )}
                    {isLoadingSchedule
                      ? 'טוען...'
                      : scheduleLoaded
                        ? 'הסתר לוח זמנים'
                        : 'הצג לוח זמנים'}
                  </button>

                  {/* Error message */}
                  {scheduleErr && !isLoadingSchedule && (
                    <div style={{
                      fontSize: 12,
                      color: '#B71C1C',
                      background: '#FFEBEE',
                      borderRadius: 6,
                      padding: '6px 10px',
                    }}>
                      {scheduleErr}
                    </div>
                  )}

                  {/* Time chips grid */}
                  {scheduleLoaded && !isLoadingSchedule && (
                    <div>
                      {times.length === 0 ? (
                        <div style={{ fontSize: 12, color: GRAY_MED }}>אין נסיעות להיום</div>
                      ) : (
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 6,
                        }}>
                          {times.map((t, ti) => (
                            <span
                              key={ti}
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: line.color,
                                background: line.color + '15',
                                border: `1px solid ${line.color}33`,
                                borderRadius: 20,
                                padding: '3px 9px',
                                fontVariantNumeric: 'tabular-nums',
                                letterSpacing: '0.02em',
                              }}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Spinner keyframe — injected once via a style tag */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
