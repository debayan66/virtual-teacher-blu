import type { CSSProperties } from 'react';

export type IconName =
  | 'home'
  | 'studio'
  | 'globe'
  | 'layers'
  | 'export'
  | 'play'
  | 'pause'
  | 'rewind'
  | 'forward'
  | 'volume'
  | 'mute'
  | 'captions'
  | 'search'
  | 'chevron'
  | 'chevronRight'
  | 'close'
  | 'check'
  | 'alert'
  | 'info'
  | 'refresh'
  | 'spark'
  | 'grid'
  | 'sliders'
  | 'panel'
  | 'clock'
  | 'mic'
  | 'cloudOff'
  | 'arrowRight'
  | 'plus'
  | 'film'
  | 'eye'
  | 'eyeOff'
  | 'folder'
  | 'copy'
  | 'download'
  | 'command'
  | 'sort';

const PATHS: Record<IconName, string> = {
  home: 'M3 10.6 12 3.2l9 7.4V20a1 1 0 0 1-1 1h-5v-6.2H9V21H4a1 1 0 0 1-1-1z',
  studio: 'M3.5 5.5h17v13h-17zM3.5 9h17M3.5 15h17M8 5.5v3.5M16 5.5v3.5M8 15v3.5M16 15v3.5',
  globe: 'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM3.6 9.5h16.8M3.6 14.5h16.8M12 3.5c2.6 3.6 2.6 13.4 0 17M12 3.5c-2.6 3.6-2.6 13.4 0 17',
  layers: 'm12 3.4 8.4 4.6-8.4 4.6-8.4-4.6zM3.6 13.2 12 17.8l8.4-4.6',
  export: 'M12 4.2v10.2m0 0 3.8-3.8M12 14.4l-3.8-3.8M4.5 19.5h15',
  play: 'm8.5 5.4 10 6.6-10 6.6z',
  pause: 'M9.2 5.2v13.6M14.8 5.2v13.6',
  rewind: 'M11.2 6.2v11.6L4.4 12zM19.6 6.2v11.6L12.8 12z',
  forward: 'M4.4 6.2v11.6L11.2 12zM12.8 6.2v11.6L19.6 12z',
  volume: 'M11.2 5.2 6.6 9.2H3.4v5.6h3.2l4.6 4zM15 9.4a3.6 3.6 0 0 1 0 5.2M17.6 7a7 7 0 0 1 0 10',
  mute: 'M11.2 5.2 6.6 9.2H3.4v5.6h3.2l4.6 4zM15.4 9.6l4.6 4.8M20 9.6l-4.6 4.8',
  captions: 'M3.4 5.8h17.2v12.4H3.4zM7 11h3.2M7 14h4.6M13.6 11H17M13.6 14H16.6',
  search: 'M11 4.2a6.8 6.8 0 1 0 0 13.6 6.8 6.8 0 0 0 0-13.6zM20.4 20.4l-4.5-4.5',
  chevron: 'm6.5 9.5 5.5 5.5 5.5-5.5',
  chevronRight: 'm9.5 6.5 5.5 5.5-5.5 5.5',
  close: 'M6.4 6.4l11.2 11.2M17.6 6.4 6.4 17.6',
  check: 'm5 12.6 4.6 4.6L19 6.8',
  alert: 'M12 3.6 2.6 20.4h18.8zM12 9.6v4.6M12 17.2h.01',
  info: 'M12 3.6a8.4 8.4 0 1 0 0 16.8 8.4 8.4 0 0 0 0-16.8zM12 11v5.4M12 7.8h.01',
  refresh: 'M20.4 12a8.4 8.4 0 1 1-2.5-6M20.4 3.8v5.4h-5.4',
  spark: 'm12 3.2 1.9 5.4 5.4 1.9-5.4 1.9L12 17.8l-1.9-5.4L4.7 10.5l5.4-1.9z',
  grid: 'M4 4h6.4v6.4H4zM13.6 4H20v6.4h-6.4zM4 13.6h6.4V20H4zM13.6 13.6H20V20h-6.4z',
  sliders: 'M4 8.4h16M4 15.6h16M9.4 8.4a2 2 0 1 0-4 0 2 2 0 0 0 4 0zM18.6 15.6a2 2 0 1 0-4 0 2 2 0 0 0 4 0z',
  panel: 'M3.6 5h16.8v14H3.6zM10 5v14M13.4 9.4h4M13.4 14.6h4',
  clock: 'M12 3.6a8.4 8.4 0 1 0 0 16.8 8.4 8.4 0 0 0 0-16.8zM12 7.4V12l3.2 2.2',
  mic: 'M12 3.8a2.6 2.6 0 0 1 2.6 2.6v5a2.6 2.6 0 0 1-5.2 0v-5A2.6 2.6 0 0 1 12 3.8zM6.2 11.4a5.8 5.8 0 0 0 11.6 0M12 17.4V20.4',
  cloudOff: 'M3.4 3.4l17.2 17.2M7.6 18.4h9.2a3.8 3.8 0 0 0 .8-7.5 5.8 5.8 0 0 0-8.3-4M6.6 10.6a3.8 3.8 0 0 0 1 7.8',
  arrowRight: 'M4.6 12h14.2m0 0-5-5m5 5-5 5',
  plus: 'M12 5.2v13.6M5.2 12h13.6',
  film: 'M3.6 5.4h16.8v13.2H3.6zM3.6 9.2h16.8M3.6 14.8h16.8M7.6 5.4v3.8M16.4 5.4v3.8M7.6 14.8v3.8M16.4 14.8v3.8',
  eye: 'M2.6 12S6.2 6.2 12 6.2 21.4 12 21.4 12 17.8 17.8 12 17.8 2.6 12 2.6 12zM12 9.4a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2z',
  eyeOff: 'M3 3l18 18M10.6 6.3A8.6 8.6 0 0 1 12 6.2c5.8 0 9.4 5.8 9.4 5.8a17 17 0 0 1-3.3 3.9M6.4 8.1A16.6 16.6 0 0 0 2.6 12S6.2 17.8 12 17.8c1.4 0 2.6-.3 3.7-.8M9.9 9.9a2.6 2.6 0 0 0 3.7 3.7',
  folder: 'M3.4 6.6h6.2l2 2.2h9v9.6h-17.2z',
  copy: 'M9 8.6h10.4v11H9zM5 15V4.6h10.4',
  download: 'M12 4.2v10.2m0 0 3.8-3.8M12 14.4l-3.8-3.8M4.5 19.5h15',
  command: 'M8.6 4.6a2.4 2.4 0 1 0 0 4.8h6.8a2.4 2.4 0 1 0 0-4.8v14.8a2.4 2.4 0 1 0 0-4.8H8.6a2.4 2.4 0 1 0 0 4.8z',
  sort: 'M7 5.4v13.2m0 0-3-3m3 3 3-3M17 18.6V5.4m0 0-3 3m3-3 3 3',
};

interface Props {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
  filled?: boolean;
}

export function Icon({ name, size = 18, strokeWidth = 1.6, className, style, filled }: Props) {
  const d = PATHS[name];
  const fillRule = name === 'play' || name === 'command' || name === 'spark' || name === 'layers';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} fillRule={fillRule ? 'evenodd' : undefined} />
    </svg>
  );
}