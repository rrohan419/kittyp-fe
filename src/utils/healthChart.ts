export interface DonutPart {
  label: string;
  value: number;
  display: string;
  color: string;
}

export interface DonutArc extends DonutPart {
  dash: number;
  gap: number;
  rotate: number;
}

export interface HealthSample {
  mem: number;
  disk: number;
  pool: number;
  workers: number;
}

export function donutArcs(parts: DonutPart[], radius = 42): DonutArc[] {
  const total = parts.reduce((sum, part) => sum + Math.max(0, part.value), 0) || 1;
  const circumference = 2 * Math.PI * radius;
  let acc = 0;
  return parts.map((part) => {
    const dash = (Math.max(0, part.value) / total) * circumference;
    const rotate = (acc / total) * 360 - 90;
    acc += Math.max(0, part.value);
    return { ...part, dash, gap: circumference - dash, rotate };
  });
}

export function stackedPercents(values: number[]): number[] {
  const total = values.reduce((sum, value) => sum + Math.max(0, value), 0) || 1;
  return values.map((value) => (Math.max(0, value) / total) * 100);
}

export function appendSample(history: HealthSample[], sample: HealthSample, max = 36): HealthSample[] {
  return [...history, sample].slice(-max);
}

export function linePath(points: number[], width: number, height: number, pad: number): string {
  if (!points.length) {
    return '';
  }
  const max = Math.max(1, ...points);
  return points
    .map((value, index) => {
      const x = pad + (index / Math.max(1, points.length - 1)) * (width - pad * 2);
      const y = height - pad - (value / max) * (height - pad * 2);
      return `${index ? 'L' : 'M'}${x} ${y}`;
    })
    .join(' ');
}

export function numDetail(details: Record<string, unknown> | undefined, key: string): number {
  const value = details?.[key];
  return typeof value === 'number' ? value : 0;
}

export function strDetail(details: Record<string, unknown> | undefined, key: string): string {
  const value = details?.[key];
  return value == null ? '' : String(value);
}

const BYTE_KEYS = new Set(['used', 'max', 'heap', 'total', 'free', 'threshold']);

export function formatHealthDetail(key: string, value: unknown, formatBytes: (n: number) => string): string {
  if (typeof value === 'number') {
    return BYTE_KEYS.has(key) ? formatBytes(value) : String(value);
  }
  if (typeof value === 'boolean') {
    return value ? 'yes' : 'no';
  }
  if (Array.isArray(value)) {
    return value.length ? JSON.stringify(value) : 'none';
  }
  if (value && typeof value === 'object') {
    return JSON.stringify(value);
  }
  if (value == null || value === '') {
    return '—';
  }
  return String(value);
}
