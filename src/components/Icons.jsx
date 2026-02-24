import React from 'react';

// Base SVG icon wrapper — no emojis, ever
const Icon = ({ children, size = 18, color = 'currentColor', className, style, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ flexShrink: 0, ...style }}
    {...props}
  >
    {children}
  </svg>
);

export const SearchIcon = (p) => (
  <Icon {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Icon>
);

export const MapIcon = (p) => (
  <Icon {...p}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></Icon>
);

export const ClockIcon = (p) => (
  <Icon {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Icon>
);

export const TrainIcon = (p) => (
  <Icon {...p}>
    <rect x="4" y="3" width="16" height="14" rx="2"/>
    <path d="M4 11h16"/><path d="M12 3v8"/>
    <path d="M8 21l2-4"/><path d="M16 21l-2-4"/>
    <circle cx="8" cy="15" r="1" fill={p.color || 'currentColor'} stroke="none"/>
    <circle cx="16" cy="15" r="1" fill={p.color || 'currentColor'} stroke="none"/>
  </Icon>
);

export const SwapIcon = (p) => (
  <Icon {...p}>
    <polyline points="7 3 7 21"/><polyline points="3 7 7 3 11 7"/>
    <polyline points="17 21 17 3"/><polyline points="13 17 17 21 21 17"/>
  </Icon>
);

export const CalendarIcon = (p) => (
  <Icon {...p}>
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </Icon>
);

export const AlertIcon = (p) => (
  <Icon {...p}>
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </Icon>
);

export const RefreshIcon = (p) => (
  <Icon {...p}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></Icon>
);

export const StationIcon = (p) => (
  <Icon {...p}><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8" strokeDasharray="4 4"/></Icon>
);

export const ChevronDown = (p) => (
  <Icon {...p}><polyline points="6 9 12 15 18 9"/></Icon>
);

export const ChevronUp = (p) => (
  <Icon {...p}><polyline points="18 15 12 9 6 15"/></Icon>
);

export const XIcon = (p) => (
  <Icon {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Icon>
);

export const ListIcon = (p) => (
  <Icon {...p}>
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </Icon>
);

export const ShieldIcon = (p) => (
  <Icon {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Icon>
);

export const LoaderIcon = (p) => (
  <Icon {...p}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></Icon>
);

// Filled dot for origin/destination indicators
export const DotIcon = ({ color = 'currentColor', size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
    <circle cx="7" cy="7" r="6" fill="none" stroke={color} strokeWidth="2"/>
    <circle cx="7" cy="7" r="3" fill={color}/>
  </svg>
);
