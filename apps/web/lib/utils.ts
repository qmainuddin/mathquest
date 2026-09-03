import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAgeBand(ageBand: string): string {
  switch (ageBand) {
    case 'age_7_8':
      return 'Ages 7–8 (Year 3)';
    case 'age_8_9':
      return 'Ages 8–9 (Year 4)';
    case 'age_9_10':
      return 'Ages 9–10 (Year 5)';
    case 'age_10_11':
      return 'Ages 10–11 (Year 6)';
    default:
      return ageBand;
  }
}

export function formatDuration(ms: number): string {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const remSec = seconds % 60;
  return `${mins}m ${remSec}s`;
}
