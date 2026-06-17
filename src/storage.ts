import { WheelScheme, HistoryRecord } from './types';

const SCHEMES_KEY = 'lucky_wheel_schemes';
const HISTORY_KEY = 'lucky_wheel_history';
const ACTIVE_KEY = 'lucky_wheel_active_scheme';

export function loadSchemes(): WheelScheme[] {
  try {
    const raw = localStorage.getItem(SCHEMES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSchemes(schemes: WheelScheme[]): void {
  localStorage.setItem(SCHEMES_KEY, JSON.stringify(schemes));
}

export function loadHistory(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHistory(history: HistoryRecord[]): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function loadActiveSchemeId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

export function saveActiveSchemeId(id: string): void {
  localStorage.setItem(ACTIVE_KEY, id);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const DEFAULT_COLORS = [
  '#e94560', '#f5a623', '#4ecdc4', '#45b7d1',
  '#96c93d', '#e056a0', '#f0c040', '#7c4dff',
  '#00bfa5', '#ff6e40', '#536dfe', '#ff4081',
];

export function getDefaultColor(index: number): string {
  return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

export function createDefaultScheme(): WheelScheme {
  const options: WheelScheme['options'] = [
    { id: generateId(), text: '选项一', color: DEFAULT_COLORS[0], weight: 1 },
    { id: generateId(), text: '选项二', color: DEFAULT_COLORS[1], weight: 1 },
    { id: generateId(), text: '选项三', color: DEFAULT_COLORS[2], weight: 1 },
    { id: generateId(), text: '选项四', color: DEFAULT_COLORS[3], weight: 1 },
  ];
  return {
    id: generateId(),
    name: '默认方案',
    options,
    mode: 'wheel',
  };
}

export function weightedRandomIndex(options: { weight: number }[]): number {
  const totalWeight = options.reduce((sum, o) => sum + Math.max(0, o.weight), 0);
  if (totalWeight <= 0 || options.length === 0) return 0;
  let random = Math.random() * totalWeight;
  for (let i = 0; i < options.length; i++) {
    const w = Math.max(0, options[i].weight);
    if (random < w) return i;
    random -= w;
  }
  return options.length - 1;
}

export function migrateSchemesWithWeight(schemes: WheelScheme[]): WheelScheme[] {
  return schemes.map(scheme => ({
    ...scheme,
    options: scheme.options.map(opt => ({
      weight: 1,
      ...opt,
    })),
  }));
}
