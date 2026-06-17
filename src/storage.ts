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
    { id: generateId(), text: '选项一', color: DEFAULT_COLORS[0] },
    { id: generateId(), text: '选项二', color: DEFAULT_COLORS[1] },
    { id: generateId(), text: '选项三', color: DEFAULT_COLORS[2] },
    { id: generateId(), text: '选项四', color: DEFAULT_COLORS[3] },
  ];
  return {
    id: generateId(),
    name: '默认方案',
    options,
    mode: 'wheel',
  };
}
