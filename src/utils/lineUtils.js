// Core algorithm module for Rakevet
// Station-line mapping, caching, scoring, transfer intelligence

import { LINES } from '../data/lines';
import { stationsByNameHe, stationById } from '../data/stations';
import { searchTrains, formatDate, formatTime } from './railApi';

// ─── A. Station-Line Mapping ───────────────────────────────────────────────

// Map: stationId → [{ lineId, lineName, lineColor }]
const stationLineMap = new Map();

// Build mapping at module load
LINES.forEach(line => {
  line.stations.forEach(stationName => {
    const station = stationsByNameHe[stationName];
    if (!station) return;
    const id = station.id;
    if (!stationLineMap.has(id)) {
      stationLineMap.set(id, []);
    }
    stationLineMap.get(id).push({
      lineId: line.id,
      lineName: line.name,
      lineColor: line.color,
    });
  });
});

export function getLinesForStation(stationId) {
  return stationLineMap.get(String(stationId)) || [];
}

export function getLineById(lineId) {
  return LINES.find(l => l.id === lineId) || null;
}

// ─── B. Dynamic Destinations ───────────────────────────────────────────────

export function getDynamicDestinations(originStationId) {
  const originId = String(originStationId);
  const lines = getLinesForStation(originId);
  const destIds = new Set();

  lines.forEach(({ lineId }) => {
    const line = getLineById(lineId);
    if (!line) return;
    const stations = line.stations;
    // Add first and last station of the line as destinations
    const firstStation = stationsByNameHe[stations[0]];
    const lastStation = stationsByNameHe[stations[stations.length - 1]];
    if (firstStation && firstStation.id !== originId) destIds.add(firstStation.id);
    if (lastStation && lastStation.id !== originId) destIds.add(lastStation.id);
  });

  // Fallback: if station is not on any line, use major hubs
  if (destIds.size === 0) {
    const fallback = ['3700', '2100', '680', '7320', '5000'];
    fallback.forEach(id => {
      if (id !== originId) destIds.add(id);
    });
  }

  return [...destIds];
}

// ─── C. Cache Layer ────────────────────────────────────────────────────────

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_MAX = 50;

function makeCacheKey(from, to, dateTime) {
  const d = dateTime instanceof Date ? dateTime : new Date(dateTime);
  return `${from}|${to}|${formatDate(d)}|${String(d.getHours()).padStart(2, '0')}`;
}

function pruneCache() {
  if (cache.size <= CACHE_MAX) return;
  const now = Date.now();
  // Remove expired first
  for (const [key, entry] of cache) {
    if (now - entry.time > CACHE_TTL) cache.delete(key);
  }
  // If still over limit, remove oldest
  if (cache.size > CACHE_MAX) {
    const entries = [...cache.entries()].sort((a, b) => a[1].time - b[1].time);
    const toRemove = entries.slice(0, cache.size - CACHE_MAX);
    toRemove.forEach(([key]) => cache.delete(key));
  }
}

export async function cachedSearchTrains(from, to, dateTime, scheduleType = 'ByDeparture') {
  const key = makeCacheKey(from, to, dateTime);
  const now = Date.now();

  const cached = cache.get(key);
  if (cached && (now - cached.time) < CACHE_TTL) {
    return cached.data;
  }

  const data = await searchTrains(from, to, dateTime, scheduleType);
  cache.set(key, { data, time: now });
  pruneCache();
  return data;
}

// ─── D. Route Scoring ──────────────────────────────────────────────────────

const WEIGHTS = {
  duration: 0.4,
  transfers: 0.3,
  crowding: 0.2,
  waitTime: 0.1,
};

