import React from 'react';

const GREEN = '#2E7D32';
const YELLOW = '#F9A825';
const RED = '#C62828';
const GRAY_MED = '#9E9E9E';

/**
 * Color-coded crowding badge
 * Green: <30% (פנוי), Yellow: 30-60% (בינוני), Red: >60% (עמוס)
 */
export function CrowdingBadge({ percent }) {
  if (percent == null) return null;

  const color = percent < 30 ? GREEN : percent < 60 ? YELLOW : RED;
  const label = percent < 30 ? 'פנוי' : percent < 60 ? 'בינוני' : 'עמוס';

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 10px', borderRadius: 12,
      background: color + '18', color: color,
      fontSize: 13, fontWeight: 600,
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      {label} ({percent}%)
    </span>
  );
}

/**
 * Platform number badge
 */
export function PlatformBadge({ num }) {
  if (num == null) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 28, height: 28, borderRadius: 6,
      background: '#0B3D91', color: '#FFFFFF',
      fontSize: 14, fontWeight: 700,
    }}>
      {num}
    </span>
  );
}
