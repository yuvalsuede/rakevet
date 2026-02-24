// Israel Railways API client
// All requests go through our Vercel serverless proxy at /api/rail

const API_URL = '/api/rail';

/**
 * Format a Date to YYYY-MM-DD string
 */
export function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Format a Date to HH:MM string
 */
export function formatTime(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * Search train routes from origin to destination
 * @param {string} fromStation - Station ID (e.g., '3700')
 * @param {string} toStation - Station ID (e.g., '2100')
 * @param {Date} dateTime - Date and time for the search
 * @param {string} scheduleType - 'ByDeparture' or 'ByArrival'
 * @returns {Promise<Object>} API response with travels array
 */
export async function searchTrains(fromStation, toStation, dateTime, scheduleType = 'ByDeparture') {
  const body = {
    endpoint: 'timetable/searchTrain',
    fromStation: String(fromStation),
    toStation: String(toStation),
    date: formatDate(dateTime),
    hour: formatTime(dateTime),
    scheduleType,
    systemType: '2',
    languageId: 'Hebrew',
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API error: ${res.status}`);
  }

  return res.json();
}

/**
 * Parse API response into a clean travels array
 */
export function parseTravels(apiResponse) {
  const result = apiResponse?.result;
  if (!result?.travels) return [];

  return result.travels.map(travel => ({
    departureTime: travel.departureTime,
    arrivalTime: travel.arrivalTime,
    messages: travel.travelMessages || [],
    isExchange: travel.trains?.length > 1,
    trains: (travel.trains || []).map(train => ({
      trainNumber: train.trainNumber,
      originStation: String(train.orignStation),
      destStation: String(train.destinationStation),
      departureTime: train.departureTime,
      arrivalTime: train.arrivalTime,
      originPlatform: train.originPlatform,
      destPlatform: train.destPlatform,
      crowding: train.predictedPctLoad ?? null,
      handicap: train.handicap,
      terminalOrigin: train.routeStations?.[0]?.stationId ? String(train.routeStations[0].stationId) : null,
      terminalDest: train.routeStations?.length ? String(train.routeStations[train.routeStations.length - 1].stationId) : null,
      stops: (train.stopStations || []).map(stop => ({
        stationId: String(stop.stationId),
        arrivalTime: stop.arrivalTime,
        departureTime: stop.departureTime,
        platform: stop.platform,
        crowding: stop.predictedPctLoad ?? null,
      })),
      routeStations: (train.routeStations || []).map(rs => ({
        stationId: String(rs.stationId),
        arrivalTime: rs.arrivalTime,
        departureTime: rs.departureTime,
        platform: rs.platform,
      })),
    })),
  }));
}

/**
 * Format ISO datetime string to HH:MM
 */
export function toTimeStr(isoStr) {
  if (!isoStr) return '--:--';
  const d = new Date(isoStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Calculate duration in minutes between two ISO datetime strings
 */
export function durationMinutes(startIso, endIso) {
  if (!startIso || !endIso) return 0;
  return Math.round((new Date(endIso) - new Date(startIso)) / 60000);
}

/**
 * Format duration as "X:YY"
 */
export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}
