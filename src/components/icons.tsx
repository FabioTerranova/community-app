/**
 * Saubere Linien-Icons (SVG) statt Emoji — der groesste Schritt weg vom "Amateur"-Look.
 * Einheitliche Strichstaerke, `filled` fuer aktive Zustaende (z.B. Tab-Bar).
 * Alle Icons teilen dieselbe Signatur -> in Maps austauschbar.
 */
import React from 'react';
import Svg, { Path, Circle, Polyline, Line, Rect } from 'react-native-svg';

export interface IconProps {
  size?: number;
  color?: string;
  /** Aktiver Zustand: leicht gefuellt statt nur Kontur. */
  filled?: boolean;
  strokeWidth?: number;
}

function base(size = 24) {
  return { width: size, height: size, viewBox: '0 0 24 24' } as const;
}

export function HomeIcon({ size = 24, color = '#000', filled, strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path
        d="M3 10.5 12 3l9 7.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={filled ? color : 'none'}
        fillOpacity={filled ? 0.14 : 0}
      />
      <Path d="M9.5 21v-6h5v6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CalendarIcon({ size = 24, color = '#000', filled, strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Rect
        x={3.5}
        y={5}
        width={17}
        height={16}
        rx={3}
        stroke={color}
        strokeWidth={strokeWidth}
        fill={filled ? color : 'none'}
        fillOpacity={filled ? 0.14 : 0}
      />
      <Line x1={3.5} y1={9.5} x2={20.5} y2={9.5} stroke={color} strokeWidth={strokeWidth} />
      <Line x1={8} y1={3} x2={8} y2={6.5} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1={16} y1={3} x2={16} y2={6.5} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Circle cx={8.5} cy={14} r={1.15} fill={color} />
      <Circle cx={12} cy={14} r={1.15} fill={color} />
      <Circle cx={15.5} cy={14} r={1.15} fill={color} />
    </Svg>
  );
}

export function TrophyIcon({ size = 24, color = '#000', filled, strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path
        d="M7 4h10v4a5 5 0 0 1-10 0V4Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        fill={filled ? color : 'none'}
        fillOpacity={filled ? 0.14 : 0}
      />
      <Path d="M7 5H4.5v1.5A3.5 3.5 0 0 0 8 10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17 5h2.5v1.5A3.5 3.5 0 0 1 16 10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1={12} y1={13} x2={12} y2={17} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M8.5 20.5h7M9.5 20.5c0-1.5 1-3 2.5-3s2.5 1.5 2.5 3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ShieldIcon({ size = 24, color = '#000', filled, strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path
        d="M12 3 5 5.5V11c0 4.3 2.9 7.6 7 9 4.1-1.4 7-4.7 7-9V5.5L12 3Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        fill={filled ? color : 'none'}
        fillOpacity={filled ? 0.14 : 0}
      />
      <Path d="m9 11.5 2 2 4-4.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function FlameIcon({ size = 24, color = '#000', filled = true, strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path
        d="M12 3c1 2.5-.5 4-1.7 5.3C9 9.7 8 11 8 13a4 4 0 0 0 8 0c0-1.3-.5-2.4-1-3.2-.3 1-1 1.7-1.8 1.7 1-2.3-.2-4.7-1.2-8.5Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        fill={filled ? color : 'none'}
        fillOpacity={filled ? 0.18 : 0}
      />
    </Svg>
  );
}

export function BookIcon({ size = 24, color = '#000', strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path
        d="M12 6.5C10.5 5 8.5 4.5 5 4.5V18c3.5 0 5.5.5 7 2 1.5-1.5 3.5-2 7-2V4.5c-3.5 0-5.5.5-7 2Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Line x1={12} y1={6.5} x2={12} y2={20} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function BellIcon({ size = 24, color = '#000', filled, strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path
        d="M6 10a6 6 0 0 1 12 0c0 4 1.2 5.2 1.8 5.8.4.4.1 1.2-.5 1.2H4.7c-.6 0-.9-.8-.5-1.2C4.8 15.2 6 14 6 10Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        fill={filled ? color : 'none'}
        fillOpacity={filled ? 0.16 : 0}
      />
      <Path d="M10 20a2 2 0 0 0 4 0" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

export function CheckIcon({ size = 24, color = '#000', strokeWidth = 2.4 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Polyline
        points="5,12.5 10,17.5 19,7"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChevronRightIcon({ size = 24, color = '#000', strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Polyline
        points="9,5 16,12 9,19"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SunIcon({ size = 24, color = '#000', strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Circle cx={12} cy={12} r={4} stroke={color} strokeWidth={strokeWidth} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const r = (deg * Math.PI) / 180;
        const x1 = 12 + Math.cos(r) * 7;
        const y1 = 12 + Math.sin(r) * 7;
        const x2 = 12 + Math.cos(r) * 9.2;
        const y2 = 12 + Math.sin(r) * 9.2;
        return <Line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />;
      })}
    </Svg>
  );
}

export function MoonIcon({ size = 24, color = '#000', strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path
        d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function MapPinIcon({ size = 24, color = '#000', strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Path
        d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={10} r={2.4} stroke={color} strokeWidth={strokeWidth} />
    </Svg>
  );
}

export function UsersIcon({ size = 24, color = '#000', strokeWidth = 2 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Circle cx={9} cy={8.5} r={3} stroke={color} strokeWidth={strokeWidth} />
      <Path
        d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M16 6.5a3 3 0 0 1 0 5.8M17 14.2c2.3.5 3.8 2.3 3.8 4.8"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function CloseIcon({ size = 24, color = '#000', strokeWidth = 2.2 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none">
      <Line x1={6} y1={6} x2={18} y2={18} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Line x1={18} y1={6} x2={6} y2={18} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
}

/** Kleines Marken-Zeichen fuer Intro/Header: schlichte Taube (Gemeinschaft/Frieden). */
export function DoveMark({ size = 48, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Path
        d="M40 12c-3 0-6 1.5-8.5 4.5C29 20 27 24 21 24c-4.5 0-7-2-9-4 0 6 3.5 11 10 12l-3.5 5.5c-.5.8.1 1.8 1 1.7l6-.7c7.5-1 13-7.2 13-15V13c0-.7-.8-1.2-1.4-.8L40 12Z"
        fill={color}
        fillOpacity={0.95}
      />
      <Circle cx={33} cy={17.5} r={1.3} fill={color === '#fff' ? '#E24C86' : '#fff'} />
    </Svg>
  );
}
