import React, { useState, useCallback, useEffect, useRef } from 'react';
import StationPicker from './StationPicker';
import { CrowdingBadge, PlatformBadge } from './CrowdingIndicator';
import { StationIcon, LoaderIcon, RefreshIcon, ChevronUp, ChevronDown, CalendarIcon } from './Icons';
import { parseTravels, toTimeStr, durationMinutes, formatDuration } from '../utils/railApi';
import { getStationName, sortedStations } from '../data/stations';
import { getDynamicDestinations, cachedSearchTrains, annotateTrainWithLine } from '../utils/lineUtils';

const BLUE = '#0B3D91';
const BLUE_DARK = '#062555';
const BLUE_PALE = '#E3F2FD';
const ACCENT = '#FF6F00';
const GRAY_MED = '#9E9E9E';
const GRAY_DARK = '#616161';
const WHITE = '#FFFFFF';
const GREEN = '#2E7D32';
const YELLOW = '#F9A825';
const RED = '#C62828';

export default function StationSchedule({ initialStation, onStationConsumed }) {
  const [station, setStation] = useState(initialStation || '3700');
  const [departures, setDepartures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [loadingLater, setLoadingLater] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });

  // Track the raw departure map for deduplication across pagination
  const depMapRef = useRef(new Map());

  // When navigating from map, update station
  useEffect(() => {
    if (initialStation) {
      setStation(initialStation);
      onStationConsumed?.();
    }
  }, [initialStation]);

  // Build departures from a search starting at the given Date,
  // and merge into existing depMap if `merge` is true.
  const fetchDepartures = useCallback(async (searchTime, merge = false) => {
    if (!station) return [];

    const results = await Promise.allSettled(
      getDynamicDestinations(station)
        .map(dest => cachedSearchTrains(station, dest, searchTime))
    );

    const localMap = merge ? new Map(depMapRef.current) : new Map();

    results.forEach(r => {
      if (r.status !== 'fulfilled') return;
      const travels = parseTravels(r.value);
      travels.forEach(travel => {
        const firstTrain = travel.trains[0];
        if (!firstTrain) return;
        const lastTrain = travel.trains[travel.trains.length - 1];
        const key = `${firstTrain.trainNumber}-${firstTrain.departureTime}`;
        if (!localMap.has(key)) {
          localMap.set(key, {
            // Display fields
            time: toTimeStr(firstTrain.departureTime),
            rawTime: firstTrain.departureTime,
            dest: getStationName(lastTrain.destStation),
            destId: lastTrain.destStation,
            platform: firstTrain.originPlatform,
            train: firstTrain.trainNumber,
            load: firstTrain.crowding,
            // Full travel data for expanded view
            travel,
          });
        }
      });
    });

    depMapRef.current = localMap;

    // Sort by time
    const sorted = [...localMap.values()].sort((a, b) =>
      a.rawTime.localeCompare(b.rawTime)
    );

    return sorted;
  }, [station]);

  const loadDepartures = useCallback(async () => {
    if (!station) return;
    setLoading(true);
    setError(null);
    setExpanded(null);
    depMapRef.current = new Map();

    try {
      // Use selected date at 00:00 if it differs from today, otherwise use current time
      const today = new Date().toISOString().slice(0, 10);
      let searchTime;
      if (selectedDate === today) {
        searchTime = new Date();
      } else {
        searchTime = new Date(`${selectedDate}T00:00:00`);
      }

      const sorted = await fetchDepartures(searchTime, false);
      setDepartures(sorted);
      setLastUpdate(new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }));

      if (sorted.length === 0) {
        setError('לא נמצאו נסיעות. נסו תחנה או תאריך אחר.');
      }
    } catch (err) {
      setError(`שגיאה בטעינה: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [station, selectedDate, fetchDepartures]);

  const handleLoadEarlier = useCallback(async () => {
    if (departures.length === 0 || loadingEarlier) return;
    setLoadingEarlier(true);
    try {
      const earliest = departures[0].rawTime;
      const earliestDt = new Date(earliest);
      earliestDt.setHours(earliestDt.getHours() - 2);

      const sorted = await fetchDepartures(earliestDt, true);
      setDepartures(sorted);
    } catch {
      // silently fail
    } finally {
      setLoadingEarlier(false);
    }
  }, [departures, loadingEarlier, fetchDepartures]);

  const handleLoadLater = useCallback(async () => {
    if (departures.length === 0 || loadingLater) return;
    setLoadingLater(true);
    try {
      const latest = departures[departures.length - 1].rawTime;
      const latestDt = new Date(latest);
      latestDt.setHours(latestDt.getHours() + 2);

      const sorted = await fetchDepartures(latestDt, true);
      setDepartures(sorted);
    } catch {
      // silently fail
    } finally {
      setLoadingLater(false);
    }
  }, [departures, loadingLater, fetchDepartures]);

  const navBtnStyle = (isLoading) => ({
    width: '100%', padding: 10, border: 'none', borderRadius: 10,
    background: BLUE + '33', color: WHITE, fontSize: 14, fontWeight: 600,
    cursor: isLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: 8, transition: 'all 0.2s',
  });

  return (
    <div style={{ padding: '20px 16px' }}>
      {/* Station picker */}
      <div style={{ background: WHITE, borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <StationPicker
          value={station}
          onChange={setStation}
          label="בחר תחנה"
          icon={<StationIcon size={16} color={BLUE} />}
          active={true}
        />

        {/* Date picker */}
        <div style={{ marginTop: 12 }}>
          <label style={{ fontSize: 12, color: GRAY_MED, marginBottom: 4, display: 'block' }}>תאריך</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 10px', borderRadius: 10, border: '2px solid #E0E0E0' }}>
            <CalendarIcon size={16} color={GRAY_MED} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: 14, color: BLUE_DARK, fontFamily: 'inherit', background: 'transparent', width: '100%', minWidth: 0 }}
            />
          </div>
        </div>

        <button
          onClick={loadDepartures}
          disabled={loading}
          style={{
            width: '100%', marginTop: 12, padding: 12,
            background: loading ? GRAY_MED : BLUE,
            color: WHITE, border: 'none', borderRadius: 10,
            fontSize: 15, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {loading ? (
            <><LoaderIcon size={16} color={WHITE} style={{ animation: 'spin 1s linear infinite' }} /> טוען...</>
          ) : (
            <><RefreshIcon size={16} color={WHITE} /> הצג לוח יציאות</>
          )}
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#FFF3E0', borderRadius: 12, color: '#E65100', fontSize: 14, textAlign: 'center', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Departure board */}
      {departures.length > 0 && (
        <div style={{ background: BLUE_DARK, borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
          {/* Header */}
          <div style={{ padding: '12px 16px', background: BLUE, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: WHITE, fontSize: 16 }}>לוח יציאות</h3>
            {lastUpdate && (
              <span style={{ color: WHITE + '88', fontSize: 13 }}>עדכון: {lastUpdate}</span>
            )}
          </div>

          {/* Color legend */}
          <div style={{
            padding: '8px 16px', background: BLUE + 'AA',
            display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
            fontSize: 11, color: WHITE + 'CC',
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: ACCENT }} />
              הנסיעה הקרובה
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#FFD54F' }} />
              נסיעות נוספות
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: GREEN }} />
              פנוי
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: YELLOW }} />
              בינוני
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: RED }} />
              עמוס
            </span>
          </div>

          {/* Column headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: '60px 1fr 50px 50px 80px',
            padding: '8px 16px', gap: 8, background: BLUE + 'CC',
            color: WHITE + '99', fontSize: 12, fontWeight: 600,
          }}>
            <span>שעה</span>
            <span>יעד</span>
            <span style={{ textAlign: 'center' }}>רציף</span>
            <span style={{ textAlign: 'center' }}>רכבת</span>
            <span style={{ textAlign: 'center' }}>עומס</span>
          </div>

          {/* Load earlier button */}
          <button onClick={handleLoadEarlier} disabled={loadingEarlier} style={navBtnStyle(loadingEarlier)}>
            {loadingEarlier ? (
              <><LoaderIcon size={14} color={WHITE} style={{ animation: 'spin 1s linear infinite' }} /> טוען...</>
            ) : (
              <><ChevronUp size={14} color={WHITE} /> נסיעות מוקדמות יותר</>
            )}
          </button>

          {departures.map((dep, i) => {
            const isExpanded = expanded === i;
            const travel = dep.travel;
            return (
              <div key={`${dep.train}-${dep.time}`}>
                {/* Main departure row */}
                <div
                  onClick={() => setExpanded(isExpanded ? null : i)}
                  style={{
                    display: 'grid', gridTemplateColumns: '60px 1fr 50px 50px 80px',
                    padding: '12px 16px', gap: 8,
                    borderBottom: `1px solid ${BLUE_DARK}22`,
                    background: isExpanded ? BLUE + '44' : i === 0 ? BLUE + '22' : 'transparent',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  <span style={{
                    color: i === 0 ? ACCENT : '#FFD54F',
                    fontSize: 18, fontWeight: 800, fontFamily: 'monospace',
                  }}>
                    {dep.time}
                  </span>
                  <span style={{ color: WHITE, fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {dep.dest}
                    {isExpanded
                      ? <ChevronUp size={12} color={GRAY_MED} />
                      : <ChevronDown size={12} color={GRAY_MED} />}
                  </span>
                  <span style={{
                    textAlign: 'center', color: WHITE, background: BLUE,
                    borderRadius: 6, padding: '2px 0', fontSize: 15, fontWeight: 700,
                  }}>
                    {dep.platform}
                  </span>
                  <span style={{ textAlign: 'center', color: WHITE + '88', fontSize: 13 }}>{dep.train}</span>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <CrowdingBadge percent={dep.load} />
                  </div>
                </div>

                {/* Expanded trip details */}
                {isExpanded && travel && (
                  <div style={{
                    background: '#0a2e6e',
                    padding: '14px 16px',
                    borderBottom: `1px solid ${BLUE_DARK}44`,
                  }}>
                    {travel.trains.map((train, ti) => {
                      const lineInfo = annotateTrainWithLine(train);
                      const terminalOriginName = train.terminalOrigin ? getStationName(train.terminalOrigin) : null;
                      const terminalDestName = train.terminalDest ? getStationName(train.terminalDest) : null;

                      return (
                        <div key={ti}>
                          {ti > 0 && (
                            <div style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              padding: '8px 0', color: ACCENT, fontSize: 13, fontWeight: 600,
                            }}>
                              <RefreshIcon size={14} color={ACCENT} />
                              <span>החלפה ב{getStationName(train.originStation)}</span>
                              <span style={{ color: GRAY_MED, fontWeight: 400 }}>
                                (המתנה {durationMinutes(travel.trains[ti - 1].arrivalTime, train.departureTime)} דק׳)
                              </span>
                            </div>
                          )}
                          <div style={{ background: BLUE_PALE + '18', borderRadius: 10, padding: 12, marginBottom: ti < travel.trains.length - 1 ? 8 : 0 }}>
                            {/* Train number + line annotation */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: WHITE, display: 'flex', alignItems: 'center', gap: 6 }}>
                                רכבת #{train.trainNumber}
                                {lineInfo && (
                                  <span style={{
                                    fontSize: 11, padding: '2px 8px', borderRadius: 8,
                                    background: lineInfo.lineColor + '33', color: lineInfo.lineColor,
                                    fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4,
                                  }}>
                                    <span style={{
                                      width: 8, height: 8, borderRadius: '50%',
                                      background: lineInfo.lineColor, display: 'inline-block',
                                    }} />
                                    {lineInfo.lineName}
                                  </span>
                                )}
                              </span>
                              <CrowdingBadge percent={train.crowding} />
                            </div>

                            {/* Terminal origin/dest info */}
                            {terminalOriginName && terminalDestName && (
                              <div style={{ fontSize: 12, color: WHITE + 'AA', marginBottom: 8 }}>
                                רכבת מ-{terminalOriginName} ל-{terminalDestName}
                              </div>
                            )}

                            {/* Origin and destination with times + platforms */}
                            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                              <div>
                                <div style={{ fontSize: 12, color: GRAY_MED }}>מ-</div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: WHITE }}>{getStationName(train.originStation)}</div>
                                <div style={{ fontSize: 13, color: BLUE_PALE, display: 'flex', alignItems: 'center', gap: 6 }}>
                                  {toTimeStr(train.departureTime)} <PlatformBadge num={train.originPlatform} />
                                </div>
                              </div>
                              <div style={{ fontSize: 18, color: GRAY_MED, alignSelf: 'center' }}>&#8592;</div>
                              <div>
                                <div style={{ fontSize: 12, color: GRAY_MED }}>אל-</div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: WHITE }}>{getStationName(train.destStation)}</div>
                                <div style={{ fontSize: 13, color: BLUE_PALE, display: 'flex', alignItems: 'center', gap: 6 }}>
                                  {toTimeStr(train.arrivalTime)} <PlatformBadge num={train.destPlatform} />
                                </div>
                              </div>
                            </div>

                            {/* Duration */}
                            <div style={{ marginTop: 6, fontSize: 12, color: WHITE + '99' }}>
                              משך נסיעה: {formatDuration(durationMinutes(train.departureTime, train.arrivalTime))}
                            </div>

                            {/* Intermediate stops */}
                            {train.stops && train.stops.length > 0 && (
                              <div style={{ marginTop: 8, fontSize: 12, color: WHITE + 'AA' }}>
                                <span style={{ color: GRAY_MED }}>תחנות ביניים: </span>
                                {train.stops.map(s => getStationName(s.stationId)).join(' · ')}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Load later button */}
          <button onClick={handleLoadLater} disabled={loadingLater} style={navBtnStyle(loadingLater)}>
            {loadingLater ? (
              <><LoaderIcon size={14} color={WHITE} style={{ animation: 'spin 1s linear infinite' }} /> טוען...</>
            ) : (
              <><ChevronDown size={14} color={WHITE} /> נסיעות מאוחרות יותר</>
            )}
          </button>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