function computeMetrics(travel) {
  const dep = new Date(travel.departureTime);
  const arr = new Date(travel.arrivalTime);
  const duration = (arr - dep) / 60000; // minutes
  const transfers = Math.max(0, travel.trains.length - 1);

  // Average crowding across trains, null defaults to 50
  const crowdingValues = travel.trains.map(t => t.crowding ?? 50);
  const crowding = crowdingValues.reduce((a, b) => a + b, 0) / crowdingValues.length;

  // Total wait time at transfer stations
  let waitTime = 0;
  for (let i = 1; i < travel.trains.length; i++) {
    const prevArr = new Date(travel.trains[i - 1].arrivalTime);
    const nextDep = new Date(travel.trains[i].departureTime);
    waitTime += Math.max(0, (nextDep - prevArr) / 60000);
  }

  return { duration, transfers, crowding, waitTime };
}

function minMaxNormalize(values) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 0);
  return values.map(v => (v - min) / (max - min));
}

export function scoreAndRankTravels(travels) {
  if (!travels || travels.length === 0) return [];

  const metricsArr = travels.map(computeMetrics);

  const durations = minMaxNormalize(metricsArr.map(m => m.duration));
  const transfersN = minMaxNormalize(metricsArr.map(m => m.transfers));
  const crowdingN = minMaxNormalize(metricsArr.map(m => m.crowding));
  const waitTimesN = minMaxNormalize(metricsArr.map(m => m.waitTime));

  return travels.map((travel, i) => ({
    ...travel,
    _metrics: metricsArr[i],
    _score:
      durations[i] * WEIGHTS.duration +
      transfersN[i] * WEIGHTS.transfers +
      crowdingN[i] * WEIGHTS.crowding +
      waitTimesN[i] * WEIGHTS.waitTime,
  }));
}

// ─── E. Transfer Intelligence ──────────────────────────────────────────────

export function analyzeTransferInfo(originId, destId) {
  const oId = String(originId);
  const dId = String(destId);
  const originLines = getLinesForStation(oId);
  const destLines = getLinesForStation(dId);

  // Find lines that serve both stations
  const directLines = [];
  originLines.forEach(oLine => {
    if (destLines.some(dLine => dLine.lineId === oLine.lineId)) {
      directLines.push({
        lineId: oLine.lineId,
        lineName: oLine.lineName,
        lineColor: oLine.lineColor,
      });
    }
  });

  return {
    hasDirect: directLines.length > 0,
    directLines,
  };
}

export function annotateTrainWithLine(train) {
  const originId = String(train.originStation);
  const destId = String(train.destStation);
  const originLines = getLinesForStation(originId);
  const destLines = getLinesForStation(destId);

  // Find a line that contains both origin and destination
  for (const oLine of originLines) {
    if (destLines.some(dLine => dLine.lineId === oLine.lineId)) {
      return {
        lineId: oLine.lineId,
        lineName: oLine.lineName,
        lineColor: oLine.lineColor,
      };
    }
  }
  return null;
}

// ─── Sort Modes + Utility ──────────────────────────────────────────────────

export const SORT_MODES = {
  RECOMMENDED: 'RECOMMENDED',
  FASTEST: 'FASTEST',
  FEWEST_TRANSFERS: 'FEWEST_TRANSFERS',
  LEAST_CROWDED: 'LEAST_CROWDED',
};

function byDeparture(a, b) {
  return new Date(a.departureTime) - new Date(b.departureTime);
}

export function sortTravels(scored, mode) {
  const copy = [...scored];
  switch (mode) {
    case SORT_MODES.FASTEST:
      return copy.sort((a, b) => a._metrics.duration - b._metrics.duration || byDeparture(a, b));
    case SORT_MODES.FEWEST_TRANSFERS:
      return copy.sort((a, b) => a._metrics.transfers - b._metrics.transfers || byDeparture(a, b));
    case SORT_MODES.LEAST_CROWDED:
      return copy.sort((a, b) => a._metrics.crowding - b._metrics.crowding || byDeparture(a, b));
    case SORT_MODES.RECOMMENDED:
    default:
      return copy.sort(byDeparture);
  }
}
