import React, { useState, useCallback, useRef, useEffect } from 'react';
import StationPicker from './StationPicker';
import { CrowdingBadge, PlatformBadge } from './CrowdingIndicator';
import { SearchIcon, SwapIcon, CalendarIcon, ClockIcon, RefreshIcon, ChevronDown, ChevronUp, DotIcon, LoaderIcon } from './Icons';
import { parseTravels, toTimeStr, durationMinutes, formatDuration } from '../utils/railApi';
import { cachedSearchTrains, scoreAndRankTravels, sortTravels, SORT_MODES, analyzeTransferInfo, annotateTrainWithLine } from '../utils/lineUtils';
import { getStationName } from '../data/stations';

const BLUE = '#0B3D91';
const BLUE_LIGHT = '#1565C0';
const BLUE_PALE = '#E3F2FD';
const BLUE_DARK = '#062555';
const ACCENT = '#FF6F00';
const GREEN = '#2E7D32';
const GRAY = '#F5F5F5';
const GRAY_MED = '#9E9E9E';
const GRAY_DARK = '#616161';
const WHITE = '#FFFFFF';
const RED = '#C62828';

function shiftTime(dateStr, timeStr, deltaHours) {
  const dt = new Date(`${dateStr}T${timeStr}:00`);
  dt.setHours(dt.getHours() + deltaHours);
  const d = dt.toISOString().slice(0, 10);
  const t = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
  return { date: d, time: t, dt };
}

export default function RoutePlanner({ initialStation, onStationConsumed }) {
  const [fromStation, setFromStation] = useState(initialStation || '3700');
  const [toStation, setToStation] = useState('2100');
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [time, setTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [travels, setTravels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [loadingLater, setLoadingLater] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [searched, setSearched] = useState(false);
  const [sortMode, setSortMode] = useState(SORT_MODES.RECOMMENDED);
  const [transferInfo, setTransferInfo] = useState(null);
  const [scoredTravels, setScoredTravels] = useState([]);
  // When navigating from map, update fromStation
  useEffect(() => {
    if (initialStation) {
      setFromStation(initialStation);
      onStationConsumed?.();
    }
  }, [initialStation]);

  // Track the time window we've fetched so far
  const windowRef = useRef({ earliestDate: null, earliestTime: null, latestDate: null, latestTime: null });

  // Stores all raw (un-scored) travels fetched so far; used as the pool for pagination
  const rawPoolRef = useRef([]);

  const deduplicateTravels = (allTravels) => {
    const seen = new Set();
    return allTravels.filter(t => {
      const key = `${t.departureTime}|${t.arrivalTime}|${t.trains.map(tr => tr.trainNumber).join(',')}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  // Sort a raw (un-scored) travels array by departure time ascending
  const sortByDeparture = (arr) =>
    [...arr].sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime));

  // From a sorted raw array, pick 2 closest before pivotDt and 2 closest after pivotDt
  const filterAroundPivot = (sortedRaw, pivotDt) => {
    const before = sortedRaw.filter(t => new Date(t.departureTime) < pivotDt);
    const after  = sortedRaw.filter(t => new Date(t.departureTime) >= pivotDt);
    // 2 closest before = last 2 of the "before" list (already sorted ascending)
    const closestBefore = before.slice(-2);
    // 2 closest after = first 2 of the "after" list
    const closestAfter  = after.slice(0, 2);
    return [...closestBefore, ...closestAfter];
  };

  const applyScoreAndSort = useCallback((parsed, mode) => {
    const scored = scoreAndRankTravels(parsed);
    const sorted = sortTravels(scored, mode);
    return { scored, sorted };
  }, []);

  const handleSortChange = useCallback((mode) => {
    setSortMode(mode);
    setTravels(sortTravels(scoredTravels, mode));
  }, [scoredTravels]);

  const handleSwap = () => {
    setFromStation(toStation);
    setToStation(fromStation);
  };

  const handleSearch = useCallback(async () => {
    if (!fromStation || !toStation) {
      setError('יש לבחור תחנת מוצא ותחנת יעד');
      return;
    }
    if (fromStation === toStation) {
      setError('תחנת המוצא ותחנת היעד זהות');
      return;
    }

    setLoading(true);
    setError(null);
    setExpanded(null);
    setSearched(true);

    try {
      const pivotDt = new Date(`${date}T${time}:00`);

      // Fetch from 2 hours before the selected time AND from the selected time itself
      const twoHoursBefore = shiftTime(date, time, -2);
      const [respBefore, respAt] = await Promise.all([
        cachedSearchTrains(fromStation, toStation, twoHoursBefore.dt),
        cachedSearchTrains(fromStation, toStation, pivotDt),
      ]);

      const rawAll = deduplicateTravels([
        ...parseTravels(respBefore),
        ...parseTravels(respAt),
      ]);

      // Store the full raw pool for incremental pagination
      rawPoolRef.current = sortByDeparture(rawAll);

      // Filter to 2 before + 2 after pivot, then score & sort
      const filtered = filterAroundPivot(rawPoolRef.current, pivotDt);
      const { scored, sorted } = applyScoreAndSort(filtered, sortMode);
      setScoredTravels(scored);
      setTravels(sorted);

      // Window tracks the departure times of the currently displayed results
      const displayedSorted = sortByDeparture(filtered);
      if (displayedSorted.length > 0) {
        const earliest = displayedSorted[0];
        const latest   = displayedSorted[displayedSorted.length - 1];
        const edtStr = earliest.departureTime.slice(0, 10);
        const etStr  = earliest.departureTime.slice(11, 16);
        const ldtStr = latest.departureTime.slice(0, 10);
        const ltStr  = latest.departureTime.slice(11, 16);
        windowRef.current = {
          earliestDate: edtStr, earliestTime: etStr,
          latestDate:   ldtStr, latestTime:   ltStr,
        };
      } else {
        windowRef.current = {
          earliestDate: date, earliestTime: time,
          latestDate:   date, latestTime:   time,
        };
      }

      const tInfo = analyzeTransferInfo(fromStation, toStation);
      setTransferInfo(tInfo);

      if (filtered.length === 0) {
        setError('לא נמצאו נסיעות למועד המבוקש. נסו מועד אחר.');
      }
    } catch (err) {
      setError(`שגיאה בחיפוש: ${err.message}`);
      setTravels([]);
    } finally {
      setLoading(false);
    }
  }, [fromStation, toStation, date, time, sortMode, applyScoreAndSort]);

  const handleLoadEarlier = useCallback(async () => {
    const w = windowRef.current;
    if (!w.earliestDate || loadingEarlier) return;
    setLoadingEarlier(true);
    try {
      // Fetch 1 hour before the current earliest displayed result
      const earlier = shiftTime(w.earliestDate, w.earliestTime, -1);
      const resp = await cachedSearchTrains(fromStation, toStation, earlier.dt);
      const newRaw = parseTravels(resp);

      // Merge new results into the raw pool (deduplicated), keep sorted
      rawPoolRef.current = sortByDeparture(
        deduplicateTravels([...newRaw, ...rawPoolRef.current])
      );

      // The pivot for "earlier" is the current earliest displayed departure time
      const currentEarliestDt = new Date(`${w.earliestDate}T${w.earliestTime}:00`);

      // Pick 2 travels that are earlier than the current earliest
      const candidates = rawPoolRef.current.filter(
        t => new Date(t.departureTime) < currentEarliestDt
      );
      const twoMore = candidates.slice(-2); // 2 closest before current earliest

      if (twoMore.length > 0) {
        // Prepend to existing scored travels (strip old scores first so we re-score together)
        const existingRaw = scoredTravels.map(({ _score, _metrics, ...rest }) => rest);
        const combined = deduplicateTravels([...twoMore, ...existingRaw]);
        const { scored, sorted } = applyScoreAndSort(combined, sortMode);
        setScoredTravels(scored);
        setTravels(sorted);

        // Update the earliest window to the new earliest displayed result
        const newEarliestDep = twoMore[0].departureTime;
        windowRef.current.earliestDate = newEarliestDep.slice(0, 10);
        windowRef.current.earliestTime = newEarliestDep.slice(11, 16);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingEarlier(false);
    }
  }, [fromStation, toStation, scoredTravels, sortMode, loadingEarlier, applyScoreAndSort]);

  const handleLoadLater = useCallback(async () => {
    const w = windowRef.current;
    if (!w.latestDate || loadingLater) return;
    setLoadingLater(true);
    try {
      // Fetch 1 hour after the current latest displayed result
      const later = shiftTime(w.latestDate, w.latestTime, 1);
      const resp = await cachedSearchTrains(fromStation, toStation, later.dt);
      const newRaw = parseTravels(resp);

      // Merge new results into the raw pool (deduplicated), keep sorted
      rawPoolRef.current = sortByDeparture(
        deduplicateTravels([...rawPoolRef.current, ...newRaw])
      );

      // The pivot for "later" is the current latest displayed departure time
      const currentLatestDt = new Date(`${w.latestDate}T${w.latestTime}:00`);

      // Pick 2 travels that are later than the current latest
      const candidates = rawPoolRef.current.filter(
        t => new Date(t.departureTime) > currentLatestDt
      );
      const twoMore = candidates.slice(0, 2); // 2 closest after current latest

      if (twoMore.length > 0) {
        // Append to existing scored travels (strip old scores first so we re-score together)
        const existingRaw = scoredTravels.map(({ _score, _metrics, ...rest }) => rest);
        const combined = deduplicateTravels([...existingRaw, ...twoMore]);
        const { scored, sorted } = applyScoreAndSort(combined, sortMode);
        setScoredTravels(scored);
        setTravels(sorted);

        // Update the latest window to the new latest displayed result
        const newLatestDep = twoMore[twoMore.length - 1].departureTime;
        windowRef.current.latestDate = newLatestDep.slice(0, 10);
        windowRef.current.latestTime = newLatestDep.slice(11, 16);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingLater(false);
    }
  }, [fromStation, toStation, scoredTravels, sortMode, loadingLater, applyScoreAndSort]);

  const navBtnStyle = (isLoading) => ({
    width: '100%', padding: 10, border: `1px solid #E0E0E0`, borderRadius: 10,
    background: WHITE, color: BLUE, fontSize: 14, fontWeight: 600,
    cursor: isLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: 8, transition: 'all 0.2s',
  });

  return (
    <div style={{ padding: '20px 16px' }}>
      {/* Search Form */}
      <div style={{ background: WHITE, borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        {/* Origin */}
        <div style={{ marginBottom: 12 }}>
          <StationPicker
            value={fromStation}
            onChange={setFromStation}
            label="תחנת מוצא"
            icon={<DotIcon color={BLUE} />}
            active={true}
          />
        </div>

        {/* Swap button */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '-4px 0', position: 'relative', zIndex: 1 }}>
          <button onClick={handleSwap} style={{
            width: 36, height: 36, borderRadius: '50%', background: BLUE, color: WHITE,
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          }}>
            <SwapIcon size={16} color={WHITE} />
          </button>
        </div>

        {/* Destination */}
        <div style={{ marginBottom: 16 }}>
          <StationPicker
            value={toStation}
            onChange={setToStation}
            label="תחנת יעד"
            icon={<DotIcon color={RED} />}
            active={false}
          />
        </div>

        {/* Date + Time */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 3, minWidth: 0 }}>
            <label style={{ fontSize: 12, color: GRAY_MED, marginBottom: 4, display: 'block' }}>תאריך</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 10px', borderRadius: 10, border: '2px solid #E0E0E0' }}>
              <CalendarIcon size={16} color={GRAY_MED} />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ border: 'none', outline: 'none', fontSize: 14, color: BLUE_DARK, fontFamily: 'inherit', background: 'transparent', width: '100%', minWidth: 0 }}
              />
            </div>
          </div>
          <div style={{ flex: 2, minWidth: 0 }}>
            <label style={{ fontSize: 12, color: GRAY_MED, marginBottom: 4, display: 'block' }}>שעה</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 10px', borderRadius: 10, border: '2px solid #E0E0E0' }}>
              <ClockIcon size={16} color={GRAY_MED} />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                style={{ border: 'none', outline: 'none', fontSize: 14, color: BLUE_DARK, fontFamily: 'inherit', background: 'transparent', width: '100%', minWidth: 0 }}
              />
            </div>
          </div>
        </div>

        {/* Search button */}
        <button
          onClick={handleSearch}
          disabled={loading}
          style={{
            width: '100%', padding: 14,
            background: loading ? GRAY_MED : `linear-gradient(135deg, ${BLUE}, ${BLUE_LIGHT})`,
            color: WHITE, border: 'none', borderRadius: 12,
            fontSize: 17, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
            boxShadow: '0 4px 12px rgba(11,61,145,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s',
          }}
        >
          {loading ? (
            <><LoaderIcon size={18} color={WHITE} style={{ animation: 'spin 1s linear infinite' }} /> מחפש...</>
          ) : (
            <><SearchIcon size={18} color={WHITE} /> חפש נסיעות</>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          marginTop: 16, padding: '12px 16px', background: '#FFF3E0', borderRadius: 12,
          color: '#E65100', fontSize: 14, textAlign: 'center',
        }}>
          {error}
        </div>
      )}

      {/* Results */}
      {travels.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16, color: BLUE_DARK }}>
              תוצאות — {travels.length} נסיעות
            </h3>
            <span style={{ fontSize: 13, color: GRAY_MED }}>
              {new Date(date).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'numeric' })}
            </span>
          </div>

          {/* Sort buttons */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {[
              { mode: SORT_MODES.RECOMMENDED, label: 'מומלץ' },
              { mode: SORT_MODES.FASTEST, label: 'מהיר' },
              { mode: SORT_MODES.FEWEST_TRANSFERS, label: 'מעט החלפות' },
              { mode: SORT_MODES.LEAST_CROWDED, label: 'פחות עמוס' },
            ].map(({ mode, label }) => (
              <button
                key={mode}
                onClick={(e) => { e.stopPropagation(); handleSortChange(mode); }}
                style={{
                  padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600,
                  background: sortMode === mode ? BLUE : '#E8E8E8',
                  color: sortMode === mode ? WHITE : GRAY_DARK,
                  transition: 'all 0.2s',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Transfer info banner */}
          {transferInfo && transferInfo.hasDirect && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
              background: '#E8F5E9', borderRadius: 10, marginBottom: 12, fontSize: 13,
              color: '#2E7D32', fontWeight: 600,
            }}>
              <span style={{ fontSize: 16 }}>&#10003;</span>
              <span>
                {transferInfo.directLines.length === 1 ? 'קו ישיר: ' : 'קווים ישירים: '}
                {transferInfo.directLines.map((line, li) => (
                  <span key={line.lineId}>
                    {li > 0 && ', '}
                    <span style={{
                      display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
                      background: line.lineColor, marginLeft: 4, verticalAlign: 'middle',
                    }} />
                    <span style={{ marginRight: 2 }}>{line.lineName}</span>
                  </span>
                ))}
              </span>
            </div>
          )}

          {/* Load earlier button */}
          <button onClick={handleLoadEarlier} disabled={loadingEarlier} style={navBtnStyle(loadingEarlier)}>
            {loadingEarlier ? (
              <><LoaderIcon size={14} color={BLUE} style={{ animation: 'spin 1s linear infinite' }} /> טוען...</>
            ) : (
              <><ChevronUp size={14} color={BLUE} /> נסיעות מוקדמות יותר</>
            )}
          </button>

          <div style={{ height: 10 }} />

          {travels.map((travel, i) => {
            const depTime = toTimeStr(travel.departureTime);
            const arrTime = toTimeStr(travel.arrivalTime);
            const dur = durationMinutes(travel.departureTime, travel.arrivalTime);
            const direct = travel.trains.length === 1;
            const firstTrain = travel.trains[0];

            return (
              <div
                key={i}
                onClick={() => setExpanded(expanded === i ? null : i)}
                style={{
                  background: WHITE, borderRadius: 14, padding: 16, marginBottom: 10,
                  cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  border: expanded === i ? `2px solid ${BLUE}` : '2px solid transparent',
                  transition: 'all 0.2s', position: 'relative',
                }}
              >
                {sortMode === SORT_MODES.RECOMMENDED && travel._score != null && travel._score === Math.min(...travels.filter(t => t._score != null).map(t => t._score)) && (
                  <div style={{
                    position: 'absolute', top: -8, right: 12,
                    background: ACCENT, color: WHITE, fontSize: 11, fontWeight: 700,
                    padding: '2px 10px', borderRadius: 10,
                  }}>
                    מומלץ
                  </div>
                )}
                {/* Main row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: BLUE_DARK }}>{depTime}</div>
                      <div style={{ fontSize: 11, color: GRAY_MED }}>יציאה</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '0 8px' }}>
                      <span style={{ fontSize: 11, color: GRAY_MED }}>{formatDuration(dur)}</span>
                      <div style={{ width: 60, height: 2, background: direct ? BLUE : ACCENT, borderRadius: 1, position: 'relative' }}>
                        {!direct && (
                          <div style={{
                            position: 'absolute', top: -4, left: '50%', transform: 'translateX(-50%)',
                            width: 10, height: 10, borderRadius: '50%', background: ACCENT, border: `2px solid ${WHITE}`,
                          }} />
                        )}
                      </div>
                      <span style={{ fontSize: 11, color: direct ? GREEN : ACCENT, fontWeight: 600 }}>
                        {direct ? 'ישיר' : `החלפה ${travel.trains.length - 1}`}
                      </span>
                      {!direct && travel.trains.length > 1 && (
                        <span style={{ fontSize: 11, color: GRAY_DARK, fontWeight: 400 }}>
                          דרך {getStationName(travel.trains[0].destStation)}
                        </span>
                      )}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: BLUE_DARK }}>{arrTime}</div>
                      <div style={{ fontSize: 11, color: GRAY_MED }}>הגעה</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: GRAY_MED }}>רציף</span>
                      <PlatformBadge num={firstTrain.originPlatform} />
                    </div>
                    <CrowdingBadge percent={firstTrain.crowding} />
                  </div>
                </div>

                {/* Expanded details */}
                {expanded === i && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #E0E0E0' }}>
                    {/* Service messages */}
                    {travel.messages.length > 0 && (
                      <div style={{
                        marginBottom: 12, padding: '8px 12px', background: '#FFF3E0',
                        borderRadius: 8, fontSize: 13, color: '#E65100',
                      }}>
                        {travel.messages.map((msg, mi) => (
                          <div key={mi}>{msg.header || msg.shortMessage || msg.longMessage}</div>
                        ))}
                      </div>
                    )}

                    {travel.trains.map((train, ti) => (
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
                        <div style={{ background: BLUE_PALE + '44', borderRadius: 10, padding: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: BLUE, display: 'flex', alignItems: 'center', gap: 6 }}>
                              רכבת #{train.trainNumber}
                              {(() => {
                                const lineInfo = annotateTrainWithLine(train);
                                if (!lineInfo) return null;
                                return (
                                  <span style={{
                                    fontSize: 11, padding: '2px 8px', borderRadius: 8,
                                    background: lineInfo.lineColor + '22', color: lineInfo.lineColor,
                                    fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4,
                                  }}>
                                    <span style={{
                                      width: 8, height: 8, borderRadius: '50%',
                                      background: lineInfo.lineColor, display: 'inline-block',
                                    }} />
                                    {lineInfo.lineName}
                                  </span>
                                );
                              })()}
                            </span>
                            <CrowdingBadge percent={train.crowding} />
                          </div>
                          <div style={{ display: 'flex', gap: 16 }}>
                            <div>
                              <div style={{ fontSize: 13, color: GRAY_MED }}>מ-</div>
                              <div style={{ fontSize: 14, fontWeight: 600 }}>{getStationName(train.originStation)}</div>
                              <div style={{ fontSize: 13, color: BLUE }}>
                                {toTimeStr(train.departureTime)} · רציף {train.originPlatform}
                              </div>
                            </div>
                            <div style={{ fontSize: 18, color: GRAY_MED, alignSelf: 'center' }}>&#8592;</div>
                            <div>
                              <div style={{ fontSize: 13, color: GRAY_MED }}>אל-</div>
                              <div style={{ fontSize: 14, fontWeight: 600 }}>{getStationName(train.destStation)}</div>
                              <div style={{ fontSize: 13, color: BLUE }}>
                                {toTimeStr(train.arrivalTime)} · רציף {train.destPlatform}
                              </div>
                            </div>
                          </div>
                          {train.stops.length > 0 && (
                            <div style={{ marginTop: 8, fontSize: 12, color: GRAY_DARK }}>
                              <span style={{ color: GRAY_MED }}>תחנות ביניים: </span>
                              {train.stops.map(s => getStationName(s.stationId)).join(' · ')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ textAlign: 'center', marginTop: 8, display: 'flex', justifyContent: 'center' }}>
                  {expanded === i ? <ChevronUp size={16} color={GRAY_MED} /> : <ChevronDown size={16} color={GRAY_MED} />}
                </div>
              </div>
            );
          })}

          {/* Load later button */}
          <button onClick={handleLoadLater} disabled={loadingLater} style={navBtnStyle(loadingLater)}>
            {loadingLater ? (
              <><LoaderIcon size={14} color={BLUE} style={{ animation: 'spin 1s linear infinite' }} /> טוען...</>
            ) : (
              <><ChevronDown size={14} color={BLUE} /> נסיעות מאוחרות יותר</>
            )}
          </button>
        </div>
      )}

      {/* Empty state */}
      {searched && !loading && !error && travels.length === 0 && (
        <div style={{ marginTop: 30, textAlign: 'center', color: GRAY_MED, fontSize: 14 }}>
          לא נמצאו תוצאות
        </div>
      )}

      {/* CSS animation for spinner */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
